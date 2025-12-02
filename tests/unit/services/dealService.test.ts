import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDeal, updateDeal } from '@/services/dealService'
import { supabase } from '@/lib/supabaseClient'
import { Deal } from '@/services/dealService'

type SupabaseFrom = typeof supabase.from

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('Deal Service - critical flows', () => {
  const mockFrom = supabase.from as unknown as vi.MockedFunction<SupabaseFrom>

  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('creates deals with default status and seeds player track when available', async () => {
    const masterInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'deal-123',
            client_name: 'Test Client',
            volume: 100000,
            operation_type: 'ccb',
            deadline: '2024-12-31',
            observations: 'Urgent',
            status: 'active',
            fee_percentage: 2.5,
            created_by: 'user-1',
            company_id: 'company-1',
            deal_product: 'Structured Note',
            createdByUser: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
            company: { id: 'company-1', name: 'ACME', type: 'enterprise', site: 'acme.com' },
          },
          error: null,
        }),
      }),
    })

    const dealMemberInsert = vi.fn().mockResolvedValue({ error: null })
    const playerTrackInsert = vi.fn().mockResolvedValue({ error: null })

    const playerSingle = vi.fn().mockResolvedValue({ data: { name: 'Player One' }, error: null })
    const playersSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: playerSingle }) })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'master_deals') return { insert: masterInsert } as never
      if (table === 'deal_members') return { insert: dealMemberInsert } as never
      if (table === 'players') return { select: playersSelect } as never
      if (table === 'player_tracks') return { insert: playerTrackInsert } as never
      return {} as never
    })

    const result = await createDeal({
      clientName: 'Test Client',
      volume: 100000,
      createdBy: 'user-1',
      observations: 'Urgent',
      playerId: 'player-1',
      initialStage: 'proposal',
    })

    expect(masterInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        client_name: 'Test Client',
        status: 'active',
      }),
    )
    expect(dealMemberInsert).toHaveBeenCalledWith({ deal_id: 'deal-123', user_id: 'user-1' })
    expect(playersSelect).toHaveBeenCalledWith('name')
    expect(playerTrackInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        master_deal_id: 'deal-123',
        player_id: 'player-1',
        current_stage: 'proposal',
        track_volume: 100000,
      }),
    )

    expect(result).toMatchObject<Deal>({
      id: 'deal-123',
      clientName: 'Test Client',
      volume: 100000,
      status: 'active',
      createdBy: 'user-1',
      companyId: 'company-1',
    })
  })

  it('does not create player track when lookup fails but still returns created deal', async () => {
    const masterInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'deal-404',
            client_name: 'No Player',
            volume: 50000,
            operation_type: 'ccb',
            status: 'active',
            created_by: 'user-2',
          },
          error: null,
        }),
      }),
    })

    const dealMemberInsert = vi.fn().mockResolvedValue({ error: null })
    const playerSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('not found') })
    const playersSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: playerSingle }) })
    const playerTrackInsert = vi.fn()

    mockFrom.mockImplementation((table: string) => {
      if (table === 'master_deals') return { insert: masterInsert } as never
      if (table === 'deal_members') return { insert: dealMemberInsert } as never
      if (table === 'players') return { select: playersSelect } as never
      if (table === 'player_tracks') return { insert: playerTrackInsert } as never
      return {} as never
    })

    const result = await createDeal({
      clientName: 'No Player',
      createdBy: 'user-2',
      playerId: 'missing-player',
    })

    expect(playerTrackInsert).not.toHaveBeenCalled()
    expect(result.clientName).toBe('No Player')
  })

  it('updates deals with provided fields and timestamps', async () => {
    const updateSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'deal-789',
        client_name: 'Updated Client',
        volume: 200000,
        status: 'concluded',
        operation_type: 'fidc',
        created_by: 'user-3',
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single: updateSingle })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'master_deals') return { update } as never
      return {} as never
    })

    const result = await updateDeal('deal-789', {
      clientName: 'Updated Client',
      volume: 200000,
      status: 'concluded',
      operationType: 'fidc',
    })

    expect(update).toHaveBeenCalledTimes(1)
    const payload = update.mock.calls[0][0]
    expect(payload).toMatchObject({
      client_name: 'Updated Client',
      volume: 200000,
      status: 'concluded',
      operation_type: 'fidc',
    })
    expect(payload.updated_at).toBeDefined()

    expect(eq).toHaveBeenCalledWith('deal-789')
    expect(select).toHaveBeenCalled()
    expect(result).toMatchObject<Deal>({
      id: 'deal-789',
      clientName: 'Updated Client',
      status: 'concluded',
      operationType: 'fidc',
    })
  })
})
