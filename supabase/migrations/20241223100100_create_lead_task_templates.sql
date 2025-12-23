-- Migration: Create lead_task_templates table
-- Description: Pre-defined task templates for leads (configurable via admin settings)
-- Date: 2024-12-23

-- Ensure uuid generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lead_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentários
COMMENT ON TABLE lead_task_templates IS 'Templates de tarefas pré-definidas para leads. Configurável via /admin/settings.';
COMMENT ON COLUMN lead_task_templates.code IS 'Código único do template (snake_case, ex: prepare_for_meeting)';
COMMENT ON COLUMN lead_task_templates.label IS 'Label exibido na UI (PT-BR)';
COMMENT ON COLUMN lead_task_templates.sort_order IS 'Ordem de exibição (menor = primeiro)';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_lead_task_templates_code 
  ON lead_task_templates(code);

CREATE INDEX IF NOT EXISTS idx_lead_task_templates_active_order 
  ON lead_task_templates(is_active, sort_order) 
  WHERE is_active = true;

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE lead_task_templates ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ler
CREATE POLICY "lead_task_templates_select_policy"
  ON lead_task_templates FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem modificar
CREATE POLICY "lead_task_templates_admin_policy"
  ON lead_task_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- SEED DATA: 11 templates pré-definidos
-- ============================================================================

INSERT INTO lead_task_templates (code, label, description, sort_order) VALUES
  ('prepare_for_meeting', 'Preparar para reunião', 'Preparar materiais e pauta para reunião agendada com o lead', 1),
  ('post_meeting_follow_up', 'Follow-up pós-reunião', 'Enviar resumo e próximos passos após reunião realizada', 2),
  ('call_first_time', 'Fazer primeira ligação', 'Realizar primeiro contato telefônico com o lead', 3),
  ('handoff_to_deal', 'Fazer handoff (para deal)', 'Transferir lead qualificado para pipeline de deals', 4),
  ('qualify_to_company', 'Qualificar para empresa', 'Vincular lead a uma empresa existente ou criar nova', 5),
  ('schedule_meeting', 'Agendar reunião', 'Agendar reunião de apresentação ou discovery', 6),
  ('call_again', 'Ligar novamente', 'Retornar ligação ou fazer follow-up telefônico', 7),
  ('send_value_asset', 'Enviar material / valor', 'Enviar case study, apresentação ou material de valor', 8),
  ('send_follow_up', 'Enviar follow-up', 'Enviar e-mail de follow-up para manter relacionamento', 9),
  ('reengage_cold_lead', 'Reengajar lead frio', 'Tentar reativar lead sem interação recente', 10),
  ('disqualify', 'Desqualificar / encerrar', 'Marcar lead como desqualificado e encerrar processo', 11)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;
