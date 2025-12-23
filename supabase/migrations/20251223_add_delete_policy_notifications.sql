-- Migration: add_delete_policy_notifications
-- Description: Allow users to delete their own notifications
-- Created at: 2025-12-23

-- Policy: Usuário pode deletar suas próprias notificações
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);
