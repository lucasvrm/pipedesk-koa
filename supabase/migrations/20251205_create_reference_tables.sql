-- 20251205_create_reference_tables.sql
-- Cria tabelas de referência para:
-- - Tipo de empresa
-- - Nível de relacionamento da empresa
-- - Status de lead
-- - Origem de lead
-- - Status de deal (master_deals)
-- - Tipo de notificação

-- Extensão para gen_random_uuid (em Supabase já costuma estar habilitada, mas deixo idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
  ) THEN
    CREATE EXTENSION pgcrypto;
  END IF;
END $$;

------------------------------------------------------------
-- 1. company_types
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,  -- ex: 'portfolio', 'target', 'cliente'
  label       text NOT NULL,         -- ex: 'Portfolio', 'Target', 'Cliente'
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- 2. company_relationship_levels
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_relationship_levels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,  -- ex: 'frio', 'morno', 'quente'
  label       text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- 3. lead_statuses
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_statuses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,  -- ex: 'novo', 'em_andamento', 'qualificado', 'descartado'
  label       text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- 4. lead_origins
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_origins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,  -- ex: 'inbound', 'outbound', 'referral', 'origem_interna'
  label       text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- 5. deal_statuses (para master_deals.status)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deal_statuses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,  -- ex: 'em_prospeccao', 'em_negociacao', 'ganho', 'perdido'
  label       text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- 6. notification_types (para notifications.type)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,  -- ex: 'task_due', 'new_comment', 'lead_assigned'
  label       text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
