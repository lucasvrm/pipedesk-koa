import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { SystemMetadataProvider } from '@/contexts/SystemMetadataContext'
import { useLabel } from '@/hooks/useLabel'
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
    name: 'Price Too High',
    description: 'Customer found price too high',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  }
]

describe('useLabel', () => {
  const createMockResponse = (data: any) => ({
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK'
  })

  beforeEach(() => {
    const mockFrom = vi.fn()
    
    mockFrom.mockImplementation((table: string) => {
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => {
          if (table === 'pipeline_stages') return Promise.resolve(createMockResponse(mockStages))
          if (table === 'operation_types') return Promise.resolve(createMockResponse(mockOperationTypes))
          if (table === 'loss_reasons') return Promise.resolve(createMockResponse(mockLossReasons))
          if (table === 'system_settings') return Promise.resolve(createMockResponse([]))
          return Promise.resolve(createMockResponse([]))
        })
      }))
      
      return { select: mockSelect }
    })
    
    vi.mocked(supabase.from).mockImplementation(mockFrom as any)
  })

  it('should resolve stage label by ID', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useLabel(), { wrapper })

    await waitFor(() => {
      expect(result.current.getLabel('stage', 'stage-1')).toBe('Prospecção')
    })
  })

  it('should resolve operation type label by ID', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useLabel(), { wrapper })

    await waitFor(() => {
      expect(result.current.getLabel('operation', 'op-1')).toBe('CRI Land')
    })
  })

  it('should resolve loss reason label by ID', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useLabel(), { wrapper })

    await waitFor(() => {
      expect(result.current.getLabel('lossReason', 'loss-1')).toBe('Price Too High')
    })
  })

  it('should resolve status labels with hardcoded values', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useLabel(), { wrapper })

    await waitFor(() => {
      expect(result.current.getLabel('status', 'active')).toBe('Ativo')
      expect(result.current.getLabel('status', 'concluded')).toBe('Concluído')
      expect(result.current.getLabel('status', 'cancelled')).toBe('Cancelado')
      expect(result.current.getLabel('status', 'on_hold')).toBe('Em Espera')
    })
  })

  it('should return formatted key as fallback for unknown entities', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useLabel(), { wrapper })

    await waitFor(() => {
      expect(result.current.getLabel('stage', 'unknown_stage')).toBe('Unknown Stage')
      expect(result.current.getLabel('operation', 'test-operation')).toBe('Test Operation')
    })
  })

  it('should format keys correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useLabel(), { wrapper })

    await waitFor(() => {
      expect(result.current.formatKey('snake_case_text')).toBe('Snake Case Text')
      expect(result.current.formatKey('kebab-case-text')).toBe('Kebab Case Text')
      expect(result.current.formatKey('mixed_case-text')).toBe('Mixed Case Text')
    })
  })

  it('should return empty string for empty key', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemMetadataProvider>{children}</SystemMetadataProvider>
    )

    const { result } = renderHook(() => useLabel(), { wrapper })

    await waitFor(() => {
      expect(result.current.getLabel('stage', '')).toBe('')
    })
  })
})
