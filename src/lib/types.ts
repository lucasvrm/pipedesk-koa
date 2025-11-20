export type UserRole = 'admin' | 'analyst' | 'client' | 'newbusiness'

export type DealStatus = 'active' | 'cancelled' | 'concluded'

export type PlayerStage = 
  | 'nda' 
  | 'analysis' 
  | 'proposal' 
  | 'negotiation' 
  | 'closing'

export type OperationType = 
  | 'acquisition' 
  | 'merger' 
  | 'investment' 
  | 'divestment'

export type ViewType = 'kanban' | 'list' | 'gantt' | 'calendar'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  clientEntity?: string
}

export interface MasterDeal {
  id: string
  clientName: string
  volume: number
  operationType: OperationType
  deadline: string
  observations: string
  status: DealStatus
  createdAt: string
  updatedAt: string
  createdBy: string
  deletedAt?: string
}

export interface PlayerTrack {
  id: string
  masterDealId: string
  playerName: string
  trackVolume: number
  currentStage: PlayerStage
  probability: number
  responsibles: string[]
  status: DealStatus
  createdAt: string
  updatedAt: string
  notes: string
}

export interface Task {
  id: string
  playerTrackId: string
  title: string
  description: string
  assignees: string[]
  dueDate?: string
  completed: boolean
  dependencies: string[]
  isMilestone: boolean
  createdAt: string
  updatedAt: string
  position: number
}

export interface Comment {
  id: string
  entityId: string
  entityType: 'deal' | 'track' | 'task'
  authorId: string
  content: string
  createdAt: string
  mentions: string[]
}

export interface Notification {
  id: string
  userId: string
  type: 'mention' | 'assignment' | 'status_change' | 'sla_breach' | 'deadline'
  title: string
  message: string
  link: string
  read: boolean
  createdAt: string
}

export const STAGE_PROBABILITIES: Record<PlayerStage, number> = {
  nda: 10,
  analysis: 25,
  proposal: 50,
  negotiation: 75,
  closing: 90,
}

export interface StageHistory {
  id: string
  playerTrackId: string
  stage: PlayerStage
  enteredAt: string
  exitedAt?: string
  durationHours?: number
}

export interface SLAConfig {
  id: string
  stage: PlayerStage
  maxHours: number
  warningThresholdPercent: number
}

export interface AnalyticsMetrics {
  totalDeals: number
  activeDeals: number
  concludedDeals: number
  cancelledDeals: number
  averageTimeToClose: number
  conversionRate: number
  weightedPipeline: number
  slaBreach: {
    total: number
    byStage: Record<PlayerStage, number>
  }
  dealsByStage: Record<PlayerStage, number>
  teamWorkload: {
    userId: string
    activeTracks: number
    activeTasks: number
  }[]
}

export interface GoogleIntegration {
  id: string
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: string
  scope: string[]
  email: string
  connectedAt: string
}

export interface GoogleDriveFolder {
  id: string
  entityId: string
  entityType: 'deal' | 'track'
  folderId: string
  folderUrl: string
  createdAt: string
}

export interface CalendarEvent {
  id: string
  googleEventId?: string
  entityId: string
  entityType: 'deal' | 'track' | 'task'
  title: string
  description: string
  startTime: string
  endTime: string
  attendees: string[]
  synced: boolean
  createdAt: string
}

export const STAGE_LABELS: Record<PlayerStage, string> = {
  nda: 'NDA',
  analysis: 'Análise',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  closing: 'Fechamento',
}

export const STATUS_LABELS: Record<DealStatus, string> = {
  active: 'Ativo',
  cancelled: 'Cancelado',
  concluded: 'Concluído',
}

export const OPERATION_LABELS: Record<OperationType, string> = {
  acquisition: 'Aquisição',
  merger: 'Fusão',
  investment: 'Investimento',
  divestment: 'Desinvestimento',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  analyst: 'Analista',
  client: 'Cliente',
  newbusiness: 'Novos Negócios',
}

export interface MagicLink {
  id: string
  userId: string
  token: string
  expiresAt: string
  createdAt: string
  usedAt?: string
  revokedAt?: string
}
