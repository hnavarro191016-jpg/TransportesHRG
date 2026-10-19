# MEMORIA TÉCNICA: AGENTE_ADMINISTRACION (Gobierno, Usuarios & Seguridad)

## 1. Archivos Administrados
- `src/pages/UsersView.jsx`: Catálogo de usuarios, altas, asignación de roles y activación/desactivación.
- `src/pages/ChangePasswordView.jsx`: Pantalla de cambio obligatorio de clave para nuevos accesos.
- `src/pages/LoginView.jsx`: Pantalla de acceso al sistema con autenticación Supabase.
- `src/components/SidebarAdmin.jsx`: Menú lateral de configuración y administración.
- `database/20261005_must_change_password.sql`: Migración que añade bandera `must_change_password` en metadata de usuario.

## 2. Subagentes y Funciones Clave
- **Subagente_Usuarios_Roles**:
  - Gestión de `romo_users`: Nombre, correo, rol asignado (`Administrador`, `Encargado de almacén`, `Mecánico`, `Compras`, `Gerencia`, `Operador`).
  - Activación o bloqueo inmediato de cuentas (`active: boolean`).
  - Super-administrador reconocido por correo institucional (`hnavarro` o `admin@transportesromo.mx`).
- **Subagente_Auth_Seguridad**:
  - `login(emailOrUser, password)`: Soporte para login por correo o username (autocompletando `@hrg.local`).
  - `register(...)`: Creación de usuarios con cliente Supabase temporal sin persistencia de sesión para no desloguear al admin en turno.
  - Verificación de metadatos `must_change_password` y redirección inmediata a `ChangePasswordView`.
  - Aplicación y auditoría de políticas Row Level Security (RLS).

## 3. Dependencias
- `@supabase/supabase-js`: Cliente de autenticación y base de datos.
- `src/context/AppContext.jsx`: Funciones `login`, `register`, `logout`, `activeRole`, `activeUser`.

## 4. Reglas de Negocio Críticas
- Ningún usuario desactivado puede ingresar a ningún módulo operativo.
- Un usuario con `must_change_password: true` no puede interactuar con el sistema hasta que actualice exitosamente su clave.
- La creación de nuevos usuarios debe mantener intacta la sesión del administrador que está operando la interfaz.
- **Caducidad por Inactividad (30 min)**: Toda sesión activa se cierra automáticamente tras 30 minutos sin interacción del usuario. Si un usuario cerró el navegador y vuelve después de 30 minutos, la sesión previa se invalida y se le solicita login nuevamente.
