-- Migration:  create_user_sidebar_preferences
-- Description: User customization for Rail & Sidebar (colors, icons, order, visibility)
-- Created at: 2025-12-25
-- Author: GitHub Copilot Agent
-- ============================================================================
-- ANÁLISE DO SCHEMA EXISTENTE:
-- ✅ Tabela 'profiles' existe (referenciada via auth.users)
-- ✅ RLS policies seguem padrão:  auth.uid() = user_id
-- ✅ Timestamps seguem padrão: created_at, updated_at com trigger
-- ✅ Grants seguem padrão: anon, authenticated, service_role, postgres
-- ============================================================================

-- ============================================================================
-- CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_sidebar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Configuração completa da sidebar (JSONB para flexibilidade)
  -- Estrutura:  
  -- {
  --   "sections": [
  --     {
  --       "id": "dashboard",
  --       "enabled": true,
  --       "order": 0,
  --       "color": "#3b82f6",
  --       "icon": "Home"
  --     },
  --     { ... }
  --   ]
  -- }
  config JSONB NOT NULL DEFAULT '{"sections": []}'::jsonb,
  
  -- Timestamps (padrão do projeto)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign Key:  Referencia auth.users (não profiles, conforme schema existente)
  CONSTRAINT fk_user_sidebar_preferences_user_id 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE,
  
  -- Garantir 1 registro por usuário
  CONSTRAINT unique_user_sidebar_preferences_user_id 
    UNIQUE(user_id)
);

-- ============================================================================
-- COMENTÁRIOS (Documentação)
-- ============================================================================

COMMENT ON TABLE public.user_sidebar_preferences IS 
  'Preferências de customização da sidebar/rail por usuário (ordem, cores, ícones, visibilidade)';

COMMENT ON COLUMN public.user_sidebar_preferences.user_id IS 
  'Referência ao usuário (auth.users. id)';

COMMENT ON COLUMN public.user_sidebar_preferences.config IS 
  'Configuração em JSON:  {sections: [{id, enabled, order, color, icon}]}';

-- ============================================================================
-- INDEXES (Performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_sidebar_preferences_user_id 
  ON public.user_sidebar_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sidebar_preferences_config_gin 
  ON public.user_sidebar_preferences USING GIN (config);

-- ============================================================================
-- TRIGGER:  updated_at (Padrão do projeto)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_sidebar_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- RLS (Row Level Security) - Seguindo padrão do projeto
-- ============================================================================

ALTER TABLE public.user_sidebar_preferences ENABLE ROW LEVEL SECURITY;

-- Policy:  SELECT (usuário vê suas próprias preferências)
CREATE POLICY "user_sidebar_preferences_select_policy"
  ON public.user_sidebar_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: INSERT (usuário cria suas próprias preferências)
CREATE POLICY "user_sidebar_preferences_insert_policy"
  ON public.user_sidebar_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: UPDATE (usuário atualiza suas próprias preferências)
CREATE POLICY "user_sidebar_preferences_update_policy"
  ON public.user_sidebar_preferences
  FOR UPDATE
  TO authenticated
  USING (auth. uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: DELETE (usuário deleta suas próprias preferências)
CREATE POLICY "user_sidebar_preferences_delete_policy"
  ON public.user_sidebar_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- GRANTS (Permissões - Padrão do projeto)
-- ============================================================================

-- Grants para 'anon' (usuários não autenticados - bloqueado por RLS)
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE 
  ON TABLE public.user_sidebar_preferences 
  TO anon;

-- Grants para 'authenticated' (usuários autenticados)
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE 
  ON TABLE public.user_sidebar_preferences 
  TO authenticated;

-- Grants para 'service_role' (admin)
GRANT ALL PRIVILEGES 
  ON TABLE public.user_sidebar_preferences 
  TO service_role;

-- Grants para 'postgres' (superuser)
GRANT ALL PRIVILEGES 
  ON TABLE public.user_sidebar_preferences 
  TO postgres;

-- ============================================================================
-- SEED:  Default config para usuários existentes (SEGURO)
-- ============================================================================

-- Inserir config padrão APENAS para usuários que ainda não têm preferências
-- Isso evita conflitos e respeita customizações existentes
INSERT INTO public.user_sidebar_preferences (user_id, config)
SELECT 
  au.id,
  jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object('id', 'dashboard', 'enabled', true, 'order', 0, 'color', '#3b82f6', 'icon', 'Home'),
      jsonb_build_object('id', 'leads', 'enabled', true, 'order', 1, 'color', '#10b981', 'icon', 'Filter'),
      jsonb_build_object('id', 'deals', 'enabled', true, 'order', 2, 'color', '#f59e0b', 'icon', 'Briefcase'),
      jsonb_build_object('id', 'kanban', 'enabled', true, 'order', 3, 'color', '#f97316', 'icon', 'Kanban'),
      jsonb_build_object('id', 'companies', 'enabled', true, 'order', 4, 'color', '#8b5cf6', 'icon', 'Building2'),
      jsonb_build_object('id', 'contacts', 'enabled', true, 'order', 5, 'color', '#ec4899', 'icon', 'User'),
      jsonb_build_object('id', 'players', 'enabled', true, 'order', 6, 'color', '#06b6d4', 'icon', 'Users'),
      jsonb_build_object('id', 'tasks', 'enabled', true, 'order', 7, 'color', '#14b8a6', 'icon', 'CheckSquare'),
      jsonb_build_object('id', 'profile', 'enabled', true, 'order', 8, 'color', '#6366f1', 'icon', 'User'),
      jsonb_build_object('id', 'settings', 'enabled', true, 'order', 9, 'color', '#64748b', 'icon', 'Settings')
    )
  )
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.user_sidebar_preferences usp 
  WHERE usp. user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_rls_enabled BOOLEAN;
  v_seed_count INTEGER;
BEGIN
  -- Verificar se tabela foi criada
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_sidebar_preferences'
  ) INTO v_table_exists;
  
  -- Verificar se RLS está habilitado
  SELECT relrowsecurity 
  FROM pg_class 
  WHERE relname = 'user_sidebar_preferences' 
    AND relnamespace = 'public':: regnamespace
  INTO v_rls_enabled;
  
  -- Contar registros inseridos pelo seed
  SELECT COUNT(*) 
  FROM public.user_sidebar_preferences
  INTO v_seed_count;
  
  -- Logs de verificação
  IF v_table_exists THEN
    RAISE NOTICE '✅ Tabela "user_sidebar_preferences" criada com sucesso';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Tabela não foi criada';
  END IF;
  
  IF v_rls_enabled THEN
    RAISE NOTICE '✅ RLS habilitado corretamente';
  ELSE
    RAISE WARNING '⚠️ AVISO: RLS não está habilitado';
  END IF;
  
  RAISE NOTICE '✅ Seed executado:  % registros inseridos', v_seed_count;
  RAISE NOTICE '🎉 Migration 20251225_create_user_sidebar_preferences concluída! ';
END $$;
