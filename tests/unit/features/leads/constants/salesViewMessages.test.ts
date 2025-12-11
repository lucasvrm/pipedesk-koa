import { describe, it, expect } from 'vitest'
import { SALES_VIEW_MESSAGES, getSalesViewErrorMessages } from '@/features/leads/constants/salesViewMessages'

describe('getSalesViewErrorMessages', () => {
  describe('validation_error code', () => {
    it('should return validation error messages', () => {
      const messages = getSalesViewErrorMessages('validation_error')
      
      expect(messages.title).toBe(SALES_VIEW_MESSAGES.ERROR_VALIDATION_TITLE)
      expect(messages.description).toBe(SALES_VIEW_MESSAGES.ERROR_VALIDATION_DESCRIPTION)
      expect(messages.toast).toBe(SALES_VIEW_MESSAGES.ERROR_VALIDATION_TOAST)
    })

    it('should return user-friendly validation error messages', () => {
      const messages = getSalesViewErrorMessages('validation_error')
      
      expect(messages.title).toContain('Filtros')
      expect(messages.description).toContain('inválidos')
      expect(messages.toast).toContain('Filtros inválidos')
    })
  })

  describe('sales_view_error code', () => {
    it('should return internal error messages', () => {
      const messages = getSalesViewErrorMessages('sales_view_error')
      
      expect(messages.title).toBe(SALES_VIEW_MESSAGES.ERROR_INTERNAL_TITLE)
      expect(messages.description).toBe(SALES_VIEW_MESSAGES.ERROR_INTERNAL_DESCRIPTION)
      expect(messages.toast).toBe(SALES_VIEW_MESSAGES.ERROR_INTERNAL_TOAST)
    })

    it('should return user-friendly internal error messages', () => {
      const messages = getSalesViewErrorMessages('sales_view_error')
      
      expect(messages.title).toContain('Erro interno')
      expect(messages.description).toContain('Erro interno')
      expect(messages.toast).toContain('Erro interno')
    })
  })

  describe('unknown or undefined code', () => {
    it('should return generic error messages for unknown code', () => {
      const messages = getSalesViewErrorMessages('unknown_code')
      
      expect(messages.title).toBe(SALES_VIEW_MESSAGES.ERROR_GENERIC_TITLE)
      expect(messages.description).toBe(SALES_VIEW_MESSAGES.ERROR_GENERIC_DESCRIPTION)
      expect(messages.toast).toBe(SALES_VIEW_MESSAGES.ERROR_GENERIC_TOAST)
    })

    it('should return generic error messages for undefined code', () => {
      const messages = getSalesViewErrorMessages(undefined)
      
      expect(messages.title).toBe(SALES_VIEW_MESSAGES.ERROR_GENERIC_TITLE)
      expect(messages.description).toBe(SALES_VIEW_MESSAGES.ERROR_GENERIC_DESCRIPTION)
      expect(messages.toast).toBe(SALES_VIEW_MESSAGES.ERROR_GENERIC_TOAST)
    })

    it('should return generic error messages for empty string', () => {
      const messages = getSalesViewErrorMessages('')
      
      expect(messages.title).toBe(SALES_VIEW_MESSAGES.ERROR_GENERIC_TITLE)
      expect(messages.description).toBe(SALES_VIEW_MESSAGES.ERROR_GENERIC_DESCRIPTION)
      expect(messages.toast).toBe(SALES_VIEW_MESSAGES.ERROR_GENERIC_TOAST)
    })
  })

  describe('message consistency', () => {
    it('should always return all three message fields', () => {
      const testCodes = ['validation_error', 'sales_view_error', 'unknown', undefined]
      
      testCodes.forEach(code => {
        const messages = getSalesViewErrorMessages(code)
        
        expect(messages).toHaveProperty('title')
        expect(messages).toHaveProperty('description')
        expect(messages).toHaveProperty('toast')
        expect(typeof messages.title).toBe('string')
        expect(typeof messages.description).toBe('string')
        expect(typeof messages.toast).toBe('string')
        expect(messages.title.length).toBeGreaterThan(0)
        expect(messages.description.length).toBeGreaterThan(0)
        expect(messages.toast.length).toBeGreaterThan(0)
      })
    })

    it('should not expose technical jargon in user-facing messages', () => {
      const testCodes = ['validation_error', 'sales_view_error', 'unknown', undefined]
      
      testCodes.forEach(code => {
        const messages = getSalesViewErrorMessages(code)
        
        // Check that messages don't contain technical terms
        const technicalTerms = ['API', 'HTTP', 'JSON', 'database', 'query', 'stack']
        const allMessages = [messages.title, messages.description, messages.toast].join(' ')
        
        technicalTerms.forEach(term => {
          expect(allMessages.toLowerCase()).not.toContain(term.toLowerCase())
        })
      })
    })
  })
})
