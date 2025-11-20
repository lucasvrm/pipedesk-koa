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
  deleted_at: string | null
}

export interface PlayerTrackDB {
  id: string
  master_deal_id: string
  player_name: string
  track_volume: number | null
  current_stage: string
  probability: number
  responsibles: string[]
  status: string
  notes: string | null
  created_at: string
  updated_at: string
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
  created_at: string
}

export interface NotificationDB {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
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
