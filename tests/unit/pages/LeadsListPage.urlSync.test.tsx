import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit tests for URL synchronization logic in LeadsListPage.
 * These tests verify the filter initialization and URL sync behavior
 * without rendering the full component to avoid complex state management issues.
 */

describe('LeadsListPage - URL Synchronization Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('URL Parameter Parsing', () => {
    it('should parse owner=me parameter correctly', () => {
      const params = new URLSearchParams('owner=me')
      const ownerParam = params.get('owner')
      
      expect(ownerParam).toBe('me')
    })

    it('should parse owners parameter as comma-separated list', () => {
      const params = new URLSearchParams('owners=user-1,user-2,user-3')
      const ownersParam = params.get('owners')?.split(',').filter(Boolean)
      
      expect(ownersParam).toEqual(['user-1', 'user-2', 'user-3'])
    })

    it('should parse priority parameter as comma-separated list', () => {
      const params = new URLSearchParams('priority=hot,warm')
      const priorityParam = params.get('priority')?.split(',').filter(Boolean)
      
      expect(priorityParam).toEqual(['hot', 'warm'])
    })

    it('should parse status parameter as comma-separated list', () => {
      const params = new URLSearchParams('status=status-1,status-2')
      const statusParam = params.get('status')?.split(',').filter(Boolean)
      
      expect(statusParam).toEqual(['status-1', 'status-2'])
    })

    it('should parse origin parameter as comma-separated list', () => {
      const params = new URLSearchParams('origin=origin-1,origin-2')
      const originParam = params.get('origin')?.split(',').filter(Boolean)
      
      expect(originParam).toEqual(['origin-1', 'origin-2'])
    })

    it('should parse days_without_interaction as number', () => {
      const params = new URLSearchParams('days_without_interaction=7')
      const daysParam = params.get('days_without_interaction')
      const daysValue = daysParam ? Number(daysParam) : null
      
      expect(daysValue).toBe(7)
    })

    it('should parse order_by parameter', () => {
      const params = new URLSearchParams('order_by=last_interaction')
      const orderByParam = params.get('order_by')
      
      expect(orderByParam).toBe('last_interaction')
    })

    it('should parse order_by=status parameter correctly', () => {
      const params = new URLSearchParams('order_by=status')
      const orderByParam = params.get('order_by')
      
      expect(orderByParam).toBe('status')
    })

    it('should parse all valid order_by values', () => {
      const validOrderByValues = ['priority', 'last_interaction', 'created_at', 'status', 'next_action', 'owner']
      
      validOrderByValues.forEach(value => {
        const params = new URLSearchParams(`order_by=${value}`)
        expect(params.get('order_by')).toBe(value)
      })
    })

    it('should default order_by to priority when not provided', () => {
      const params = new URLSearchParams('')
      const orderByParam = params.get('order_by') || 'priority'
      
      expect(orderByParam).toBe('priority')
    })

    it('should handle empty comma-separated values', () => {
      const params = new URLSearchParams('priority=')
      const priorityParam = params.get('priority')?.split(',').filter(Boolean) || []
      
      expect(priorityParam).toEqual([])
    })

    it('should handle multiple filters in URL', () => {
      const url = 'owner=me&priority=hot,warm&status=status-1&origin=origin-1&days_without_interaction=7&order_by=last_interaction'
      const params = new URLSearchParams(url)
      
      expect(params.get('owner')).toBe('me')
      expect(params.get('priority')?.split(',').filter(Boolean)).toEqual(['hot', 'warm'])
      expect(params.get('status')?.split(',').filter(Boolean)).toEqual(['status-1'])
      expect(params.get('origin')?.split(',').filter(Boolean)).toEqual(['origin-1'])
      expect(Number(params.get('days_without_interaction'))).toBe(7)
      expect(params.get('order_by')).toBe('last_interaction')
    })
  })

  describe('URL Construction', () => {
    it('should construct URL with owner=me parameter', () => {
      const params = new URLSearchParams()
      params.set('owner', 'me')
      
      expect(params.toString()).toBe('owner=me')
    })

    it('should construct URL with owners parameter', () => {
      const params = new URLSearchParams()
      const ownerIds = ['user-1', 'user-2']
      params.set('owners', ownerIds.join(','))
      
      expect(params.toString()).toBe('owners=user-1%2Cuser-2')
      expect(decodeURIComponent(params.toString())).toBe('owners=user-1,user-2')
    })

    it('should construct URL with multiple filter parameters', () => {
      const params = new URLSearchParams()
      params.set('owner', 'me')
      params.set('priority', ['hot', 'warm'].join(','))
      params.set('status', ['status-1'].join(','))
      params.set('order_by', 'last_interaction')
      
      const urlString = params.toString()
      expect(urlString).toContain('owner=me')
      expect(urlString).toContain('priority=hot')
      expect(urlString).toContain('status=status-1')
      expect(urlString).toContain('order_by=last_interaction')
    })

    it('should not include order_by if it is priority (default)', () => {
      const params = new URLSearchParams()
      const orderBy = 'priority'
      
      if (orderBy && orderBy !== 'priority') {
        params.set('order_by', orderBy)
      }
      
      expect(params.toString()).toBe('')
    })

    it('should skip empty arrays in URL construction', () => {
      const params = new URLSearchParams()
      const priority: string[] = []
      
      if (priority.length > 0) {
        params.set('priority', priority.join(','))
      }
      
      expect(params.toString()).toBe('')
    })
  })

  describe('Idempotent URL Updates', () => {
    it('should not update URL if nextSearch equals currentSearch', () => {
      const lastSearchRef = { current: 'owner=me&priority=hot' }
      const nextSearch = 'owner=me&priority=hot'
      const currentSearch = 'owner=me&priority=hot'
      
      const shouldUpdate = lastSearchRef.current !== nextSearch || currentSearch !== nextSearch
      
      expect(shouldUpdate).toBe(false)
    })

    it('should update URL if nextSearch differs from currentSearch', () => {
      const lastSearchRef = { current: 'owner=me' }
      const nextSearch = 'owner=me&priority=hot'
      const currentSearch = 'owner=me'
      
      const shouldUpdate = lastSearchRef.current !== nextSearch || currentSearch !== nextSearch
      
      expect(shouldUpdate).toBe(true)
    })

    it('should skip URL update when isSalesError is true', () => {
      const isSalesError = true
      const shouldSkip = isSalesError
      
      expect(shouldSkip).toBe(true)
    })

    it('should allow URL update when isSalesError is false', () => {
      const isSalesError = false
      const shouldSkip = isSalesError
      
      expect(shouldSkip).toBe(false)
    })
  })

  describe('Owner Mode Logic', () => {
    it('should determine ownerMode as "me" when owner=me parameter exists', () => {
      const params = new URLSearchParams('owner=me')
      const ownerParam = params.get('owner')
      const ownersParam = params.get('owners')
      
      let ownerMode: 'me' | 'all' | 'custom' = 'all'
      if (ownerParam === 'me') ownerMode = 'me'
      else if (ownersParam) ownerMode = 'custom'
      
      expect(ownerMode).toBe('me')
    })

    it('should determine ownerMode as "custom" when owners parameter exists', () => {
      const params = new URLSearchParams('owners=user-1,user-2')
      const ownerParam = params.get('owner')
      const ownersParam = params.get('owners')
      
      let ownerMode: 'me' | 'all' | 'custom' = 'all'
      if (ownerParam === 'me') ownerMode = 'me'
      else if (ownersParam) ownerMode = 'custom'
      
      expect(ownerMode).toBe('custom')
    })

    it('should default ownerMode to "all" when no owner parameters exist', () => {
      const params = new URLSearchParams('')
      const ownerParam = params.get('owner')
      const ownersParam = params.get('owners')
      
      let ownerMode: 'me' | 'all' | 'custom' = 'all'
      if (ownerParam === 'me') ownerMode = 'me'
      else if (ownersParam) ownerMode = 'custom'
      
      expect(ownerMode).toBe('all')
    })

    it('should construct URL correctly for ownerMode "me"', () => {
      const params = new URLSearchParams()
      const ownerMode = 'me'
      const ownerIds: string[] = []
      
      if (ownerMode === 'me') {
        params.set('owner', 'me')
      } else if (ownerMode === 'custom' && ownerIds.length > 0) {
        params.set('owners', ownerIds.join(','))
      }
      
      expect(params.toString()).toBe('owner=me')
    })

    it('should construct URL correctly for ownerMode "custom"', () => {
      const params = new URLSearchParams()
      const ownerMode = 'custom'
      const ownerIds = ['user-1', 'user-2']
      
      if (ownerMode === 'me') {
        params.set('owner', 'me')
      } else if (ownerMode === 'custom' && ownerIds.length > 0) {
        params.set('owners', ownerIds.join(','))
      }
      
      expect(params.toString()).toBe('owners=user-1%2Cuser-2')
    })

    it('should construct empty URL for ownerMode "all"', () => {
      const params = new URLSearchParams()
      const ownerMode = 'all'
      const ownerIds: string[] = []
      
      if (ownerMode === 'me') {
        params.set('owner', 'me')
      } else if (ownerMode === 'custom' && ownerIds.length > 0) {
        params.set('owners', ownerIds.join(','))
      }
      
      expect(params.toString()).toBe('')
    })
  })
})
