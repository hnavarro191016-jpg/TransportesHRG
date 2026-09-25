-- Migración aditiva para Supabase. Revísala y ejecútala UNA vez en SQL Editor.
-- No ejecuta los DROP TABLE del archivo supabase_schema.sql original.

create extension if not exists pgcrypto;

-- Tablas que el frontend ya consulta y que no existían en el esquema inicial.
create table if not exists public.romo_employees (
  id text primary key, full_name text not null, email text, position text,
  department text, status text default 'activo', created_at timestamptz default now()
);
create table if not exists public.romo_courses (
  id text primary key, title text not null, description text, audience text,
  content jsonb default '[]'::jsonb, active boolean default true, created_at timestamptz default now()
);
create table if not exists public.romo_course_assignments (
  id text primary key, course_id text references public.romo_courses(id) on delete cascade,
  employee_id text references public.romo_employees(id) on delete cascade,
  status text default 'assigned', progress numeric default 0, completed_at timestamptz, created_at timestamptz default now()
);

create table if not exists public.romo_maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique not null default ('MTTO-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5))),
  unit_id text not null references public.romo_units(id),
  economic_number text not null,
  category text not null check (category in ('mecanica', 'llantas', 'electrica', 'seguridad', 'revision')),
  description text not null check (char_length(description) between 5 and 2000),
  priority text not null default 'media' check (priority in ('baja', 'media', 'alta')),
  status text not null default 'reported' check (status in ('reported', 'assigned', 'in_progress', 'resolved', 'closed')),
  reported_by text not null,
  reported_by_name text not null,
  assigned_to text,
  assigned_to_name text,
  solution text,
  reported_at timestamptz not null default now(), assigned_at timestamptz, resolved_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists romo_maintenance_tickets_status_reported_at_idx on public.romo_maintenance_tickets(status, reported_at desc);
create index if not exists romo_maintenance_tickets_reported_by_idx on public.romo_maintenance_tickets(reported_by);

create table if not exists public.romo_maintenance_events (
  id uuid primary key default gen_random_uuid(), ticket_id uuid not null references public.romo_maintenance_tickets(id) on delete cascade,
  event_type text not null, note text, actor_id text not null, actor_name text not null, created_at timestamptz not null default now()
);

-- Funciones SECURITY DEFINER: limitan los cambios sensibles al flujo del servidor.
create or replace function public.romo_has_role(allowed_roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.romo_users where id = auth.uid()::text and active = true and role = any(allowed_roles));
$$;

create or replace function public.create_maintenance_ticket(p_unit_id text, p_economic_number text, p_category text, p_description text, p_priority text)
returns public.romo_maintenance_tickets language plpgsql security definer set search_path = public as $$
declare profile public.romo_users; ticket public.romo_maintenance_tickets;
begin
  select * into profile from public.romo_users where id = auth.uid()::text and active = true;
  if profile is null then raise exception 'No existe un perfil activo para esta sesión'; end if;
  insert into public.romo_maintenance_tickets(unit_id, economic_number, category, description, priority, reported_by, reported_by_name)
  values (p_unit_id, p_economic_number, p_category, p_description, p_priority, profile.id, profile.name) returning * into ticket;
  insert into public.romo_maintenance_events(ticket_id, event_type, note, actor_id, actor_name)
  values (ticket.id, 'reported', 'Reporte creado desde Portal Empresarial', profile.id, profile.name);
  return ticket;
end; $$;

create or replace function public.take_maintenance_ticket(p_ticket_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare profile public.romo_users; ticket public.romo_maintenance_tickets;
begin
  select * into profile from public.romo_users where id = auth.uid()::text and active and role in ('Mecánico', 'Administrador');
  if profile is null then raise exception 'Solo el personal de taller puede tomar tickets'; end if;
  update public.romo_maintenance_tickets set status = 'in_progress', assigned_to = profile.id, assigned_to_name = profile.name, assigned_at = now(), updated_at = now()
  where id = p_ticket_id and status = 'reported' returning * into ticket;
  if ticket is null then raise exception 'El ticket ya fue tomado o no existe'; end if;
  insert into public.romo_maintenance_events(ticket_id, event_type, note, actor_id, actor_name) values (ticket.id, 'assigned', 'Ticket tomado por taller', profile.id, profile.name);
end; $$;

create or replace function public.resolve_maintenance_ticket(p_ticket_id uuid, p_solution text)
returns void language plpgsql security definer set search_path = public as $$
declare profile public.romo_users; ticket public.romo_maintenance_tickets;
begin
  select * into profile from public.romo_users where id = auth.uid()::text and active and role in ('Mecánico', 'Administrador');
  if profile is null then raise exception 'Solo el personal de taller puede resolver tickets'; end if;
  update public.romo_maintenance_tickets set status = 'resolved', solution = p_solution, resolved_at = now(), updated_at = now()
  where id = p_ticket_id and status in ('assigned', 'in_progress') and (assigned_to = profile.id or profile.role = 'Administrador') returning * into ticket;
  if ticket is null then raise exception 'No puedes resolver este ticket'; end if;
  insert into public.romo_maintenance_events(ticket_id, event_type, note, actor_id, actor_name) values (ticket.id, 'resolved', p_solution, profile.id, profile.name);
end; $$;

-- Reemplaza las políticas públicas por acceso autenticado y basado en rol.
alter table public.romo_users enable row level security;
drop policy if exists "romo_users_policy" on public.romo_users;
drop policy if exists romo_users_self_read on public.romo_users;
drop policy if exists romo_users_admin_update on public.romo_users;
create policy romo_users_self_read on public.romo_users for select to authenticated using (id = auth.uid()::text or public.romo_has_role(array['Administrador']));
create policy romo_users_admin_update on public.romo_users for update to authenticated using (public.romo_has_role(array['Administrador'])) with check (public.romo_has_role(array['Administrador']));

alter table public.romo_maintenance_tickets enable row level security;
alter table public.romo_maintenance_events enable row level security;
drop policy if exists tickets_read_own_or_taller on public.romo_maintenance_tickets;
drop policy if exists ticket_events_read_own_or_taller on public.romo_maintenance_events;
create policy tickets_read_own_or_taller on public.romo_maintenance_tickets for select to authenticated using (reported_by = auth.uid()::text or public.romo_has_role(array['Mecánico','Administrador','Gerencia']));
create policy ticket_events_read_own_or_taller on public.romo_maintenance_events for select to authenticated using (exists (select 1 from public.romo_maintenance_tickets t where t.id = ticket_id and (t.reported_by = auth.uid()::text or public.romo_has_role(array['Mecánico','Administrador','Gerencia']))));

-- Todas las escrituras de tickets pasan por las RPCs; no otorgues INSERT/UPDATE directos al cliente.
revoke all on public.romo_maintenance_tickets, public.romo_maintenance_events from anon, authenticated;
grant select on public.romo_maintenance_tickets, public.romo_maintenance_events to authenticated;
grant execute on function public.create_maintenance_ticket(text, text, text, text, text), public.take_maintenance_ticket(uuid), public.resolve_maintenance_ticket(uuid, text) to authenticated;

-- Tablas operativas existentes: se elimina el acceso de anon y se limita la escritura
-- a los roles que administran operación. Ajusta esta matriz cuando se definan permisos más finos.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'romo_categories', 'romo_brands', 'romo_warehouses', 'romo_suppliers', 'romo_units',
    'romo_products', 'romo_purchases', 'romo_exits', 'romo_work_orders', 'romo_transfers',
    'romo_physical_adjustments', 'romo_kardex', 'romo_employees', 'romo_courses', 'romo_course_assignments'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_policy', table_name);
    execute format('drop policy if exists authenticated_read on public.%I', table_name);
    execute format('drop policy if exists controlled_write on public.%I', table_name);
    execute format('create policy authenticated_read on public.%I for select to authenticated using (auth.uid() is not null)', table_name);
    execute format('create policy controlled_write on public.%I for all to authenticated using (public.romo_has_role(array[''Administrador'', ''Encargado de almacén'', ''Compras''])) with check (public.romo_has_role(array[''Administrador'', ''Encargado de almacén'', ''Compras'']))', table_name);
    execute format('revoke all on public.%I from anon', table_name);
  end loop;
end $$;

-- Altas normales: el perfil nunca se crea desde JavaScript ni se autoasigna administrador.
-- Crea el primer administrador directamente en Supabase antes de habilitar registro público.
create or replace function public.create_pending_romo_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.romo_users(id, name, email, role, active)
  values (new.id::text, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), new.email, 'Pendiente', false)
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists create_pending_romo_profile on auth.users;
create trigger create_pending_romo_profile after insert on auth.users for each row execute function public.create_pending_romo_profile();
