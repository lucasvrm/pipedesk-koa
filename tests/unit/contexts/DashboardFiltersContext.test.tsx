import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { DashboardFiltersProvider, useDashboardFilters } from '@/contexts/DashboardFiltersContext'
import { ReactNode } from 'react'

describe('DashboardFiltersContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DashboardFiltersProvider>{children}</DashboardFiltersProvider>
  )

  it('should provide default filter values', () => {
    const { result } = renderHook(() => useDashboardFilters(), { wrapper })

    expect(result.current.filters.dateRangePreset).toBe('30d')
    expect(result.current.filters.selectedTeamMemberId).toBe('all')
    expect(result.current.filters.selectedOperationTypeId).toBe('all')
  })

  it('should update date range preset', () => {
    const { result } = renderHook(() => useDashboardFilters(), { wrapper })

    act(() => {
      result.current.setDateRangePreset('7d')
    })

    expect(result.current.filters.dateRangePreset).toBe('7d')
  })

  it('should update selected team member', () => {
    const { result } = renderHook(() => useDashboardFilters(), { wrapper })

    act(() => {
      result.current.setSelectedTeamMemberId('user-123')
    })

    expect(result.current.filters.selectedTeamMemberId).toBe('user-123')
  })

  it('should normalize empty team member to "all"', () => {
    const { result } = renderHook(() => useDashboardFilters(), { wrapper })

    act(() => {
      result.current.setSelectedTeamMemberId('')
    })

    expect(result.current.filters.selectedTeamMemberId).toBe('all')
  })

  it('should update selected operation type', () => {
    const { result } = renderHook(() => useDashboardFilters(), { wrapper })

    act(() => {
      result.current.setSelectedOperationTypeId('type-456')
    })

    expect(result.current.filters.selectedOperationTypeId).toBe('type-456')
  })

  it('should normalize empty operation type to "all"', () => {
    const { result } = renderHook(() => useDashboardFilters(), { wrapper })

    act(() => {
      result.current.setSelectedOperationTypeId('')
    })

    expect(result.current.filters.selectedOperationTypeId).toBe('all')
  })

  it('should reset all filters to defaults', () => {
    const { result } = renderHook(() => useDashboardFilters(), { wrapper })

    // Change all filters
    act(() => {
      result.current.setDateRangePreset('1y')
      result.current.setSelectedTeamMemberId('user-123')
      result.current.setSelectedOperationTypeId('type-456')
    })

    // Reset
    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.filters.dateRangePreset).toBe('30d')
    expect(result.current.filters.selectedTeamMemberId).toBe('all')
    expect(result.current.filters.selectedOperationTypeId).toBe('all')
  })

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = () => {}

    expect(() => {
      renderHook(() => useDashboardFilters())
    }).toThrow('useDashboardFilters must be used within a DashboardFiltersProvider')

    console.error = originalError
  })
})
