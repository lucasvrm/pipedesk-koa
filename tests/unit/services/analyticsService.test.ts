import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAnalyticsSummary } from '@/services/analyticsService'
import { supabase } from '@/lib/supabaseClient'
import { Stage } from '@/types/metadata'
import { DateRange } from '@/utils/dateRangeUtils'

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAnalyticsSummary with dynamic options', () => {
    it('should use provided stages for probability calculations', async () => {
      // Mock stages
      const mockStages: Stage[] = [
        {
          id: 'stage-1',
          pipelineId: 'pipeline-1',
          name: 'NDA',
          color: '#blue',
          stageOrder: 1,
          probability: 10,
          isDefault: false,
          active: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        },
        {
          id: 'stage-2',
          pipelineId: 'pipeline-1',
          name: 'Proposal',
          color: '#green',
          stageOrder: 2,
          probability: 50,
          isDefault: false,
          active: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ]

      // Mock database responses
      const mockDeals = [
        { id: 'deal-1', status: 'active', operation_type: 'ccb', created_at: '2024-06-01T00:00:00Z' },
        { id: 'deal-2', status: 'concluded', operation_type: 'cri_land', created_at: '2024-06-02T00:00:00Z' }
      ]

      const mockTracks = [
        {
          id: 'track-1',
          master_deal_id: 'deal-1',
          current_stage: 'stage-1',
          track_volume: 1000000,
          status: 'active',
          probability: null,
          responsibles: ['user-1']
        },
        {
          id: 'track-2',
          master_deal_id: 'deal-2',
          current_stage: 'stage-2',
          track_volume: 2000000,
          status: 'active',
          probability: null,
          responsibles: ['user-2']
        }
      ]

      // Create a query builder mock that can be chained and awaited
      const createQueryBuilder = (data: any) => {
        const builder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          then: (resolve: any) => resolve({ data, error: null })
        }
        return builder
      }

      // Mock supabase.from() calls
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'master_deals') {
          return createQueryBuilder(mockDeals)
        }
        if (table === 'player_tracks') {
          return createQueryBuilder(mockTracks)
        }
        if (table === 'stage_history') {
          return createQueryBuilder([])
        }
        if (table === 'tasks') {
          return createQueryBuilder([])
        }
        if (table === 'profiles') {
          return createQueryBuilder([])
        }
        return createQueryBuilder([])
      })

      // Call function with stages option
      const result = await getAnalyticsSummary('all', 'all', 'all', { stages: mockStages })

      // Verify stages were used
      expect(result).toBeDefined()
      expect(result.totalDeals).toBe(2)
      expect(result.activeDeals).toBe(1)
      expect(result.concludedDeals).toBe(1)
      
      // Weighted pipeline should use stage probabilities
      // track-1: 1000000 * 0.10 = 100000
      // track-2: 2000000 * 0.50 = 1000000
      // Total = 1100000
      expect(result.weightedPipeline).toBe(1100000)
    })

    it('should use provided team members for workload filtering', async () => {
      const mockTeamMembers = ['user-1', 'user-2']
      const mockStages: Stage[] = []
      const mockDeals = [{ id: 'deal-1', status: 'active', operation_type: 'ccb', created_at: '2024-06-01T00:00:00Z' }]
      const mockTracks = [
        {
          id: 'track-1',
          master_deal_id: 'deal-1',
          current_stage: 'stage-1',
          track_volume: 1000000,
          status: 'active',
          probability: 10,
          responsibles: ['user-1']
        }
      ]
      const mockUsers = [
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' }
      ]

      const createQueryBuilder = (data: any) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data, error: null })
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pipeline_stages') return createQueryBuilder(mockStages)
        if (table === 'master_deals') return createQueryBuilder(mockDeals)
        if (table === 'player_tracks') return createQueryBuilder(mockTracks)
        if (table === 'stage_history') return createQueryBuilder([])
        if (table === 'tasks') return createQueryBuilder([])
        if (table === 'profiles') return createQueryBuilder(mockUsers)
        return createQueryBuilder([])
      })

      const result = await getAnalyticsSummary('all', 'all', 'all', { teamMembers: mockTeamMembers })

      expect(result.teamWorkload).toBeDefined()
      expect(result.teamWorkload).toHaveLength(2)
      expect(result.teamWorkload[0].userId).toBe('user-1')
      expect(result.teamWorkload[1].userId).toBe('user-2')
    })
  })
})
