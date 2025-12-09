import { describe, it, expect } from 'vitest';
import { STAGE_PROBABILITIES, getLeadStatusProgress, getLeadStatusColor, LEAD_STATUS_PROGRESS, LEAD_STATUS_COLORS } from '@/lib/types';

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

describe('Types - Lead Status Helper Functions', () => {
  it('getLeadStatusProgress should return correct progress for each status', () => {
    expect(getLeadStatusProgress('new')).toBe(15)
    expect(getLeadStatusProgress('contacted')).toBe(45)
    expect(getLeadStatusProgress('qualified')).toBe(100)
    expect(getLeadStatusProgress('disqualified')).toBe(0)
  })

  it('getLeadStatusProgress should match LEAD_STATUS_PROGRESS constant', () => {
    Object.keys(LEAD_STATUS_PROGRESS).forEach(status => {
      expect(getLeadStatusProgress(status as any)).toBe(LEAD_STATUS_PROGRESS[status as any])
    })
  })

  it('getLeadStatusColor should return correct color for each status', () => {
    expect(getLeadStatusColor('new')).toBe('bg-blue-500')
    expect(getLeadStatusColor('contacted')).toBe('bg-amber-500')
    expect(getLeadStatusColor('qualified')).toBe('bg-emerald-500')
    expect(getLeadStatusColor('disqualified')).toBe('bg-rose-500')
  })

  it('getLeadStatusColor should match LEAD_STATUS_COLORS constant', () => {
    Object.keys(LEAD_STATUS_COLORS).forEach(status => {
      expect(getLeadStatusColor(status as any)).toBe(LEAD_STATUS_COLORS[status as any])
    })
  })

  it('getLeadStatusProgress should return 0 for invalid status', () => {
    expect(getLeadStatusProgress('invalid' as any)).toBe(0)
  })

  it('getLeadStatusColor should return default color for invalid status', () => {
    expect(getLeadStatusColor('invalid' as any)).toBe('bg-gray-500')
  })
})
