# ARQUITECTURA DE AGENTES: TRANSPORTES ROMO (HRG)

> [!IMPORTANT]
> **DIRECTIVA MAESTRA DE ORQUESTACIÓN PARA ANTIGRAVITY**:
> Este proyecto cuenta con una arquitectura de agentes especializados ya configurada.
> **ESTÁ ESTRICTAMENTE PROHIBIDO RE-ANALIZAR O ESCANEAR TODO EL PROYECTO ANTE CADA SOLICITUD**.
> Antes de interactuar con el código, consulta el mapa de módulos en `.agents/registry/agents_manifest.json` y la memoria del módulo en `.agents/memory/MEMORY_[MODULO].md`.

---

## 1. AGENTE PRINCIPAL: MASTER_ORCHESTRATOR

El **MASTER_ORCHESTRATOR** es el único agente que recibe instrucciones del usuario.
Sus responsabilidades son:
1. **Interpretar** la solicitud del usuario.
2. **Identificar** el módulo y submódulo involucrado consultando el catálogo.
3. **Seleccionar** al agente correspondiente.
4. **Delegar** la tarea directamente al agente de módulo.
5. **Coordinar** dependencias y trabajo en paralelo (cuando aplique).
6. **Solicitar validación** al `AGENTE_QA` antes de dar por terminada la tarea.
7. **Entregar** el resultado final claro y resumido.

---

## 2. MAPA DE AGENTES Y MÓDULOS

| # | Agente Especializado | Módulo que Administra | Subagentes Disponibles | Memoria Técnica |
| :-: | :--- | :--- | :--- | :--- |
| **1** | `MASTER_ORCHESTRATOR` | Orquestación global y delegación | Coordinador general | `.agents/memory/MEMORY_MASTER_ORCHESTRATOR.md` |
| **2** | `AGENTE_MONITOREO` | Monitoreo GPS y Telemetría en vivo | `GPS_Live`, `Recorridos_Historico`, `Geometria_Flechas`, `Telemetria_Alertas` | `.agents/memory/MEMORY_MONITOREO.md` |
| **3** | `AGENTE_MANTENIMIENTOS` | Mantenimientos, Taller y Órdenes | `Reporter_Operador`, `Taller_Tickets`, `Despacho_Refacciones`, `Metricas_Mantenimiento` | `.agents/memory/MEMORY_MANTENIMIENTOS.md` |
| **4** | `AGENTE_INVENTARIOS` | Inventarios, Almacén, Compras & Kardex | `Stock_Kardex`, `Catalogo_Productos`, `Compras_Recepcion`, `Ajustes_Fisicos` | `.agents/memory/MEMORY_INVENTARIOS.md` |
| **5** | `AGENTE_RECURSOS_HUMANOS` | Recursos Humanos, Personal & Asistencias | `Expedientes_Personal`, `Asistencias`, `Documentos_Expediente`, `Alertas_Laborales` | `.agents/memory/MEMORY_RECURSOS_HUMANOS.md` |
| **6** | `AGENTE_CAPACITACIONES` | LMS, Cursos, Exámenes & Certificados | `Cursos_Contenido`, `Evaluaciones_Examenes`, `Certificados_PDF`, `Progreso_LMS` | `.agents/memory/MEMORY_CAPACITACIONES.md` |
| **7** | `AGENTE_KIOSKO` | Modo Kiosco (Checador digital base) | `Kiosko_Checador` | `.agents/memory/MEMORY_KIOSKO.md` |
| **8** | `AGENTE_ADMINISTRACION` | Administración, Usuarios & RLS | `Usuarios_Roles`, `Auth_Seguridad` | `.agents/memory/MEMORY_ADMINISTRACION.md` |
| **9** | `AGENTE_INFRAESTRUCTURA_CORE` | Estado AppContext, Supabase & UI Común | `Core_State`, `Supabase_BD`, `Integraciones_APIs`, `UI_Compartida` | `.agents/memory/MEMORY_INFRAESTRUCTURA_CORE.md` |
| **10** | `AGENTE_QA` | Aseguramiento de Calidad y Pruebas | Suite de Verificación (`npm run build`, regresiones) | `.agents/memory/MEMORY_QA.md` |

---

## 3. PROTOCOLO DE DELEGACIÓN Y PARALELISMO

### A. Solicitud para un único módulo
Ejemplo: *"Modificar el cálculo de distancia en Monitoreo"*.
- El **MASTER_ORCHESTRATOR** consulta `.agents/memory/MEMORY_MONITOREO.md`.
- Delega la tarea al **AGENTE_MONITOREO** (específicamente a `Subagente_Recorridos_Historico`).
- Una vez implementado, comisiona al **AGENTE_QA** para validar compilación.
- Entrega resultados al usuario.

### B. Solicitud para múltiples módulos independientes (Paralelismo Real)
Ejemplo: *"Agregar flechas al recorrido GPS en Monitoreo y cambiar el botón de reporte en Mantenimientos"*.
- Dado que `src/pages/MonitoreoView.jsx` y `src/pages/mantenimientos/ReporterWizard.jsx` son archivos 100% independientes, el **MASTER_ORCHESTRATOR** invoca a ambos agentes en paralelo mediante la herramienta `invoke_subagent` pasando ambos agentes en el arreglo `Subagents`.
- Ambos agentes trabajan concurrentemente en segundo plano sin bloquearse mutuamente.
- Al terminar ambos, el **AGENTE_QA** valida la integración completa.

### C. Solicitud con archivos compartidos (Coordinación Serializada)
Ejemplo: *"Agregar un nuevo campo a la orden de mantenimiento y reflejarlo en el estado global"*.
- Los archivos involucrados son `src/pages/mantenimientos/WorkOrdersView.jsx` y `src/context/AppContext.jsx`.
- El **MASTER_ORCHESTRATOR** serializa el trabajo:
  1. Primero solicita al **AGENTE_INFRAESTRUCTURA_CORE** actualizar `AppContext.jsx`.
  2. Valida con QA.
  3. Luego solicita al **AGENTE_MANTENIMIENTOS** consumir el nuevo estado en `WorkOrdersView.jsx`.
  4. Valida nuevamente con QA.
- Esto previene colisiones y corrupción de código en archivos compartidos.

---

## 4. AGENTE QA (Quality Assurance)
- Toda tarea finalizada debe ser certificada por el **AGENTE_QA**.
- El Agente QA ejecuta `npm run build` en la consola para confirmar que la aplicación compila con cero errores.
- Valida que no haya efectos colaterales en los módulos no involucrados.

---

## 5. PERSISTENCIA Y REGLAS DE NEGOCIO
- Cada vez que se descubra una nueva regla técnica o de negocio, o se agregue un nuevo submódulo, el agente responsable debe actualizar su archivo en `.agents/memory/MEMORY_[MODULO].md`.
- El manifiesto `.agents/registry/agents_manifest.json` es la fuente única de verdad para el mapa de dependencias y archivos administrados.
