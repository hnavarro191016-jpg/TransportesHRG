-- ====================================================================
-- SCRIPT MIGRATORIO SQL PARA SUPABASE
-- ====================================================================

DROP TABLE IF EXISTS romo_users CASCADE;
DROP TABLE IF EXISTS romo_kardex CASCADE;
DROP TABLE IF EXISTS romo_physical_adjustments CASCADE;
DROP TABLE IF EXISTS romo_transfers CASCADE;
DROP TABLE IF EXISTS romo_work_orders CASCADE;
DROP TABLE IF EXISTS romo_exits CASCADE;
DROP TABLE IF EXISTS romo_purchases CASCADE;
DROP TABLE IF EXISTS romo_products CASCADE;
DROP TABLE IF EXISTS romo_units CASCADE;
DROP TABLE IF EXISTS romo_suppliers CASCADE;
DROP TABLE IF EXISTS romo_warehouses CASCADE;
DROP TABLE IF EXISTS romo_brands CASCADE;
DROP TABLE IF EXISTS romo_categories CASCADE;

CREATE TABLE romo_categories (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_categories_policy" ON romo_categories FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE romo_brands (
    id text PRIMARY KEY,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_brands_policy" ON romo_brands FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE romo_warehouses (
    id text PRIMARY KEY,
    name text NOT NULL,
    location text,
    description text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_warehouses_policy" ON romo_warehouses FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE romo_suppliers (
    id text PRIMARY KEY,
    name text NOT NULL,
    rfc text,
    contact text,
    phone text,
    email text,
    address text,
    payment_terms text,
    status text DEFAULT 'activo',
    notes text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_suppliers_policy" ON romo_suppliers FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE romo_units (
    id text PRIMARY KEY,
    economic_number text NOT NULL UNIQUE,
    plates text NOT NULL,
    unit_type text NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    year integer NOT NULL,
    vin text NOT NULL,
    status text DEFAULT 'activo',
    notes text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_units_policy" ON romo_units FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE romo_products (
    id text PRIMARY KEY,
    code_internal text NOT NULL UNIQUE,
    code_supplier text,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    brand text NOT NULL,
    unit_of_measure text,
    compatibility text,
    unit_cost numeric DEFAULT 0,
    ref_price numeric DEFAULT 0,
    current_stock integer DEFAULT 0,
    min_stock integer DEFAULT 5,
    max_stock integer DEFAULT 50,
    warehouse text NOT NULL,
    location_details text,
    photo_url text,
    status text DEFAULT 'activo',
    expiration_date text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_products_policy" ON romo_products FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE romo_purchases (
    id text PRIMARY KEY,
    folio text NOT NULL UNIQUE,
    purchase_date date DEFAULT current_date,
    supplier_id text,
    supplier_name text NOT NULL,
    invoice_number text,
    warehouse text NOT NULL,
    responsible_user text NOT NULL,
    notes text,
    items jsonb,
    subtotal numeric DEFAULT 0,
    total_tax numeric DEFAULT 0,
    total numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_purchases_policy" ON romo_purchases FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE romo_exits (
    id text PRIMARY KEY,
    folio text NOT NULL UNIQUE,
    exit_date date DEFAULT current_date,
    reason text NOT NULL,
    unit_id text,
    economic_number text,
    work_order_id text,
    work_order_folio text,
    warehouse text NOT NULL,
    responsible_user text NOT NULL,
    notes text,
    items jsonb,
    total_cost numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_exits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_exits_policy" ON romo_exits FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE romo_work_orders (
    id text PRIMARY KEY,
    folio text NOT NULL UNIQUE,
    unit_id text,
    economic_number text NOT NULL,
    unit_info text,
    maintenance_type text NOT NULL,
    issue_description text NOT NULL,
    diagnosis text,
    technician text NOT NULL,
    status text,
    open_date text NOT NULL,
    close_date text,
    parts_used jsonb,
    labor_cost numeric DEFAULT 0,
    total_cost numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_work_orders_policy" ON romo_work_orders FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE romo_transfers (
    id text PRIMARY KEY,
    folio text NOT NULL UNIQUE,
    transfer_date date DEFAULT current_date,
    origin_warehouse text NOT NULL,
    destination_warehouse text NOT NULL,
    responsible_user text NOT NULL,
    notes text,
    items jsonb,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_transfers_policy" ON romo_transfers FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE romo_physical_adjustments (
    id text PRIMARY KEY,
    folio text NOT NULL UNIQUE,
    adjustment_date date DEFAULT current_date,
    warehouse text NOT NULL,
    responsible_user text NOT NULL,
    reason text NOT NULL,
    notes text,
    items jsonb,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_physical_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_physical_adjustments_policy" ON romo_physical_adjustments FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE romo_kardex (
    id text PRIMARY KEY,
    date_time text NOT NULL,
    folio text NOT NULL,
    product_id text NOT NULL,
    product_code text NOT NULL,
    product_name text NOT NULL,
    movement_type text NOT NULL,
    qty_in integer DEFAULT 0,
    qty_out integer DEFAULT 0,
    resulting_stock integer NOT NULL,
    unit_cost numeric DEFAULT 0,
    warehouse text NOT NULL,
    unit_related text,
    user_name text NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_kardex ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_kardex_policy" ON romo_kardex FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE romo_users (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    role text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE romo_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romo_users_policy" ON romo_users FOR ALL USING (true) WITH CHECK (true);

