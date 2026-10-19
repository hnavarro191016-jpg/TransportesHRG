# MEMORIA TÉCNICA: AGENTE_MANTENIMIENTOS (Taller & Órdenes de Servicio)

## 1. Archivos Administrados
- `src/pages/mantenimientos/MantenimientoDashboard.jsx`: Tablero gerencial y de taller (urgencias, pendientes, resueltos, costos).
- `src/pages/mantenimientos/ReporterWizard.jsx`: Wizard interactivo para que el operador reporte fallas en su unidad.
- `src/pages/mantenimientos/WorkOrdersView.jsx`: Gestión tabular y detallada de órdenes y tickets de taller.
- `src/pages/mantenimientos/DespachoView.jsx`: Despacho transaccional de refacciones ligadas al ticket de mantenimiento.
- `src/components/SidebarMantenimiento.jsx`: Navegación lateral específica de mantenimientos.
- `database/20260914_portal_security_and_maintenance.sql`: Migración de base de datos para soporte de tickets de taller.
- `PROJECT_PLAN.md`: Definición operativa de fases y flujos acordados.

## 2. Subagentes y Funciones Clave
- **Subagente_Reporter_Operador**:
  - Selección de unidad (`economic_number`), categoría de avería (frenos, motor, llantas, luces, suspensión, etc.).
  - Determinación de prioridad inicial (Baja, Media, Alta, Urgente).
  - Carga opcional de evidencias (fotografía, documento o nota).
  - Inserción de registro en `romo_work_orders` en estado inicial `reported`.
- **Subagente_Taller_Tickets**:
  - Transición de estados de la orden: `reported` → `in_progress` → `resolved` → `closed`.
  - Asignación de mecánico/técnico responsable.
  - Registro obligatorio de diagnóstico y solución escrita antes de resolver.
  - Bitácora inmutable de quién reportó, atendió y resolvió el ticket.
- **Subagente_Despacho_Refacciones**:
  - Selección de ticket de mantenimiento activo.
  - Selección de almacén de origen y refacción.
  - Llamada transaccional a RPC `record_inventory_movement` en Supabase: valida existencia, descuenta saldo, actualiza costo y genera kardex automáticamente.
- **Subagente_Metricas_Mantenimiento**:
  - Métricas KPI: tiempo de primera atención, tiempo de resolución, costo total por unidad vehicular, reincidencia de fallas.

## 3. Dependencias
- `src/context/AppContext.jsx`: Acceso a `data.workOrders`, `data.products`, `data.warehouses`, `data.units`.
- Tablas Supabase: `romo_work_orders`, `romo_inventory_balances`, `romo_kardex`, `romo_products`.

## 4. Reglas de Negocio Críticas
- Un ticket NO puede cerrarse como `resolved` sin una solución textual documentada.
- No se pueden despachar refacciones a tickets cerrados o cancelados.
- Todo despacho a unidad vehicular debe afectar transaccionalmente las existencias en `romo_inventory_balances`.
