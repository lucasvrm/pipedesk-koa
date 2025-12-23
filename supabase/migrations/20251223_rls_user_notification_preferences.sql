-- Migration: rls_user_notification_preferences
-- Description: Row Level Security for notification preferences
-- Created at: 2025-12-23

-- Habilitar RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver suas próprias preferências
CREATE POLICY "Users can view own notification preferences"
  ON user_notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuário pode inserir suas próprias preferências
CREATE POLICY "Users can insert own notification preferences"
  ON user_notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuário pode atualizar suas próprias preferências
CREATE POLICY "Users can update own notification preferences"
  ON user_notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Usuário pode deletar suas próprias preferências
CREATE POLICY "Users can delete own notification preferences"
  ON user_notification_preferences
  FOR DELETE
  USING (auth.uid() = user_id);
