# MEMORIA TÉCNICA: AGENTE_CAPACITACIONES (LMS & Certificaciones)

## 1. Archivos Administrados
- `src/pages/capacitaciones/DashboardCapacitacionesView.jsx`: Indicadores clave de avance del plan de adiestramiento.
- `src/pages/capacitaciones/CourseCatalogView.jsx`: Catálogo general de cursos para inscripción.
- `src/pages/capacitaciones/MyCoursesView.jsx`: Bandeja personal del usuario con cursos asignados y estatus.
- `src/pages/capacitaciones/CourseViewerView.jsx`: Reproductor interactivo de módulos, temario y lecciones.
- `src/pages/capacitaciones/ExamViewerView.jsx`: Motor de evaluaciones, preguntas de opción múltiple y resultado.
- `src/pages/capacitaciones/AdminCoursesView.jsx`: Gestión de cursos, módulos, preguntas y asignación obligatoria por perfil.
- `src/pages/capacitaciones/cursos_hrg_contenido.json`: Banco de contenidos estructurados oficiales de Transportes Romo.
- `src/components/SidebarCapacitaciones.jsx`: Menú lateral de capacitaciones.
- `src/utils/certificateGenerator.js`: Generador de constancias y diplomas en PDF usando `jspdf`.

## 2. Subagentes y Funciones Clave
- **Subagente_Cursos_Contenido**:
  - Manejo de cursos: título, descripción, portada, categoría, perfil destino (Operador/Mecánico/Admin), duración.
  - Carga y parseo del archivo JSON de contenido estructurado.
- **Subagente_Evaluaciones_Examenes**:
  - Verificación de calificación obtenida vs `min_score_required` (usualmente 80%).
  - Control de número de intentos permitidos (`max_attempts`).
- **Subagente_Certificados_PDF**:
  - Función `generateCertificate(userName, courseTitle, score, completionDate, validityMonths)`.
  - Emisión de documento con membrete de Transportes Romo, folio único y fecha de vigencia.
- **Subagente_Progreso_LMS**:
  - Actualización de `romo_course_assignments`: `assigned` → `in_progress` → `completed` / `failed`.

## 3. Dependencias
- Librerías: `jspdf`, `lucide-react`.
- Tablas Supabase: `romo_courses`, `romo_course_assignments`.

## 4. Reglas de Negocio Críticas
- Solo se puede generar y descargar el diploma PDF si el examen fue aprobado con el porcentaje mínimo requerido.
- Si un curso vence según su `validity_months`, el estado del diploma pasa a expirado y requiere re-certificación.
