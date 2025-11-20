import {
  MasterDeal,
  PlayerTrack,
  Task,
  User,
  Comment,
  Notification,
  CustomFieldDefinition,
  CustomFieldValue,
  Folder,
  EntityLocation,
  StageHistory,
  GoogleIntegration,
  GoogleDriveFolder,
  CalendarEvent,
  MagicLink,
} from './types'

import {
  MasterDealDB,
  PlayerTrackDB,
  TaskDB,
  UserDB,
  CommentDB,
  NotificationDB,
  CustomFieldDefinitionDB,
  CustomFieldValueDB,
  FolderDB,
  EntityLocationDB,
  StageHistoryDB,
  GoogleIntegrationDB,
  GoogleDriveFolderDB,
  CalendarEventDB,
  MagicLinkDB,
} from './databaseTypes'

// MasterDeal converters
export function dbToMasterDeal(db: MasterDealDB): MasterDeal {
  return {
    id: db.id,
    clientName: db.client_name,
    volume: db.volume ?? 0,
    operationType: db.operation_type as any,
    deadline: db.deadline ?? '',
    observations: db.observations ?? '',
    status: db.status as any,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    createdBy: db.created_by,
    deletedAt: db.deleted_at ?? undefined,
    feePercentage: db.fee_percentage ?? undefined,
  }
}

export function masterDealToDB(deal: Partial<MasterDeal>): Partial<MasterDealDB> {
  return {
    id: deal.id,
    client_name: deal.clientName,
    volume: deal.volume,
    operation_type: deal.operationType,
    deadline: deal.deadline,
    observations: deal.observations,
    status: deal.status,
    fee_percentage: deal.feePercentage,
    created_by: deal.createdBy,
    deleted_at: deal.deletedAt ?? null,
  }
}

// PlayerTrack converters
export function dbToPlayerTrack(db: PlayerTrackDB): PlayerTrack {
  return {
    id: db.id,
    masterDealId: db.master_deal_id,
    playerName: db.player_name,
    trackVolume: db.track_volume ?? 0,
    currentStage: db.current_stage as any,
    probability: db.probability,
    responsibles: db.responsibles,
    status: db.status as any,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    notes: db.notes ?? '',
  }
}

export function playerTrackToDB(track: Partial<PlayerTrack>): Partial<PlayerTrackDB> {
  return {
    id: track.id,
    master_deal_id: track.masterDealId,
    player_name: track.playerName,
    track_volume: track.trackVolume,
    current_stage: track.currentStage,
    probability: track.probability,
    responsibles: track.responsibles,
    status: track.status,
    notes: track.notes,
  }
}

// Task converters
export function dbToTask(db: TaskDB): Task {
  return {
    id: db.id,
    playerTrackId: db.player_track_id,
    title: db.title,
    description: db.description ?? '',
    assignees: db.assignees,
    dueDate: db.due_date ?? undefined,
    completed: db.completed,
    dependencies: db.dependencies,
    isMilestone: db.is_milestone,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    position: db.position,
    status: db.status as any,
    priority: db.priority as any,
  }
}

export function taskToDB(task: Partial<Task>): Partial<TaskDB> {
  return {
    id: task.id,
    player_track_id: task.playerTrackId,
    title: task.title,
    description: task.description,
    assignees: task.assignees,
    due_date: task.dueDate ?? null,
    completed: task.completed,
    dependencies: task.dependencies,
    is_milestone: task.isMilestone,
    position: task.position,
    status: task.status,
    priority: task.priority,
  }
}

// User converters
export function dbToUser(db: UserDB): User {
  return {
    id: db.id,
    name: db.name,
    email: db.email,
    role: db.role as any,
    avatar: db.avatar ?? undefined,
    clientEntity: db.client_entity ?? undefined,
  }
}

export function userToDB(user: Partial<User>): Partial<UserDB> {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? null,
    client_entity: user.clientEntity ?? null,
  }
}

// Comment converters
export function dbToComment(db: CommentDB): Comment {
  return {
    id: db.id,
    entityId: db.entity_id,
    entityType: db.entity_type as any,
    authorId: db.author_id,
    content: db.content,
    createdAt: db.created_at,
    mentions: db.mentions,
  }
}

export function commentToDB(comment: Partial<Comment>): Partial<CommentDB> {
  return {
    id: comment.id,
    entity_id: comment.entityId,
    entity_type: comment.entityType,
    author_id: comment.authorId,
    content: comment.content,
    mentions: comment.mentions,
  }
}

// Notification converters
export function dbToNotification(db: NotificationDB): Notification {
  return {
    id: db.id,
    userId: db.user_id,
    type: db.type as any,
    title: db.title,
    message: db.message,
    link: db.link ?? '',
    read: db.read,
    createdAt: db.created_at,
  }
}

export function notificationToDB(notification: Partial<Notification>): Partial<NotificationDB> {
  return {
    id: notification.id,
    user_id: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link ?? null,
    read: notification.read,
  }
}

// CustomFieldDefinition converters
export function dbToCustomFieldDefinition(db: CustomFieldDefinitionDB): CustomFieldDefinition {
  return {
    id: db.id,
    name: db.name,
    key: db.key,
    type: db.type as any,
    entityType: db.entity_type as any,
    required: db.required,
    options: db.options ?? undefined,
    defaultValue: db.default_value ?? undefined,
    placeholder: db.placeholder ?? undefined,
    helpText: db.help_text ?? undefined,
    createdAt: db.created_at,
    createdBy: db.created_by,
    position: db.position,
  }
}

// CustomFieldValue converters
export function dbToCustomFieldValue(db: CustomFieldValueDB): CustomFieldValue {
  return {
    id: db.id,
    fieldDefinitionId: db.field_definition_id,
    entityId: db.entity_id,
    entityType: db.entity_type as any,
    value: db.value,
    updatedAt: db.updated_at,
    updatedBy: db.updated_by,
  }
}

// Folder converters
export function dbToFolder(db: FolderDB): Folder {
  return {
    id: db.id,
    name: db.name,
    description: db.description ?? undefined,
    color: db.color ?? undefined,
    icon: db.icon ?? undefined,
    parentId: db.parent_id ?? undefined,
    createdAt: db.created_at,
    createdBy: db.created_by,
    type: db.type as any,
    position: db.position,
  }
}

// EntityLocation converters
export function dbToEntityLocation(db: EntityLocationDB): EntityLocation {
  return {
    id: db.id,
    entityId: db.entity_id,
    entityType: db.entity_type as any,
    folderId: db.folder_id,
    isPrimary: db.is_primary,
    addedAt: db.added_at,
    addedBy: db.added_by,
  }
}

// StageHistory converters
export function dbToStageHistory(db: StageHistoryDB): StageHistory {
  return {
    id: db.id,
    playerTrackId: db.player_track_id,
    stage: db.stage as any,
    enteredAt: db.entered_at,
    exitedAt: db.exited_at ?? undefined,
    durationHours: db.duration_hours ?? undefined,
  }
}

// GoogleIntegration converters
export function dbToGoogleIntegration(db: GoogleIntegrationDB): GoogleIntegration {
  return {
    id: db.id,
    userId: db.user_id,
    accessToken: db.access_token,
    refreshToken: db.refresh_token,
    expiresAt: db.expires_at,
    scope: db.scope,
    email: db.email,
    connectedAt: db.connected_at,
  }
}

// GoogleDriveFolder converters
export function dbToGoogleDriveFolder(db: GoogleDriveFolderDB): GoogleDriveFolder {
  return {
    id: db.id,
    entityId: db.entity_id,
    entityType: db.entity_type as any,
    folderId: db.folder_id,
    folderUrl: db.folder_url,
    createdAt: db.created_at,
  }
}

// CalendarEvent converters
export function dbToCalendarEvent(db: CalendarEventDB): CalendarEvent {
  return {
    id: db.id,
    googleEventId: db.google_event_id ?? undefined,
    entityId: db.entity_id,
    entityType: db.entity_type as any,
    title: db.title,
    description: db.description ?? '',
    startTime: db.start_time,
    endTime: db.end_time,
    attendees: db.attendees,
    synced: db.synced,
    createdAt: db.created_at,
  }
}

// MagicLink converters
export function dbToMagicLink(db: MagicLinkDB): MagicLink {
  return {
    id: db.id,
    userId: db.user_id,
    token: db.token,
    expiresAt: db.expires_at,
    createdAt: db.created_at,
    usedAt: db.used_at ?? undefined,
    revokedAt: db.revoked_at ?? undefined,
  }
}
