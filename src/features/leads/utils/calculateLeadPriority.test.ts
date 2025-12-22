import { describe, it, expect } from 'vitest'
import { calculateLeadPriority } from './calculateLeadPriority'
import type { LeadPriorityBucket } from '@/lib/types'

describe('calculateLeadPriority', () => {
  describe('Score-based bucket determination (single source of truth)', () => {
    it('should classify score 75 as hot', () => {
      const result = calculateLeadPriority({
        priorityScore: 75,
        priorityBucket: 'warm' // Backend might send wrong bucket, but score takes precedence
      })
      
      expect(result.bucket).toBe('hot')
      expect(result.score).toBe(75)
    })
    
    it('should classify score 76 as hot', () => {
      const result = calculateLeadPriority({
        priorityScore: 76
      })
      
      expect(result.bucket).toBe('hot')
      expect(result.score).toBe(76)
    })
    
    it('should classify score 74 as warm', () => {
      const result = calculateLeadPriority({
        priorityScore: 74
      })
      
      expect(result.bucket).toBe('warm')
      expect(result.score).toBe(74)
    })
    
    it('should classify score 55 as warm (boundary)', () => {
      const result = calculateLeadPriority({
        priorityScore: 55
      })
      
      expect(result.bucket).toBe('warm')
      expect(result.score).toBe(55)
    })
    
    it('should classify score 54 as cold', () => {
      const result = calculateLeadPriority({
        priorityScore: 54
      })
      
      expect(result.bucket).toBe('cold')
      expect(result.score).toBe(54)
    })
    
    it('should classify score 100 as hot', () => {
      const result = calculateLeadPriority({
        priorityScore: 100
      })
      
      expect(result.bucket).toBe('hot')
      expect(result.score).toBe(100)
    })
    
    it('should classify score 0 as cold', () => {
      const result = calculateLeadPriority({
        priorityScore: 0
      })
      
      expect(result.bucket).toBe('cold')
      expect(result.score).toBe(0)
    })
  })

  describe('Score takes precedence over bucket', () => {
    it('should override incorrect bucket when score is provided', () => {
      const result = calculateLeadPriority({
        priorityScore: 75,
        priorityBucket: 'cold' // Wrong bucket from backend
      })
      
      expect(result.bucket).toBe('hot') // Score wins
      expect(result.score).toBe(75)
    })
    
    it('should normalize warm to hot when score is 75', () => {
      const result = calculateLeadPriority({
        priorityScore: 75,
        priorityBucket: 'warm'
      })
      
      expect(result.bucket).toBe('hot')
    })
  })

  describe('Bucket-only fallback (no score)', () => {
    it('should use bucket as-is when only bucket is provided', () => {
      const result = calculateLeadPriority({
        priorityBucket: 'hot'
      })
      
      expect(result.bucket).toBe('hot')
      expect(result.score).toBe(85) // Default score for hot
    })
    
    it('should return default scores for each bucket', () => {
      const hotResult = calculateLeadPriority({ priorityBucket: 'hot' })
      const warmResult = calculateLeadPriority({ priorityBucket: 'warm' })
      const coldResult = calculateLeadPriority({ priorityBucket: 'cold' })
      
      expect(hotResult.score).toBe(85)
      expect(warmResult.score).toBe(65)
      expect(coldResult.score).toBe(40)
    })
  })

  describe('Date-based calculation (no score or bucket)', () => {
    it('should calculate hot priority for recent interaction (0 days)', () => {
      const now = new Date()
      const result = calculateLeadPriority({
        lastInteractionAt: now.toISOString()
      })
      
      expect(result.bucket).toBe('hot')
      expect(result.score).toBe(90)
    })
    
    it('should calculate hot priority for interaction 3 days ago', () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      
      const result = calculateLeadPriority({
        lastInteractionAt: threeDaysAgo.toISOString()
      })
      
      expect(result.bucket).toBe('hot')
      expect(result.score).toBe(75) // 90 - (3 * 5) = 75
    })
    
    it('should calculate warm priority for interaction 4 days ago', () => {
      const fourDaysAgo = new Date()
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)
      
      const result = calculateLeadPriority({
        lastInteractionAt: fourDaysAgo.toISOString()
      })
      
      expect(result.bucket).toBe('warm')
      expect(result.score).toBe(65) // 70 - ((4-3) * 5) = 65
    })
    
    it('should calculate warm priority for interaction 7 days ago', () => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const result = calculateLeadPriority({
        lastInteractionAt: sevenDaysAgo.toISOString()
      })
      
      expect(result.bucket).toBe('warm')
      expect(result.score).toBe(50) // 70 - ((7-3) * 5) = 50
    })
    
    it('should calculate cold priority for interaction 8+ days ago', () => {
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
      
      const result = calculateLeadPriority({
        lastInteractionAt: tenDaysAgo.toISOString()
      })
      
      expect(result.bucket).toBe('cold')
      expect(result.score).toBeLessThan(50)
    })
    
    it('should use createdAt if no lastInteractionAt', () => {
      const now = new Date()
      const result = calculateLeadPriority({
        createdAt: now.toISOString()
      })
      
      expect(result.bucket).toBe('hot')
      expect(result.score).toBe(90)
    })
  })

  describe('Description generation', () => {
    it('should return appropriate description for each bucket', () => {
      const hot = calculateLeadPriority({ priorityScore: 80 })
      const warm = calculateLeadPriority({ priorityScore: 60 })
      const cold = calculateLeadPriority({ priorityScore: 40 })
      
      expect(hot.description).toContain('quente')
      expect(warm.description).toContain('morno')
      expect(cold.description).toContain('frio')
    })
  })

  describe('Edge cases', () => {
    it('should handle null score', () => {
      const result = calculateLeadPriority({
        priorityScore: null,
        priorityBucket: 'hot'
      })
      
      expect(result.bucket).toBe('hot')
      expect(result.score).toBe(85) // Default for hot
    })
    
    it('should handle undefined values', () => {
      const result = calculateLeadPriority({})
      
      expect(result.bucket).toBeDefined()
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.description).toBeDefined()
    })
    
    it('should handle negative scores as cold', () => {
      const result = calculateLeadPriority({
        priorityScore: -10
      })
      
      expect(result.bucket).toBe('cold')
      expect(result.score).toBe(-10)
    })
  })
})
