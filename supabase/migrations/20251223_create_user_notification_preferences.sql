-- Migration: create_user_notification_preferences
-- Description: User preferences for notification types and DND mode
-- Created at: 2025-12-23

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Do Not Disturb
  dnd_enabled BOOLEAN DEFAULT false,
  
  -- Preferências por categoria (todas ativas por padrão)
  pref_mention BOOLEAN DEFAULT true,
  pref_assignment BOOLEAN DEFAULT true,
  pref_status BOOLEAN DEFAULT true,
  pref_sla BOOLEAN DEFAULT true,
  pref_deadline BOOLEAN DEFAULT true,
  pref_activity BOOLEAN DEFAULT true,
  pref_system BOOLEAN DEFAULT true,
  
  -- Preferências por prioridade mínima (recebe apenas >= este nível)
  -- null = recebe todas, 'high' = só high, urgent, critical
  min_priority TEXT DEFAULT NULL
    CHECK (min_priority IN ('critical', 'urgent', 'high', 'normal', 'low') OR min_priority IS NULL),
  
  -- Canais futuros (preparado para expansão)
  channel_inapp BOOLEAN DEFAULT true,
  channel_email BOOLEAN DEFAULT false,
  channel_push BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir 1 registro por usuário
  UNIQUE(user_id)
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_user_notification_prefs_user 
  ON user_notification_preferences(user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_prefs_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_prefs_updated_at();

-- Comentários
COMMENT ON TABLE user_notification_preferences IS 'Preferências de notificação por usuário';
COMMENT ON COLUMN user_notification_preferences.dnd_enabled IS 'Modo Não Perturbe - silencia toasts mas mantém no inbox';
COMMENT ON COLUMN user_notification_preferences.min_priority IS 'Prioridade mínima para receber notificações (null = todas)';
