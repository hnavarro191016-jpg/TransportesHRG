-- ==============================================================================
-- LIMPIEZA DE DATOS DE DEMOSTRACIÓN - RECLUTAMIENTO DE PERSONAL
-- Fecha: 2026-11-12
-- Objetivo: Vaciar candidatos de prueba y dejar activa ÚNICAMENTE la vacante
--           de "Guardia de Seguridad".
-- ==============================================================================

-- 1. Vaciar candidatos, seguimientos, historial y notificaciones de prueba
TRUNCATE TABLE public.romo_recruitment_followups CASCADE;
TRUNCATE TABLE public.romo_recruitment_history CASCADE;
TRUNCATE TABLE public.romo_recruitment_notifications CASCADE;
TRUNCATE TABLE public.romo_recruitment_candidates CASCADE;

-- 2. Mantener abierta ÚNICAMENTE la vacante de Guardia de Seguridad
-- (Eliminar o cerrar las que no están disponibles actualmente)
DELETE FROM public.romo_recruitment_vacancies 
WHERE id != 'vac-guardia-01' AND title != 'Guardia de Seguridad';

-- Asegurar que Guardia de Seguridad esté activa y abierta
UPDATE public.romo_recruitment_vacancies 
SET status = 'abierta', slots = 3 
WHERE id = 'vac-guardia-01' OR title = 'Guardia de Seguridad';
