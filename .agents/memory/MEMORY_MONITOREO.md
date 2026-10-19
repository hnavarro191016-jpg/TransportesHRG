# MEMORIA TÉCNICA: AGENTE_MONITOREO (GPS & Telemetría)

## 1. Archivos Administrados
- `src/pages/MonitoreoView.jsx` (1,377 líneas: mapa Leaflet, polilíneas, filtros, telemetría)
- `database/20260922_live_tracking_history_rls.sql` (Políticas de RLS para histórico)
- `database/20260922_live_tracking_trigger.sql` (Trigger de inserción automática al histórico)
- `database/20260922_setup_history_pruning.sql` (Mantenimiento periódico y depuración de coordenadas antiguas)

## 2. Subagentes y Funciones Clave
- **Subagente_GPS_Live**:
  - `getTruckIcon(last_updated)`: Determina el color (verde si <3 min, gris offline si >3 min) y renderiza el icono SVG personalizado de camión.
  - Centrado de mapa (`MapContainer`, `useMap`, `setView`).
  - Polling y suscripción reactiva a `romo_live_tracking`.
- **Subagente_Recorridos_Historico**:
  - Consulta a `romo_live_tracking_history` filtrando por `unit_id`, fecha inicial y final.
  - `calculateDistance(lat1, lon1, lat2, lon2)`: Fórmula de Haversine para distancia en kilómetros.
  - `getTotalDistance(coords)`: Suma acumulada del trayecto seleccionado.
  - `Polyline`: Trazado del camino con personalización visual (grosor, color, opacidad).
- **Subagente_Geometria_Flechas**:
  - `calculateBearing(lat1, lon1, lat2, lon2)`: Cálculo trigonométrico del rumbo/azimut (0° a 360°).
  - `createArrowIcon(bearing, color)`: Renderizado de flechas direccionales SVG rotadas con CSS `transform: rotate(...)` sobre puntos clave del recorrido.
  - `createStartIcon('A')` y marcador de fin ('B').
- **Subagente_Telemetria_Alertas**:
  - Cálculo de velocidad actual (`speed`), visualización de alertas por desconexión prolongada y purga en base de datos.
  - `parseTripSegmentsAndGaps(rawPoints)`: Segmentación inteligente de trayectos continuos vs. brechas de desconexión (`gaps`).
  - `createSignalLostIcon()` y `createSignalRestoredIcon()`: Marcadores visuales de interrupción y restablecimiento de señal satelital/Telegram.

## 3. Dependencias
- Librerías: `leaflet`, `react-leaflet`, `lucide-react`.
- Backend: Tablas `romo_live_tracking` y `romo_live_tracking_history` en Supabase.
- Estado compartido: `supabaseClient.js`, sesión de usuario para roles permitidos (`Administrador`, `Gerencia`, `Monitoreo`).

## 4. Reglas de Negocio
- Un camión se considera fuera de línea si no reporta ping en más de 180,000 ms (3 minutos).
- Las flechas del recorrido se deben colocar a intervalos representativos de distancia/tiempo para no saturar el renderizado DOM del mapa Leaflet.
- El historial debe podarse para no degradar el rendimiento de la base de datos Supabase.
- **Pérdida de Señal y Gaps en Ruta**: Nunca se debe conectar con línea sólida un salto donde se perdió la señal GPS (>3.5 min y >300m, >7 min y >100m, o salto >1.0 km sin pings). Estos tramos deben dibujarse con línea punteada ámbar (`#f59e0b`, `dashArray: '6, 8'`), tooltip explicativo con minutos y km transcurridos sin señal, y marcadores de corte y reconexión para no simular calles inexistentes.

## 5. Pruebas y Validación
- Verificar que Leaflet CSS se mantenga cargado (`leaflet/dist/leaflet.css`).
- Verificar que los contenedores del mapa tengan altura fija definida (evita mapa gris o colapsado).
