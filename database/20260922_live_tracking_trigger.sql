-- ==========================================
-- GATILLO PARA GUARDAR HISTORIAL DE RASTREO
-- ==========================================

-- 1. Crear la función que insertará automáticamente el registro en el historial
CREATE OR REPLACE FUNCTION public.save_tracking_history()
RETURNS trigger AS $$
BEGIN
  -- Solo insertamos si las coordenadas no vienen vacías
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    -- OPTIMIZACIÓN: Solo guardar si es un registro nuevo (INSERT) 
    -- o si las coordenadas REALMENTE cambiaron (UPDATE), para no llenar la BD de basura si el camión está detenido.
    IF (TG_OP = 'INSERT') OR (NEW.latitude IS DISTINCT FROM OLD.latitude OR NEW.longitude IS DISTINCT FROM OLD.longitude) THEN
      INSERT INTO public.romo_live_tracking_history (telegram_id, latitude, longitude, recorded_at)
      VALUES (NEW.telegram_id, NEW.latitude, NEW.longitude, NEW.last_updated);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminar el trigger si ya existía (para evitar duplicados)
DROP TRIGGER IF EXISTS trigger_save_tracking_history ON public.romo_live_tracking;

-- 3. Crear el trigger que se dispara cuando hay una actualización o inserción
CREATE TRIGGER trigger_save_tracking_history
AFTER INSERT OR UPDATE OF latitude, longitude
ON public.romo_live_tracking
FOR EACH ROW
EXECUTE FUNCTION public.save_tracking_history();
