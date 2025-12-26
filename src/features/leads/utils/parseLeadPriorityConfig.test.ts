import { describe, it, expect } from 'vitest'
import { parseLeadPriorityConfig } from './parseLeadPriorityConfig'

describe('parseLeadPriorityConfig', () => {
  it('should return default config when no raw config provided', () => {
    const result = parseLeadPriorityConfig(null)
    
    expect(result.thresholds.hot).toBe(70)
    expect(result.thresholds.warm).toBe(40)
    expect(result.scoring.recencyMaxPoints).toBe(40)
    expect(result.scoring.staleDays).toBe(30)
    expect(result.scoring.upcomingMeetingPoints).toBe(10)
    expect(result.scoring.minScore).toBe(0)
    expect(result.scoring.maxScore).toBe(100)
  })

  it('should return default config when raw is not an object', () => {
    expect(parseLeadPriorityConfig('string')).toEqual(parseLeadPriorityConfig(null))
    expect(parseLeadPriorityConfig(123)).toEqual(parseLeadPriorityConfig(null))
    expect(parseLeadPriorityConfig(true)).toEqual(parseLeadPriorityConfig(null))
  })

  it('should parse custom thresholds', () => {
    const raw = {
      thresholds: {
        hot: 75,
        warm: 55
      }
    }
    
    const result = parseLeadPriorityConfig(raw)
    
    expect(result.thresholds.hot).toBe(75)
    expect(result.thresholds.warm).toBe(55)
  })

  it('should parse custom scoring config', () => {
    const raw = {
      scoring: {
        recencyMaxPoints: 50,
        staleDays: 45,
        upcomingMeetingPoints: 15,
        minScore: 10,
        maxScore: 90
      }
    }
    
    const result = parseLeadPriorityConfig(raw)
    
    expect(result.scoring.recencyMaxPoints).toBe(50)
    expect(result.scoring.staleDays).toBe(45)
    expect(result.scoring.upcomingMeetingPoints).toBe(15)
    expect(result.scoring.minScore).toBe(10)
    expect(result.scoring.maxScore).toBe(90)
  })

  it('should parse custom descriptions', () => {
    const raw = {
      descriptions: {
        hot: 'Custom hot',
        warm: 'Custom warm',
        cold: 'Custom cold'
      }
    }
    
    const result = parseLeadPriorityConfig(raw)
    
    expect(result.descriptions.hot).toBe('Custom hot')
    expect(result.descriptions.warm).toBe('Custom warm')
    expect(result.descriptions.cold).toBe('Custom cold')
  })

  it('should use defaults for missing fields', () => {
    const raw = {
      thresholds: {
        hot: 80
        // warm is missing
      },
      scoring: {
        recencyMaxPoints: 35
        // other fields missing
      }
    }
    
    const result = parseLeadPriorityConfig(raw)
    
    // Custom values
    expect(result.thresholds.hot).toBe(80)
    expect(result.scoring.recencyMaxPoints).toBe(35)
    
    // Default values for missing fields
    expect(result.thresholds.warm).toBe(40) // default
    expect(result.scoring.staleDays).toBe(30) // default
    expect(result.descriptions.hot).toBeDefined() // default
  })

  it('should ignore invalid types for numeric fields', () => {
    const raw = {
      thresholds: {
        hot: 'not a number',
        warm: null
      },
      scoring: {
        recencyMaxPoints: undefined,
        staleDays: {}
      }
    }
    
    const result = parseLeadPriorityConfig(raw)
    
    // Should use all defaults since values are invalid
    expect(result.thresholds.hot).toBe(70)
    expect(result.thresholds.warm).toBe(40)
    expect(result.scoring.recencyMaxPoints).toBe(40)
    expect(result.scoring.staleDays).toBe(30)
  })

  it('should ignore invalid types for string fields', () => {
    const raw = {
      descriptions: {
        hot: 123,
        warm: null,
        cold: {}
      }
    }
    
    const result = parseLeadPriorityConfig(raw)
    
    // Should use defaults since values are not strings
    expect(typeof result.descriptions.hot).toBe('string')
    expect(typeof result.descriptions.warm).toBe('string')
    expect(typeof result.descriptions.cold).toBe('string')
  })

  it('should handle partial config gracefully', () => {
    const raw = {
      thresholds: {
        hot: 85
      }
    }
    
    const result = parseLeadPriorityConfig(raw)
    
    expect(result.thresholds.hot).toBe(85)
    expect(result.thresholds.warm).toBe(40) // default
    expect(result.scoring).toBeDefined()
    expect(result.descriptions).toBeDefined()
  })
})
