import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { SystemMetadataProvider } from '@/contexts/SystemMetadataContext'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { supabase } from '@/lib/supabaseClient'

// Mock supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}))

const mockStages = [
  {
    id: 'stage-1',
    pipeline_id: null,
    name: 'Prospecção',
    color: '#3b82f6',
    stage_order: 1,
    probability: 10,
    is_default: false,
    active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'stage-2',
    pipeline_id: null,
    name: 'Negociação',
    color: '#10b981',
    stage_order: 2,
    probability: 50,
    is_default: false,
    active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockOperationTypes = [
  {
    id: 'op-1',
    name: 'CRI Land',
    description: 'CRI Land operations',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockLossReasons = [
  {
    id: 'loss-1',
    name: 'Price too high',
    description: 'Customer found price too high',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  }
]

const mockSettings = [
  {
    key: 'test_setting',
    value: { enabled: true },
    description: 'Test setting',
    updated_at: '2024-01-01T00:00:00Z',
    updated_by: 'user-1'
  }
]

describe('useSystemMetadata', () => {
  const createMockResponse = (data: any) => ({
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK'
  })

  beforeEach(() => {
    // Setup mock responses
    const mockFrom = vi.fn()
    
    mockFrom.mockImplementation((table: string) => {
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => {
          if (table === 'pipeline_stages') return Promise.resolve(createMockResponse(mockStages))
          if (table === 'operation_types') return Promise.resolve(createMockResponse(mockOperationTypes))
          if (table === 'loss_reasons') return Promise.resolve(createMockResponse(mockLossReasons))
          if (table === 'system_settings') return Promise.resolve(createMockResponse(mockSettings))
          return Promise.resolve(createMockResponse([]))
        })
      }))
      
      return { select: mockSelect }
    })
    
    vi.mocked(supabase.from).mockImplementation(mockFrom as any)
  })

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useSystemMetadata())
    }).toThrow('useSystemMetadata must be used within a SystemMetadataProvider')
  })

  it('should provide system metadata from context', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useSystemMetadata(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stages).toHaveLength(2)
    expect(result.current.operationTypes).toHaveLength(1)
    expect(result.current.lossReasons).toHaveLength(1)
    expect(result.current.settings).toHaveLength(1)
  })

  it('should get stage probability by ID', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useSystemMetadata(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.getStageProbability('stage-1')).toBe(10)
    expect(result.current.getStageProbability('stage-2')).toBe(50)
    expect(result.current.getStageProbability('non-existent')).toBe(0)
  })

  it('should get stage by ID', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useSystemMetadata(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const stage = result.current.getStageById('stage-1')
    expect(stage).toBeDefined()
    expect(stage?.name).toBe('Prospecção')
    expect(stage?.probability).toBe(10)
  })

  it('should get operation type by ID', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useSystemMetadata(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const operationType = result.current.getOperationTypeById('op-1')
    expect(operationType).toBeDefined()
    expect(operationType?.name).toBe('CRI Land')
  })

  it('should get loss reason by ID', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useSystemMetadata(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const lossReason = result.current.getLossReasonById('loss-1')
    expect(lossReason).toBeDefined()
    expect(lossReason?.name).toBe('Price too high')
  })

  it('should get setting by key', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useSystemMetadata(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const setting = result.current.getSetting('test_setting')
    expect(setting).toEqual({ enabled: true })
  })
})
