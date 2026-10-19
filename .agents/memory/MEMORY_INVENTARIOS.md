# MEMORIA TÉCNICA: AGENTE_INVENTARIOS (Almacén, Catálogos & Kardex)

## 1. Archivos Administrados
- `src/pages/DashboardView.jsx`: Resumen ejecutivo de existencias, valor del inventario y alertas.
- `src/pages/ProductsView.jsx`: Catálogo de productos y refacciones, números de parte, fotos y stock.
- `src/pages/CategoriesBrandsView.jsx`: Gestión de familias de piezas, marcas y categorías.
- `src/pages/WarehousesView.jsx`: Registro y control de almacenes físicos.
- `src/pages/SuppliersView.jsx`: Padrón de proveedores, RFC, condiciones de pago.
- `src/pages/UnitsView.jsx`: Unidades de transporte (tractocamiones, remolques, camionetas, VIN, placas).
- `src/pages/PurchasesView.jsx`: Registro de órdenes de compra, entrada de mercancía y facturas.
- `src/pages/ExitsView.jsx`: Registro de salidas directas de almacén por vale.
- `src/pages/WorkOrdersView.jsx`: Vista clásica de órdenes ligadas al inventario.
- `src/pages/PhysicalInventoryView.jsx`: Auditorías de inventario físico y conciliación de stock.
- `src/pages/KardexView.jsx`: Libro mayor de movimientos (entradas, salidas, ajustes, transferencias).
- `src/pages/AlertsView.jsx`: Notificaciones de desabasto, stock mínimo y sobrestock.
- `src/pages/ReportsView.jsx`: Reportes analíticos de consumo y rotación.
- `src/components/Sidebar.jsx`: Barra de navegación de inventarios.
- `src/data/initialData.js`: Datos base iniciales y estructura de modelos.
- `database/20260914_phase_1_2_operations.sql`: Lógica transaccional de balances y kardex.

## 2. Subagentes y Funciones Clave
- **Subagente_Stock_Kardex**:
  - Consulta y balance por producto y almacén (`romo_inventory_balances`).
  - Registro de auditoría cronológica en `romo_kardex` (`qty_in`, `qty_out`, `resulting_stock`, `unit_cost`).
- **Subagente_Catalogo_Productos**:
  - Código interno, código de proveedor, unidad de medida, compatibilidad con modelos de camiones.
  - Costo unitario promedio y precio de referencia.
  - Alerta de stock mínimo y límite de stock máximo.
- **Subagente_Compras_Recepcion**:
  - Creación de folios de compra, afectación de stock entrante y cálculo de costos con impuestos.
- **Subagente_Ajustes_Fisicos**:
  - Registro de tomas de inventario, cálculo de discrepancias contra sistema y registro de póliza de ajuste.

## 3. Dependencias
- `src/context/AppContext.jsx`: Métodos de actualización de inventario.
- Tablas Supabase: `romo_products`, `romo_categories`, `romo_brands`, `romo_warehouses`, `romo_suppliers`, `romo_units`, `romo_purchases`, `romo_exits`, `romo_transfers`, `romo_physical_adjustments`, `romo_kardex`.

## 4. Reglas de Negocio Críticas
- Toda salida o entrada debe generar su correspondiente renglón en `romo_kardex`.
- El stock de un producto no puede decrementar por debajo de cero salvo autorización o ajuste físico documentado.
- La compatibilidad vehicular debe cotejarse contra el catálogo de `romo_units`.
