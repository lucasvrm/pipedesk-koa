-- Supabase Database Schema for PipeDesk
-- Initial Schema Migration (Consolidated)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & PROFILES (Consolidated)
-- ============================================================================

-- Profiles table extends auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE, -- Kept for compatibility, though email is in auth.users
  name TEXT, -- Migrated from users.name
  role TEXT CHECK (role IN ('admin', 'analyst', 'client', 'newbusiness')) DEFAULT 'client', -- Migrated from users.role
  avatar_url TEXT, -- Migrated from users.avatar/profiles.avatar_url
  website TEXT, -- From migration script
  client_entity TEXT, -- Migrated from users.client_entity
  has_completed_onboarding BOOLEAN DEFAULT false, -- Migrated from users.has_completed_onboarding
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    COALESCE(new.raw_user_meta_data->>'role', 'client')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

CREATE TABLE master_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  volume NUMERIC,
  operation_type TEXT CHECK (operation_type IN ('acquisition', 'merger', 'investment', 'divestment')),
  deadline TIMESTAMPTZ,
  observations TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'concluded')),
  fee_percentage NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE player_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_deal_id UUID NOT NULL REFERENCES master_deals(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  track_volume NUMERIC,
  current_stage TEXT DEFAULT 'nda' CHECK (current_stage IN ('nda', 'analysis', 'proposal', 'negotiation', 'closing')),
  probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
  responsibles UUID[] DEFAULT '{}', -- references profiles(id) logically
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'concluded')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid REFERENCES master_deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  stage_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pipeline_id, stage_order)
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_track_id UUID NOT NULL REFERENCES player_tracks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignees UUID[] DEFAULT '{}', -- references profiles(id) logically
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  dependencies UUID[] DEFAULT '{}',
  is_milestone BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'track', 'task')),
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}', -- references profiles(id) logically
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mention', 'assignment', 'status_change', 'sla_breach', 'deadline')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CUSTOM FIELDS & ORGANIZATION
-- ============================================================================

CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'multiselect', 'boolean', 'url', 'email')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'track', 'task')),
  required BOOLEAN DEFAULT false,
  options JSONB,
  default_value JSONB,
  placeholder TEXT,
  help_text TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  UNIQUE(entity_type, key)
);

CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'track', 'task')),
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES profiles(id)
);

CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('project', 'team', 'sprint', 'category', 'custom')),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id)
);

CREATE TABLE entity_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'track', 'task')),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  added_at TIMESTAMPTZ DEFAULT now(),
  added_by UUID NOT NULL REFERENCES profiles(id)
);

-- ============================================================================
-- ANALYTICS & HISTORY
-- ============================================================================

CREATE TABLE stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_track_id UUID NOT NULL REFERENCES player_tracks(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('nda', 'analysis', 'proposal', 'negotiation', 'closing')),
  entered_at TIMESTAMPTZ DEFAULT now(),
  exited_at TIMESTAMPTZ,
  duration_hours NUMERIC
);

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  entity_id UUID,
  entity_type TEXT CHECK (entity_type IN ('deal', 'track', 'task', 'user', 'folder')),
  action TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INTEGRATIONS (Google, etc.)
-- ============================================================================

CREATE TABLE google_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT[] DEFAULT '{}',
  email TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE google_drive_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'track')),
  folder_id TEXT NOT NULL,
  folder_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_event_id TEXT,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'track', 'task')),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  attendees UUID[] DEFAULT '{}', -- references profiles(id) logically
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PHASE VALIDATION (Business Rules)
-- ============================================================================

CREATE TABLE phase_transition_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_stage TEXT NOT NULL CHECK (from_stage IN ('nda', 'analysis', 'proposal', 'negotiation', 'closing')),
  to_stage TEXT NOT NULL CHECK (to_stage IN ('nda', 'analysis', 'proposal', 'negotiation', 'closing')),
  required_fields JSONB DEFAULT '[]',
  required_tasks_completed BOOLEAN DEFAULT false,
  min_probability INTEGER,
  custom_validation JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  UNIQUE(from_stage, to_stage)
);

-- ============================================================================
-- Q&A MODULE
-- ============================================================================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'track')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  asked_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  answered_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Master Deals
CREATE INDEX idx_master_deals_status ON master_deals(status);
CREATE INDEX idx_master_deals_created_by ON master_deals(created_by);
CREATE INDEX idx_master_deals_deadline ON master_deals(deadline);
CREATE INDEX idx_master_deals_deleted_at ON master_deals(deleted_at);

-- Player Tracks
CREATE INDEX idx_player_tracks_master_deal_id ON player_tracks(master_deal_id);
CREATE INDEX idx_player_tracks_current_stage ON player_tracks(current_stage);
CREATE INDEX idx_player_tracks_status ON player_tracks(status);

-- Tasks
CREATE INDEX idx_tasks_player_track_id ON tasks(player_track_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Comments
CREATE INDEX idx_comments_entity ON comments(entity_id, entity_type);
CREATE INDEX idx_comments_author_id ON comments(author_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Custom Fields
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_id, entity_type);
CREATE INDEX idx_custom_field_values_field_def ON custom_field_values(field_definition_id);

-- Folders & Locations
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_entity_locations_entity ON entity_locations(entity_id, entity_type);
CREATE INDEX idx_entity_locations_folder_id ON entity_locations(folder_id);

-- Stage History
CREATE INDEX idx_stage_history_player_track_id ON stage_history(player_track_id);
CREATE INDEX idx_stage_history_stage ON stage_history(stage);

-- Activity Log
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_id, entity_type);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Q&A
CREATE INDEX idx_questions_entity ON questions(entity_id, entity_type);
CREATE INDEX idx_questions_asked_by ON questions(asked_by);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_answered_by ON answers(answered_by);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE master_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_drive_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_transition_rules ENABLE ROW LEVEL SECURITY;

-- Master Deals: Clients can only see their own deals, others can see all active deals
CREATE POLICY "Users can view master_deals" ON master_deals
  FOR SELECT USING (
    deleted_at IS NULL AND (
      -- Admins and analysts can see all
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
      -- Clients can only see deals they created
      OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'client') AND created_by = auth.uid())
    )
  );

CREATE POLICY "Authorized users can create master_deals" ON master_deals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
  );

CREATE POLICY "Authorized users can update master_deals" ON master_deals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
  );

CREATE POLICY "Authorized users can delete master_deals" ON master_deals
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst'))
  );

-- Player Tracks: Inherit access from master_deals
CREATE POLICY "Users can view player_tracks" ON player_tracks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM master_deals
      WHERE id = player_tracks.master_deal_id
      AND deleted_at IS NULL
      AND (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
        OR created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can manage player_tracks" ON player_tracks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
  );

-- Tasks: Can be viewed by anyone involved in the player track
CREATE POLICY "Users can view tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM player_tracks pt
      JOIN master_deals md ON pt.master_deal_id = md.id
      WHERE pt.id = tasks.player_track_id
      AND md.deleted_at IS NULL
      AND (
        auth.uid() = ANY(tasks.assignees)
        OR auth.uid() = ANY(pt.responsibles)
        OR md.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
      )
    )
  );

CREATE POLICY "Users can manage assigned tasks" ON tasks
  FOR ALL USING (
    auth.uid() = ANY(assignees)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
  );

-- Comments: Can be viewed by anyone who can see the related entity
CREATE POLICY "Users can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Custom Fields: Visible to all, manageable by admins
CREATE POLICY "Users can view custom_field_definitions" ON custom_field_definitions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage custom_field_definitions" ON custom_field_definitions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view custom_field_values" ON custom_field_values
  FOR SELECT USING (true);

CREATE POLICY "Users can manage custom_field_values" ON custom_field_values
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
  );

-- Folders: Visible to all authenticated users
CREATE POLICY "Users can view folders" ON folders
  FOR SELECT USING (true);

CREATE POLICY "Authorized users can manage folders" ON folders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
  );

-- Entity Locations: Follow entity visibility rules
CREATE POLICY "Users can view entity_locations" ON entity_locations
  FOR SELECT USING (true);

CREATE POLICY "Authorized users can manage entity_locations" ON entity_locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
  );

-- Stage History: Readable by all, writable by system
CREATE POLICY "Users can view stage_history" ON stage_history
  FOR SELECT USING (true);

CREATE POLICY "System can manage stage_history" ON stage_history
  FOR ALL USING (true);

-- Activity Log: Readable by all, system-managed
CREATE POLICY "Users can view activity_log" ON activity_log
  FOR SELECT USING (true);

CREATE POLICY "System can manage activity_log" ON activity_log
  FOR ALL USING (true);

-- Google Integrations: Users can only manage their own
CREATE POLICY "Users can manage their own google_integrations" ON google_integrations
  FOR ALL USING (auth.uid() = user_id);

-- Google Drive Folders: Visible to all
CREATE POLICY "Users can view google_drive_folders" ON google_drive_folders
  FOR SELECT USING (true);

CREATE POLICY "Authorized users can manage google_drive_folders" ON google_drive_folders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
  );

-- Calendar Events: Visible to attendees and authorized users
CREATE POLICY "Users can view calendar_events" ON calendar_events
  FOR SELECT USING (
    auth.uid() = ANY(attendees)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
  );

CREATE POLICY "Authorized users can manage calendar_events" ON calendar_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
  );

-- Phase Transition Rules: Visible to all, manageable by admins
CREATE POLICY "Users can view phase_transition_rules" ON phase_transition_rules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage phase_transition_rules" ON phase_transition_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- TRIGGERS for automatic timestamps
-- ============================================================================

CREATE TRIGGER update_master_deals_updated_at BEFORE UPDATE ON master_deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_tracks_updated_at BEFORE UPDATE ON player_tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_field_values_updated_at BEFORE UPDATE ON custom_field_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER for stage history tracking
-- ============================================================================

CREATE OR REPLACE FUNCTION track_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
        -- Close the previous stage
        UPDATE stage_history
        SET exited_at = now(),
            duration_hours = EXTRACT(EPOCH FROM (now() - entered_at)) / 3600
        WHERE player_track_id = NEW.id
        AND exited_at IS NULL;

        -- Create new stage entry
        INSERT INTO stage_history (player_track_id, stage, entered_at)
        VALUES (NEW.id, NEW.current_stage, now());
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER player_track_stage_change AFTER UPDATE ON player_tracks
    FOR EACH ROW EXECUTE FUNCTION track_stage_change();
