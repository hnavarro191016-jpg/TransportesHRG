# MEMORIA TÉCNICA: AGENTE_RECURSOS_HUMANOS (Personal & Asistencias)

## 1. Archivos Administrados
- `src/pages/hr/DashboardHRView.jsx`: Resumen general de personal activo, incidencias del día y estadísticas.
- `src/pages/hr/EmployeesView.jsx`: Ficha y catálogo de empleados (choferes, mecánicos, administrativos).
- `src/pages/hr/AttendanceView.jsx`: Registro de asistencias, retardos, faltas y justificaciones.
- `src/pages/hr/DocumentosView.jsx`: Expedientes digitales (contratos, licencias, identificaciones).
- `src/pages/hr/AlertasView.jsx`: Monitoreo de vencimientos legales y laborales.
- `src/components/SidebarHR.jsx`: Menú lateral de navegación de Recursos Humanos.

## 2. Subagentes y Funciones Clave
- **Subagente_Expedientes_Personal**:
  - Registro de datos de colaboradores: Nombre, CURP, RFC, NSS, departamento, puesto, fecha de ingreso.
  - Datos médicos críticos para choferes: tipo de sangre, contacto de emergencia, teléfono de emergencia.
  - Número y fecha de vencimiento de licencia federal de conducir.
- **Subagente_Asistencias**:
  - Registro de horarios de entrada/salida y cálculo de puntualidad.
  - Mapeo de ausencias justificadas e injustificadas.
- **Subagente_Documentos_Expediente**:
  - Carga y visualización de archivos PDF/imágenes pertenecientes al legajo del empleado.
- **Subagente_Alertas_Laborales**:
  - Detección automática de licencias de conducir próximas a vencer (<30 días).
  - Vencimiento de contratos laborales por tiempo determinado.

## 3. Dependencias
- `src/context/AppContext.jsx`: Acceso a `data.employees` y métodos de sincronización.
- Base de Datos: Tabla `romo_employees`.

## 4. Reglas de Negocio Críticas
- Un chofer con licencia federal vencida debe generar una alerta crítica inmediata en el dashboard de RH.
- Los datos de contacto de emergencia y tipo de sangre son obligatorios para el personal operativo.
