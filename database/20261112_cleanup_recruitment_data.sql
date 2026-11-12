-- ==============================================================================
-- LIMPIEZA TOTAL Y PERMISOS DE TABLAS: RECLUTAMIENTO DE PERSONAL
-- ==============================================================================

-- 1. Otorgar permisos a los roles de Supabase (anon y authenticated)
GRANT ALL ON TABLE public.romo_recruitment_vacancies TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.romo_recruitment_candidates TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.romo_recruitment_followups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.romo_recruitment_history TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.romo_recruitment_notifications TO anon, authenticated, service_role;

-- 2. Vaciar candidatos, seguimientos, historial y notificaciones
TRUNCATE TABLE public.romo_recruitment_followups CASCADE;
TRUNCATE TABLE public.romo_recruitment_history CASCADE;
TRUNCATE TABLE public.romo_recruitment_notifications CASCADE;
TRUNCATE TABLE public.romo_recruitment_candidates CASCADE;

-- 3. Dejar activa ÚNICAMENTE la vacante de Guardia de Seguridad
DELETE FROM public.romo_recruitment_vacancies 
WHERE id != 'vac-guardia-01' AND title != 'Guardia de Seguridad';

-- Asegurar que la vacante de Guardia de Seguridad exista y esté abierta
INSERT INTO public.romo_recruitment_vacancies (id, title, department, location, description, requirements, schedule_shift, slots, status)
VALUES (
  'vac-guardia-01',
  'Guardia de Seguridad',
  'Seguridad Patrimonial',
  'Base Romo - Patio Matriz',
  'Control de accesos peatonales y vehiculares, rondines periódicos en patio de maniobras, llenado de bitácoras y salvaguarda de instalaciones.',
  'Experiencia previa comprobable en vigilancia, control de accesos y elaboración de reportes de incidencias. Disponibilidad para turnos de 12 horas.',
  'Turnos rotativos 12x12 (Día/Noche)',
  3,
  'abierta'
)
ON CONFLICT (id) DO UPDATE SET
  status = 'abierta',
  slots = 3;
