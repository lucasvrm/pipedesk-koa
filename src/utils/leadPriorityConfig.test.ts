import { describe, it, expect } from 'vitest'
import {
  parseLeadPriorityConfig,
  validateLeadPriorityConfig,
  DEFAULT_LEAD_PRIORITY_CONFIG
} from '@/utils/leadPriorityConfig'

describe('leadPriorityConfig', () => {
  describe('parseLeadPriorityConfig', () => {
    it('should return default config when value is null', () => {
      const result = parseLeadPriorityConfig(null)
      expect(result).toEqual(DEFAULT_LEAD_PRIORITY_CONFIG)
    })

    it('should return default config when value is undefined', () => {
      const result = parseLeadPriorityConfig(undefined)
      expect(result).toEqual(DEFAULT_LEAD_PRIORITY_CONFIG)
    })

    it('should return default config when value is not an object', () => {
      const result = parseLeadPriorityConfig('invalid')
      expect(result).toEqual(DEFAULT_LEAD_PRIORITY_CONFIG)
    })

    it('should parse valid config correctly', () => {
      const validConfig = {
        thresholds: { hot: 80, warm: 50 },
        scoring: {
          recencyMaxPoints: 35,
          staleDays: 25,
          upcomingMeetingPoints: 15,
          minScore: 5,
          maxScore: 95
        },
        descriptions: {
          hot: 'Custom hot description',
          warm: 'Custom warm description',
          cold: 'Custom cold description'
        }
      }

      const result = parseLeadPriorityConfig(validConfig)
      expect(result).toEqual(validConfig)
    })

    it('should use default values for missing fields', () => {
      const partialConfig = {
        thresholds: { hot: 80 }
      }

      const result = parseLeadPriorityConfig(partialConfig)
      expect(result.thresholds.hot).toBe(80)
      expect(result.thresholds.warm).toBe(DEFAULT_LEAD_PRIORITY_CONFIG.thresholds.warm)
      expect(result.scoring).toEqual(DEFAULT_LEAD_PRIORITY_CONFIG.scoring)
      expect(result.descriptions).toEqual(DEFAULT_LEAD_PRIORITY_CONFIG.descriptions)
    })
  })

  describe('validateLeadPriorityConfig', () => {
    it('should validate default config as valid', () => {
      const result = validateLeadPriorityConfig(DEFAULT_LEAD_PRIORITY_CONFIG)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject when hot threshold is not greater than warm', () => {
      const invalidConfig = {
        ...DEFAULT_LEAD_PRIORITY_CONFIG,
        thresholds: { hot: 40, warm: 70 }
      }

      const result = validateLeadPriorityConfig(invalidConfig)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Threshold "hot" deve ser maior que "warm"')
    })

    it('should reject negative thresholds', () => {
      const invalidConfig = {
        ...DEFAULT_LEAD_PRIORITY_CONFIG,
        thresholds: { hot: -10, warm: -20 }
      }

      const result = validateLeadPriorityConfig(invalidConfig)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('não-negativos'))).toBe(true)
    })

    it('should reject thresholds above 100', () => {
      const invalidConfig = {
        ...DEFAULT_LEAD_PRIORITY_CONFIG,
        thresholds: { hot: 150, warm: 40 }
      }

      const result = validateLeadPriorityConfig(invalidConfig)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('não podem exceder 100'))).toBe(true)
    })

    it('should reject when minScore >= maxScore', () => {
      const invalidConfig = {
        ...DEFAULT_LEAD_PRIORITY_CONFIG,
        scoring: {
          ...DEFAULT_LEAD_PRIORITY_CONFIG.scoring,
          minScore: 100,
          maxScore: 50
        }
      }

      const result = validateLeadPriorityConfig(invalidConfig)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('minScore deve ser menor que maxScore'))).toBe(true)
    })

    it('should reject empty descriptions', () => {
      const invalidConfig = {
        ...DEFAULT_LEAD_PRIORITY_CONFIG,
        descriptions: { hot: '', warm: 'test', cold: 'test' }
      }

      const result = validateLeadPriorityConfig(invalidConfig)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Descrição de "hot" é obrigatória'))).toBe(true)
    })

    it('should reject staleDays <= 0', () => {
      const invalidConfig = {
        ...DEFAULT_LEAD_PRIORITY_CONFIG,
        scoring: {
          ...DEFAULT_LEAD_PRIORITY_CONFIG.scoring,
          staleDays: 0
        }
      }

      const result = validateLeadPriorityConfig(invalidConfig)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('staleDays deve ser positivo'))).toBe(true)
    })
  })
})
