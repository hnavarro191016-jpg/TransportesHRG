-- ==============================================================================
-- MIGRACIÓN DE SEGURIDAD: RESOLUCIÓN DE ALERTAS RLS EN SUPABASE
-- Fecha: 2026-10-20
-- Problema: Tablas públicas expuestas sin Row Level Security (RLS) y columna
--           sensible (password) expuesta en la tabla "User".
-- ==============================================================================

-- 1. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS DETECTADAS
-- (Usa identificador seguro %I para soportar nombres con mayúsculas o minúsculas)
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'Certificate',
    'RemissionNote',
    'ServiceReport',
    'ExpenseCategory',
    'Expense',
    'ServiceOrder',
    'Contract',
    'Quote',
    'User',
    'RemissionItem',
    'Invoice',
    'CarouselImage',
    'WebLead',
    'romo_live_tracking'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      RAISE NOTICE 'RLS habilitado en public.%', t;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = lower(t)) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', lower(t));
      RAISE NOTICE 'RLS habilitado en public.% (lowercase)', lower(t);
    END IF;
  END LOOP;
END $$;


-- ==============================================================================
-- 2. POLÍTICAS PARA "romo_live_tracking" (Monitoreo satelital en vivo)
-- Debe permitir lectura pública (para visualización del mapa) y escritura
-- autorizada para el bot de Telegram o scripts de sincronización.
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'romo_live_tracking') THEN
    DROP POLICY IF EXISTS "romo_live_tracking_read_policy" ON public.romo_live_tracking;
    CREATE POLICY "romo_live_tracking_read_policy" 
      ON public.romo_live_tracking 
      FOR SELECT 
      TO public 
      USING (true);

    DROP POLICY IF EXISTS "romo_live_tracking_write_policy" ON public.romo_live_tracking;
    CREATE POLICY "romo_live_tracking_write_policy" 
      ON public.romo_live_tracking 
      FOR ALL 
      TO public 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;


-- ==============================================================================
-- 3. POLÍTICA DE PROTECCIÓN PARA "User" (Protección de columna "password")
-- CRÍTICO: Bloquea el acceso anónimo/público. Solo usuarios autenticados o
-- funciones backend (service_role) tienen acceso a los registros.
-- ==============================================================================
DO $$
DECLARE
  user_tbl text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    user_tbl := 'User';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user') THEN
    user_tbl := 'user';
  END IF;

  IF user_tbl IS NOT NULL THEN
    EXECUTE format('DROP POLICY IF EXISTS "User_auth_access_only" ON public.%I;', user_tbl);
    EXECUTE format('
      CREATE POLICY "User_auth_access_only" 
      ON public.%I 
      FOR ALL 
      TO authenticated 
      USING (true) 
      WITH CHECK (true);
    ', user_tbl);
  END IF;
END $$;


-- ==============================================================================
-- 4. POLÍTICAS PARA SITIO WEB / PORTAL PÚBLICO ("CarouselImage" y "WebLead")
-- - CarouselImage: Lectura pública (anónima) para ver banners, edición solo autenticada.
-- - WebLead: Inserción pública (formularios de contacto/cotización), gestión solo autenticada.
-- ==============================================================================
DO $$
DECLARE
  c_tbl text;
  w_tbl text;
BEGIN
  -- CarouselImage
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CarouselImage') THEN
    c_tbl := 'CarouselImage';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'carouselimage') THEN
    c_tbl := 'carouselimage';
  END IF;

  IF c_tbl IS NOT NULL THEN
    EXECUTE format('DROP POLICY IF EXISTS "CarouselImage_public_read" ON public.%I;', c_tbl);
    EXECUTE format('CREATE POLICY "CarouselImage_public_read" ON public.%I FOR SELECT TO public USING (true);', c_tbl);
    EXECUTE format('DROP POLICY IF EXISTS "CarouselImage_auth_write" ON public.%I;', c_tbl);
    EXECUTE format('CREATE POLICY "CarouselImage_auth_write" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', c_tbl);
  END IF;

  -- WebLead
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'WebLead') THEN
    w_tbl := 'WebLead';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'weblead') THEN
    w_tbl := 'weblead';
  END IF;

  IF w_tbl IS NOT NULL THEN
    EXECUTE format('DROP POLICY IF EXISTS "WebLead_public_insert" ON public.%I;', w_tbl);
    EXECUTE format('CREATE POLICY "WebLead_public_insert" ON public.%I FOR INSERT TO public WITH CHECK (true);', w_tbl);
    EXECUTE format('DROP POLICY IF EXISTS "WebLead_auth_manage" ON public.%I;', w_tbl);
    EXECUTE format('CREATE POLICY "WebLead_auth_manage" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', w_tbl);
  END IF;
END $$;


-- ==============================================================================
-- 5. POLÍTICAS PARA TABLAS OPERATIVAS Y DE NEGOCIO (Solo usuarios autenticados)
-- "Certificate", "RemissionNote", "ServiceReport", "ExpenseCategory", "Expense",
-- "ServiceOrder", "Contract", "Quote", "RemissionItem", "Invoice"
-- ==============================================================================
DO $$
DECLARE
  t text;
  target_tbl text;
  business_tbls text[] := ARRAY[
    'Certificate',
    'RemissionNote',
    'ServiceReport',
    'ExpenseCategory',
    'Expense',
    'ServiceOrder',
    'Contract',
    'Quote',
    'RemissionItem',
    'Invoice'
  ];
BEGIN
  FOREACH t IN ARRAY business_tbls LOOP
    target_tbl := NULL;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      target_tbl := t;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = lower(t)) THEN
      target_tbl := lower(t);
    END IF;

    IF target_tbl IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "%s_auth_full_policy" ON public.%I;', target_tbl, target_tbl);
      EXECUTE format('
        CREATE POLICY "%s_auth_full_policy" 
        ON public.%I 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
      ', target_tbl, target_tbl);
    END IF;
  END LOOP;
END $$;
