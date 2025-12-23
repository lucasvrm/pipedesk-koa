-- Migration: expand_notifications_table
-- Description: Add priority, category, grouping and metadata to notifications
-- Created at: 2025-12-23

-- 1. Adicionar novas colunas
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' 
  CHECK (priority IN ('critical', 'urgent', 'high', 'normal', 'low')),
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general'
  CHECK (category IN ('mention', 'assignment', 'status', 'sla', 'deadline', 'activity', 'system', 'general')),
ADD COLUMN IF NOT EXISTS entity_id UUID,
ADD COLUMN IF NOT EXISTS entity_type TEXT
  CHECK (entity_type IN ('lead', 'deal', 'track', 'task', 'company', 'contact', 'comment')),
ADD COLUMN IF NOT EXISTS group_key TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, read) 
  WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_group_key 
  ON notifications(user_id, group_key) 
  WHERE group_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_entity 
  ON notifications(entity_type, entity_id) 
  WHERE entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_priority 
  ON notifications(user_id, priority) 
  WHERE read = false;

-- 3. Comentários para documentação
COMMENT ON COLUMN notifications.priority IS 'Nível de prioridade: critical, urgent, high, normal, low';
COMMENT ON COLUMN notifications.category IS 'Categoria para agrupamento e filtros na UI';
COMMENT ON COLUMN notifications.entity_id IS 'ID da entidade relacionada (lead, deal, etc)';
COMMENT ON COLUMN notifications.entity_type IS 'Tipo da entidade relacionada';
COMMENT ON COLUMN notifications.group_key IS 'Chave para agrupar notificações similares (ex: mention:lead:uuid)';
COMMENT ON COLUMN notifications.metadata IS 'Dados extras em JSON (autor, valores antigos/novos, etc)';
COMMENT ON COLUMN notifications.expires_at IS 'Data de expiração opcional (para limpeza automática)';
