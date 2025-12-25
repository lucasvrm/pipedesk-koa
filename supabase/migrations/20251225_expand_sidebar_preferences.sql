-- Migration:  expand_sidebar_preferences
-- Description: Expande estrutura JSONB para suportar seções customizadas e subitens
-- Created at: 2025-12-25
-- Author: lucasvrm

-- ============================================================================
-- NOTA: Esta migration é ADITIVA e retrocompatível
-- Dados existentes continuam funcionando, novos campos são opcionais
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR COMENTÁRIOS (Documentação expandida)
-- ============================================================================

COMMENT ON COLUMN public.user_sidebar_preferences.config IS 
  'Configuração em JSON expandida: 
  {
    "sections": [
      {
        "id": "dashboard",
        "type": "default",  // NOVO: "default" | "custom"
        "enabled":  true,
        "order": 0,
        "color": "#3b82f6",
        "icon": "Home",
        "label": "Dashboard",  // NOVO
        "tooltip": "Ir para Dashboard",  // NOVO
        "path": "/dashboard",  // NOVO
        "children": [  // NOVO:  subitens
          {
            "id": "overview",
            "label": "Visão Geral",
            "path": "/dashboard",
            "enabled": true,
            "order":  0,
            "fixed":  true,
            "icon": "Home"
          }
        ]
      }
    ]
  }';

-- ============================================================================
-- 2. FUNÇÃO DE VALIDAÇÃO (Garantir integridade)
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_sidebar_config()
RETURNS TRIGGER AS $$
DECLARE
  v_active_count INT;
BEGIN
  -- Contar seções ativas
  SELECT COUNT(*) INTO v_active_count
  FROM jsonb_array_elements(NEW. config->'sections') AS section
  WHERE (section->>'enabled')::boolean = true;
  
  -- Validar mínimo 4 ativas
  IF v_active_count < 4 THEN
    RAISE EXCEPTION 'Mínimo de 4 seções ativas requerido (atual: %)', v_active_count;
  END IF;
  
  -- Validar máximo 10 ativas
  IF v_active_count > 10 THEN
    RAISE EXCEPTION 'Máximo de 10 seções ativas permitido (atual: %)', v_active_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. ADICIONAR TRIGGER DE VALIDAÇÃO
-- ============================================================================

DROP TRIGGER IF EXISTS validate_sidebar_config_trigger ON public.user_sidebar_preferences;

CREATE TRIGGER validate_sidebar_config_trigger
  BEFORE INSERT OR UPDATE ON public. user_sidebar_preferences
  FOR EACH ROW
  EXECUTE FUNCTION validate_sidebar_config();

-- ============================================================================
-- 4. ÍNDICE GIN (Performance para queries em children)
-- ============================================================================

-- Já existe índice GIN, mas reforçar para queries aninhadas
DROP INDEX IF EXISTS idx_user_sidebar_preferences_config_gin;

CREATE INDEX idx_user_sidebar_preferences_config_gin 
  ON public.user_sidebar_preferences USING GIN (config jsonb_path_ops);

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
