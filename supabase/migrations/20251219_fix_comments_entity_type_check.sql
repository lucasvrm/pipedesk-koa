-- Fix legacy CHECK constraint on public.comments that blocks entity_type='lead'
-- Ensures the canonical constraint "comments_entity_type_check" allows:
-- deal, track, task, lead, company, user, folder

BEGIN;

DO $$
DECLARE
  existing_def text;
BEGIN
  -- 1) Drop legacy constraint that is currently blocking inserts
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'comments'
      AND c.conname = 'check_entity_type'
  ) THEN
    EXECUTE 'ALTER TABLE public.comments DROP CONSTRAINT check_entity_type';
  END IF;

  -- 2) Ensure canonical constraint exists and includes 'lead' (+ other supported types)
  SELECT pg_get_constraintdef(c.oid)
    INTO existing_def
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'comments'
    AND c.conname = 'comments_entity_type_check'
  LIMIT 1;

  -- If missing, add it
  IF existing_def IS NULL THEN
    EXECUTE $stmt$
      ALTER TABLE public.comments
      ADD CONSTRAINT comments_entity_type_check
      CHECK (
        entity_type = ANY (
          ARRAY[
            'deal'::text,
            'track'::text,
            'task'::text,
            'lead'::text,
            'company'::text,
            'user'::text,
            'folder'::text
          ]
        )
      )
    $stmt$;
  -- If present but does not include lead, replace it
  ELSIF existing_def NOT ILIKE '%lead%' THEN
    EXECUTE 'ALTER TABLE public.comments DROP CONSTRAINT comments_entity_type_check';

    EXECUTE $stmt$
      ALTER TABLE public.comments
      ADD CONSTRAINT comments_entity_type_check
      CHECK (
        entity_type = ANY (
          ARRAY[
            'deal'::text,
            'track'::text,
            'task'::text,
            'lead'::text,
            'company'::text,
            'user'::text,
            'folder'::text
          ]
        )
      )
    $stmt$;
  END IF;
END $$;

COMMIT;
