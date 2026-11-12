-- ==============================================================================
-- MÓDULO DE RECLUTAMIENTO DE PERSONAL - TRANSPORTES ROMO (HRG)
-- Fecha: 2026-11-12
-- Tablas: Vacantes, Candidatos, Seguimientos, Historial/Auditoría y Notificaciones
-- ==============================================================================

-- 1. TABLA DE VACANTES (Catálogo dinámico)
CREATE TABLE IF NOT EXISTS public.romo_recruitment_vacancies (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title text NOT NULL,
    department text NOT NULL,
    location text NOT NULL DEFAULT 'Base Romo - Patio Matriz',
    description text,
    requirements text,
    schedule_shift text,
    slots integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'abierta' CHECK (status IN ('abierta', 'pausada', 'cerrada')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. TABLA DE CANDIDATOS
CREATE TABLE IF NOT EXISTS public.romo_recruitment_candidates (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    folio text UNIQUE,
    vacancy_id text REFERENCES public.romo_recruitment_vacancies(id) ON DELETE SET NULL,
    vacancy_title text NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    whatsapp text,
    email text,
    city text NOT NULL,
    municipality text,
    neighborhood text,
    source text NOT NULL DEFAULT 'anuncio',
    source_details text,
    secondary_vacancies text[] DEFAULT '{}',
    entry_availability text NOT NULL DEFAULT 'Inmediata',
    schedule_availability text,
    salary_expectation numeric,
    salary_period text DEFAULT 'semanal' CHECK (salary_period IN ('semanal', 'quincenal', 'mensual')),
    transport_mode text,
    education text,
    years_experience numeric DEFAULT 0,
    employment_history jsonb DEFAULT '[]'::jsonb,
    skills_certifications text,
    recruiter_notes text,
    specific_fields jsonb DEFAULT '{}'::jsonb,
    consent_share_profile boolean NOT NULL DEFAULT false,
    consent_date timestamptz,
    resume_url text,
    status text NOT NULL DEFAULT 'Borrador' CHECK (status IN (
        'Borrador',
        'Pendiente de revisión',
        'Información adicional solicitada',
        'Seguimiento solicitado',
        'Entrevista solicitada',
        'Entrevista programada',
        'En evaluación',
        'Contratado',
        'Descartado',
        'Candidato desistió'
    )),
    discard_reason text,
    hire_notes text,
    assigned_recruiter text,
    company_reviewer text,
    next_action text,
    next_action_date timestamptz,
    last_activity_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. TABLA DE SEGUIMIENTOS Y CONTACTOS (Llamadas, WhatsApp, etc.)
CREATE TABLE IF NOT EXISTS public.romo_recruitment_followups (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id text NOT NULL REFERENCES public.romo_recruitment_candidates(id) ON DELETE CASCADE,
    followup_date timestamptz DEFAULT now(),
    contact_medium text NOT NULL DEFAULT 'llamada',
    contact_result text NOT NULL,
    comments text,
    next_action text,
    next_action_due_date timestamptz,
    created_by text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 4. TABLA DE HISTORIAL CRONOLÓGICO Y AUDITORÍA DE ESTADOS
CREATE TABLE IF NOT EXISTS public.romo_recruitment_history (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id text NOT NULL REFERENCES public.romo_recruitment_candidates(id) ON DELETE CASCADE,
    action_type text NOT NULL,
    previous_status text,
    new_status text,
    actor_name text NOT NULL,
    actor_role text NOT NULL,
    notes text,
    internal_only boolean NOT NULL DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 5. TABLA DE NOTIFICACIONES INTERNAS DEL FLUJO
CREATE TABLE IF NOT EXISTS public.romo_recruitment_notifications (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    target_role text NOT NULL CHECK (target_role IN ('Empresa', 'Reclutador', 'Todos')),
    candidate_id text REFERENCES public.romo_recruitment_candidates(id) ON DELETE CASCADE,
    candidate_name text,
    title text NOT NULL,
    message text NOT NULL,
    read boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.romo_recruitment_vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romo_recruitment_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romo_recruitment_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romo_recruitment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romo_recruitment_notifications ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS PERMISIVAS PARA USUARIOS AUTENTICADOS
DROP POLICY IF EXISTS "romo_recruitment_vacancies_all" ON public.romo_recruitment_vacancies;
CREATE POLICY "romo_recruitment_vacancies_all" ON public.romo_recruitment_vacancies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "romo_recruitment_candidates_all" ON public.romo_recruitment_candidates;
CREATE POLICY "romo_recruitment_candidates_all" ON public.romo_recruitment_candidates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "romo_recruitment_followups_all" ON public.romo_recruitment_followups;
CREATE POLICY "romo_recruitment_followups_all" ON public.romo_recruitment_followups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "romo_recruitment_history_all" ON public.romo_recruitment_history;
CREATE POLICY "romo_recruitment_history_all" ON public.romo_recruitment_history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "romo_recruitment_notifications_all" ON public.romo_recruitment_notifications;
CREATE POLICY "romo_recruitment_notifications_all" ON public.romo_recruitment_notifications FOR ALL USING (true) WITH CHECK (true);

-- ÍNDICES PARA BÚSQUEDA Y RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_candidates_phone ON public.romo_recruitment_candidates(phone);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.romo_recruitment_candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.romo_recruitment_candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_vacancy ON public.romo_recruitment_candidates(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_followups_candidate ON public.romo_recruitment_followups(candidate_id);
CREATE INDEX IF NOT EXISTS idx_history_candidate ON public.romo_recruitment_history(candidate_id);

-- SEED DATA DE LAS 5 VACANTES INICIALES OBLIGATORIAS
INSERT INTO public.romo_recruitment_vacancies (id, title, department, location, description, requirements, schedule_shift, slots, status)
VALUES
  ('vac-guardia-01', 'Guardia de Seguridad', 'Seguridad Patrimonial', 'Base Romo - Patio Matriz', 'Control de accesos peatonales y vehiculares, rondines en patio de maniobras, llenado de bitácoras y salvaguarda de instalaciones.', 'Experiencia comprobable en vigilancia, control de accesos y rondines. Disponibilidad para rolar turnos de 12x12.', 'Turnos rotativos 12x12', 3, 'abierta'),
  ('vac-taller-02', 'Mecánico Diesel / Técnico de Taller', 'Mantenimiento y Taller', 'Taller Central Romo', 'Mantenimiento preventivo y correctivo de tractocamiones quinta rueda, motores diésel, sistemas de frenos neumáticos y suspensión.', 'Conocimientos sólidos en motores Cummins/Detroit, transmisiones Eaton Fuller y diagnóstico de fallas mecánicas.', 'Lunes a Sábado - Turno completo', 2, 'abierta'),
  ('vac-almacen-03', 'Auxiliar de Almacén de Refacciones', 'Almacén e Inventarios', 'Almacén Central Romo', 'Recepción, clasificación, resguardo y despacho de refacciones automotrices, conteos cíclicos y control de entradas/salidas.', 'Manejo básico de sistemas de inventario, orden, disciplina y deseable manejo de montacargas.', 'Lunes a Viernes 8:00 a 18:00, Sábados medio día', 2, 'abierta'),
  ('vac-monitorista-04', 'Monitorista GPS y Telemetría', 'Monitoreo y Seguridad', 'Centro de Monitoreo Romo', 'Monitoreo satelital 24/7 de unidades en carretera, detección de paradas no autorizadas, protocolos ante pérdida de señal y comunicación con operadores.', 'Manejo de plataformas GPS, reacción ante alertas de seguridad y excelente comunicación.', 'Turnos rolados 8 horas', 2, 'abierta'),
  ('vac-operador-05', 'Operador de Tráiler (Quinta Rueda)', 'Operaciones y Logística', 'Rutas Nacionales / Base Romo', 'Operación segura de tractocamiones articulados en rutas foráneas y locales, inspección 360 antes de viaje y cumplimiento de normas de transporte.', 'Licencia Federal Tipo B o E vigente con antigüedad mínima de 3 años, apto médico vigente, cartas de recomendación.', 'Rutas foráneas programadas', 5, 'abierta')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  department = EXCLUDED.department,
  description = EXCLUDED.description,
  requirements = EXCLUDED.requirements;
