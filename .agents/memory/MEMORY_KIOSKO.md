# MEMORIA TÉCNICA: AGENTE_KIOSKO (Checador Digital de Base)

## 1. Archivos Administrados
- `src/pages/hr/KioskView.jsx`: Pantalla completa optimizada para tablets montadas en pared en base/taller.
- `src/components/CheckInWidget.jsx`: Componente interactivo de marcación y confirmación.

## 2. Subagentes y Funciones Clave
- **Subagente_Kiosko_Checador**:
  - Teclado numérico táctil en pantalla grande para ingreso de número de empleado o PIN.
  - Validación instantánea contra `romo_employees`.
  - Registro de marca de tiempo (timestamp) de entrada o salida.
  - Mensaje visual de confirmación con foto/nombre y saludo (ej. "¡Buen turno, Javier!").
  - Auto-limpieza y retorno al modo de espera después de 5 segundos de inactividad.

## 3. Dependencias
- `src/context/AppContext.jsx`: Acceso a la lista de colaboradores.
- Backend: Inserción directa en registros de asistencia.

## 4. Reglas de Negocio Críticas
- La pantalla no debe permitir la navegación a otros módulos sin contraseña de supervisor.
- Debe soportar operación fluida en modo táctil sin requerir teclado físico ni mouse.
