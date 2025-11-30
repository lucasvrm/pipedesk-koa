import { describe, it, expect } from 'vitest'
import {
  calculatePipelineValue,
  calculateWeightedPipeline,
  calculateConversionRate,
  groupTracksByStage,
  calculateAverageTimeToClose,
  calculateStageForecast,
  getDealCountByStatus,
  calculateWinRate,
  getTopDealsByVolume,
  calculateTotalFees,
} from '../utils/calculations'
import { MasterDeal, PlayerTrack, PlayerStage } from '@/lib/types'

describe('Analytics Calculations', () => {
  const createDeal = (
    id: string,
    status: 'active' | 'concluded' | 'cancelled',
    volume: number = 1000000,
    feePercentage?: number
  ): MasterDeal => ({
    id,
    clientName: `Client ${id}`,
    volume,
    operationType: 'acquisition',
    deadline: '2024-12-31',
    observations: '',
    status,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString(),
    createdBy: 'user-1',
    feePercentage,
  })

  const createTrack = (
    id: string,
    stage: PlayerStage,
    volume: number = 500000,
    probability: number = 50,
    status: 'active' | 'concluded' | 'cancelled' = 'active'
  ): PlayerTrack => ({
    id,
    masterDealId: 'deal-1',
    playerName: `Player ${id}`,
    trackVolume: volume,
    currentStage: stage,
    probability,
    responsibles: [],
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: '',
  })

  describe('calculatePipelineValue', () => {
    it('should sum all active track volumes', () => {
      const tracks: PlayerTrack[] = [
        createTrack('1', 'nda', 1000000),
        createTrack('2', 'offer', 2000000),
        createTrack('3', 'closing', 500000),
      ]
      
      expect(calculatePipelineValue(tracks)).toBe(3500000)
    })

    it('should exclude concluded tracks', () => {
      const tracks: PlayerTrack[] = [
        createTrack('1', 'nda', 1000000, 50, 'active'),
        createTrack('2', 'offer', 2000000, 50, 'concluded'),
      ]
      
      expect(calculatePipelineValue(tracks)).toBe(1000000)
    })

    it('should exclude cancelled tracks', () => {
      const tracks: PlayerTrack[] = [
        createTrack('1', 'nda', 1000000, 50, 'active'),
        createTrack('2', 'offer', 2000000, 50, 'cancelled'),
      ]
      
      expect(calculatePipelineValue(tracks)).toBe(1000000)
    })

    it('should return 0 for empty tracks', () => {
      expect(calculatePipelineValue([])).toBe(0)
    })

    it('should return 0 when no active tracks', () => {
      const tracks: PlayerTrack[] = [
        createTrack('1', 'nda', 1000000, 50, 'concluded'),
        createTrack('2', 'offer', 2000000, 50, 'cancelled'),
      ]
      
      expect(calculatePipelineValue(tracks)).toBe(0)
    })
  })

  describe('calculateWeightedPipeline', () => {
    it('should calculate weighted volume for all active tracks', () => {
      const tracks: PlayerTrack[] = [
        createTrack('1', 'nda', 1000000, 10),     // 100,000
        createTrack('2', 'offer', 1000000, 50),   // 500,000
        createTrack('3', 'closing', 1000000, 90),  // 900,000
      ]
      
      expect(calculateWeightedPipeline(tracks)).toBe(1500000)
    })

    it('should exclude non-active tracks', () => {
      const tracks: PlayerTrack[] = [
        createTrack('1', 'nda', 1000000, 50, 'active'),
        createTrack('2', 'offer', 1000000, 50, 'concluded'),
      ]
      
      expect(calculateWeightedPipeline(tracks)).toBe(500000)
    })

    it('should return 0 for empty tracks', () => {
      expect(calculateWeightedPipeline([])).toBe(0)
    })
  })

  describe('calculateConversionRate', () => {
    it('should calculate percentage of concluded deals', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'active'),
        createDeal('2', 'concluded'),
        createDeal('3', 'concluded'),
        createDeal('4', 'cancelled'),
      ]
      
      expect(calculateConversionRate(deals)).toBe(50) // 2 out of 4
    })

    it('should return 0 for empty deals', () => {
      expect(calculateConversionRate([])).toBe(0)
    })

    it('should return 0 when no concluded deals', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'active'),
        createDeal('2', 'cancelled'),
      ]
      
      expect(calculateConversionRate(deals)).toBe(0)
    })

    it('should return 100 when all deals concluded', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'concluded'),
        createDeal('2', 'concluded'),
      ]
      
      expect(calculateConversionRate(deals)).toBe(100)
    })
  })

  describe('groupTracksByStage', () => {
    it('should group active tracks by stage', () => {
      const tracks: PlayerTrack[] = [
        createTrack('1', 'nda'),
        createTrack('2', 'nda'),
        createTrack('3', 'offer'),
        createTrack('4', 'closing'),
      ]
      
      const result = groupTracksByStage(tracks)
      expect(result.nda).toBe(2)
      // Chaves não presentes retornam undefined
      expect(result.tease).toBeUndefined()
      expect(result.offer).toBe(1)
      expect(result.diligence).toBeUndefined()
      expect(result.closing).toBe(1)
    })

    it('should exclude non-active tracks', () => {
      const tracks: PlayerTrack[] = [
        createTrack('1', 'nda', 500000, 50, 'active'),
        createTrack('2', 'nda', 500000, 50, 'concluded'),
      ]
      
      const result = groupTracksByStage(tracks)
      expect(result.nda).toBe(1)
    })

    it('should return all zeros for empty tracks', () => {
      const result = groupTracksByStage([])
      expect(result.nda).toBeUndefined()
    })
  })

  describe('calculateAverageTimeToClose', () => {
    it('should calculate average time in days', () => {
      const deals: MasterDeal[] = [
        {
          ...createDeal('1', 'concluded'),
          createdAt: new Date('2024-01-01').toISOString(),
          updatedAt: new Date('2024-01-31').toISOString(), // 30 days
        },
        {
          ...createDeal('2', 'concluded'),
          createdAt: new Date('2024-01-01').toISOString(),
          updatedAt: new Date('2024-01-11').toISOString(), // 10 days
        },
      ]
      
      expect(calculateAverageTimeToClose(deals)).toBe(20) // (30 + 10) / 2
    })

    it('should return 0 for empty deals', () => {
      expect(calculateAverageTimeToClose([])).toBe(0)
    })

    it('should only consider concluded deals', () => {
      const deals: MasterDeal[] = [
        {
          ...createDeal('1', 'concluded'),
          createdAt: new Date('2024-01-01').toISOString(),
          updatedAt: new Date('2024-01-31').toISOString(),
        },
        {
          ...createDeal('2', 'active'),
          createdAt: new Date('2024-01-01').toISOString(),
          updatedAt: new Date('2024-06-01').toISOString(),
        },
      ]
      
      expect(calculateAverageTimeToClose(deals)).toBe(30)
    })

    it('should return 0 when no concluded deals', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'active'),
        createDeal('2', 'cancelled'),
      ]
      
      expect(calculateAverageTimeToClose(deals)).toBe(0)
    })
  })

  describe('calculateStageForecast', () => {
    it('should calculate weighted forecast for specific stage', () => {
      const tracks: PlayerTrack[] = [
        createTrack('1', 'offer', 1000000, 50), // 50% probability = 500,000
        createTrack('2', 'offer', 2000000, 50), // 50% probability = 1,000,000
        createTrack('3', 'closing', 1000000, 90),  // shouldn't be included
      ]
      
      expect(calculateStageForecast(tracks, 'offer')).toBe(1500000)
    })

    it('should use stage-based probability when provided', () => {
      const tracks: PlayerTrack[] = [
        createTrack('1', 'nda', 1000000, 10), // 10% = 100,000
      ]
      
      expect(calculateStageForecast(tracks, 'nda')).toBe(100000)
    })

    it('should exclude non-active tracks', () => {
      const tracks: PlayerTrack[] = [
        createTrack('1', 'offer', 1000000, 50, 'active'),
        createTrack('2', 'offer', 1000000, 50, 'concluded'),
      ]
      
      expect(calculateStageForecast(tracks, 'offer')).toBe(500000)
    })

    it('should return 0 for stage with no tracks', () => {
      const tracks: PlayerTrack[] = [
        createTrack('1', 'nda', 1000000, 10),
      ]
      
      expect(calculateStageForecast(tracks, 'closing')).toBe(0)
    })
  })

  describe('getDealCountByStatus', () => {
    it('should count deals by status', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'active'),
        createDeal('2', 'active'),
        createDeal('3', 'concluded'),
        createDeal('4', 'cancelled'),
      ]
      
      const result = getDealCountByStatus(deals)
      expect(result.active).toBe(2)
      expect(result.concluded).toBe(1)
      expect(result.cancelled).toBe(1)
      expect(result.total).toBe(4)
    })

    it('should handle empty deals', () => {
      const result = getDealCountByStatus([])
      expect(result.active).toBe(0)
      expect(result.concluded).toBe(0)
      expect(result.cancelled).toBe(0)
      expect(result.total).toBe(0)
    })
  })

  describe('calculateWinRate', () => {
    it('should calculate win rate from concluded and cancelled', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'concluded'),
        createDeal('2', 'concluded'),
        createDeal('3', 'concluded'),
        createDeal('4', 'cancelled'),
      ]
      
      expect(calculateWinRate(deals)).toBe(75) // 3 out of 4
    })

    it('should return 0 when no closed deals', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'active'),
        createDeal('2', 'active'),
      ]
      
      expect(calculateWinRate(deals)).toBe(0)
    })

    it('should return 100 when all are concluded', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'concluded'),
        createDeal('2', 'concluded'),
      ]
      
      expect(calculateWinRate(deals)).toBe(100)
    })

    it('should return 0 when all are cancelled', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'cancelled'),
        createDeal('2', 'cancelled'),
      ]
      
      expect(calculateWinRate(deals)).toBe(0)
    })
  })

  describe('getTopDealsByVolume', () => {
    it('should return top N deals by volume', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'active', 1000000),
        createDeal('2', 'active', 5000000),
        createDeal('3', 'active', 3000000),
        createDeal('4', 'active', 2000000),
      ]
      
      const top2 = getTopDealsByVolume(deals, 2)
      expect(top2).toHaveLength(2)
      expect(top2[0].id).toBe('2') // 5M
      expect(top2[1].id).toBe('3') // 3M
    })

    it('should default to 5 deals', () => {
      const deals = Array.from({ length: 10 }, (_, i) => 
        createDeal(`${i}`, 'active', (i + 1) * 1000000)
      )
      
      const top = getTopDealsByVolume(deals)
      expect(top).toHaveLength(5)
    })

    it('should only include active deals', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'active', 1000000),
        createDeal('2', 'concluded', 9000000),
        createDeal('3', 'active', 3000000),
      ]
      
      const top = getTopDealsByVolume(deals, 2)
      expect(top).toHaveLength(2)
      expect(top[0].id).toBe('3')
      expect(top[1].id).toBe('1')
    })

    it('should handle fewer deals than limit', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'active', 1000000),
      ]
      
      const top = getTopDealsByVolume(deals, 5)
      expect(top).toHaveLength(1)
    })
  })

  describe('calculateTotalFees', () => {
    it('should sum fees from concluded deals', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'concluded', 1000000, 2),   // 20,000
        createDeal('2', 'concluded', 2000000, 1.5), // 30,000
      ]
      
      expect(calculateTotalFees(deals)).toBe(50000)
    })

    it('should exclude active deals', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'concluded', 1000000, 2),
        createDeal('2', 'active', 1000000, 2),
      ]
      
      expect(calculateTotalFees(deals)).toBe(20000)
    })

    it('should handle deals without fee percentage', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'concluded', 1000000, 2),
        createDeal('2', 'concluded', 1000000),
      ]
      
      expect(calculateTotalFees(deals)).toBe(20000)
    })

    it('should return 0 for empty deals', () => {
      expect(calculateTotalFees([])).toBe(0)
    })

    it('should return 0 when no concluded deals with fees', () => {
      const deals: MasterDeal[] = [
        createDeal('1', 'active', 1000000, 2),
        createDeal('2', 'cancelled', 1000000, 2),
      ]
      
      expect(calculateTotalFees(deals)).toBe(0)
    })
  })
})
