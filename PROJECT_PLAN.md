# Portal Empresarial · Mantenimientos

## Modelo operativo

1. **Operador:** al entrar a Mantenimientos abre el asistente. El sistema reconoce su sesión, pide unidad, tipo de falla, detalle y prioridad; crea un ticket interno.
2. **Taller:** el dashboard muestra urgentes, pendientes, reparaciones y resueltos. Un mecánico toma el ticket, registra diagnóstico/solución y lo resuelve.
3. **Seguimiento:** el operador consulta el estado de sus reportes. La bitácora conserva quién reportó, tomó y resolvió el ticket.

## Reglas de negocio acordadas en esta primera versión

- Estados: `reported` → `in_progress` → `resolved` → `closed`.
- La prioridad la propone el operador; taller/administración puede reclasificarla en una fase posterior.
- Se requiere solución escrita para resolver. El cierre definitivo quedará como validación de supervisión/operador en la siguiente fase.
- Telegram deja de ser la fuente de tickets; puede conservarse solo como notificación opcional futura.

## Implementación por fases

1. Aplicar, en este orden, `database/20260914_portal_security_and_maintenance.sql` y `database/20260914_phase_1_2_operations.sql`. Crear o conservar un administrador inicial desde Supabase con acceso controlado.
2. Validar el flujo con un operador y un mecánico reales. El reportador ya admite evidencia opcional (foto/PDF) y el taller ya muestra la bitácora de cada ticket.
3. Despachar refacciones desde **Mantenimientos → Despacho a unidad**. El despacho se liga al ticket, valida el saldo del almacén y registra el movimiento de forma transaccional.
4. Medir tiempo de primera atención, tiempo de resolución, reincidencia y costo por unidad.

## Inventario: implementación de fase 2

La migración de fase 2 crea `romo_inventory_balances`, una existencia por producto y almacén. Compras, salidas, transferencias y ajustes pasan por `record_inventory_movement`: inserta el documento, bloquea el saldo involucrado, valida existencias, actualiza saldo, recalcula el total del producto y crea kardex en una sola transacción. La interfaz no cierra el formulario hasta recibir una respuesta exitosa.

## Prueba de aceptación recomendada

1. Como administrador, reporta `T-01` → **Llantas o ponchadura** → evidencia fotográfica.
2. Toma el ticket desde **Tickets de mantenimiento** y revisa su bitácora.
3. Desde **Despacho a unidad**, selecciona el ticket, un almacén y una refacción.
4. Confirma que se genera la salida, baja la existencia del almacén correcto y aparece el kardex.
5. Resuelve el ticket documentando la solución aplicada.
