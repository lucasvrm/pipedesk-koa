// Database types (snake_case) to match Supabase schema
export interface MasterDealDB {
  id: string
  client_name: string
  volume: number | null
  operation_type: string | null
  deadline: string | null
  observations: string | null
  status: string
  fee_percentage: number | null
  created_at: string
  updated_at: string
  created_by: string
  company_id: string | null
  deal_product: string | null
  deleted_at: string | null
  is_synthetic: boolean
}

export interface ProfileDB {
  id: string
  name: string | null
  username?: string | null
  email: string | null
  secondary_email?: string | null
  cellphone?: string | null
  rg?: string | null
  cpf?: string | null
  address?: string | null
  pix_key_pf?: string | null
  pix_key_pj?: string | null
  avatar_url: string | null
  avatar_bg_color?: string | null
  avatar_text_color?: string | null
  avatar_border_color?: string | null
  banner_style?: string | null
  title?: string | null
  department?: string | null
  birth_date?: string | null
  linkedin?: string | null
  bio?: string | null
  doc_identity_url?: string | null
  doc_social_contract_url?: string | null
  doc_service_agreement_url?: string | null
  role?: string | null
  client_entity?: string | null
  status?: string | null
  last_login?: string | null
  has_completed_onboarding?: boolean | null
  preferences?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export interface CompanyDB {
  id: string
  name: string
  cnpj: string | null
  type: string | null
  site: string | null
  description: string | null
  relationship_level: string | null
  created_at: string
  updated_at: string
  created_by: string
  deleted_at: string | null
}

export interface ContactDB {
  id: string
  company_id: string | null
  name: string
  email: string | null
  phone: string | null
  role: string | null
  department: string | null
  linkedin: string | null
  notes: string | null
  is_primary: boolean
  buying_role: string | null
  sentiment: string | null
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
}

export interface PlayerDB {
  id: string
  name: string
  cnpj: string | null
  site: string | null
  description: string | null
  logo_url: string | null
  type: string
  gestora_types: string[] | null
  relationship_level: string
  product_capabilities: Record<string, unknown> | null
  category_id: string | null
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
  deleted_at: string | null
  is_synthetic: boolean
}

export interface PlayerContactDB {
  id: string
  player_id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  is_primary: boolean
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
}

export interface LeadDB {
  id: string
  legal_name: string
  trade_name: string | null
  cnpj: string | null
  website: string | null
  segment: string | null
  address_city: string | null
  address_state: string | null
  description: string | null
  operation_type: string | null
  lead_status_id: string
  lead_origin_id: string
  owner_user_id: string | null
  priority_bucket: string | null
  priority_score: number | null
  priority_description: string | null
  last_interaction_at: string | null
  next_action: Record<string, unknown> | null
  qualified_at: string | null
  qualified_company_id: string | null
  qualified_master_deal_id: string | null
  created_at: string
  updated_at: string
  created_by: string
  deleted_at: string | null
  is_synthetic: boolean
}

export interface LeadContactDB {
  id: string
  lead_id: string
  contact_id: string
  is_primary: boolean
  created_at: string
}

export interface LeadMemberDB {
  id: string
  lead_id: string
  user_id: string
  role: string
  added_at: string
}

export interface DealMemberDB {
  id: string
  deal_id: string
  user_id: string
  created_at: string
}

export interface ActivityLogDB {
  id: string
  entity_id: string
  entity_type: string
  action: string
  user_id: string
  changes: Record<string, unknown> | null
  created_at: string
}

export interface RoleDB {
  id: string
  name: string
  description: string | null
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface PermissionDB {
  id: string
  code: string
  description: string | null
  created_at: string
}

export interface RolePermissionDB {
  id: string
  role_id: string
  permission_id: string
  created_at: string
}

export interface TagDB {
  id: string
  name: string
  color: string
  entity_type: string | null
  created_at: string
  created_by: string
}

export interface EntityTagDB {
  id: string
  tag_id: string
  entity_id: string
  entity_type: string
  created_at: string
}

export interface SlaPolicyDB {
  id: string
  stage_id: string
  max_hours: number
  warning_threshold_hours: number
  created_at: string
  updated_at: string
}

export interface PhaseTransitionRuleDB {
  id: string
  from_stage: string
  to_stage: string
  enabled: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OperationTypeDB {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LossReasonDB {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface SystemSettingsDB {
  id: string
  key: string
  value: Record<string, unknown> | null
  description: string | null
  updated_at: string
  updated_by: string | null
}

export interface DealStatusDB {
  id: string
  code: string
  label: string
  color: string | null
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface CompanyRelationshipLevelDB {
  id: string
  code: string
  label: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface CompanyTypeDB {
  id: string
  code: string
  label: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface LeadStatusDB {
  id: string
  code: string
  label: string
  color: string | null
  description: string | null
  is_active: boolean
  sort_order: number
  priority_weight: number | null
  created_at: string
}

export interface LeadOriginDB {
  id: string
  code: string
  label: string
  description: string | null
  is_active: boolean
  sort_order: number
  priority_weight: number | null
  created_at: string
}

export interface LeadMemberRoleDB {
  id: string
  code: string
  label: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface UserRoleMetadataDB {
  id: string
  code: string
  label: string
  description: string | null
  badge_variant: string | null
  permissions: string[] | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TaskStatusDB {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TaskPriorityDB {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TrackStatusDB {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DocumentTemplateDB {
  id: string
  name: string
  entity_type: string
  structure: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface DocumentTypeConfigDB {
  id: string
  name: string
  entity_type: string
  config: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface UserNotificationPreferencesDB {
  id: string
  user_id: string
  dnd_enabled: boolean
  pref_mention: boolean
  pref_assignment: boolean
  pref_status: boolean
  pref_sla: boolean
  pref_deadline: boolean
  pref_activity: boolean
  pref_system: boolean
  min_priority: string | null
  channel_inapp: boolean
  channel_email: boolean
  channel_push: boolean
  created_at: string
  updated_at: string
}

export interface PlayerTrackDB {
  id: string
  master_deal_id: string
  player_id: string | null
  player_name: string
  track_volume: number | null
  current_stage: string
  probability: number
  responsibles: string[]
  status: string
  notes: string | null
  stage_entered_at: string | null
  created_at: string
  updated_at: string
  is_synthetic: boolean
}

export interface TaskDB {
  id: string
  player_track_id: string
  title: string
  description: string | null
  assignees: string[]
  due_date: string | null
  completed: boolean
  dependencies: string[]
  is_milestone: boolean
  position: number
  status: string
  priority: string
  created_at: string
  updated_at: string
}

export interface UserDB {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  client_entity: string | null
  created_at: string
  updated_at: string
}

export interface CommentDB {
  id: string
  entity_id: string
  entity_type: string
  author_id: string
  content: string
  mentions: string[]
  parent_id: string | null
  created_at: string
  updated_at: string | null
}

export interface NotificationDB {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  priority: string | null
  category: string | null
  entity_id: string | null
  entity_type: string | null
  group_key: string | null
  metadata: Record<string, unknown> | null
  expires_at: string | null
  created_at: string
}

export interface CustomFieldDefinitionDB {
  id: string
  name: string
  key: string
  type: string
  entity_type: string
  required: boolean
  options: any | null
  default_value: any | null
  placeholder: string | null
  help_text: string | null
  position: number
  created_at: string
  created_by: string
}

export interface CustomFieldValueDB {
  id: string
  field_definition_id: string
  entity_id: string
  entity_type: string
  value: any | null
  updated_at: string
  updated_by: string
}

export interface FolderDB {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  parent_id: string | null
  type: string
  position: number
  created_at: string
  created_by: string
}

export interface EntityLocationDB {
  id: string
  entity_id: string
  entity_type: string
  folder_id: string
  is_primary: boolean
  added_at: string
  added_by: string
}

export interface StageHistoryDB {
  id: string
  player_track_id: string
  stage: string
  entered_at: string
  exited_at: string | null
  duration_hours: number | null
}

export interface GoogleIntegrationDB {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  scope: string[]
  email: string
  connected_at: string
}

export interface GoogleDriveFolderDB {
  id: string
  entity_id: string
  entity_type: string
  folder_id: string
  folder_url: string
  created_at: string
}

export interface CalendarEventDB {
  id: string
  google_event_id: string | null
  entity_id: string
  entity_type: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  attendees: string[]
  synced: boolean
  created_at: string
}

export interface MagicLinkDB {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
  used_at: string | null
  revoked_at: string | null
}

export interface PipelineStageDB {
  id: string
  pipeline_id: string | null
  name: string
  color: string
  stage_order: number
  probability: number | null
  is_default: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Helper type to make id, timestamps, and fields with DB defaults optional for inserts
// These fields are typically auto-generated or have default values in the database
type InsertType<T> = Omit<T, 'id' | 'created_at' | 'updated_at' | 'added_at' | 'is_synthetic' | 'deleted_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
  added_at?: string
  is_synthetic?: boolean
  deleted_at?: string | null
}

export type Database = {
  public: {
    Tables: {
      master_deals: {
        Row: MasterDealDB
        Insert: InsertType<MasterDealDB>
        Update: Partial<MasterDealDB>
        Relationships: []
      }
      player_tracks: {
        Row: PlayerTrackDB
        Insert: InsertType<PlayerTrackDB>
        Update: Partial<PlayerTrackDB>
        Relationships: []
      }
      tasks: {
        Row: TaskDB
        Insert: InsertType<TaskDB>
        Update: Partial<TaskDB>
        Relationships: []
      }
      users: {
        Row: UserDB
        Insert: InsertType<UserDB>
        Update: Partial<UserDB>
        Relationships: []
      }
      profiles: {
        Row: ProfileDB
        Insert: InsertType<ProfileDB>
        Update: Partial<ProfileDB>
        Relationships: []
      }
      companies: {
        Row: CompanyDB
        Insert: InsertType<CompanyDB>
        Update: Partial<CompanyDB>
        Relationships: []
      }
      contacts: {
        Row: ContactDB
        Insert: InsertType<ContactDB>
        Update: Partial<ContactDB>
        Relationships: []
      }
      players: {
        Row: PlayerDB
        Insert: InsertType<PlayerDB>
        Update: Partial<PlayerDB>
        Relationships: []
      }
      player_contacts: {
        Row: PlayerContactDB
        Insert: InsertType<PlayerContactDB>
        Update: Partial<PlayerContactDB>
        Relationships: []
      }
      leads: {
        Row: LeadDB
        Insert: InsertType<LeadDB>
        Update: Partial<LeadDB>
        Relationships: []
      }
      lead_contacts: {
        Row: LeadContactDB
        Insert: InsertType<LeadContactDB>
        Update: Partial<LeadContactDB>
        Relationships: []
      }
      lead_members: {
        Row: LeadMemberDB
        Insert: InsertType<LeadMemberDB>
        Update: Partial<LeadMemberDB>
        Relationships: []
      }
      deal_members: {
        Row: DealMemberDB
        Insert: InsertType<DealMemberDB>
        Update: Partial<DealMemberDB>
        Relationships: []
      }
      comments: {
        Row: CommentDB
        Insert: InsertType<CommentDB>
        Update: Partial<CommentDB>
        Relationships: []
      }
      notifications: {
        Row: NotificationDB
        Insert: InsertType<NotificationDB>
        Update: Partial<NotificationDB>
        Relationships: []
      }
      activity_log: {
        Row: ActivityLogDB
        Insert: InsertType<ActivityLogDB>
        Update: Partial<ActivityLogDB>
        Relationships: []
      }
      roles: {
        Row: RoleDB
        Insert: InsertType<RoleDB>
        Update: Partial<RoleDB>
        Relationships: []
      }
      permissions: {
        Row: PermissionDB
        Insert: InsertType<PermissionDB>
        Update: Partial<PermissionDB>
        Relationships: []
      }
      role_permissions: {
        Row: RolePermissionDB
        Insert: InsertType<RolePermissionDB>
        Update: Partial<RolePermissionDB>
        Relationships: []
      }
      tags: {
        Row: TagDB
        Insert: InsertType<TagDB>
        Update: Partial<TagDB>
        Relationships: []
      }
      entity_tags: {
        Row: EntityTagDB
        Insert: InsertType<EntityTagDB>
        Update: Partial<EntityTagDB>
        Relationships: []
      }
      sla_policies: {
        Row: SlaPolicyDB
        Insert: InsertType<SlaPolicyDB>
        Update: Partial<SlaPolicyDB>
        Relationships: []
      }
      phase_transition_rules: {
        Row: PhaseTransitionRuleDB
        Insert: InsertType<PhaseTransitionRuleDB>
        Update: Partial<PhaseTransitionRuleDB>
        Relationships: []
      }
      operation_types: {
        Row: OperationTypeDB
        Insert: InsertType<OperationTypeDB>
        Update: Partial<OperationTypeDB>
        Relationships: []
      }
      loss_reasons: {
        Row: LossReasonDB
        Insert: InsertType<LossReasonDB>
        Update: Partial<LossReasonDB>
        Relationships: []
      }
      system_settings: {
        Row: SystemSettingsDB
        Insert: InsertType<SystemSettingsDB>
        Update: Partial<SystemSettingsDB>
        Relationships: []
      }
      deal_statuses: {
        Row: DealStatusDB
        Insert: InsertType<DealStatusDB>
        Update: Partial<DealStatusDB>
        Relationships: []
      }
      company_relationship_levels: {
        Row: CompanyRelationshipLevelDB
        Insert: InsertType<CompanyRelationshipLevelDB>
        Update: Partial<CompanyRelationshipLevelDB>
        Relationships: []
      }
      company_types: {
        Row: CompanyTypeDB
        Insert: InsertType<CompanyTypeDB>
        Update: Partial<CompanyTypeDB>
        Relationships: []
      }
      lead_statuses: {
        Row: LeadStatusDB
        Insert: InsertType<LeadStatusDB>
        Update: Partial<LeadStatusDB>
        Relationships: []
      }
      lead_origins: {
        Row: LeadOriginDB
        Insert: InsertType<LeadOriginDB>
        Update: Partial<LeadOriginDB>
        Relationships: []
      }
      lead_member_roles: {
        Row: LeadMemberRoleDB
        Insert: InsertType<LeadMemberRoleDB>
        Update: Partial<LeadMemberRoleDB>
        Relationships: []
      }
      user_role_metadata: {
        Row: UserRoleMetadataDB
        Insert: InsertType<UserRoleMetadataDB>
        Update: Partial<UserRoleMetadataDB>
        Relationships: []
      }
      task_statuses: {
        Row: TaskStatusDB
        Insert: InsertType<TaskStatusDB>
        Update: Partial<TaskStatusDB>
        Relationships: []
      }
      task_priorities: {
        Row: TaskPriorityDB
        Insert: InsertType<TaskPriorityDB>
        Update: Partial<TaskPriorityDB>
        Relationships: []
      }
      track_statuses: {
        Row: TrackStatusDB
        Insert: InsertType<TrackStatusDB>
        Update: Partial<TrackStatusDB>
        Relationships: []
      }
      document_templates: {
        Row: DocumentTemplateDB
        Insert: InsertType<DocumentTemplateDB>
        Update: Partial<DocumentTemplateDB>
        Relationships: []
      }
      document_type_configs: {
        Row: DocumentTypeConfigDB
        Insert: InsertType<DocumentTypeConfigDB>
        Update: Partial<DocumentTypeConfigDB>
        Relationships: []
      }
      user_notification_preferences: {
        Row: UserNotificationPreferencesDB
        Insert: InsertType<UserNotificationPreferencesDB>
        Update: Partial<UserNotificationPreferencesDB>
        Relationships: []
      }
      custom_field_definitions: {
        Row: CustomFieldDefinitionDB
        Insert: InsertType<CustomFieldDefinitionDB>
        Update: Partial<CustomFieldDefinitionDB>
        Relationships: []
      }
      custom_field_values: {
        Row: CustomFieldValueDB
        Insert: InsertType<CustomFieldValueDB>
        Update: Partial<CustomFieldValueDB>
        Relationships: []
      }
      folders: {
        Row: FolderDB
        Insert: InsertType<FolderDB>
        Update: Partial<FolderDB>
        Relationships: []
      }
      entity_locations: {
        Row: EntityLocationDB
        Insert: InsertType<EntityLocationDB>
        Update: Partial<EntityLocationDB>
        Relationships: []
      }
      stage_history: {
        Row: StageHistoryDB
        Insert: InsertType<StageHistoryDB>
        Update: Partial<StageHistoryDB>
        Relationships: []
      }
      google_integrations: {
        Row: GoogleIntegrationDB
        Insert: InsertType<GoogleIntegrationDB>
        Update: Partial<GoogleIntegrationDB>
        Relationships: []
      }
      google_drive_folders: {
        Row: GoogleDriveFolderDB
        Insert: InsertType<GoogleDriveFolderDB>
        Update: Partial<GoogleDriveFolderDB>
        Relationships: []
      }
      calendar_events: {
        Row: CalendarEventDB
        Insert: InsertType<CalendarEventDB>
        Update: Partial<CalendarEventDB>
        Relationships: []
      }
      magic_links: {
        Row: MagicLinkDB
        Insert: InsertType<MagicLinkDB>
        Update: Partial<MagicLinkDB>
        Relationships: []
      }
      pipeline_stages: {
        Row: PipelineStageDB
        Insert: InsertType<PipelineStageDB>
        Update: Partial<PipelineStageDB>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_synthetic_data_v2: {
        Args: {
          payload: {
            companies_count: number
            leads_count: number
            deals_count: number
            contacts_count: number
            players_count: number
            users_ids: string[]
          }
        }
        Returns: {
          companies: number
          leads: number
          deals: number
          contacts: number
          players: number
        }
      }
      qualify_lead: {
        Args: {
          p_lead_id: string
          p_company_id?: string
          p_new_company_data?: Record<string, unknown>
          p_user_id: string
        }
        Returns: {
          master_deal_id: string
          company_id: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
