export type UserRole = 'admin' | 'analyst' | 'client' | 'newbusiness'

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
  isSynthetic?: boolean
  preferences?: Record<string, any> // User specific UI preferences
}

export interface PipelineStage {
  id: string
  pipelineId: string | null
  name: string
  color: string
  stageOrder: number
  probability: number
  isDefault: boolean
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
  company?: Company;

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
  }
  content: string
  createdAt: string
  // Fallback para snake_case
  created_at?: string
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
  createdAt: string;
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

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  incorporadora: 'Incorporadora',
  construtora: 'Construtora',
  assessor_juridico: 'Assessor Jurídico',
  agente_fiduciario: 'Agente Fiduciário',
  servicer: 'Servicer',
  outros: 'Outros',
  corporation: 'Corporação',
  fund: 'Fundo',
  startup: 'Startup',
  advisor: 'Advisor',
  other: 'Outro'
};

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

  status: LeadStatus;
  origin: LeadOrigin;
  ownerUserId?: string;

  qualifiedAt?: string;
  qualifiedCompanyId?: string;
  qualifiedMasterDealId?: string;

  createdAt: string;
  updatedAt: string;
  createdBy: string;

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

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  qualified: 'Qualificado',
  disqualified: 'Desqualificado'
};

export const LEAD_STATUS_PROGRESS: Record<LeadStatus, number> = {
  new: 15,
  contacted: 45,
  qualified: 100,
  disqualified: 0,
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-amber-500',
  qualified: 'bg-emerald-500',
  disqualified: 'bg-rose-500',
};

export const LEAD_ORIGIN_LABELS: Record<LeadOrigin, string> = {
  inbound: 'Inbound',
  outbound: 'Outbound',
  referral: 'Indicação',
  event: 'Evento',
  other: 'Outro'
};
