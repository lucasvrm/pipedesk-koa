-- Fix tags table constraint to include 'lead' and 'company'
-- Date: 2025-12-16

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop existing check constraints on entity_type for tags table
    FOR r IN SELECT constraint_name
             FROM information_schema.constraint_column_usage
             WHERE table_name = 'tags' AND column_name = 'entity_type'
    LOOP
        EXECUTE 'ALTER TABLE tags DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;

    -- Add new constraint
    ALTER TABLE tags ADD CONSTRAINT tags_entity_type_check
    CHECK (entity_type IN ('deal', 'track', 'lead', 'company', 'global'));
END $$;
