import { PlayerStage, PlayerTrack, MasterDeal } from './types'

export type ValidationOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_filled' | 'is_empty'

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean'

export interface FieldCondition {
  id: string
  fieldName: string
  fieldType: FieldType
  operator: ValidationOperator
  value?: any
  label: string
}

export interface PhaseTransitionRule {
  id: string
  fromStage: PlayerStage | 'any'
  toStage: PlayerStage
  conditions: FieldCondition[]
  requireAll: boolean
  errorMessage?: string
  enabled: boolean
  createdAt: string
  createdBy: string
}

export interface ValidationResult {
  isValid: boolean
  failedConditions: FieldCondition[]
  errorMessage: string
}

export const AVAILABLE_FIELDS: Record<string, { label: string; type: FieldType; path: string }> = {
  'track.playerName': { label: 'Nome do Player', type: 'text', path: 'playerName' },
  'track.trackVolume': { label: 'Volume da Negociação', type: 'number', path: 'trackVolume' },
  'track.probability': { label: 'Probabilidade (%)', type: 'number', path: 'probability' },
  'track.responsibles': { label: 'Responsáveis', type: 'select', path: 'responsibles' },
  'track.notes': { label: 'Observações do Track', type: 'text', path: 'notes' },
  'deal.volume': { label: 'Volume do Deal Master', type: 'number', path: 'volume' },
  'deal.operationType': { label: 'Tipo de Operação', type: 'select', path: 'operationType' },
  'deal.observations': { label: 'Observações do Deal', type: 'text', path: 'observations' },
}

export const OPERATORS_BY_TYPE: Record<FieldType, ValidationOperator[]> = {
  text: ['is_filled', 'is_empty', 'contains', 'equals', 'not_equals'],
  number: ['is_filled', 'is_empty', 'equals', 'not_equals', 'greater_than', 'less_than'],
  date: ['is_filled', 'is_empty', 'greater_than', 'less_than'],
  select: ['is_filled', 'is_empty', 'equals', 'not_equals'],
  boolean: ['equals', 'not_equals'],
}

export const OPERATOR_LABELS: Record<ValidationOperator, string> = {
  equals: 'é igual a',
  not_equals: 'é diferente de',
  greater_than: 'é maior que',
  less_than: 'é menor que',
  contains: 'contém',
  is_filled: 'está preenchido',
  is_empty: 'está vazio',
}

function getFieldValue(track: PlayerTrack, deal: MasterDeal | undefined, fieldPath: string): any {
  if (fieldPath.startsWith('deal.') && deal) {
    const key = fieldPath.replace('deal.', '') as keyof MasterDeal
    return deal[key]
  } else if (fieldPath.startsWith('track.')) {
    const key = fieldPath.replace('track.', '') as keyof PlayerTrack
    return track[key]
  }
  return undefined
}

function evaluateCondition(condition: FieldCondition, value: any): boolean {
  switch (condition.operator) {
    case 'is_filled':
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') return value.trim().length > 0
      return value !== null && value !== undefined && value !== ''
    
    case 'is_empty':
      if (Array.isArray(value)) return value.length === 0
      if (typeof value === 'string') return value.trim().length === 0
      return value === null || value === undefined || value === ''
    
    case 'equals':
      return value === condition.value
    
    case 'not_equals':
      return value !== condition.value
    
    case 'greater_than':
      return Number(value) > Number(condition.value)
    
    case 'less_than':
      return Number(value) < Number(condition.value)
    
    case 'contains':
      if (typeof value === 'string') {
        return value.toLowerCase().includes(String(condition.value).toLowerCase())
      }
      if (Array.isArray(value)) {
        return value.includes(condition.value)
      }
      return false
    
    default:
      return false
  }
}

export function validatePhaseTransition(
  track: PlayerTrack,
  deal: MasterDeal | undefined,
  targetStage: PlayerStage,
  rules: PhaseTransitionRule[]
): ValidationResult {
  const applicableRules = rules.filter(
    rule => rule.enabled && 
    (rule.fromStage === 'any' || rule.fromStage === track.currentStage) &&
    rule.toStage === targetStage
  )

  if (applicableRules.length === 0) {
    return {
      isValid: true,
      failedConditions: [],
      errorMessage: '',
    }
  }

  const allFailedConditions: FieldCondition[] = []
  const errorMessages: string[] = []

  for (const rule of applicableRules) {
    const failedConditions: FieldCondition[] = []

    for (const condition of rule.conditions) {
      const fieldConfig = AVAILABLE_FIELDS[condition.fieldName]
      if (!fieldConfig) continue

      const value = getFieldValue(track, deal, fieldConfig.path)
      const isConditionMet = evaluateCondition(condition, value)

      if (!isConditionMet) {
        failedConditions.push(condition)
      }
    }

    if (rule.requireAll && failedConditions.length > 0) {
      allFailedConditions.push(...failedConditions)
      errorMessages.push(rule.errorMessage || 'Requisitos não atendidos')
    } else if (!rule.requireAll && failedConditions.length === rule.conditions.length) {
      allFailedConditions.push(...failedConditions)
      errorMessages.push(rule.errorMessage || 'Nenhum requisito atendido')
    }
  }

  if (allFailedConditions.length > 0) {
    return {
      isValid: false,
      failedConditions: allFailedConditions,
      errorMessage: errorMessages[0] || 'Não é possível avançar para esta fase',
    }
  }

  return {
    isValid: true,
    failedConditions: [],
    errorMessage: '',
  }
}

export function formatConditionDescription(condition: FieldCondition): string {
  const field = AVAILABLE_FIELDS[condition.fieldName]
  const operator = OPERATOR_LABELS[condition.operator]
  
  if (condition.operator === 'is_filled' || condition.operator === 'is_empty') {
    return `${field?.label || condition.fieldName} ${operator}`
  }
  
  return `${field?.label || condition.fieldName} ${operator} "${condition.value}"`
}