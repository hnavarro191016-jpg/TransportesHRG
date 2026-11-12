# MEMORIA TÉCNICA: AGENTE_RECLUTAMIENTO (Atracción de Talento & Selección)

## 1. Archivos Administrados
- `src/pages/reclutamiento/RecruitmentView.jsx`: Orquestador principal de subvistas del módulo.
- `src/pages/reclutamiento/RecruitmentDashboardView.jsx`: Panel general de KPIs, candidatos pendientes de revisión, entrevistas y notificaciones.
- `src/pages/reclutamiento/CandidatesListView.jsx`: Listado y filtrado avanzado (vacante, estado, responsable, buscador reactivo).
- `src/pages/reclutamiento/CandidateDetailView.jsx`: Expediente integral del candidato, auditoría de estados y acciones de Empresa vs Reclutador.
- `src/pages/reclutamiento/CandidateFormModal.jsx`: Formulario estructurado, campos por perfil de vacante y validación en tiempo real de duplicados.
- `src/pages/reclutamiento/MyPendingView.jsx`: Panel "Mis pendientes" para el reclutador con señalización visual de vencidas.
- `src/pages/reclutamiento/VacanciesView.jsx`: Catálogo dinámico para crear, editar, pausar y cerrar vacantes sin tocar código.
- `src/components/SidebarReclutamiento.jsx`: Menú lateral de navegación con contadores y badges.
- `database/20261112_recruitment_module.sql`: DDL de tablas PostgreSQL con RLS y datos iniciales para Supabase.

## 2. Dependencias Compartidas
- `src/context/AppContext.jsx`: Métodos de mutación (`addRecruitmentCandidate`, `changeCandidateStatus`, `addCandidateFollowup`, `addRecruitmentVacancy`, `checkCandidateDuplicate`).
- `src/pages/ModuleHubView.jsx`: Punto de entrada desde el portal empresarial.
- `src/App.jsx`: Enrutador global de módulos.

## 3. Subagentes y Funciones Clave
- **Subagente_Atraccion_Candidatos**:
  - Detección reactiva de duplicados por teléfono o correo electrónico.
  - Captura estructurada de datos de contacto, disponibilidad, expectativa salarial y trayectoria laboral.
  - Registro de consentimiento obligatorio del aspirante para compartir su información.
  - Bloqueo de solicitud de datos sensibles innecesarios (bancarios, médicos, etc.).
- **Subagente_Perfiles_Vacantes**:
  - Campos dinámicos adaptados según vacante:
    - *Guardias de Seguridad*: Vigilancia, accesos, rondines y reportes.
    - *Taller*: Especialidad mecánica, motores/cajas y diagnósticos.
    - *Almacén*: Inventarios, entradas/salidas, sistemas y montacargas.
    - *Monitorista*: Plataformas GPS, reacción en carretera y protocolos.
    - *Operadores*: Licencia federal, apto médico, tractocamión y rutas.
- **Subagente_Seguimiento_Reclutador**:
  - Bitácora de contactos e intentos (distinguiendo resultado del contacto: "No contestó", etc., del estado del proceso).
  - Agenda de entrevistas y registro de evaluaciones preliminares.
  - Alertas visuales de tareas vencidas y compromisos del día.
- **Subagente_Decisiones_Empresa**:
  - Botones de acción exclusiva para la Empresa: solicitar información, solicitar seguimiento, solicitar entrevista, descartar (con motivo interno obligatorio) y marcar como contratado.
  - Protección de notas internas confidenciales (visibles solo para usuarios autorizados / evaluadores / administración).

## 4. Reglas de Negocio Críticas
- **Separación de Responsabilidades**: La Empresa decide si un candidato avanza o se descarta. El Reclutador ejecuta los contactos, recaba datos y agenda entrevistas.
- **Privacidad y Consentimiento**: No se puede registrar ni avanzar a un candidato sin su autorización explícita.
- **Auditoría Integral**: Todo cambio de estado guarda usuario, fecha, rol, estado previo, estado nuevo y notas.
- **Notificaciones Cruzadas**:
  - Envío a revisión -> Notificación a la Empresa.
  - Solicitud de información/seguimiento/entrevista -> Notificación al Reclutador.
