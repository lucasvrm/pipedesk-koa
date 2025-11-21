-- =====================================================
-- SUPABASE PROFILES TABLE MIGRATION
-- =====================================================
-- This script creates the profiles table for PipeDesk
-- and sets up automatic profile creation on user signup.
-- 
-- Execute this in the Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- =====================================================

-- 1. Cria a tabela para armazenar os perfis dos usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  username TEXT UNIQUE,
  avatar_url TEXT,
  website TEXT,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 2. Define a chave estrangeira para a tabela de usuários do Supabase Auth
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- 3. Habilita a Segurança a Nível de Linha (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Cria políticas de acesso para a tabela de perfis
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Cria uma função para criar um perfil automaticamente ao criar um usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Cria um trigger que executa a função acima após a criação de um novo usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
