import { describe, it, expect } from 'vitest'
import { isToday, isWithinHours, isUpdatedToday, isNew } from '@/utils/dateUtils'

describe('dateUtils', () => {
  describe('isToday', () => {
    it('should return true for today\'s date', () => {
      const today = new Date()
      expect(isToday(today)).toBe(true)
    })

    it('should return true for today\'s date as string', () => {
      const today = new Date().toISOString()
      expect(isToday(today)).toBe(true)
    })

    it('should return false for yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isToday(yesterday)).toBe(false)
    })

    it('should return false for tomorrow', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(isToday(tomorrow)).toBe(false)
    })

    it('should return false for invalid date', () => {
      expect(isToday('invalid-date')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isToday('')).toBe(false)
    })
  })

  describe('isWithinHours', () => {
    it('should return true for current time', () => {
      const now = new Date()
      expect(isWithinHours(now, 1)).toBe(true)
    })

    it('should return true for date within specified hours', () => {
      const twoHoursAgo = new Date()
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)
      expect(isWithinHours(twoHoursAgo, 24)).toBe(true)
    })

    it('should return false for date beyond specified hours', () => {
      const twentySixHoursAgo = new Date()
      twentySixHoursAgo.setHours(twentySixHoursAgo.getHours() - 26)
      expect(isWithinHours(twentySixHoursAgo, 24)).toBe(false)
    })

    it('should return false for future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(isWithinHours(tomorrow, 24)).toBe(false)
    })

    it('should return false for invalid date', () => {
      expect(isWithinHours('invalid-date', 24)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isWithinHours('', 24)).toBe(false)
    })
  })

  describe('isUpdatedToday', () => {
    it('should return true for today\'s timestamp', () => {
      const today = new Date().toISOString()
      expect(isUpdatedToday(today)).toBe(true)
    })

    it('should return false for yesterday\'s timestamp', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isUpdatedToday(yesterday.toISOString())).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isUpdatedToday(undefined)).toBe(false)
    })
  })

  describe('isNew', () => {
    it('should return true for item created 1 hour ago', () => {
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)
      expect(isNew(oneHourAgo.toISOString())).toBe(true)
    })

    it('should return true for item created 23 hours ago', () => {
      const twentyThreeHoursAgo = new Date()
      twentyThreeHoursAgo.setHours(twentyThreeHoursAgo.getHours() - 23)
      expect(isNew(twentyThreeHoursAgo.toISOString())).toBe(true)
    })

    it('should return false for item created 25 hours ago', () => {
      const twentyFiveHoursAgo = new Date()
      twentyFiveHoursAgo.setHours(twentyFiveHoursAgo.getHours() - 25)
      expect(isNew(twentyFiveHoursAgo.toISOString())).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isNew(undefined)).toBe(false)
    })
  })
})
