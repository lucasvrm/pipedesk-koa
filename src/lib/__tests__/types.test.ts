import { describe, it, expect } from 'vitest';
import { STAGE_PROBABILITIES } from '../types';

describe('Types - STAGE_PROBABILITIES', () => {
  it('should define correct probability for nda stage', () => {
    expect(STAGE_PROBABILITIES.nda).toBe(10)
  })

  it('should define correct probability for tease stage', () => {
    expect(STAGE_PROBABILITIES.tease).toBe(25)
  })

  it('should define correct probability for offer stage', () => {
    expect(STAGE_PROBABILITIES.offer).toBe(50)
  })

  it('should define correct probability for diligence stage', () => {
    expect(STAGE_PROBABILITIES.diligence).toBe(75)
  })

  it('should define correct probability for closing stage', () => {
    expect(STAGE_PROBABILITIES.closing).toBe(95)
  })

  it('should have probabilities in ascending order', () => {
    const probabilities = [
      STAGE_PROBABILITIES.nda,
      STAGE_PROBABILITIES.tease,
      STAGE_PROBABILITIES.offer,
      STAGE_PROBABILITIES.diligence,
      STAGE_PROBABILITIES.closing
    ]
    
    for (let i = 1; i < probabilities.length; i++) {
      expect(probabilities[i]).toBeGreaterThan(probabilities[i - 1])
    }
  })

  it('should have all probabilities between 0 and 100', () => {
    Object.values(STAGE_PROBABILITIES).forEach(prob => {
      expect(prob).toBeGreaterThanOrEqual(0)
      expect(prob).toBeLessThanOrEqual(100)
    })
  })

  it('should cover all expected player stages', () => {
    const stages = ['nda', 'tease', 'offer', 'diligence', 'closing']
    
    stages.forEach(stage => {
      expect(STAGE_PROBABILITIES[stage]).toBeDefined()
      expect(typeof STAGE_PROBABILITIES[stage]).toBe('number')
    })
  })
})
