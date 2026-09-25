-- ====================================================================
-- SCRIPT PARA AÑADIR LLAVES FORÁNEAS (RELACIONES) A LAS TABLAS
-- ====================================================================

-- 1. Relacionar Compras con Proveedores
ALTER TABLE romo_purchases 
ADD CONSTRAINT fk_supplier 
FOREIGN KEY (supplier_id) 
REFERENCES romo_suppliers(id) 
ON DELETE SET NULL;

-- 2. Relacionar Salidas (Exits) con Unidades y Órdenes de Trabajo
ALTER TABLE romo_exits 
ADD CONSTRAINT fk_unit_exit 
FOREIGN KEY (unit_id) 
REFERENCES romo_units(id) 
ON DELETE SET NULL;

ALTER TABLE romo_exits 
ADD CONSTRAINT fk_work_order 
FOREIGN KEY (work_order_id) 
REFERENCES romo_work_orders(id) 
ON DELETE SET NULL;

-- 3. Relacionar Órdenes de Trabajo con Unidades
ALTER TABLE romo_work_orders 
ADD CONSTRAINT fk_unit_wo 
FOREIGN KEY (unit_id) 
REFERENCES romo_units(id) 
ON DELETE SET NULL;

-- 4. Relacionar el Kardex (Historial) con los Productos
ALTER TABLE romo_kardex 
ADD CONSTRAINT fk_product_kardex 
FOREIGN KEY (product_id) 
REFERENCES romo_products(id) 
ON DELETE CASCADE;

-- 5. Relacionar las transferencias con los almacenes
-- Como los almacenes en el frontend se manejan por "nombre" (ej. "Almacén Central"), 
-- primero aseguramos que los nombres de almacén sean únicos para poder referenciarlos.
ALTER TABLE romo_warehouses ADD CONSTRAINT unique_warehouse_name UNIQUE (name);

ALTER TABLE romo_transfers 
ADD CONSTRAINT fk_origin_warehouse 
FOREIGN KEY (origin_warehouse) 
REFERENCES romo_warehouses(name) 
ON DELETE CASCADE;

ALTER TABLE romo_transfers 
ADD CONSTRAINT fk_dest_warehouse 
FOREIGN KEY (destination_warehouse) 
REFERENCES romo_warehouses(name) 
ON DELETE CASCADE;
