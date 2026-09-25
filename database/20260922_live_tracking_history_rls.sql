-- ==========================================
-- PERMISOS PARA EL HISTORIAL DE RASTREO
-- ==========================================

-- Habilitar seguridad por fila (obligatorio en Supabase)
ALTER TABLE public.romo_live_tracking_history ENABLE ROW LEVEL SECURITY;

-- Borrar la política si ya existía para evitar errores
DROP POLICY IF EXISTS "romo_live_tracking_history_policy" ON public.romo_live_tracking_history;

-- Crear política que permite a la página web (anon) leer y escribir el historial
CREATE POLICY "romo_live_tracking_history_policy" 
ON public.romo_live_tracking_history 
FOR ALL 
USING (true) 
WITH CHECK (true);
