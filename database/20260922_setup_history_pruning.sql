-- ====================================================================
-- AUTOMATIC PURGE FOR LIVE TRACKING HISTORY (30 DAYS RETENTION)
-- ====================================================================

-- 1. Habilitar la extensión de cron en Supabase (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Crear una función que borra registros más viejos de 30 días
CREATE OR REPLACE FUNCTION public.purge_old_tracking_history()
RETURNS void AS $$
BEGIN
  -- Borrar todo lo que tenga más de 30 días de antigüedad
  DELETE FROM public.romo_live_tracking_history
  WHERE recorded_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Programar el trabajo (Job) para que se ejecute TODOS LOS DÍAS a las 3:00 AM
SELECT cron.schedule(
  'purge_tracking_history_daily', -- Nombre del trabajo
  '0 3 * * *',                    -- Expresión Cron (A las 3:00 AM todos los días)
  'SELECT public.purge_old_tracking_history();'
);

-- NOTA: Si alguna vez deseas cancelar este trabajo automático, puedes correr:
-- SELECT cron.unschedule('purge_tracking_history_daily');
