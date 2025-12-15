import { describe, it, expect } from 'vitest'
import {
  getGmailComposeUrl,
  cleanPhoneNumber,
  getWhatsAppWebUrl,
  getGoogleCalendarDayUrl,
} from '@/utils/googleLinks'

describe('googleLinks', () => {
  describe('getGmailComposeUrl', () => {
    it('should generate correct Gmail compose URL', () => {
      const url = getGmailComposeUrl('john@example.com', 'Hello World')
      expect(url).toContain('https://mail.google.com/mail/')
      expect(url).toContain('to=john%40example.com')
      expect(url).toContain('su=Hello+World')
    })

    it('should handle special characters in subject', () => {
      const url = getGmailComposeUrl('test@test.com', 'Test & Special <chars>')
      expect(url).toContain('su=Test')
    })
  })

  describe('cleanPhoneNumber', () => {
    it('should clean formatted phone numbers', () => {
      const result = cleanPhoneNumber('+55 (11) 99999-8888')
      expect(result.cleanPhone).toBe('5511999998888')
      expect(result.isValid).toBe(true)
    })

    it('should handle already clean numbers', () => {
      const result = cleanPhoneNumber('5511999998888')
      expect(result.cleanPhone).toBe('5511999998888')
      expect(result.isValid).toBe(true)
    })

    it('should return invalid for short numbers', () => {
      const result = cleanPhoneNumber('1234')
      expect(result.cleanPhone).toBe('1234')
      expect(result.isValid).toBe(false)
    })

    it('should remove all non-numeric characters', () => {
      const result = cleanPhoneNumber('+1-800-555-1234')
      expect(result.cleanPhone).toBe('18005551234')
      expect(result.isValid).toBe(true)
    })
  })

  describe('getWhatsAppWebUrl', () => {
    it('should generate correct WhatsApp Web URL', () => {
      const url = getWhatsAppWebUrl('5511999998888')
      expect(url).toBe('https://web.whatsapp.com/send?phone=5511999998888')
    })

    it('should clean phone number if it contains non-digits', () => {
      const url = getWhatsAppWebUrl('+55 11 99999-8888')
      expect(url).toBe('https://web.whatsapp.com/send?phone=5511999998888')
    })

    it('should handle phone with plus sign', () => {
      const url = getWhatsAppWebUrl('+5511999998888')
      expect(url).toBe('https://web.whatsapp.com/send?phone=5511999998888')
    })

    it('should preserve DDI/DDD when sanitizing', () => {
      const url = getWhatsAppWebUrl('+55 (11) 99999-8888')
      expect(url).toContain('phone=5511999998888')
    })
  })

  describe('getGoogleCalendarDayUrl', () => {
    it('should generate correct calendar URL', () => {
      const date = new Date('2024-03-15')
      const url = getGoogleCalendarDayUrl(date)
      expect(url).toBe('https://calendar.google.com/calendar/u/0/r/day/2024/3/15')
    })

    it('should handle different months correctly', () => {
      const date = new Date('2024-12-25')
      const url = getGoogleCalendarDayUrl(date)
      expect(url).toBe('https://calendar.google.com/calendar/u/0/r/day/2024/12/25')
    })
  })
})
