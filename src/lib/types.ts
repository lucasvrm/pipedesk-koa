export type UserRole = 'admin' | 'manager' | 'analyst' | 'client' | 'newbusiness'

export type DealStatus = 'active' | 'cancelled' | 'concluded' | 'on_hold'

export type PlayerStage = string

export type OperationType =
  | 'ccb'
  | 'cri_land'
  | 'cri_construction'
  | 'cri_corporate'
  | 'debt_construction'
  | 'receivables_advance'
  | 'working_capital'
  | 'built_to_suit'
  | 'preferred_equity'
  | 'repurchase'
  | 'sale_and_lease_back'
  | 'inventory_purchase'
  | 'financial_swap'
  | 'physical_swap'
  | 'hybrid_swap';

export type ViewType = 'kanban' | 'list' | 'gantt' | 'calendar'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  avatar_url?: string
  avatarBgColor?: string
  avatarTextColor?: string
  avatarBorderColor?: string
  bannerStyle?: string
  clientEntity?: string
  has_completed_onboarding?: boolean
  createdAt?: string
  updatedAt?: string
  address?: string
  cellphone?: string
  pixKeyPJ?: string
  pixKeyPF?: string
  rg?: string
  cpf?: string
  secondaryEmail?: string
  docIdentityUrl?: string
  docSocialContractUrl?: string
  docServiceAgreementUrl?: string
  title?: string
  department?: string
  birthDate?: string
  linkedin?: string
  bio?: string
  isSynthetic?: boolean
  preferences?: UserPreferences // User specific UI preferences
  status?: 'active' | 'inactive' | 'pending'
  lastLogin?: string
}

export interface PipelineStage {
  id: string
  pipelineId: string | null
  name: string
  color: string
  stageOrder: number
  probability: number
  isDefault: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

// === NOVOS TIPOS DE CONFIGURAÇÃO (SETTINGS) ===

export interface LossReason {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  acronym?: string;
  description?: string;
  defaultFeePercentage?: number;
  defaultSlaDays?: number;
  isActive: boolean;
  createdAt: string;
}

export interface DealSource {
  id: string;
  name: string;
  type?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PlayerCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Holiday {
  id: string;
  date: string; // ISO Date String 'YYYY-MM-DD'
  name: string;
  type: 'national' | 'regional';
  createdAt: string;
}

export type CommunicationTemplateType = 'email' | 'whatsapp' | 'document';

export interface CommunicationTemplate {
  id: string;
  title: string;
  subject?: string;
  content: string;
  type: CommunicationTemplateType;
  category?: string;
  variables: string[]; // ex: ['{{client_name}}']
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TrackStatus {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface OperationTypeRecord {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskStatusDefinition {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskPriorityDefinition {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MasterDeal {
  id: string
  clientName: string
  volume: number
  operationType: OperationType
  dealProduct?: string; 
  deadline: string
  observations: string
  status: DealStatus
  createdAt: string
  updatedAt: string
  createdBy: string
  deletedAt?: string
  feePercentage?: number
  
  createdByUser?: {
    id: string
    name: string
    email: string
    avatar?: string
  }

  companyId?: string;
  // Fallback para código legado que acessa snake_case direto do banco sem mapeamento
  company_id?: string;
  company?: Partial<Company>;

  // NOVOS CAMPOS RELACIONAIS
  productId?: string;
  product?: Product;
  sourceId?: string;
  source?: DealSource;
  lossReasonId?: string;
  lossReason?: LossReason;

  responsibles?: User[];
  tags?: Tag[];
  isSynthetic?: boolean;
}

export interface PlayerTrack {
  id: string
  masterDealId: string
  // Fallback para código legado
  playerId?: string
  // Alias for masterDealId for backward compatibility
  dealId?: string
  playerName: string
  trackVolume: number
  currentStage: PlayerStage
  probability: number
  responsibles: string[]
  status: DealStatus
  createdAt: string
  updatedAt: string
  notes: string
  tags?: Tag[];
  stageEnteredAt?: string; // New field for SLA
  isSynthetic?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  entity_type?: 'deal' | 'track' | 'global' | 'lead' | 'company';
  createdAt?: string;
  createdBy?: string;
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
  status?: 'todo' | 'in_progress' | 'waiting_third_party' | 'blocked' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  isSynthetic?: boolean;
}

export interface Comment {
  id: string
  entityId: string
  entityType: 'deal' | 'track' | 'task' | 'lead' | 'company'
  authorId: string
  // Fallback para código que busca 'author'
  author?: {
    name: string
    avatar?: string
    avatar_url?: string
    avatarBgColor?: string
    avatarTextColor?: string
    avatarBorderColor?: string
  }
  content: string
  createdAt: string
  // Fallback para snake_case
  created_at?: string
  mentions: string[]
  parentId?: string | null
}

// ============================================================================
// NOTIFICATION SYSTEM - EXPANDED TYPES
// ============================================================================

/**
 * Níveis de prioridade para notificações
 * critical: SLA vencido, deadline perdido (vermelho)
 * urgent: SLA em risco, deadline próximo (laranja)
 * high: Lead quente, regressão de status (amarelo)
 * normal: Menção, atribuição, mudança de status (azul)
 * low: Ação em massa, nota interna (cinza)
 */
export type NotificationPriority = 'critical' | 'urgent' | 'high' | 'normal' | 'low';

/**
 * Categorias de notificação para agrupamento e filtros
 */
export type NotificationCategory = 
  | 'mention'      // Menções em comentários
  | 'assignment'   // Atribuições e reatribuições
  | 'status'       // Mudanças de status
  | 'sla'          // Alertas de SLA
  | 'deadline'     // Prazos
  | 'activity'     // Atividades gerais (comentários, notas)
  | 'system'       // Notificações do sistema
  | 'general';     // Outros

/**
 * Tipos de entidade que podem ter notificações
 */
export type NotificationEntityType = 
  | 'lead' 
  | 'deal' 
  | 'track' 
  | 'task' 
  | 'company' 
  | 'contact'
  | 'comment';

/**
 * Tipos específicos de notificação (expandido)
 */
export type NotificationType =
  // Existentes
  | 'mention'
  | 'assignment'
  | 'status_change'
  | 'sla_breach'
  | 'deadline'
  // Novos
  | 'sla_warning'
  | 'deadline_approaching'
  | 'reassignment'
  | 'status_regression'
  | 'hot_lead_assigned'
  | 'new_opportunity'
  | 'thread_reply'
  | 'internal_note'
  | 'bulk_action_complete'
  | 'audit_alert';

/**
 * Interface expandida de Notificação
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
  
  // Novos campos
  priority: NotificationPriority;
  category: NotificationCategory;
  entityId?: string;
  entityType?: NotificationEntityType;
  groupKey?: string;
  metadata?: NotificationMetadata;
  expiresAt?: string;
}

/**
 * Metadata flexível para notificações
 */
export interface NotificationMetadata {
  // Autor da ação
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  
  // Valores para mudanças de status
  oldValue?: string;
  newValue?: string;
  
  // Contagem para agrupamento
  groupCount?: number;
  
  // Entidade relacionada
  entityName?: string;
  
  // Dados extras específicos por tipo
  [key: string]: any;
}

/**
 * Notificação agrupada para exibição no Inbox
 */
export interface GroupedNotification {
  groupKey: string;
  notifications: Notification[];
  latestAt: string;
  unreadCount: number;
  totalCount: number;
  
  // Dados do grupo para exibição
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  entityType?: NotificationEntityType;
  entityId?: string;
  link: string;
}

/**
 * Preferências de notificação do usuário
 */
export interface UserNotificationPreferences {
  id: string;
  userId: string;
  
  // Modo Não Perturbe
  dndEnabled: boolean;
  
  // Preferências por categoria
  prefMention: boolean;
  prefAssignment: boolean;
  prefStatus: boolean;
  prefSla: boolean;
  prefDeadline: boolean;
  prefActivity: boolean;
  prefSystem: boolean;
  
  // Prioridade mínima (null = todas)
  minPriority: NotificationPriority | null;
  
  // Canais (futuro)
  channelInapp: boolean;
  channelEmail: boolean;
  channelPush: boolean;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Input para criar preferências
 */
export interface UserNotificationPreferencesInput {
  dndEnabled?: boolean;
  prefMention?: boolean;
  prefAssignment?: boolean;
  prefStatus?: boolean;
  prefSla?: boolean;
  prefDeadline?: boolean;
  prefActivity?: boolean;
  prefSystem?: boolean;
  minPriority?: NotificationPriority | null;
  channelInapp?: boolean;
  channelEmail?: boolean;
  channelPush?: boolean;
}

// ============================================================================
// NOTIFICATION CONSTANTS & LABELS
// ============================================================================

/**
 * Labels para prioridades
 */
export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  critical: 'Crítica',
  urgent: 'Urgente',
  high: 'Alta',
  normal: 'Normal',
  low: 'Baixa',
};

/**
 * Cores para prioridades (Tailwind classes)
 */
export const NOTIFICATION_PRIORITY_COLORS: Record<NotificationPriority, {
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-950/50',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  urgent: {
    bg: 'bg-orange-100 dark:bg-orange-950/50',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
  high: {
    bg: 'bg-amber-100 dark:bg-amber-950/50',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  normal: {
    bg: 'bg-blue-100 dark:bg-blue-950/50',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  low: {
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
    dot: 'bg-gray-400',
  },
};

/**
 * Labels para categorias
 */
export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  mention: 'Menções',
  assignment: 'Atribuições',
  status: 'Mudanças de Status',
  sla: 'Alertas de SLA',
  deadline: 'Prazos',
  activity: 'Atividades',
  system: 'Sistema',
  general: 'Geral',
};

/**
 * Ícones por categoria (nomes do lucide-react)
 */
export const NOTIFICATION_CATEGORY_ICONS: Record<NotificationCategory, string> = {
  mention: 'MessageCircle',
  assignment: 'UserCircle',
  status: 'RefreshCw',
  sla: 'AlertTriangle',
  deadline: 'Clock',
  activity: 'Activity',
  system: 'Settings',
  general: 'Bell',
};

/**
 * Catálogo completo de tipos de notificação com metadados
 */
export const NOTIFICATION_TYPE_CATALOG: Record<NotificationType, {
  label: string;
  description: string;
  category: NotificationCategory;
  defaultPriority: NotificationPriority;
}> = {
  // Menções
  mention: {
    label: 'Menção em comentário',
    description: 'Alguém marcou você em um comentário',
    category: 'mention',
    defaultPriority: 'normal',
  },
  thread_reply: {
    label: 'Resposta em thread',
    description: 'Alguém respondeu em uma thread que você criou',
    category: 'mention',
    defaultPriority: 'low',
  },
  
  // Atribuições
  assignment: {
    label: 'Atribuição direta',
    description: 'Você foi atribuído como responsável',
    category: 'assignment',
    defaultPriority: 'normal',
  },
  reassignment: {
    label: 'Reatribuição',
    description: 'A responsabilidade foi transferida',
    category: 'assignment',
    defaultPriority: 'normal',
  },
  new_opportunity: {
    label: 'Nova oportunidade',
    description: 'Um novo lead/deal foi criado para você',
    category: 'assignment',
    defaultPriority: 'high',
  },
  hot_lead_assigned: {
    label: 'Lead quente atribuído',
    description: 'Um lead de alta prioridade foi atribuído a você',
    category: 'assignment',
    defaultPriority: 'high',
  },
  
  // Status
  status_change: {
    label: 'Mudança de status',
    description: 'O status de um registro foi alterado',
    category: 'status',
    defaultPriority: 'normal',
  },
  status_regression: {
    label: 'Regressão de status',
    description: 'Um registro voltou para um estágio anterior',
    category: 'status',
    defaultPriority: 'high',
  },
  
  // SLA
  sla_breach: {
    label: 'SLA vencido',
    description: 'O prazo de SLA foi ultrapassado',
    category: 'sla',
    defaultPriority: 'critical',
  },
  sla_warning: {
    label: 'SLA em risco',
    description: 'O prazo de SLA está próximo',
    category: 'sla',
    defaultPriority: 'urgent',
  },
  
  // Deadline
  deadline: {
    label: 'Prazo perdido',
    description: 'Uma data limite foi ultrapassada',
    category: 'deadline',
    defaultPriority: 'critical',
  },
  deadline_approaching: {
    label: 'Prazo se aproximando',
    description: 'Uma data limite está próxima',
    category: 'deadline',
    defaultPriority: 'urgent',
  },
  
  // Atividades
  internal_note: {
    label: 'Nota interna',
    description: 'Uma nota foi adicionada ao seu registro',
    category: 'activity',
    defaultPriority: 'low',
  },
  
  // Sistema
  bulk_action_complete: {
    label: 'Ação em massa concluída',
    description: 'Uma operação em lote foi finalizada',
    category: 'system',
    defaultPriority: 'low',
  },
  audit_alert: {
    label: 'Alerta de auditoria',
    description: 'Uma alteração crítica foi detectada',
    category: 'system',
    defaultPriority: 'high',
  },
};

/**
 * Helper: Obter prioridade padrão de um tipo
 */
export function getDefaultPriorityForType(type: NotificationType): NotificationPriority {
  return NOTIFICATION_TYPE_CATALOG[type]?.defaultPriority || 'normal';
}

/**
 * Helper: Obter categoria de um tipo
 */
export function getCategoryForType(type: NotificationType): NotificationCategory {
  return NOTIFICATION_TYPE_CATALOG[type]?.category || 'general';
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

// Alias for backward compatibility
export type SlaPolicy = SLAConfig

export type PlayerTrackStatus = 'active' | 'cancelled' | 'concluded' | 'on_hold'

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
    userName: string
    activeTracks: number
    activeTasks: number
  }[]
  conversionTrend: {
    period: string
    concluded: number
    cancelled: number
    conversionRate: number
  }[]
  // New relational metrics for BI
  playerEfficiency: {
    name: string
    volume: number
    conversionRate: number
    totalDeals: number
  }[]
  leadOriginPerformance: {
    origin: string
    total: number
    converted: number
    conversionRate: number
    avgTicket: number
  }[]
  productDistribution: {
    type: string
    volume: number
    count: number
  }[]
  dealVelocity: {
    stageName: string
    avgDays: number
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
  entityType: 'deal' | 'track' | 'task' | 'lead'
  title: string
  description: string
  startTime: string
  endTime: string
  attendees: string[]
  synced: boolean
  createdAt: string
}

export const STATUS_LABELS: Record<DealStatus, string> = {
  active: 'Ativo',
  cancelled: 'Cancelado',
  concluded: 'Concluído',
  on_hold: 'Em Espera'
}

export const STAGE_LABELS: Record<string, string> = {
  nda: 'NDA',
  tease: 'Teaser',
  offer: 'Oferta',
  diligence: 'Diligência',
  closing: 'Fechamento'
}

export const STAGE_PROBABILITIES: Record<string, number> = {
  nda: 10,
  tease: 25,
  offer: 50,
  diligence: 75,
  closing: 95
}

export const OPERATION_LABELS: Record<OperationType, string> = {
  ccb: 'CCB',
  cri_land: 'CRI Terreno',
  cri_construction: 'CRI Construção',
  cri_corporate: 'CRI Corporativo',
  debt_construction: 'Plano Empresário',
  receivables_advance: 'Antecipação de Recebíveis',
  working_capital: 'Capital de Giro',
  built_to_suit: 'Built to Suit',
  preferred_equity: 'Equity Preferencial',
  repurchase: 'Retrovenda',
  sale_and_lease_back: 'Sale & Leaseback',
  inventory_purchase: 'Compra de Estoque',
  financial_swap: 'Permuta Financeira',
  physical_swap: 'Permuta Física',
  hybrid_swap: 'Permuta Híbrida'
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

export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'url' | 'email'

export interface CustomFieldDefinition {
  id: string
  name: string
  key: string
  type: CustomFieldType
  entityType: 'deal' | 'track' | 'task' | 'lead'
  required: boolean
  options?: string[]
  defaultValue?: any
  placeholder?: string
  helpText?: string
  createdAt: string
  createdBy: string
  position: number
}

export interface CustomFieldValue {
  id: string
  fieldDefinitionId: string
  entityId: string
  entityType: 'deal' | 'track' | 'task' | 'lead'
  value: any
  updatedAt: string
  updatedBy: string
}

export interface Folder {
  id: string
  name: string
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  createdAt: string;
  createdBy: string;
  type: 'project' | 'team' | 'sprint' | 'category' | 'custom'
  position: number
}

export interface EntityLocation {
  id: string
  entityId: string
  entityType: 'deal' | 'track' | 'task' | 'lead'
  folderId: string
  isPrimary: boolean
  addedAt: string
  addedBy: string
}

export type QuestionPriority = 'low' | 'medium' | 'high' | 'urgent'
export type QuestionStatus = 'open' | 'answered' | 'closed'

export interface Question {
  id: string
  entityId: string
  entityType: 'deal' | 'track'
  title: string
  content: string
  category?: string;
  priority: QuestionPriority
  status: QuestionStatus
  askedBy: string
  createdAt: string
  updatedAt: string
}

export interface Answer {
  id: string
  questionId: string
  content: string
  isInternal: boolean
  answeredBy: string
  createdAt: string
  updatedAt: string
}

// --- TIPOS DO PLAYER ---

export type PlayerType = 'bank' | 'asset_manager' | 'securitizer' | 'family_office' | 'other' | 'fund';

export type AssetManagerType = 
  | 'fii_tijolo' | 'fii_papel' | 'fii_hibrido' 
  | 'fidc' | 'fiagro' | 'multimercado' | 'fip';

export type RelationshipLevel = 'none' | 'basic' | 'intermediate' | 'close';

export type ProductType = 'credit' | 'equity' | 'barter';

export type CreditSubtype = 
  | 'ccb' | 'cri_terreno' | 'cri_obra' | 'cri_corporativo' 
  | 'plano_empresario' | 'antecipacao' | 'kgiro' | 'bts';

export type EquitySubtype = 
  | 'equity_pref' | 'retrovenda' | 'slb' | 'compra_estoque';

export type BarterSubtype = 
  | 'financeira' | 'fisica' | 'hibrida';

export interface PlayerProductCapabilities {
  credit?: CreditSubtype[];
  equity?: EquitySubtype[];
  barter?: BarterSubtype[];
}

export type BuyingRole = 'decision_maker' | 'influencer' | 'blocker' | 'champion' | 'user' | 'gatekeeper';
export type ContactSentiment = 'positive' | 'neutral' | 'negative' | 'unknown';

export interface Contact {
  id: string;
  companyId: string | null;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  linkedin?: string;
  notes?: string;
  isPrimary: boolean;

  buyingRole?: BuyingRole;
  sentiment?: ContactSentiment;

  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  isSynthetic?: boolean;
}

// Alias legacy for backward compatibility during refactor
export type PlayerContact = Contact & { playerId?: string };

export interface Player {
  id: string;
  name: string;
  cnpj?: string;
  site?: string;
  description?: string;
  logoUrl?: string;
  
  type: PlayerType;
  gestoraTypes?: AssetManagerType[]; 
  relationshipLevel: RelationshipLevel;
  products: PlayerProductCapabilities;
  
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  deletedAt?: string;
  isSynthetic: boolean;
  
  // NOVO CAMPO RELACIONAL
  categoryId?: string;
  category?: PlayerCategory;

  contacts?: Contact[];
  creator?: { name: string };
  primaryContact?: Contact;
}

export const PLAYER_TYPE_LABELS: Record<PlayerType, string> = {
  bank: 'Banco',
  asset_manager: 'Gestora',
  securitizer: 'Securitizadora',
  family_office: 'Family Office',
  other: 'Outro',
  fund: 'Fundo'
};

export const ASSET_MANAGER_TYPE_LABELS: Record<AssetManagerType, string> = {
  fii_tijolo: 'FII Tijolo',
  fii_papel: 'FII Papel',
  fii_hibrido: 'FII Híbrido',
  fidc: 'FIDC',
  fiagro: 'FIAGRO',
  multimercado: 'Multimercado',
  fip: 'FIP'
};

// Note: RELATIONSHIP_LEVEL_LABELS has been migrated to metadata system.
// Use useSystemMetadata() hook to get relationship levels dynamically from the database.
// See src/contexts/SystemMetadataContext.tsx and src/hooks/useSystemMetadata.ts

export const PRODUCT_LABELS: Record<ProductType, string> = {
  credit: 'Crédito',
  equity: 'Equity',
  barter: 'Permuta'
};

export const CREDIT_SUBTYPE_LABELS: Record<CreditSubtype, string> = {
  ccb: 'CCB Pura',
  cri_terreno: 'CRI Terreno',
  cri_obra: 'CRI Obra',
  cri_corporativo: 'CRI Corporativo',
  plano_empresario: 'Plano Empresário',
  antecipacao: 'Antecipação de Recebíveis',
  kgiro: 'KGiro',
  bts: 'Built to Suit'
};

export const EQUITY_SUBTYPE_LABELS: Record<EquitySubtype, string> = {
  equity_pref: 'Equity Preferencial',
  retrovenda: 'Retrovenda',
  slb: 'Sale and Lease Back',
  compra_estoque: 'Compra de Estoque'
};

export const BARTER_SUBTYPE_LABELS: Record<BarterSubtype, string> = {
  financeira: 'Permuta Financeira',
  fisica: 'Permuta Física',
  hibrida: 'Permuta Híbrida'
};

export const ALL_PRODUCT_LABELS: Record<string, string> = {
  ...CREDIT_SUBTYPE_LABELS,
  ...EQUITY_SUBTYPE_LABELS,
  ...BARTER_SUBTYPE_LABELS
};

export type CompanyType = 
  | 'incorporadora' 
  | 'construtora' 
  | 'assessor_juridico' 
  | 'agente_fiduciario' 
  | 'servicer' 
  | 'outros'
  | 'corporation' | 'fund' | 'startup' | 'advisor' | 'other'; // Added new types from migration

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  site?: string;
  description?: string;
  type: CompanyType;
  relationshipLevel: RelationshipLevel;
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  deletedAt?: string;
  
  deals?: MasterDeal[];
  contacts?: Contact[];
  
  dealsCount?: number; 
  primaryContactName?: string;
  isSynthetic?: boolean;
}

// Note: COMPANY_TYPE_LABELS has been migrated to metadata system.
// Use useSystemMetadata() hook to get company types dynamically from the database.
// See src/contexts/SystemMetadataContext.tsx and src/hooks/useSystemMetadata.ts

// -- Permissões e Roles (RBAC Dinâmico) --
export interface Permission {
  id: string;
  code: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions?: Permission[]; 
}

// === LEADS ===

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'disqualified';
export type LeadOrigin = 'inbound' | 'outbound' | 'referral' | 'event' | 'other';
export type LeadPriorityBucket = 'hot' | 'warm' | 'cold';

export interface LeadNextAction {
  label?: string;
  reason?: string;
  dueAt?: string;
}

export interface Lead {
  id: string;
  legalName: string;
  tradeName?: string;
  cnpj?: string;
  website?: string;
  segment?: string;
  addressCity?: string;
  addressState?: string;
  description?: string;

  operationType?: OperationType;

  leadStatusId: string;
  leadOriginId: string;
  ownerUserId?: string;
  // Populated for UI convenience
  owner?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };

  qualifiedAt?: string;
  qualifiedCompanyId?: string;
  qualifiedMasterDealId?: string;

  createdAt: string;
  updatedAt: string;
  createdBy: string;

  priorityBucket?: LeadPriorityBucket;
  priorityScore?: number;
  priorityDescription?: string;
  lastInteractionAt?: string;
  daysWithoutInteraction?: number;
  nextAction?: LeadNextAction;

  contacts?: Contact[];
  members?: LeadMember[];
  isSynthetic?: boolean;
}

export interface LeadMember {
  leadId: string;
  userId: string;
  role: 'owner' | 'collaborator' | 'watcher';
  addedAt: string;
  user?: User; // Joined
}

// Note: LEAD_STATUS_LABELS and LEAD_ORIGIN_LABELS have been migrated to metadata system.
// Use useSystemMetadata() hook to get lead statuses and origins dynamically from the database.
// See src/contexts/SystemMetadataContext.tsx and src/hooks/useSystemMetadata.ts

/**
 * LEAD_STATUS_PROGRESS: Progress percentage for each lead status.
 * This is a UI-only constant used for visual representation (progress bars, etc.).
 * 
 * TODO: This constant is a temporary bridge until the metadata schema supports 'progress' field.
 * Once the lead_statuses table has a 'progress' column, this should be migrated to metadata.
 */
export const LEAD_STATUS_PROGRESS: Record<LeadStatus, number> = {
  new: 15,
  contacted: 45,
  qualified: 100,
  disqualified: 0,
};

/**
 * LEAD_STATUS_COLORS: Tailwind CSS color classes for each lead status.
 * This is a UI-only constant used for visual representation (badges, progress bars, etc.).
 * 
 * TODO: This constant is a temporary bridge until the metadata schema supports 'color' field.
 * Once the lead_statuses table has a 'color' column, this should be migrated to metadata.
 * 
 * Helper functions can be created to encapsulate these values:
 * - getLeadStatusProgress(code: LeadStatus): number
 * - getLeadStatusColor(code: LeadStatus): string
 */
export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-amber-500',
  qualified: 'bg-emerald-500',
  disqualified: 'bg-rose-500',
};

/**
 * Helper function to get progress percentage for a lead status.
 * @param code - The lead status code
 * @returns Progress percentage (0-100)
 */
export function getLeadStatusProgress(code: LeadStatus): number {
  return LEAD_STATUS_PROGRESS[code] ?? 0;
}

/**
 * Helper function to get Tailwind CSS color class for a lead status.
 * @param code - The lead status code
 * @returns Tailwind CSS color class (e.g., 'bg-blue-500')
 */
export function getLeadStatusColor(code: LeadStatus): string {
  return LEAD_STATUS_COLORS[code] ?? 'bg-gray-500';
}

// ============================================================================
// TIMELINE PREFERENCES
// ============================================================================

export type TimelineEventType =
  | 'status_change'
  | 'comments'
  | 'mentions'
  | 'assignment'
  | 'task_completed'
  | 'notes'
  | 'file_upload'
  | 'priority_change'   // FUTURO
  | 'contact_associated' // FUTURO
  | 'loss_reason'       // FUTURO
  | 'calendar_event';   // FUTURO

export interface TimelinePreferences {
  enabledEvents: Record<TimelineEventType, boolean>;
  eventColors: Record<TimelineEventType, string>;
}

export interface UserPreferences {
  timeline?: TimelinePreferences;
  notifications?: Record<string, any>;
  dashboard?: Record<string, any>;
}
