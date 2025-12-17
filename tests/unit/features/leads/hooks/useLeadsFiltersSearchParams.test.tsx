import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useSearchParams } from 'react-router-dom'
import {
  useLeadsFiltersSearchParams,
  parseFiltersFromSearchParams,
  serializeFiltersToSearchParams,
  AppliedLeadsFilters,
} from '@/features/leads/hooks/useLeadsFiltersSearchParams'
import { ReactNode } from 'react'

// Wrapper with MemoryRouter for testing hooks that use react-router
function createWrapper(initialEntries: string[] = ['/']) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  }
}

describe('parseFiltersFromSearchParams', () => {
  it('should parse empty params with defaults', () => {
    const params = new URLSearchParams()
    const result = parseFiltersFromSearchParams(params)

    expect(result).toEqual({
      view: 'sales',
      search: '',
      ownerMode: 'all',
      ownerIds: [],
      priority: [],
      status: [],
      origin: [],
      tags: [],
      nextAction: [],
      daysWithoutInteraction: null,
      orderBy: 'priority',
      page: 1,
    })
  })

  it('should parse multi-value CSV params', () => {
    const params = new URLSearchParams({
      status: 'status-1,status-2',
      priority: 'hot,warm',
      tags: 'tag-1,tag-2,tag-3',
      next_action: 'call_first_time,send_follow_up',
    })
    const result = parseFiltersFromSearchParams(params)

    expect(result.status).toEqual(['status-1', 'status-2'])
    expect(result.priority).toEqual(['hot', 'warm'])
    expect(result.tags).toEqual(['tag-1', 'tag-2', 'tag-3'])
    expect(result.nextAction).toEqual(['call_first_time', 'send_follow_up'])
  })

  it('should parse owner modes correctly', () => {
    // owner=me
    const params1 = new URLSearchParams({ owner: 'me' })
    expect(parseFiltersFromSearchParams(params1).ownerMode).toBe('me')

    // ownerIds (custom mode)
    const params2 = new URLSearchParams({ ownerIds: 'user-1,user-2' })
    expect(parseFiltersFromSearchParams(params2).ownerMode).toBe('custom')
    expect(parseFiltersFromSearchParams(params2).ownerIds).toEqual(['user-1', 'user-2'])

    // no owner param (all mode)
    const params3 = new URLSearchParams()
    expect(parseFiltersFromSearchParams(params3).ownerMode).toBe('all')
  })

  it('should parse view with backward compatibility for "list"', () => {
    expect(parseFiltersFromSearchParams(new URLSearchParams({ view: 'grid' })).view).toBe('grid')
    expect(parseFiltersFromSearchParams(new URLSearchParams({ view: 'kanban' })).view).toBe('kanban')
    expect(parseFiltersFromSearchParams(new URLSearchParams({ view: 'sales' })).view).toBe('sales')
    expect(parseFiltersFromSearchParams(new URLSearchParams({ view: 'list' })).view).toBe('sales') // backward compat
  })

  it('should validate orderBy values', () => {
    expect(parseFiltersFromSearchParams(new URLSearchParams({ order_by: 'last_interaction' })).orderBy).toBe('last_interaction')
    expect(parseFiltersFromSearchParams(new URLSearchParams({ order_by: 'invalid' })).orderBy).toBe('priority') // default
    expect(parseFiltersFromSearchParams(new URLSearchParams()).orderBy).toBe('priority') // default
  })

  it('should parse days_without_interaction as number', () => {
    expect(parseFiltersFromSearchParams(new URLSearchParams({ days_without_interaction: '7' })).daysWithoutInteraction).toBe(7)
    expect(parseFiltersFromSearchParams(new URLSearchParams()).daysWithoutInteraction).toBeNull()
  })

  it('should parse page with minimum of 1', () => {
    expect(parseFiltersFromSearchParams(new URLSearchParams({ page: '5' })).page).toBe(5)
    expect(parseFiltersFromSearchParams(new URLSearchParams({ page: '0' })).page).toBe(1)
    expect(parseFiltersFromSearchParams(new URLSearchParams({ page: '-1' })).page).toBe(1)
    expect(parseFiltersFromSearchParams(new URLSearchParams()).page).toBe(1)
  })
})

describe('serializeFiltersToSearchParams', () => {
  const defaultFilters: AppliedLeadsFilters = {
    view: 'sales',
    search: '',
    ownerMode: 'all',
    ownerIds: [],
    priority: [],
    status: [],
    origin: [],
    tags: [],
    nextAction: [],
    daysWithoutInteraction: null,
    orderBy: 'priority',
    page: 1,
  }

  it('should produce empty params for default filters', () => {
    const params = serializeFiltersToSearchParams(defaultFilters)
    expect(params.toString()).toBe('')
  })

  it('should serialize multi-value filters as CSV', () => {
    const filters: AppliedLeadsFilters = {
      ...defaultFilters,
      status: ['status-1', 'status-2'],
      priority: ['hot', 'warm'],
    }
    const params = serializeFiltersToSearchParams(filters)

    expect(params.get('status')).toBe('status-1,status-2')
    expect(params.get('priority')).toBe('hot,warm')
  })

  it('should serialize owner mode correctly', () => {
    const meFilters: AppliedLeadsFilters = { ...defaultFilters, ownerMode: 'me' }
    expect(serializeFiltersToSearchParams(meFilters).get('owner')).toBe('me')

    const customFilters: AppliedLeadsFilters = { ...defaultFilters, ownerMode: 'custom', ownerIds: ['user-1'] }
    expect(serializeFiltersToSearchParams(customFilters).get('ownerIds')).toBe('user-1')
    expect(serializeFiltersToSearchParams(customFilters).get('owner')).toBeNull()
  })

  it('should only include non-default values', () => {
    const filters: AppliedLeadsFilters = {
      ...defaultFilters,
      view: 'grid',
      orderBy: 'created_at',
      page: 3,
    }
    const params = serializeFiltersToSearchParams(filters)

    expect(params.get('view')).toBe('grid')
    expect(params.get('order_by')).toBe('created_at')
    expect(params.get('page')).toBe('3')
  })

  it('should serialize days_without_interaction when set', () => {
    const filters: AppliedLeadsFilters = { ...defaultFilters, daysWithoutInteraction: 14 }
    const params = serializeFiltersToSearchParams(filters)

    expect(params.get('days_without_interaction')).toBe('14')
  })

  it('should roundtrip parse/serialize correctly', () => {
    const original = new URLSearchParams({
      view: 'grid',
      q: 'test search',
      status: 'status-1,status-2',
      priority: 'hot',
      next_action: 'call_first_time',
      days_without_interaction: '7',
      order_by: 'last_interaction',
      page: '2',
    })

    const parsed = parseFiltersFromSearchParams(original)
    const serialized = serializeFiltersToSearchParams(parsed)

    expect(serialized.get('view')).toBe('grid')
    expect(serialized.get('q')).toBe('test search')
    expect(serialized.get('status')).toBe('status-1,status-2')
    expect(serialized.get('priority')).toBe('hot')
    expect(serialized.get('next_action')).toBe('call_first_time')
    expect(serialized.get('days_without_interaction')).toBe('7')
    expect(serialized.get('order_by')).toBe('last_interaction')
    expect(serialized.get('page')).toBe('2')
  })
})

describe('useLeadsFiltersSearchParams', () => {
  it('should return appliedFilters derived from URL', () => {
    const { result } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads?status=status-1&priority=hot']),
    })

    expect(result.current.appliedFilters.status).toEqual(['status-1'])
    expect(result.current.appliedFilters.priority).toEqual(['hot'])
  })

  it('should update URL when toggling a multi-select value', () => {
    const { result } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads']),
    })

    expect(result.current.appliedFilters.status).toEqual([])

    act(() => {
      result.current.actions.toggleMulti('status', 'status-1')
    })

    expect(result.current.appliedFilters.status).toEqual(['status-1'])

    // Toggle again to remove
    act(() => {
      result.current.actions.toggleMulti('status', 'status-1')
    })

    expect(result.current.appliedFilters.status).toEqual([])
  })

  it('should reset page to 1 when filter changes', () => {
    const { result } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads?page=5']),
    })

    expect(result.current.appliedFilters.page).toBe(5)

    act(() => {
      result.current.actions.toggleMulti('status', 'status-1')
    })

    expect(result.current.appliedFilters.page).toBe(1)
  })

  it('should NOT reset page when calling setPage', () => {
    const { result } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads?status=status-1']),
    })

    act(() => {
      result.current.actions.setPage(3)
    })

    expect(result.current.appliedFilters.page).toBe(3)
  })

  it('should clear all filters except view', () => {
    const { result } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads?view=grid&status=s1&priority=hot&q=test&page=3']),
    })

    expect(result.current.appliedFilters.view).toBe('grid')
    expect(result.current.appliedFilters.status).toEqual(['s1'])

    act(() => {
      result.current.actions.clearAll()
    })

    expect(result.current.appliedFilters.view).toBe('grid') // Kept
    expect(result.current.appliedFilters.status).toEqual([]) // Cleared
    expect(result.current.appliedFilters.search).toBe('') // Cleared
    expect(result.current.appliedFilters.page).toBe(1) // Reset
  })

  it('should clear a specific filter', () => {
    const { result } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads?status=s1,s2&origin=o1']),
    })

    act(() => {
      result.current.actions.clearFilter('status')
    })

    expect(result.current.appliedFilters.status).toEqual([])
    expect(result.current.appliedFilters.origin).toEqual(['o1']) // Untouched
  })

  it('should calculate activeFiltersCount correctly', () => {
    const { result: result1 } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads']),
    })
    expect(result1.current.activeFiltersCount).toBe(0)

    const { result: result2 } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads?status=s1&priority=hot&owner=me']),
    })
    expect(result2.current.activeFiltersCount).toBe(3) // status, priority, owner

    const { result: result3 } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads?days_without_interaction=7']),
    })
    expect(result3.current.activeFiltersCount).toBe(1)
  })

  it('should set owner mode and clear ownerIds when not custom', () => {
    const { result } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads?ownerIds=user-1,user-2']),
    })

    expect(result.current.appliedFilters.ownerMode).toBe('custom')
    expect(result.current.appliedFilters.ownerIds).toEqual(['user-1', 'user-2'])

    act(() => {
      result.current.actions.setOwnerMode('me')
    })

    expect(result.current.appliedFilters.ownerMode).toBe('me')
    expect(result.current.appliedFilters.ownerIds).toEqual([])
  })

  it('should set multiple values at once with setMulti', () => {
    const { result } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads']),
    })

    act(() => {
      result.current.actions.setMulti('nextAction', ['call_first_time', 'send_follow_up', 'schedule_meeting'])
    })

    expect(result.current.appliedFilters.nextAction).toEqual(['call_first_time', 'send_follow_up', 'schedule_meeting'])
  })

  it('should set search term', () => {
    const { result } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads']),
    })

    act(() => {
      result.current.actions.setSearch('company name')
    })

    expect(result.current.appliedFilters.search).toBe('company name')
  })

  it('should set orderBy', () => {
    const { result } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads']),
    })

    act(() => {
      result.current.actions.setOrderBy('created_at')
    })

    expect(result.current.appliedFilters.orderBy).toBe('created_at')
  })

  it('should set daysWithoutInteraction', () => {
    const { result } = renderHook(() => useLeadsFiltersSearchParams(), {
      wrapper: createWrapper(['/leads']),
    })

    act(() => {
      result.current.actions.setDaysWithoutInteraction(7)
    })

    expect(result.current.appliedFilters.daysWithoutInteraction).toBe(7)

    act(() => {
      result.current.actions.setDaysWithoutInteraction(null)
    })

    expect(result.current.appliedFilters.daysWithoutInteraction).toBeNull()
  })
})
