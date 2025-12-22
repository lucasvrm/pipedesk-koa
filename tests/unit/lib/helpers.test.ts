import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatCurrency,
  parseCurrency,
  formatDate,
  formatDateTime,
  calculateWeightedVolume,
  calculateFee,
  generateId,
  getInitials,
  isOverdue,
  getDaysUntil,
} from '@/lib/helpers'

describe('Helpers - Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers as BRL currency', () => {
      const result = formatCurrency(1000000)
      expect(result).toContain('1.000.000')
      expect(result).toContain('R$')
    })

    it('should format zero correctly', () => {
      const result = formatCurrency(0)
      expect(result).toContain('0')
      expect(result).toContain('R$')
    })

    it('should format decimal values correctly', () => {
      const result = formatCurrency(1234.56)
      expect(result).toContain('1.234')
      expect(result).toContain('56')
    })

    it('should format negative numbers correctly', () => {
      const result = formatCurrency(-1000)
      expect(result).toContain('1.000')
      expect(result).toContain('-')
    })
  })

  describe('parseCurrency', () => {
    it('should parse BRL formatted currency', () => {
      expect(parseCurrency('R$ 1.000,00')).toBe(1000)
    })

    it('should parse currency with thousands separator', () => {
      expect(parseCurrency('R$ 1.234.567,89')).toBe(1234567.89)
    })

    it('should parse simple numeric string', () => {
      expect(parseCurrency('1000,50')).toBe(1000.5)
    })

    it('should return 0 for empty string', () => {
      expect(parseCurrency('')).toBe(0)
    })

    it('should return 0 for invalid string', () => {
      expect(parseCurrency('abc')).toBe(0)
    })

    it('should handle currency without decimals', () => {
      expect(parseCurrency('R$ 1.000')).toBe(1000)
    })
  })

  describe('formatDate', () => {
    it('should format Date object in pt-BR format', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('should format ISO string in pt-BR format', () => {
      const result = formatDate('2024-01-15')
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })

  describe('formatDateTime', () => {
    it('should format Date object with time in pt-BR format', () => {
      const date = new Date('2024-01-15T10:30:00')
      const result = formatDateTime(date)
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
      expect(result).toContain(':')
    })

    it('should format ISO string with time', () => {
      const result = formatDateTime('2024-01-15T10:30:00')
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })

  describe('calculateWeightedVolume', () => {
    it('should calculate weighted volume with 50% probability', () => {
      expect(calculateWeightedVolume(1000000, 50)).toBe(500000)
    })

    it('should calculate weighted volume with 100% probability', () => {
      expect(calculateWeightedVolume(1000000, 100)).toBe(1000000)
    })

    it('should calculate weighted volume with 0% probability', () => {
      expect(calculateWeightedVolume(1000000, 0)).toBe(0)
    })

    it('should calculate weighted volume with 75% probability', () => {
      expect(calculateWeightedVolume(1000000, 75)).toBe(750000)
    })

    it('should handle decimal volumes', () => {
      expect(calculateWeightedVolume(1234.56, 25)).toBe(308.64)
    })
  })

  describe('calculateFee', () => {
    it('should calculate 2% fee', () => {
      expect(calculateFee(1000000, 2)).toBe(20000)
    })

    it('should calculate 1.5% fee', () => {
      expect(calculateFee(1000000, 1.5)).toBe(15000)
    })

    it('should return 0 for 0% fee', () => {
      expect(calculateFee(1000000, 0)).toBe(0)
    })

    it('should handle decimal values', () => {
      expect(calculateFee(12345.67, 2.5)).toBeCloseTo(308.64, 2)
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      
      expect(id1).not.toBe(id2)
    })

    it('should generate ID in correct format', () => {
      const id = generateId()
      expect(id).toMatch(/^\d+-[a-z0-9]+$/)
    })

    it('should generate ID with timestamp and random part', () => {
      const id = generateId()
      const parts = id.split('-')
      
      expect(parts.length).toBeGreaterThanOrEqual(2)
      expect(Number(parts[0])).toBeGreaterThan(0)
    })
  })

  describe('getInitials', () => {
    it('should get initials from two-word name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('should get first two characters from single word name', () => {
      expect(getInitials('John')).toBe('JO')
    })

    it('should get first and last initials from multi-word name', () => {
      expect(getInitials('John Peter Doe')).toBe('JD')
    })

    it('should handle lowercase names', () => {
      expect(getInitials('john doe')).toBe('JD')
    })

    it('should handle names with extra spaces', () => {
      expect(getInitials('  John   Doe  ')).toBe('JD')
    })

    it('should return ? for null name', () => {
      expect(getInitials(null)).toBe('?')
    })

    it('should return ? for undefined name', () => {
      expect(getInitials(undefined)).toBe('?')
    })

    it('should return ? for empty string', () => {
      expect(getInitials('')).toBe('?')
    })

    it('should return ? for whitespace-only string', () => {
      expect(getInitials('   ')).toBe('?')
    })

    it('should handle single character names', () => {
      expect(getInitials('J')).toBe('J')
    })
  })

  describe('isOverdue', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00'))
    })

    it('should return true for past dates', () => {
      expect(isOverdue('2024-01-14')).toBe(true)
    })

    it('should return false for future dates', () => {
      expect(isOverdue('2024-01-16')).toBe(false)
    })

    it('should return true for earlier today', () => {
      expect(isOverdue('2024-01-15T10:00:00')).toBe(true)
    })

    it('should return false for later today', () => {
      expect(isOverdue('2024-01-15T14:00:00')).toBe(false)
    })
  })

  describe('getDaysUntil', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00'))
    })

    it('should return positive days for future date', () => {
      const days = getDaysUntil('2024-01-20')
      expect(days).toBeGreaterThan(0)
    })

    it('should return negative days for past date', () => {
      const days = getDaysUntil('2024-01-10')
      expect(days).toBeLessThan(0)
    })

    it('should return approximately 0 for same day', () => {
      const days = getDaysUntil('2024-01-15T23:59:00')
      expect(days).toBeLessThanOrEqual(1)
      expect(days).toBeGreaterThanOrEqual(0)
    })

    it('should calculate correct number of days', () => {
      const days = getDaysUntil('2024-01-25')
      expect(days).toBe(10)
    })
  })
})
