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
  has_completed_onboarding?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PipelineStage {
  id: string
  pipelineId: string | null
  name: string
  color: string
  stageOrder: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface MasterDeal {
  id: string
  clientName: string
  volume: number
  operationType: OperationType
  // CAMPO NOVO:
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
  status?: 'todo' | 'in_progress' | 'blocked' | 'completed'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
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

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso total ao sistema. Pode gerenciar usuários, configurações, integrações e exportar dados. Tem permissão para criar, editar e excluir negócios.',
  analyst: 'Pode criar e editar negócios, visualizar analytics, atribuir tarefas e ver nomes reais de players. Não pode gerenciar usuários ou configurações do sistema.',
  client: 'Acesso restrito para clientes externos. Visualiza nomes de players de forma anonimizada (Player A, Player B, etc.) e tem acesso limitado aos dados.',
  newbusiness: 'Equipe de novos negócios com acesso a todos os dados e nomes reais de players. Pode visualizar analytics mas não pode criar ou editar negócios.',
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
  entityType: 'deal' | 'track' | 'task'
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
  entityType: 'deal' | 'track' | 'task'
  value: any
  updatedAt: string
  updatedBy: string
}

export interface Folder {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  parentId?: string
  createdAt: string
  createdBy: string
  type: 'project' | 'team' | 'sprint' | 'category' | 'custom'
  position: number
}

export interface EntityLocation {
  id: string
  entityId: string
  entityType: 'deal' | 'track' | 'task'
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
  category?: string
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

export type PlayerType = 'bank' | 'asset_manager' | 'securitizer' | 'family_office' | 'other';

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

export interface PlayerContact {
  id: string;
  playerId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Player {
  id: string;
  name: string;
  cnpj?: string;
  site?: string;
  description?: string;
  logoUrl?: string;
  
  // Novos Campos
  type: PlayerType;
  gestoraTypes?: AssetManagerType[]; // Apenas se type === 'asset_manager'
  relationshipLevel: RelationshipLevel;
  products: PlayerProductCapabilities;
  
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  deletedAt?: string;
  isSynthetic: boolean;
  
  contacts?: PlayerContact[]; // Join opcional
  creator?: { name: string };
  primaryContact?: PlayerContact; // Contato principal para listagem
}

// --- LABELS (Para UI) ---

export const PLAYER_TYPE_LABELS: Record<PlayerType, string> = {
  bank: 'Banco',
  asset_manager: 'Gestora',
  securitizer: 'Securitizadora',
  family_office: 'Family Office',
  other: 'Outro'
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

export const RELATIONSHIP_LEVEL_LABELS: Record<RelationshipLevel, string> = {
  none: 'Nenhum',
  basic: 'Básico',
  intermediate: 'Intermediário',
  close: 'Próximo'
};

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

// ATUALIZADO AQUI
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

// ... tipos existentes

// --- EMPRESAS (CLIENTES) ---

export type CompanyType = 
  | 'incorporadora' 
  | 'construtora' 
  | 'assessor_juridico' 
  | 'agente_fiduciario' 
  | 'servicer' 
  | 'outros';

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  site?: string;
  description?: string;
  type: CompanyType;
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  deletedAt?: string;
  
  // Relações (Joins)
  deals?: MasterDeal[];
  contacts?: PlayerContact[]; // Reutilizando a estrutura de contatos se for usar a mesma tabela ou criar uma nova
}

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  incorporadora: 'Incorporadora',
  construtora: 'Construtora',
  assessor_juridico: 'Assessor Jurídico',
  agente_fiduciario: 'Agente Fiduciário',
  servicer: 'Servicer',
  outros: 'Outros'
};

// Atualizar MasterDeal para incluir o vínculo
export interface MasterDeal {
  // ... campos existentes
  companyId?: string;
  company?: Company; // Para quando fizermos o join
}