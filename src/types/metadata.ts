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
 * System Metadata loaded at application startup
 */
export interface SystemMetadata {
  stages: Stage[]
  operationTypes: OperationType[]
  lossReasons: LossReason[]
  settings: SystemSettings[]
}

/**
 * Entity types for label resolution
 */
export type EntityType = 'stage' | 'operation' | 'status' | 'lossReason'

/**
 * Date filter options supported by the system
 */
export type DateFilterType = 'today' | '7d' | '30d' | '90d' | '1y' | 'ytd' | 'all'
