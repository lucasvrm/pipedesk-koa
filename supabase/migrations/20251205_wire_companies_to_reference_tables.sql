-- 20251205_wire_companies_to_reference_tables.sql

DO $$
BEGIN
  --------------------------------------------------------
  -- 1) company_type_id em companies
  --------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'companies'
      AND column_name  = 'company_type_id'
  ) THEN
    ALTER TABLE public.companies
      ADD COLUMN company_type_id uuid;
  END IF;

  -- 2) Seed em company_types a partir dos valores existentes em companies.type
  INSERT INTO public.company_types (id, code, label)
  SELECT gen_random_uuid(), t.type, initcap(replace(t.type, '_', ' '))
  FROM (
    SELECT DISTINCT type
    FROM public.companies
    WHERE type IS NOT NULL
  ) t
  LEFT JOIN public.company_types ct ON ct.code = t.type
  WHERE ct.id IS NULL;

  -- 3) Backfill de company_type_id
  UPDATE public.companies c
  SET company_type_id = ct.id
  FROM public.company_types ct
  WHERE ct.code = c.type
    AND c.company_type_id IS NULL;

  -- 4) FK companies.company_type_id -> company_types.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'companies_company_type_id_fkey'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_company_type_id_fkey
      FOREIGN KEY (company_type_id) REFERENCES public.company_types(id);
  END IF;

  -- 5) (Opcional) Remover CHECK antigo de tipo
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'companies_type_check'
  ) THEN
    ALTER TABLE public.companies
      DROP CONSTRAINT companies_type_check;
  END IF;

  --------------------------------------------------------
  -- 6) relationship_level_id em companies
  --------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'companies'
      AND column_name  = 'relationship_level_id'
  ) THEN
    ALTER TABLE public.companies
      ADD COLUMN relationship_level_id uuid;
  END IF;

  -- 7) Seed em company_relationship_levels a partir de companies.relationship_level
  INSERT INTO public.company_relationship_levels (id, code, label)
  SELECT gen_random_uuid(), t.relationship_level, initcap(replace(t.relationship_level, '_', ' '))
  FROM (
    SELECT DISTINCT relationship_level
    FROM public.companies
    WHERE relationship_level IS NOT NULL
  ) t
  LEFT JOIN public.company_relationship_levels rl ON rl.code = t.relationship_level
  WHERE rl.id IS NULL;

  -- 8) Backfill de relationship_level_id
  UPDATE public.companies c
  SET relationship_level_id = rl.id
  FROM public.company_relationship_levels rl
  WHERE rl.code = c.relationship_level
    AND c.relationship_level_id IS NULL;

  -- 9) FK companies.relationship_level_id -> company_relationship_levels.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'companies_relationship_level_id_fkey'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_relationship_level_id_fkey
      FOREIGN KEY (relationship_level_id) REFERENCES public.company_relationship_levels(id);
  END IF;

  -- 10) (Opcional) Dropar CHECK antigo de relacionamento
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'companies_relationship_level_check'
  ) THEN
    ALTER TABLE public.companies
      DROP CONSTRAINT companies_relationship_level_check;
  END IF;

END $$;
