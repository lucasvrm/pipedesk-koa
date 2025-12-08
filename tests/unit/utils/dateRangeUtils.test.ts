import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getDateRange, getDateRangeISO, shouldApplyDateFilter } from '@/utils/dateRangeUtils'

describe('dateRangeUtils', () => {
  beforeEach(() => {
    // Mock current date to ensure consistent test results
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getDateRange', () => {
    it('should return today range for "today" filter', () => {
      const { startDate, endDate } = getDateRange('today')
      
      expect(startDate.getFullYear()).toBe(2024)
      expect(startDate.getMonth()).toBe(5) // June (0-indexed)
      expect(startDate.getDate()).toBe(15)
      expect(startDate.getHours()).toBe(0)
      expect(startDate.getMinutes()).toBe(0)
      expect(startDate.getSeconds()).toBe(0)
      
      expect(endDate.getFullYear()).toBe(2024)
      expect(endDate.getMonth()).toBe(5)
      expect(endDate.getDate()).toBe(15)
    })

    it('should return 7 days range for "7d" filter', () => {
      const { startDate, endDate } = getDateRange('7d')
      
      const expectedStart = new Date('2024-06-08T12:00:00Z')
      expect(startDate.getTime()).toBe(expectedStart.getTime())
      expect(endDate.getFullYear()).toBe(2024)
      expect(endDate.getMonth()).toBe(5)
      expect(endDate.getDate()).toBe(15)
    })

    it('should return 30 days range for "30d" filter', () => {
      const { startDate, endDate } = getDateRange('30d')
      
      const expectedStart = new Date('2024-05-16T12:00:00Z')
      expect(startDate.getTime()).toBe(expectedStart.getTime())
      expect(endDate.getFullYear()).toBe(2024)
      expect(endDate.getMonth()).toBe(5)
      expect(endDate.getDate()).toBe(15)
    })

    it('should return 90 days range for "90d" filter', () => {
      const { startDate, endDate } = getDateRange('90d')
      
      const expectedStart = new Date('2024-03-17T12:00:00Z')
      expect(startDate.getTime()).toBe(expectedStart.getTime())
      expect(endDate.getFullYear()).toBe(2024)
      expect(endDate.getMonth()).toBe(5)
      expect(endDate.getDate()).toBe(15)
    })

    it('should return 1 year range for "1y" filter', () => {
      const { startDate, endDate } = getDateRange('1y')
      
      const expectedStart = new Date('2023-06-16T12:00:00Z')
      expect(startDate.getTime()).toBe(expectedStart.getTime())
      expect(endDate.getFullYear()).toBe(2024)
      expect(endDate.getMonth()).toBe(5)
      expect(endDate.getDate()).toBe(15)
    })

    it('should return year to date range for "ytd" filter', () => {
      const { startDate, endDate } = getDateRange('ytd')
      
      expect(startDate.getFullYear()).toBe(2024)
      expect(startDate.getMonth()).toBe(0) // January
      expect(startDate.getDate()).toBe(1)
      
      expect(endDate.getFullYear()).toBe(2024)
      expect(endDate.getMonth()).toBe(5)
      expect(endDate.getDate()).toBe(15)
    })

    it('should return far past date for "all" filter', () => {
      const { startDate, endDate } = getDateRange('all')
      
      expect(startDate.getFullYear()).toBe(2000)
      expect(startDate.getMonth()).toBe(0)
      expect(startDate.getDate()).toBe(1)
      
      expect(endDate.getFullYear()).toBe(2024)
      expect(endDate.getMonth()).toBe(5)
      expect(endDate.getDate()).toBe(15)
    })
  })

  describe('getDateRangeISO', () => {
    it('should return ISO string dates', () => {
      const { startDate, endDate } = getDateRangeISO('30d')
      
      expect(typeof startDate).toBe('string')
      expect(typeof endDate).toBe('string')
      expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('shouldApplyDateFilter', () => {
    it('should return true for specific date filters', () => {
      expect(shouldApplyDateFilter('today')).toBe(true)
      expect(shouldApplyDateFilter('7d')).toBe(true)
      expect(shouldApplyDateFilter('30d')).toBe(true)
      expect(shouldApplyDateFilter('90d')).toBe(true)
      expect(shouldApplyDateFilter('1y')).toBe(true)
      expect(shouldApplyDateFilter('ytd')).toBe(true)
    })

    it('should return false for "all" filter', () => {
      expect(shouldApplyDateFilter('all')).toBe(false)
    })
  })
})
