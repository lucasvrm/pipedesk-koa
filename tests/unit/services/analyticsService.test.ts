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

  describe('New relational BI metrics', () => {
    it('should calculate player efficiency metrics', async () => {
      const mockDeals = [
        { id: 'deal-1', status: 'active', operation_type: 'ccb', created_at: '2024-06-01T00:00:00Z', volume: 1000000 },
        { id: 'deal-2', status: 'concluded', operation_type: 'cri_land', created_at: '2024-06-02T00:00:00Z', volume: 2000000 }
      ]

      const mockTracks = [
        {
          id: 'track-1',
          master_deal_id: 'deal-1',
          player_name: 'Player A',
          current_stage: 'stage-1',
          track_volume: 1000000,
          status: 'active',
          probability: 10,
          responsibles: ['user-1']
        },
        {
          id: 'track-2',
          master_deal_id: 'deal-2',
          player_name: 'Player A',
          current_stage: 'stage-2',
          track_volume: 2000000,
          status: 'concluded',
          probability: 50,
          responsibles: ['user-1']
        }
      ]

      const createQueryBuilder = (data: any) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data, error: null })
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'master_deals') return createQueryBuilder(mockDeals)
        if (table === 'player_tracks') return createQueryBuilder(mockTracks)
        if (table === 'stage_history') return createQueryBuilder([])
        if (table === 'tasks') return createQueryBuilder([])
        if (table === 'profiles') return createQueryBuilder([])
        if (table === 'leads') return createQueryBuilder([])
        return createQueryBuilder([])
      })

      const result = await getAnalyticsSummary('all', 'all', 'all')

      expect(result.playerEfficiency).toBeDefined()
      expect(result.playerEfficiency).toHaveLength(1)
      expect(result.playerEfficiency[0].name).toBe('Player A')
      expect(result.playerEfficiency[0].volume).toBe(3000000)
      expect(result.playerEfficiency[0].totalDeals).toBe(2)
      expect(result.playerEfficiency[0].conversionRate).toBe(50)
    })

    it('should calculate lead origin performance metrics', async () => {
      const mockDeals = [
        { id: 'deal-1', status: 'concluded', operation_type: 'ccb', created_at: '2024-06-01T00:00:00Z', volume: 1000000 },
        { id: 'deal-2', status: 'concluded', operation_type: 'cri_land', created_at: '2024-06-02T00:00:00Z', volume: 2000000 }
      ]

      const mockLeads = [
        { id: 'lead-1', origin: 'inbound', qualified_master_deal_id: 'deal-1' },
        { id: 'lead-2', origin: 'inbound', qualified_master_deal_id: 'deal-2' },
        { id: 'lead-3', origin: 'outbound', qualified_master_deal_id: null }
      ]

      const createQueryBuilder = (data: any) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data, error: null })
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'master_deals') return createQueryBuilder(mockDeals)
        if (table === 'player_tracks') return createQueryBuilder([])
        if (table === 'stage_history') return createQueryBuilder([])
        if (table === 'tasks') return createQueryBuilder([])
        if (table === 'profiles') return createQueryBuilder([])
        if (table === 'leads') return createQueryBuilder(mockLeads)
        return createQueryBuilder([])
      })

      const result = await getAnalyticsSummary('all', 'all', 'all')

      expect(result.leadOriginPerformance).toBeDefined()
      expect(result.leadOriginPerformance.length).toBeGreaterThanOrEqual(1)
      
      const inboundOrigin = result.leadOriginPerformance.find(o => o.origin === 'inbound')
      expect(inboundOrigin).toBeDefined()
      expect(inboundOrigin?.total).toBe(2)
      expect(inboundOrigin?.converted).toBe(2)
      expect(inboundOrigin?.conversionRate).toBe(100)
      expect(inboundOrigin?.avgTicket).toBe(1500000)
    })

    it('should calculate product distribution metrics', async () => {
      const mockDeals = [
        { id: 'deal-1', status: 'active', operation_type: 'ccb', created_at: '2024-06-01T00:00:00Z', volume: 1000000 },
        { id: 'deal-2', status: 'concluded', operation_type: 'ccb', created_at: '2024-06-02T00:00:00Z', volume: 2000000 },
        { id: 'deal-3', status: 'active', operation_type: 'cri_land', created_at: '2024-06-03T00:00:00Z', volume: 3000000 }
      ]

      const createQueryBuilder = (data: any) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data, error: null })
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'master_deals') return createQueryBuilder(mockDeals)
        if (table === 'player_tracks') return createQueryBuilder([])
        if (table === 'stage_history') return createQueryBuilder([])
        if (table === 'tasks') return createQueryBuilder([])
        if (table === 'profiles') return createQueryBuilder([])
        if (table === 'leads') return createQueryBuilder([])
        return createQueryBuilder([])
      })

      const result = await getAnalyticsSummary('all', 'all', 'all')

      expect(result.productDistribution).toBeDefined()
      expect(result.productDistribution.length).toBe(2)
      
      const ccbProduct = result.productDistribution.find(p => p.type === 'ccb')
      expect(ccbProduct).toBeDefined()
      expect(ccbProduct?.volume).toBe(3000000)
      expect(ccbProduct?.count).toBe(2)

      const criProduct = result.productDistribution.find(p => p.type === 'cri_land')
      expect(criProduct).toBeDefined()
      expect(criProduct?.volume).toBe(3000000)
      expect(criProduct?.count).toBe(1)
    })

    it('should calculate deal velocity metrics', async () => {
      const mockHistory = [
        {
          id: 'hist-1',
          player_track_id: 'track-1',
          stage: 'nda',
          entered_at: '2024-01-01T00:00:00Z',
          exited_at: '2024-01-11T00:00:00Z'
        },
        {
          id: 'hist-2',
          player_track_id: 'track-1',
          stage: 'nda',
          entered_at: '2024-02-01T00:00:00Z',
          exited_at: '2024-02-16T00:00:00Z'
        },
        {
          id: 'hist-3',
          player_track_id: 'track-2',
          stage: 'proposal',
          entered_at: '2024-03-01T00:00:00Z',
          exited_at: '2024-03-21T00:00:00Z'
        }
      ]

      const createQueryBuilder = (data: any) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data, error: null })
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'master_deals') return createQueryBuilder([])
        if (table === 'player_tracks') return createQueryBuilder([])
        if (table === 'stage_history') return createQueryBuilder(mockHistory)
        if (table === 'tasks') return createQueryBuilder([])
        if (table === 'profiles') return createQueryBuilder([])
        if (table === 'leads') return createQueryBuilder([])
        return createQueryBuilder([])
      })

      const result = await getAnalyticsSummary('all', 'all', 'all')

      expect(result.dealVelocity).toBeDefined()
      expect(result.dealVelocity.length).toBe(2)
      
      const ndaStage = result.dealVelocity.find(v => v.stageName === 'nda')
      expect(ndaStage).toBeDefined()
      // Average of 10 days and 15 days = 12.5 days
      expect(ndaStage?.avgDays).toBeCloseTo(12.5, 1)

      const proposalStage = result.dealVelocity.find(v => v.stageName === 'proposal')
      expect(proposalStage).toBeDefined()
      expect(proposalStage?.avgDays).toBe(20)
    })
  })
})
