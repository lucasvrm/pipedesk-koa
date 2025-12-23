-- Migration: create_notification_with_preferences
-- Description: Function that respects user preferences when creating notifications
-- Created at: 2025-12-23

CREATE OR REPLACE FUNCTION create_notification_if_allowed(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_category TEXT DEFAULT 'general',
  p_entity_id UUID DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_group_key TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_prefs user_notification_preferences%ROWTYPE;
  v_notification_id UUID;
  v_category_enabled BOOLEAN;
  v_priority_allowed BOOLEAN;
  v_priority_order JSONB := '{"critical": 5, "urgent": 4, "high": 3, "normal": 2, "low": 1}'::JSONB;
BEGIN
  -- Buscar preferências do usuário (ou usar defaults se não existir)
  SELECT * INTO v_prefs 
  FROM user_notification_preferences 
  WHERE user_id = p_user_id;
  
  -- Se não tem preferências, criar com defaults
  IF NOT FOUND THEN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;
  
  -- Verificar se categoria está habilitada
  v_category_enabled := CASE p_category
    WHEN 'mention' THEN v_prefs.pref_mention
    WHEN 'assignment' THEN v_prefs.pref_assignment
    WHEN 'status' THEN v_prefs.pref_status
    WHEN 'sla' THEN v_prefs.pref_sla
    WHEN 'deadline' THEN v_prefs.pref_deadline
    WHEN 'activity' THEN v_prefs.pref_activity
    WHEN 'system' THEN v_prefs.pref_system
    ELSE true -- 'general' sempre habilitado
  END;
  
  IF NOT v_category_enabled THEN
    RETURN NULL; -- Usuário desabilitou esta categoria
  END IF;
  
  -- Verificar prioridade mínima
  IF v_prefs.min_priority IS NOT NULL THEN
    v_priority_allowed := (v_priority_order->>p_priority)::INT >= (v_priority_order->>v_prefs.min_priority)::INT;
    IF NOT v_priority_allowed THEN
      RETURN NULL; -- Prioridade abaixo do mínimo configurado
    END IF;
  END IF;
  
  -- Criar notificação
  INSERT INTO notifications (
    user_id, type, title, message, link, 
    priority, category, entity_id, entity_type, group_key, metadata
  )
  VALUES (
    p_user_id, p_type, p_title, p_message, p_link,
    p_priority, p_category, p_entity_id, p_entity_type, p_group_key, p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION create_notification_if_allowed TO authenticated;
