-- 20251205_wire_leads_to_reference_tables.sql

DO $$
BEGIN
  --------------------------------------------------------
  -- 1) lead_status_id em leads
  --------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'leads'
      AND column_name  = 'lead_status_id'
  ) THEN
    ALTER TABLE public.leads
      ADD COLUMN lead_status_id uuid;
  END IF;

  -- 2) Seed lead_statuses a partir de leads.status
  INSERT INTO public.lead_statuses (id, code, label)
  SELECT gen_random_uuid(), t.status, initcap(replace(t.status, '_', ' '))
  FROM (
    SELECT DISTINCT status
    FROM public.leads
    WHERE status IS NOT NULL
  ) t
  LEFT JOIN public.lead_statuses ls ON ls.code = t.status
  WHERE ls.id IS NULL;

  -- 3) Backfill lead_status_id
  UPDATE public.leads l
  SET lead_status_id = ls.id
  FROM public.lead_statuses ls
  WHERE ls.code = l.status
    AND l.lead_status_id IS NULL;

  -- 4) FK leads.lead_status_id -> lead_statuses.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leads_lead_status_id_fkey'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_lead_status_id_fkey
      FOREIGN KEY (lead_status_id) REFERENCES public.lead_statuses(id);
  END IF;

  -- 5) (Opcional) Dropar CHECK antigo de status
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leads_status_check'
  ) THEN
    ALTER TABLE public.leads
      DROP CONSTRAINT leads_status_check;
  END IF;

  --------------------------------------------------------
  -- 6) lead_origin_id em leads
  --------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'leads'
      AND column_name  = 'lead_origin_id'
  ) THEN
    ALTER TABLE public.leads
      ADD COLUMN lead_origin_id uuid;
  END IF;

  -- 7) Seed lead_origins a partir de leads.origin
  INSERT INTO public.lead_origins (id, code, label)
  SELECT gen_random_uuid(), t.origin, initcap(replace(t.origin, '_', ' '))
  FROM (
    SELECT DISTINCT origin
    FROM public.leads
    WHERE origin IS NOT NULL
  ) t
  LEFT JOIN public.lead_origins lo ON lo.code = t.origin
  WHERE lo.id IS NULL;

  -- 8) Backfill lead_origin_id
  UPDATE public.leads l
  SET lead_origin_id = lo.id
  FROM public.lead_origins lo
  WHERE lo.code = l.origin
    AND l.lead_origin_id IS NULL;

  -- 9) FK leads.lead_origin_id -> lead_origins.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leads_lead_origin_id_fkey'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_lead_origin_id_fkey
      FOREIGN KEY (lead_origin_id) REFERENCES public.lead_origins(id);
  END IF;

  -- 10) (Opcional) Dropar CHECK antigo de origin
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leads_origin_check'
  ) THEN
    ALTER TABLE public.leads
      DROP CONSTRAINT leads_origin_check;
  END IF;

END $$;
