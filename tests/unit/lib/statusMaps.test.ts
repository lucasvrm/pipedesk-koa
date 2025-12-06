import { describe, it, expect } from 'vitest'
import { leadStatusMap, dealStatusMap, trackStatusMap } from '@/lib/statusMaps'
import type { LeadStatus, DealStatus } from '@/lib/types'

describe('statusMaps', () => {
  describe('leadStatusMap', () => {
    it('should map "new" to "info"', () => {
      expect(leadStatusMap('new' as LeadStatus)).toBe('info')
    })

    it('should map "contacted" to "warning"', () => {
      expect(leadStatusMap('contacted' as LeadStatus)).toBe('warning')
    })

    it('should map "qualified" to "success"', () => {
      expect(leadStatusMap('qualified' as LeadStatus)).toBe('success')
    })

    it('should map "disqualified" to "error"', () => {
      expect(leadStatusMap('disqualified' as LeadStatus)).toBe('error')
    })
  })

  describe('dealStatusMap', () => {
    it('should map "active" to "success"', () => {
      expect(dealStatusMap('active' as DealStatus)).toBe('success')
    })

    it('should map "concluded" to "info"', () => {
      expect(dealStatusMap('concluded' as DealStatus)).toBe('info')
    })

    it('should map "cancelled" to "error"', () => {
      expect(dealStatusMap('cancelled' as DealStatus)).toBe('error')
    })

    it('should map "on_hold" to "warning"', () => {
      expect(dealStatusMap('on_hold' as DealStatus)).toBe('warning')
    })
  })

  describe('trackStatusMap', () => {
    it('should use the same logic as dealStatusMap', () => {
      expect(trackStatusMap).toBe(dealStatusMap)
    })

    it('should map "active" to "success"', () => {
      expect(trackStatusMap('active' as DealStatus)).toBe('success')
    })

    it('should map "concluded" to "info"', () => {
      expect(trackStatusMap('concluded' as DealStatus)).toBe('info')
    })

    it('should map "cancelled" to "error"', () => {
      expect(trackStatusMap('cancelled' as DealStatus)).toBe('error')
    })

    it('should map "on_hold" to "warning"', () => {
      expect(trackStatusMap('on_hold' as DealStatus)).toBe('warning')
    })
  })
})
