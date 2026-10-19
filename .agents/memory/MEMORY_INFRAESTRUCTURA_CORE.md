# MEMORIA TÉCNICA: AGENTE_INFRAESTRUCTURA_CORE (Estado, Servicios Centrales & UI Común)

## 1. Archivos Administrados
- `src/context/AppContext.jsx`: Núcleo de estado reactivo global, sincronización y mutaciones (1,034 líneas).
- `src/lib/supabaseClient.js`: Inicialización y validación del cliente Supabase.
- `src/services/googleSheets.js`: Sincronización y exportación con Google Sheets.
- `src/components/Header.jsx`: Barra superior con perfil de usuario, buscador global y switch de tema.
- `src/components/ConfirmModal.jsx`: Modal reutilizable para confirmación de acciones irreversibles.
- `src/components/ToastNotification.jsx`: Sistema global de toasts y avisos flotantes.
- `src/pages/ModuleHubView.jsx`: Hub central selector de módulos según rol.
- `src/App.jsx`: Orquestador de enrutamiento principal de la aplicación.
- `src/index.css`: Definición del sistema de diseño, variables CSS y temas (claro/oscuro).
- `supabase_schema.sql`: Script consolidado de tablas, políticas RLS y llaves foráneas.
- `supabase/functions/telegram-webhook/index.ts`: Edge Function Deno de Supabase para notificaciones externas.

## 2. Subagentes y Funciones Clave
- **Subagente_Core_State**:
  - `fetchFromSupabase()`: Carga masiva paralela de todas las colecciones principales usando `Promise.all`.
  - Mecanismo de contingencia offline: Fallback automático a `localStorage` (`romo_inventory_data_v2`).
  - Monitoreo de inactividad de 30 min: Detección proactiva de eventos de usuario, throttling en `romo_last_activity` y cierre automático con notificación Toast.
  - `addToast(message, type)` / `removeToast(id)`: Sistema de alertas no bloqueantes.
  - Gestión del tema (`toggleTheme` / `romo_theme`).
- **Subagente_Supabase_BD**:
  - Mantenimiento del esquema DDL, índices, políticas de seguridad RLS y funciones transaccionales en PostgreSQL.
- **Subagente_Integraciones_APIs**:
  - Google Sheets API: exportación y lectura de hojas de cálculo.
  - Telegram Webhook: recepción de eventos e integración con mensajería instantánea.
- **Subagente_UI_Compartida**:
  - Mantenimiento de variables de color, tipografía y componentes compartidos entre módulos.

## 3. Dependencias
- `@supabase/supabase-js`, `dotenv`, `google-auth-library`, `google-spreadsheet`.
- Estructura central consumida por el 100% de los módulos de la aplicación.

## 4. Reglas de Negocio Críticas
- **Protección de Contratos**: Cualquier adición a `AppContext` debe mantener compatibilidad hacia atrás con todos los componentes existentes.
- **Gestión de Sesión**: La sesión de Supabase y el perfil en `romo_users` deben permanecer sincronizados en todo momento.
