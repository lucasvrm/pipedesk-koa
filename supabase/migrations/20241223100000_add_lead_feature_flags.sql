-- Migration: Add feature flags for lead priority and next action systems
-- Description: Controls transition from automatic to manual priority/next-action
-- Date: 2024-12-23

-- ============================================================================
-- INSERT FEATURE FLAGS (idempotent com ON CONFLICT)
-- ============================================================================

-- Sistema antigo: prioridade automática (DESABILITADO por padrão)
INSERT INTO system_settings (key, value, description, updated_at)
VALUES (
  'feature_lead_auto_priority',
  'false'::jsonb,
  'Habilita cálculo automático de prioridade de leads via worker. Quando false, priority_score só muda manualmente.',
  now()
)
ON CONFLICT (key) DO NOTHING;

-- Sistema antigo: next action automática (DESABILITADO por padrão)
INSERT INTO system_settings (key, value, description, updated_at)
VALUES (
  'feature_lead_auto_next_action',
  'false'::jsonb,
  'Habilita sugestão automática de próximas ações no sales-view. Quando false, usa sistema de tarefas.',
  now()
)
ON CONFLICT (key) DO NOTHING;

-- Sistema novo: prioridade manual (HABILITADO por padrão)
INSERT INTO system_settings (key, value, description, updated_at)
VALUES (
  'feature_lead_manual_priority',
  'true'::jsonb,
  'Permite usuários alterarem prioridade de leads manualmente (hot/warm/cold) clicando no badge.',
  now()
)
ON CONFLICT (key) DO NOTHING;

-- Sistema novo: tarefas como next actions (HABILITADO por padrão)
INSERT INTO system_settings (key, value, description, updated_at)
VALUES (
  'feature_lead_task_next_action',
  'true'::jsonb,
  'Habilita sistema de tarefas vinculadas a leads como próximas ações. Usa tabela lead_tasks.',
  now()
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- COMENTÁRIO
-- ============================================================================
COMMENT ON TABLE system_settings IS 'Configurações globais do sistema, incluindo feature flags para controle de funcionalidades.';
