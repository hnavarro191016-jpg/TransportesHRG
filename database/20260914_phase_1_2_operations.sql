-- Fases 1 y 2: ejecutar DESPUÉS de 20260914_portal_security_and_maintenance.sql.
-- Es incremental y no borra información existente.

create table if not exists public.romo_inventory_balances (
  product_id text not null references public.romo_products(id) on delete cascade,
  warehouse_id text not null references public.romo_warehouses(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, warehouse_id)
);

-- Inicializa saldos a partir de los productos existentes. La columna current_stock
-- se conserva como total de compatibilidad mientras se termina la migración de vistas.
insert into public.romo_inventory_balances(product_id, warehouse_id, quantity)
select p.id, w.id, greatest(coalesce(p.current_stock, 0), 0)
from public.romo_products p join public.romo_warehouses w on w.name = p.warehouse
on conflict (product_id, warehouse_id) do nothing;

alter table public.romo_exits add column if not exists maintenance_ticket_id uuid references public.romo_maintenance_tickets(id) on delete set null;
alter table public.romo_maintenance_tickets add column if not exists location text;
alter table public.romo_maintenance_tickets add column if not exists dispatch_cost numeric not null default 0;

create table if not exists public.romo_maintenance_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.romo_maintenance_tickets(id) on delete cascade,
  storage_path text not null unique, file_name text not null, mime_type text, byte_size bigint,
  uploaded_by text not null, created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public) values ('maintenance-evidence', 'maintenance-evidence', false)
on conflict (id) do nothing;

create or replace function public.add_maintenance_attachment(p_ticket_id uuid, p_storage_path text, p_file_name text, p_mime_type text, p_byte_size bigint)
returns void language plpgsql security definer set search_path = public as $$
declare profile public.romo_users;
begin
  select * into profile from public.romo_users where id = auth.uid()::text and active;
  if profile is null then raise exception 'Sesión sin perfil activo'; end if;
  if not exists (select 1 from public.romo_maintenance_tickets where id = p_ticket_id and (reported_by = profile.id or profile.role in ('Mecánico','Administrador'))) then
    raise exception 'No tienes permiso para adjuntar evidencia a este ticket';
  end if;
  insert into public.romo_maintenance_attachments(ticket_id, storage_path, file_name, mime_type, byte_size, uploaded_by)
  values (p_ticket_id, p_storage_path, p_file_name, p_mime_type, p_byte_size, profile.id);
  insert into public.romo_maintenance_events(ticket_id, event_type, note, actor_id, actor_name)
  values (p_ticket_id, 'attachment_added', 'Evidencia adjunta: ' || p_file_name, profile.id, profile.name);
end; $$;

-- La función es la única vía de escritura de compras, salidas, transferencias y ajustes.
-- Bloquea los saldos involucrados y actualiza documento, kardex y total del producto en una transacción.
create or replace function public.record_inventory_movement(p_kind text, p_document jsonb, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare profile public.romo_users; item jsonb; product public.romo_products; wh_origin text; wh_dest text;
  origin_id text; dest_id text; before_qty integer; after_qty integer; total_qty integer; movement_id text;
begin
  select * into profile from public.romo_users where id = auth.uid()::text and active = true;
  if profile is null then raise exception 'Sesión sin perfil activo'; end if;
  if p_kind not in ('purchase', 'exit', 'transfer', 'adjustment') then raise exception 'Movimiento inválido'; end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then raise exception 'El movimiento requiere partidas'; end if;
  movement_id := coalesce(p_document ->> 'id', replace(gen_random_uuid()::text, '-', ''));

  if p_kind = 'purchase' then
    insert into public.romo_purchases(id, folio, purchase_date, supplier_id, supplier_name, invoice_number, warehouse, responsible_user, notes, items, subtotal, total_tax, total)
    values (movement_id, p_document ->> 'folio', coalesce((p_document ->> 'date')::date, current_date), p_document ->> 'supplierId', p_document ->> 'supplierName', p_document ->> 'invoiceNumber', p_document ->> 'warehouse', coalesce(p_document ->> 'responsibleUser', profile.name), p_document ->> 'notes', p_items, coalesce((p_document ->> 'subtotal')::numeric,0), coalesce((p_document ->> 'totalTax')::numeric,0), coalesce((p_document ->> 'total')::numeric,0));
    wh_origin := p_document ->> 'warehouse';
  elsif p_kind = 'exit' then
    insert into public.romo_exits(id, folio, exit_date, reason, unit_id, economic_number, work_order_id, work_order_folio, warehouse, responsible_user, notes, items, total_cost, maintenance_ticket_id)
    values (movement_id, p_document ->> 'folio', coalesce((p_document ->> 'date')::date, current_date), p_document ->> 'reason', p_document ->> 'unitId', p_document ->> 'economicNumber', p_document ->> 'workOrderId', p_document ->> 'workOrderFolio', p_document ->> 'warehouse', coalesce(p_document ->> 'responsibleUser', profile.name), p_document ->> 'notes', p_items, coalesce((p_document ->> 'totalCost')::numeric,0), nullif(p_document ->> 'maintenanceTicketId','')::uuid);
    wh_origin := p_document ->> 'warehouse';
  elsif p_kind = 'transfer' then
    insert into public.romo_transfers(id, folio, transfer_date, origin_warehouse, destination_warehouse, responsible_user, notes, items)
    values (movement_id, p_document ->> 'folio', coalesce((p_document ->> 'date')::date, current_date), p_document ->> 'originWarehouse', p_document ->> 'destinationWarehouse', coalesce(p_document ->> 'responsibleUser', profile.name), p_document ->> 'notes', p_items);
    wh_origin := p_document ->> 'originWarehouse'; wh_dest := p_document ->> 'destinationWarehouse';
  else
    insert into public.romo_physical_adjustments(id, folio, adjustment_date, warehouse, responsible_user, reason, notes, items)
    values (movement_id, p_document ->> 'folio', coalesce((p_document ->> 'date')::date, current_date), p_document ->> 'warehouse', coalesce(p_document ->> 'responsibleUser', profile.name), p_document ->> 'reason', p_document ->> 'notes', p_items);
    wh_origin := p_document ->> 'warehouse';
  end if;

  select id into origin_id from public.romo_warehouses where name = wh_origin;
  if origin_id is null then raise exception 'Almacén no encontrado: %', wh_origin; end if;
  if p_kind = 'transfer' then select id into dest_id from public.romo_warehouses where name = wh_dest; if dest_id is null then raise exception 'Almacén destino no encontrado: %', wh_dest; end if; end if;

  for item in select * from jsonb_array_elements(p_items) loop
    select * into product from public.romo_products where id = item ->> 'productId' for update;
    if product is null then raise exception 'Producto no encontrado'; end if;
    insert into public.romo_inventory_balances(product_id, warehouse_id, quantity) values(product.id, origin_id, 0) on conflict do nothing;
    select quantity into before_qty from public.romo_inventory_balances where product_id = product.id and warehouse_id = origin_id for update;
    if p_kind = 'purchase' then after_qty := before_qty + (item ->> 'qty')::integer;
    elsif p_kind = 'adjustment' then after_qty := (item ->> 'adjustedQty')::integer;
    else
      if before_qty < (item ->> 'qty')::integer then raise exception 'Existencia insuficiente para % en %', product.name, wh_origin; end if;
      after_qty := before_qty - (item ->> 'qty')::integer;
    end if;
    if after_qty < 0 then raise exception 'No se permiten existencias negativas'; end if;
    update public.romo_inventory_balances set quantity = after_qty, updated_at = now() where product_id = product.id and warehouse_id = origin_id;
    if p_kind = 'transfer' then
      insert into public.romo_inventory_balances(product_id, warehouse_id, quantity) values(product.id, dest_id, 0) on conflict do nothing;
      update public.romo_inventory_balances set quantity = quantity + (item ->> 'qty')::integer, updated_at = now() where product_id = product.id and warehouse_id = dest_id;
    end if;
    select coalesce(sum(quantity),0) into total_qty from public.romo_inventory_balances where product_id = product.id;
    update public.romo_products set current_stock = total_qty, unit_cost = case when p_kind = 'purchase' and coalesce((item ->> 'unitCost')::numeric,0) > 0 then (item ->> 'unitCost')::numeric else unit_cost end where id = product.id;
    insert into public.romo_kardex(id, date_time, folio, product_id, product_code, product_name, movement_type, qty_in, qty_out, resulting_stock, unit_cost, warehouse, unit_related, user_name, notes)
    values ('k-' || replace(gen_random_uuid()::text,'-',''), to_char(now(),'YYYY-MM-DD HH24:MI'), p_document ->> 'folio', product.id, product.code_internal, product.name, p_kind,
      case when p_kind in ('purchase','adjustment') and after_qty > before_qty then after_qty-before_qty else 0 end,
      case when p_kind in ('exit','transfer') then (item ->> 'qty')::integer when p_kind = 'adjustment' and after_qty < before_qty then before_qty-after_qty else 0 end,
      after_qty, coalesce((item ->> 'unitCost')::numeric, product.unit_cost), wh_origin, coalesce(p_document ->> 'economicNumber','-'), profile.name, coalesce(p_document ->> 'notes',''));
  end loop;
  if p_kind = 'exit' and nullif(p_document ->> 'maintenanceTicketId','') is not null then
    insert into public.romo_maintenance_events(ticket_id, event_type, note, actor_id, actor_name)
    values ((p_document ->> 'maintenanceTicketId')::uuid, 'parts_dispatched', 'Refacciones despachadas: ' || (p_document ->> 'folio'), profile.id, profile.name);
  end if;
  return jsonb_build_object('id', movement_id, 'folio', p_document ->> 'folio');
end; $$;

alter table public.romo_inventory_balances enable row level security;
alter table public.romo_maintenance_attachments enable row level security;
drop policy if exists balances_read_authenticated on public.romo_inventory_balances;
drop policy if exists attachments_read_own_or_taller on public.romo_maintenance_attachments;
create policy balances_read_authenticated on public.romo_inventory_balances for select to authenticated using (auth.uid() is not null);
create policy attachments_read_own_or_taller on public.romo_maintenance_attachments for select to authenticated using (exists (select 1 from public.romo_maintenance_tickets t where t.id = ticket_id and (t.reported_by = auth.uid()::text or public.romo_has_role(array['Mecánico','Administrador','Gerencia']))));
revoke all on public.romo_inventory_balances, public.romo_maintenance_attachments from anon, authenticated;
grant select on public.romo_inventory_balances, public.romo_maintenance_attachments to authenticated;
grant execute on function public.record_inventory_movement(text, jsonb, jsonb) to authenticated;
grant execute on function public.add_maintenance_attachment(uuid, text, text, text, bigint) to authenticated;

drop policy if exists maintenance_evidence_upload on storage.objects;
drop policy if exists maintenance_evidence_read on storage.objects;
create policy maintenance_evidence_upload on storage.objects for insert to authenticated with check (bucket_id = 'maintenance-evidence');
create policy maintenance_evidence_read on storage.objects for select to authenticated using (bucket_id = 'maintenance-evidence');
