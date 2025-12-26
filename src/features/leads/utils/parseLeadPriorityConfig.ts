import type { LeadPriorityConfig } from '@/types/metadata'

/**
 * Default configuration for lead priority calculation
 * Aligned with backend defaults (70/40 thresholds)
 */
const DEFAULT_CONFIG: LeadPriorityConfig = {
  thresholds: {
    hot: 70,
    warm: 40
  },
  scoring: {
    recencyMaxPoints: 40,
    staleDays: 30,
    upcomingMeetingPoints: 10,
    minScore: 0,
    maxScore: 100
  },
  descriptions: {
    hot: 'Lead quente - interação recente, alta probabilidade de conversão',
    warm: 'Lead morno - necessita acompanhamento',
    cold: 'Lead frio - sem interação recente'
  }
}

/**
 * Parses and validates lead_priority_config from system settings
 * @param raw - Raw configuration value from system_settings table
 * @returns Validated LeadPriorityConfig with defaults for missing values
 */
export function parseLeadPriorityConfig(raw: any): LeadPriorityConfig {
  // If no config provided, use defaults
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_CONFIG
  }

  // Parse with fallbacks to defaults
  return {
    thresholds: {
      hot: typeof raw.thresholds?.hot === 'number' 
        ? raw.thresholds.hot 
        : DEFAULT_CONFIG.thresholds.hot,
      warm: typeof raw.thresholds?.warm === 'number' 
        ? raw.thresholds.warm 
        : DEFAULT_CONFIG.thresholds.warm
    },
    scoring: {
      recencyMaxPoints: typeof raw.scoring?.recencyMaxPoints === 'number'
        ? raw.scoring.recencyMaxPoints
        : DEFAULT_CONFIG.scoring.recencyMaxPoints,
      staleDays: typeof raw.scoring?.staleDays === 'number'
        ? raw.scoring.staleDays
        : DEFAULT_CONFIG.scoring.staleDays,
      upcomingMeetingPoints: typeof raw.scoring?.upcomingMeetingPoints === 'number'
        ? raw.scoring.upcomingMeetingPoints
        : DEFAULT_CONFIG.scoring.upcomingMeetingPoints,
      minScore: typeof raw.scoring?.minScore === 'number'
        ? raw.scoring.minScore
        : DEFAULT_CONFIG.scoring.minScore,
      maxScore: typeof raw.scoring?.maxScore === 'number'
        ? raw.scoring.maxScore
        : DEFAULT_CONFIG.scoring.maxScore
    },
    descriptions: {
      hot: typeof raw.descriptions?.hot === 'string'
        ? raw.descriptions.hot
        : DEFAULT_CONFIG.descriptions.hot,
      warm: typeof raw.descriptions?.warm === 'string'
        ? raw.descriptions.warm
        : DEFAULT_CONFIG.descriptions.warm,
      cold: typeof raw.descriptions?.cold === 'string'
        ? raw.descriptions.cold
        : DEFAULT_CONFIG.descriptions.cold
    }
  }
}
