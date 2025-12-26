import type { LeadPriorityConfig } from '@/types/metadata'

/**
 * Default lead priority configuration
 * Used as fallback when no configuration exists in system_settings
 */
export const DEFAULT_LEAD_PRIORITY_CONFIG: LeadPriorityConfig = {
  thresholds: {
    hot: 70,
    warm: 40
  },
  scoring: {
    recencyMaxPoints: 40,
    staleDays: 30,
    upcomingMeetingPoints: 20,
    minScore: 0,
    maxScore: 100
  },
  descriptions: {
    hot: 'Lead com alta prioridade, requer atenção imediata',
    warm: 'Lead com prioridade média, acompanhamento regular',
    cold: 'Lead com baixa prioridade, monitoramento passivo'
  }
}

/**
 * Parse and validate lead priority configuration from system_settings
 * @param value - Raw value from system_settings.lead_priority_config
 * @returns Validated LeadPriorityConfig or default config if invalid
 */
export function parseLeadPriorityConfig(value: any): LeadPriorityConfig {
  // Return default if value is null/undefined
  if (!value || typeof value !== 'object') {
    return DEFAULT_LEAD_PRIORITY_CONFIG
  }

  try {
    // Validate and extract thresholds
    const thresholds = {
      hot: typeof value.thresholds?.hot === 'number' ? value.thresholds.hot : DEFAULT_LEAD_PRIORITY_CONFIG.thresholds.hot,
      warm: typeof value.thresholds?.warm === 'number' ? value.thresholds.warm : DEFAULT_LEAD_PRIORITY_CONFIG.thresholds.warm
    }

    // Validate and extract scoring
    const scoring = {
      recencyMaxPoints: typeof value.scoring?.recencyMaxPoints === 'number' ? value.scoring.recencyMaxPoints : DEFAULT_LEAD_PRIORITY_CONFIG.scoring.recencyMaxPoints,
      staleDays: typeof value.scoring?.staleDays === 'number' ? value.scoring.staleDays : DEFAULT_LEAD_PRIORITY_CONFIG.scoring.staleDays,
      upcomingMeetingPoints: typeof value.scoring?.upcomingMeetingPoints === 'number' ? value.scoring.upcomingMeetingPoints : DEFAULT_LEAD_PRIORITY_CONFIG.scoring.upcomingMeetingPoints,
      minScore: typeof value.scoring?.minScore === 'number' ? value.scoring.minScore : DEFAULT_LEAD_PRIORITY_CONFIG.scoring.minScore,
      maxScore: typeof value.scoring?.maxScore === 'number' ? value.scoring.maxScore : DEFAULT_LEAD_PRIORITY_CONFIG.scoring.maxScore
    }

    // Validate and extract descriptions
    const descriptions = {
      hot: typeof value.descriptions?.hot === 'string' ? value.descriptions.hot : DEFAULT_LEAD_PRIORITY_CONFIG.descriptions.hot,
      warm: typeof value.descriptions?.warm === 'string' ? value.descriptions.warm : DEFAULT_LEAD_PRIORITY_CONFIG.descriptions.warm,
      cold: typeof value.descriptions?.cold === 'string' ? value.descriptions.cold : DEFAULT_LEAD_PRIORITY_CONFIG.descriptions.cold
    }

    return { thresholds, scoring, descriptions }
  } catch (error) {
    console.warn('Failed to parse lead priority config, using default:', error)
    return DEFAULT_LEAD_PRIORITY_CONFIG
  }
}

/**
 * Validate lead priority configuration
 * @param config - Configuration to validate
 * @returns Validation result with errors if any
 */
export function validateLeadPriorityConfig(config: LeadPriorityConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate thresholds
  if (config.thresholds.hot <= config.thresholds.warm) {
    errors.push('Threshold "hot" deve ser maior que "warm"')
  }
  if (config.thresholds.warm < 0 || config.thresholds.hot < 0) {
    errors.push('Thresholds devem ser não-negativos')
  }
  if (config.thresholds.hot > 100 || config.thresholds.warm > 100) {
    errors.push('Thresholds não podem exceder 100')
  }

  // Validate scoring
  if (config.scoring.recencyMaxPoints < 0 || config.scoring.recencyMaxPoints > 100) {
    errors.push('recencyMaxPoints deve estar entre 0 e 100')
  }
  if (config.scoring.staleDays <= 0) {
    errors.push('staleDays deve ser positivo')
  }
  if (config.scoring.upcomingMeetingPoints < 0 || config.scoring.upcomingMeetingPoints > 100) {
    errors.push('upcomingMeetingPoints deve estar entre 0 e 100')
  }
  if (config.scoring.minScore < 0 || config.scoring.maxScore < 0) {
    errors.push('Scores mínimo e máximo devem ser não-negativos')
  }
  if (config.scoring.minScore >= config.scoring.maxScore) {
    errors.push('minScore deve ser menor que maxScore')
  }

  // Validate descriptions
  if (!config.descriptions.hot.trim()) {
    errors.push('Descrição de "hot" é obrigatória')
  }
  if (!config.descriptions.warm.trim()) {
    errors.push('Descrição de "warm" é obrigatória')
  }
  if (!config.descriptions.cold.trim()) {
    errors.push('Descrição de "cold" é obrigatória')
  }

  return { valid: errors.length === 0, errors }
}
