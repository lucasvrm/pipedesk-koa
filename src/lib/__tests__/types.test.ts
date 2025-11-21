import { describe, it, expect } from 'vitest'
import { STAGE_PROBABILITIES, PlayerStage } from '../types'

describe('Types - STAGE_PROBABILITIES', () => {
  it('should define correct probability for nda stage', () => {
    expect(STAGE_PROBABILITIES.nda).toBe(10)
  })

  it('should define correct probability for analysis stage', () => {
    expect(STAGE_PROBABILITIES.analysis).toBe(25)
  })

  it('should define correct probability for proposal stage', () => {
    expect(STAGE_PROBABILITIES.proposal).toBe(50)
  })

  it('should define correct probability for negotiation stage', () => {
    expect(STAGE_PROBABILITIES.negotiation).toBe(75)
  })

  it('should define correct probability for closing stage', () => {
    expect(STAGE_PROBABILITIES.closing).toBe(90)
  })

  it('should have probabilities in ascending order', () => {
    const stages: PlayerStage[] = ['nda', 'analysis', 'proposal', 'negotiation', 'closing']
    const probabilities = stages.map(stage => STAGE_PROBABILITIES[stage])
    
    for (let i = 1; i < probabilities.length; i++) {
      expect(probabilities[i]).toBeGreaterThan(probabilities[i - 1])
    }
  })

  it('should have all probabilities between 0 and 100', () => {
    Object.values(STAGE_PROBABILITIES).forEach(probability => {
      expect(probability).toBeGreaterThanOrEqual(0)
      expect(probability).toBeLessThanOrEqual(100)
    })
  })

  it('should cover all player stages', () => {
    const stages: PlayerStage[] = ['nda', 'analysis', 'proposal', 'negotiation', 'closing']
    
    stages.forEach(stage => {
      expect(STAGE_PROBABILITIES[stage]).toBeDefined()
      expect(typeof STAGE_PROBABILITIES[stage]).toBe('number')
    })
  })
})
