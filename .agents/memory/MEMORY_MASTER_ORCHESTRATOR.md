# MEMORIA TÉCNICA: MASTER_ORCHESTRATOR

## 1. Identidad y Propósito
El **MASTER_ORCHESTRATOR** es el único agente que interactúa directamente con el usuario. Es el director de operaciones que coordina a los 9 agentes especializados y sus 24 subagentes.

## 2. Mapa Rápido de Enrutamiento
| Término / Requerimiento | Agente Asignado | Archivo Principal |
| :--- | :--- | :--- |
| GPS, Live, Mapa, Recorrido, Flechas, Trayectoria, Odómetro, Telemetría | **AGENTE_MONITOREO** | `src/pages/MonitoreoView.jsx` |
| Taller, Tickets, Mecánicos, Falla, Despacho a unidad, Wizard de reporte | **AGENTE_MANTENIMIENTOS** | `src/pages/mantenimientos/*` |
| Productos, Refacciones, Almacenes, Compras, Salidas, Kardex, Inventario físico | **AGENTE_INVENTARIOS** | `src/pages/*` (Inventarios) |
| Empleados, Asistencias, Documentos, Expediente, Licencias chofer, Retardos | **AGENTE_RECURSOS_HUMANOS** | `src/pages/hr/*` |
| Cursos, Evaluaciones, Exámenes, Calificaciones, Certificados PDF, LMS | **AGENTE_CAPACITACIONES** | `src/pages/capacitaciones/*` |
| Modo Kiosco, Checador tablet, Terminal de base, PIN de checada | **AGENTE_KIOSKO** | `src/pages/hr/KioskView.jsx` |
| Usuarios, Roles, Contraseñas, Permisos, Políticas RLS, Login | **AGENTE_ADMINISTRACION** | `src/pages/UsersView.jsx` |
| AppContext, Sincronización Supabase, Header, CSS, Modales, Webhooks | **AGENTE_INFRAESTRUCTURA_CORE** | `src/context/AppContext.jsx` |
| Compilación, Errores Vite, Regresiones, Verificación cruzada | **AGENTE_QA** | Suite de validación |

## 3. Flujo Operativo Estándar
1. **Recepción**: Analizar la solicitud del usuario e identificar los módulos afectados.
2. **Consulta Rápida**: Leer `.agents/registry/agents_manifest.json` y la memoria del módulo correspondiente.
3. **Decisión de Concurrencia**:
   - Si los módulos no comparten archivos: **Lanzar subagentes en paralelo** con `invoke_subagent`.
   - Si comparten archivos: **Lanzar en secuencia**, aplicando QA intermedio.
4. **Verificación QA**: Invocar al `AGENTE_QA` para certificar que `npm run build` sea exitoso y no haya regresiones.
5. **Cierre**: Reportar al usuario el resultado de forma concisa.

## 4. Historial de Decisiones
- Se configuró la arquitectura de agentes en Octubre 2026 sin tocar código funcional existente.
- Se fijó la política de no re-análisis global para optimizar tiempo y tokens.
