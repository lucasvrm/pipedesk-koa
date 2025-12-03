-- Ensure/creates a password-based admin user for local Supabase environments.
-- Usage: psql "$SUPABASE_DB_URL" -f supabase/sql/upsert_admin_user.sql
-- Adjust the email/password/name below as needed.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  target_email TEXT := 'lucasvaladaresroquettemaia@gmail.com';
  target_password TEXT := 'ChangeMe123!';
  target_name TEXT := 'Lucas Maia';
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;

  IF user_id IS NULL THEN
    user_id := uuid_generate_v4();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      aud,
      role
    )
    VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      target_email,
      crypt(target_password, gen_salt('bf')),
      NOW(),
      jsonb_build_object('name', target_name, 'role', 'admin'),
      'authenticated',
      'authenticated'
    );
  ELSE
    UPDATE auth.users
      SET encrypted_password = crypt(target_password, gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
          raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
            || jsonb_build_object('name', target_name, 'role', 'admin')
    WHERE email = target_email;
  END IF;

  INSERT INTO public.profiles (id, name, role)
  VALUES (user_id, target_name, 'admin')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = 'admin';

  RAISE NOTICE 'User % ensured with admin role (id=%)', target_email, user_id;
END $$;
