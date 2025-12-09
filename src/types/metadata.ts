/**
 * Type definitions for system metadata loaded from database
 * These types replace hardcoded values and magic strings throughout the application
 */

export interface Stage {
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

export interface OperationType {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LossReason {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
}

export interface SystemSettings {
  key: string
  value: any
  description?: string
  updatedAt: string
  updatedBy: string
}

/**
 * Deal status metadata from deal_statuses table
 */
export interface DealStatusMeta {
  id: string
  code: string
  label: string
  color?: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

/**
 * Relationship level metadata from company_relationship_levels table
 */
export interface RelationshipLevelMeta {
  id: string
  code: string
  label: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

/**
 * Company type metadata from company_types table
 */
export interface CompanyTypeMeta {
  id: string
  code: string
  label: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

/**
 * Lead status metadata from lead_statuses table
 */
export interface LeadStatusMeta {
  id: string
  code: string
  label: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

/**
 * Lead origin metadata from lead_origins table
 */
export interface LeadOriginMeta {
  id: string
  code: string
  label: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

/**
 * Lead member role metadata from lead_member_roles table
 */
export interface LeadMemberRoleMeta {
  id: string
  code: string
  label: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

/**
 * User role metadata from user_role_metadata table
 */
export interface UserRoleMetadata {
  id: string
  code: string
  label: string
  description?: string
  badgeVariant?: string
  permissions: string[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/**
 * System Metadata loaded at application startup
 */
export interface SystemMetadata {
  stages: Stage[]
  operationTypes: OperationType[]
  lossReasons: LossReason[]
  settings: SystemSettings[]
  dealStatuses: DealStatusMeta[]
  relationshipLevels: RelationshipLevelMeta[]
  companyTypes: CompanyTypeMeta[]
  leadStatuses: LeadStatusMeta[]
  leadOrigins: LeadOriginMeta[]
  leadMemberRoles: LeadMemberRoleMeta[]
  userRoleMetadata: UserRoleMetadata[]
}

/**
 * Entity types for label resolution
 */
export type EntityType = 'stage' | 'operation' | 'status' | 'lossReason'

/**
 * Date filter options supported by the system
 */
export type DateFilterType = 'today' | '7d' | '30d' | '90d' | '1y' | 'ytd' | 'all'
