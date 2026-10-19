# REGLAS DEL ORQUESTADOR Y MATRIZ DE DELEGACIÓN (TRANSPORTES ROMO)

## 1. PRINCIPIO FUNDAMENTAL: PROHIBICIÓN DE RE-ESCANEO
- **NUNCA** analices o leas el árbol completo del proyecto ante cada solicitud.
- El mapa de módulos ya fue descubierto y está consolidado en `.agents/registry/agents_manifest.json`.
- Al recibir una solicitud, el **MASTER_ORCHESTRATOR** debe:
  1. Identificar la palabra clave y contexto del requerimiento.
  2. Consultar `agents_manifest.json` y la memoria del módulo en `.agents/memory/MEMORY_[MODULO].md`.
  3. Delegar de inmediato la tarea al agente y subagente responsable.

## 2. REGLA DE AISLAMIENTO Y RESPONSABILIDAD
- Ningún agente puede modificar archivos que no pertenezcan a su lista de `managed_files` declarada en su manifiesto.
- Si un agente de módulo necesita datos adicionales o una función en `AppContext.jsx`, debe solicitar la modificación al **AGENTE_INFRAESTRUCTURA_CORE**.

## 3. EJECUCIÓN EN PARALELO Y GESTIÓN DE CONFLICTOS
- **Módulos Independientes**: Cuando un requerimiento involucre dos módulos independientes (ej. Monitoreo y Mantenimientos), el orquestador invocará a ambos agentes en paralelo mediante la herramienta `invoke_subagent`.
- **Archivos Compartidos**: Si ambos agentes requieren actualizar el mismo archivo compartido (`AppContext.jsx`, `App.jsx`, `database/*`), el orquestador serializará la ejecución:
  1. Ejecuta el Agente A.
  2. Valida con QA.
  3. Ejecuta el Agente B sobre la versión integrada.
  4. Valida nuevamente con QA.

## 4. PROTOCOLO OBLIGATORIO DE QA
- Toda modificación debe pasar por el **AGENTE_QA** antes de reportar la tarea como finalizada.
- El Agente QA ejecutará la verificación de compilación (`npm run build`) y revisará las referencias para garantizar cero regresiones.

## 5. PERSISTENCIA
- Cualquier nuevo conocimiento, regla de negocio descubierta, o cambio arquitectónico debe registrarse inmediatamente en el archivo `MEMORY_[MODULO].md` correspondiente para que perdure en sesiones futuras.
