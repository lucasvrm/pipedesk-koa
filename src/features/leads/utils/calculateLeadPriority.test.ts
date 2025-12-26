import { describe, it, expect } from 'vitest'
import { calculateLeadPriority } from './calculateLeadPriority'
import type { LeadPriorityBucket } from '@/lib/types'
import type { LeadPriorityConfig } from '@/types/metadata'

// Test configuration matching backend defaults (70/40)
const testConfig: LeadPriorityConfig = {
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

describe('calculateLeadPriority', () => {
  describe('Score-based bucket determination with dynamic config', () => {
    it('should classify score 70 as hot (threshold boundary)', () => {
      const result = calculateLeadPriority({
        priorityScore: 70,
        priorityBucket: 'warm' // Backend might send wrong bucket, but score takes precedence
      }, testConfig)
      
      expect(result.bucket).toBe('hot')
      expect(result.score).toBe(70)
    })
    
    it('should classify score 71 as hot', () => {
      const result = calculateLeadPriority({
        priorityScore: 71
      }, testConfig)
      
      expect(result.bucket).toBe('hot')
      expect(result.score).toBe(71)
    })
    
    it('should classify score 69 as warm', () => {
      const result = calculateLeadPriority({
        priorityScore: 69
      }, testConfig)
      
      expect(result.bucket).toBe('warm')
      expect(result.score).toBe(69)
    })
    
    it('should classify score 40 as warm (boundary)', () => {
      const result = calculateLeadPriority({
        priorityScore: 40
      }, testConfig)
      
      expect(result.bucket).toBe('warm')
      expect(result.score).toBe(40)
    })
    
    it('should classify score 39 as cold', () => {
      const result = calculateLeadPriority({
        priorityScore: 39
      }, testConfig)
      
      expect(result.bucket).toBe('cold')
      expect(result.score).toBe(39)
    })
    
    it('should classify score 100 as hot', () => {
      const result = calculateLeadPriority({
        priorityScore: 100
      }, testConfig)
      
      expect(result.bucket).toBe('hot')
      expect(result.score).toBe(100)
    })
    
    it('should classify score 0 as cold', () => {
      const result = calculateLeadPriority({
        priorityScore: 0
      }, testConfig)
      
      expect(result.bucket).toBe('cold')
      expect(result.score).toBe(0)
    })
  })

  describe('Custom thresholds', () => {
    it('should respect custom thresholds (75/55)', () => {
      const customConfig: LeadPriorityConfig = {
        ...testConfig,
        thresholds: { hot: 75, warm: 55 }
      }
      
      const hot = calculateLeadPriority({ priorityScore: 75 }, customConfig)
      const warm = calculateLeadPriority({ priorityScore: 55 }, customConfig)
      const cold = calculateLeadPriority({ priorityScore: 54 }, customConfig)
      
      expect(hot.bucket).toBe('hot')
      expect(warm.bucket).toBe('warm')
      expect(cold.bucket).toBe('cold')
    })
  })

  describe('Score takes precedence over bucket', () => {
    it('should override incorrect bucket when score is provided', () => {
      const result = calculateLeadPriority({
        priorityScore: 70,
        priorityBucket: 'cold' // Wrong bucket from backend
      }, testConfig)
      
      expect(result.bucket).toBe('hot') // Score wins
      expect(result.score).toBe(70)
    })
    
    it('should normalize warm to hot when score is 70', () => {
      const result = calculateLeadPriority({
        priorityScore: 70,
        priorityBucket: 'warm'
      }, testConfig)
      
      expect(result.bucket).toBe('hot')
    })
  })

  describe('Bucket-only fallback (no score)', () => {
    it('should use bucket as-is when only bucket is provided', () => {
      const result = calculateLeadPriority({
        priorityBucket: 'hot'
      }, testConfig)
      
      expect(result.bucket).toBe('hot')
      // Default score for hot is midpoint between 70 and 100 = 85
      expect(result.score).toBe(85)
    })
    
    it('should return default scores for each bucket based on config', () => {
      const hotResult = calculateLeadPriority({ priorityBucket: 'hot' }, testConfig)
      const warmResult = calculateLeadPriority({ priorityBucket: 'warm' }, testConfig)
      const coldResult = calculateLeadPriority({ priorityBucket: 'cold' }, testConfig)
      
      // hot: (70 + 100) / 2 = 85
      expect(hotResult.score).toBe(85)
      // warm: (40 + 70) / 2 = 55
      expect(warmResult.score).toBe(55)
      // cold: (0 + 40) / 2 = 20
      expect(coldResult.score).toBe(20)
    })
  })

  describe('Fallback calculation with recency', () => {
    it('should calculate score based on recency (0 days = full recency points)', () => {
      const now = new Date()
      const result = calculateLeadPriority({
        lastInteractionAt: now.toISOString()
      }, testConfig)
      
      // With 0 days, should get full recencyMaxPoints (40)
      expect(result.score).toBe(40)
      expect(result.bucket).toBe('warm') // 40 is exactly at warm threshold
    })
    
    it('should decay score with days since interaction', () => {
      const fifteenDaysAgo = new Date()
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)
      
      const result = calculateLeadPriority({
        lastInteractionAt: fifteenDaysAgo.toISOString()
      }, testConfig)
      
      // 15 days is half of staleDays (30), so should get 50% of recencyMaxPoints
      // 40 * (1 - 15/30) = 40 * 0.5 = 20
      expect(result.score).toBe(20)
      expect(result.bucket).toBe('cold') // 20 < 40 (warm threshold)
    })
    
    it('should use createdAt if no lastInteractionAt', () => {
      const now = new Date()
      const result = calculateLeadPriority({
        createdAt: now.toISOString()
      }, testConfig)
      
      expect(result.score).toBe(40) // Full recency points
      expect(result.bucket).toBe('warm')
    })
    
    it('should clamp score to minScore', () => {
      const longAgo = new Date()
      longAgo.setDate(longAgo.getDate() - 100) // Way past staleDays
      
      const result = calculateLeadPriority({
        lastInteractionAt: longAgo.toISOString()
      }, testConfig)
      
      expect(result.score).toBeGreaterThanOrEqual(testConfig.scoring.minScore)
      expect(result.score).toBe(0) // Should hit the floor
    })
  })

  describe('Fallback calculation with status/origin weights', () => {
    it('should add status weight to score', () => {
      const now = new Date()
      const result = calculateLeadPriority({
        lastInteractionAt: now.toISOString(),
        leadStatusId: 'status-1'
      }, testConfig, {
        leadStatuses: [{
          id: 'status-1',
          code: 'qualified',
          label: 'Qualificado',
          priorityWeight: 20,
          isActive: true,
          sortOrder: 1,
          createdAt: '2024-01-01'
        }]
      })
      
      // recency (40) + statusWeight (20) = 60
      expect(result.score).toBe(60)
      expect(result.bucket).toBe('warm') // 60 is between 40 and 70
    })
    
    it('should add origin weight to score', () => {
      const now = new Date()
      const result = calculateLeadPriority({
        lastInteractionAt: now.toISOString(),
        leadOriginId: 'origin-1'
      }, testConfig, {
        leadOrigins: [{
          id: 'origin-1',
          code: 'inbound',
          label: 'Inbound',
          priorityWeight: 15,
          isActive: true,
          sortOrder: 1,
          createdAt: '2024-01-01'
        }]
      })
      
      // recency (40) + originWeight (15) = 55
      expect(result.score).toBe(55)
      expect(result.bucket).toBe('warm')
    })
    
    it('should combine status, origin, and recency weights', () => {
      const now = new Date()
      const result = calculateLeadPriority({
        lastInteractionAt: now.toISOString(),
        leadStatusId: 'status-1',
        leadOriginId: 'origin-1'
      }, testConfig, {
        leadStatuses: [{
          id: 'status-1',
          code: 'qualified',
          label: 'Qualificado',
          priorityWeight: 20,
          isActive: true,
          sortOrder: 1,
          createdAt: '2024-01-01'
        }],
        leadOrigins: [{
          id: 'origin-1',
          code: 'inbound',
          label: 'Inbound',
          priorityWeight: 15,
          isActive: true,
          sortOrder: 1,
          createdAt: '2024-01-01'
        }]
      })
      
      // recency (40) + statusWeight (20) + originWeight (15) = 75
      expect(result.score).toBe(75)
      expect(result.bucket).toBe('hot') // 75 >= 70 (hot threshold)
    })
  })

  describe('Fallback calculation with upcoming meeting bonus', () => {
    it('should add meeting points when hasUpcomingMeeting is true', () => {
      const now = new Date()
      const result = calculateLeadPriority({
        lastInteractionAt: now.toISOString(),
        hasUpcomingMeeting: true
      }, testConfig)
      
      // recency (40) + meetingPoints (10) = 50
      expect(result.score).toBe(50)
      expect(result.bucket).toBe('warm')
    })
  })

  describe('Score clamping', () => {
    it('should clamp to maxScore', () => {
      const now = new Date()
      const result = calculateLeadPriority({
        lastInteractionAt: now.toISOString(),
        leadStatusId: 'status-1',
        leadOriginId: 'origin-1',
        hasUpcomingMeeting: true
      }, testConfig, {
        leadStatuses: [{
          id: 'status-1',
          code: 'qualified',
          label: 'Qualificado',
          priorityWeight: 50,
          isActive: true,
          sortOrder: 1,
          createdAt: '2024-01-01'
        }],
        leadOrigins: [{
          id: 'origin-1',
          code: 'inbound',
          label: 'Inbound',
          priorityWeight: 50,
          isActive: true,
          sortOrder: 1,
          createdAt: '2024-01-01'
        }]
      })
      
      // Without clamp: recency(40) + status(50) + origin(50) + meeting(10) = 150
      // With clamp: 100 (maxScore)
      expect(result.score).toBe(100)
      expect(result.score).toBeLessThanOrEqual(testConfig.scoring.maxScore)
    })
  })

  describe('Description generation', () => {
    it('should return appropriate description from config', () => {
      const hot = calculateLeadPriority({ priorityScore: 80 }, testConfig)
      const warm = calculateLeadPriority({ priorityScore: 60 }, testConfig)
      const cold = calculateLeadPriority({ priorityScore: 30 }, testConfig)
      
      expect(hot.description).toBe(testConfig.descriptions.hot)
      expect(warm.description).toBe(testConfig.descriptions.warm)
      expect(cold.description).toBe(testConfig.descriptions.cold)
    })
  })

  describe('Edge cases', () => {
    it('should handle null score', () => {
      const result = calculateLeadPriority({
        priorityScore: null,
        priorityBucket: 'hot'
      }, testConfig)
      
      expect(result.bucket).toBe('hot')
      expect(result.score).toBe(85) // Default for hot with config
    })
    
    it('should handle undefined values with defaults', () => {
      const result = calculateLeadPriority({})
      
      expect(result.bucket).toBeDefined()
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.description).toBeDefined()
    })
    
    it('should handle negative scores as cold', () => {
      const result = calculateLeadPriority({
        priorityScore: -10
      }, testConfig)
      
      expect(result.bucket).toBe('cold')
      expect(result.score).toBe(-10)
    })
    
    it('should handle missing config by using defaults', () => {
      const result = calculateLeadPriority({
        priorityScore: 70
      })
      
      // Should use default config (70/40 thresholds)
      expect(result.bucket).toBe('hot')
    })
  })
})
