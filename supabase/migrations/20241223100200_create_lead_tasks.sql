-- Migration: Create lead_tasks table for task-based next actions
-- Description: Tasks linked to leads, including the "next action" concept
-- Date: 2024-12-23

-- ============================================================================
-- CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  template_id UUID REFERENCES lead_task_templates(id) ON DELETE SET NULL,
  
  -- Conteúdo
  title TEXT NOT NULL,
  description TEXT,
  
  -- Estado
  is_next_action BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Completion tracking
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Comentários
COMMENT ON TABLE lead_tasks IS 'Tarefas vinculadas a leads. Inclui conceito de "próxima ação" (is_next_action).';
COMMENT ON COLUMN lead_tasks.lead_id IS 'Lead ao qual a tarefa está vinculada';
COMMENT ON COLUMN lead_tasks.template_id IS 'Template de onde a tarefa foi criada (NULL se customizada)';
COMMENT ON COLUMN lead_tasks.is_next_action IS 'Se é a próxima ação principal do lead (máximo 1 por lead)';
COMMENT ON COLUMN lead_tasks.status IS 'Status: pending, in_progress, completed, cancelled';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Buscar tarefas de um lead
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id 
  ON lead_tasks(lead_id);

-- Buscar próxima ação ativa de um lead
CREATE INDEX IF NOT EXISTS idx_lead_tasks_next_action 
  ON lead_tasks(lead_id) 
  WHERE is_next_action = true 
    AND status NOT IN ('completed', 'cancelled');

-- Buscar tarefas pendentes por data
CREATE INDEX IF NOT EXISTS idx_lead_tasks_pending_due 
  ON lead_tasks(due_date) 
  WHERE status IN ('pending', 'in_progress');

-- Buscar por template
CREATE INDEX IF NOT EXISTS idx_lead_tasks_template 
  ON lead_tasks(template_id) 
  WHERE template_id IS NOT NULL;

-- ============================================================================
-- TRIGGER: Garantir apenas uma next_action ativa por lead
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_single_next_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Se estamos definindo is_next_action = true
  IF NEW.is_next_action = true AND NEW.status NOT IN ('completed', 'cancelled') THEN
    -- Desmarcar outras next_actions do mesmo lead
    UPDATE lead_tasks 
    SET is_next_action = false
    WHERE lead_id = NEW.lead_id 
      AND id != NEW.id 
      AND is_next_action = true
      AND status NOT IN ('completed', 'cancelled');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_next_action ON lead_tasks;
CREATE TRIGGER trigger_ensure_single_next_action
  BEFORE INSERT OR UPDATE OF is_next_action, status ON lead_tasks
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_next_action();

-- ============================================================================
-- TRIGGER: Auto-set completed_at
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Marcar completed_at quando status muda para completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = COALESCE(NEW.completed_at, now());
  END IF;
  
  -- Limpar completed_at se status sair de completed
  IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
    NEW.completed_by = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_completed_at ON lead_tasks;
CREATE TRIGGER trigger_auto_completed_at
  BEFORE UPDATE OF status ON lead_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_completed_at();

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ler
CREATE POLICY "lead_tasks_select_policy"
  ON lead_tasks FOR SELECT
  TO authenticated
  USING (true);

-- Staff pode criar/editar/deletar (admin, analyst, newbusiness)
CREATE POLICY "lead_tasks_staff_policy"
  ON lead_tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'analyst', 'newbusiness')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'analyst', 'newbusiness')
    )
  );
