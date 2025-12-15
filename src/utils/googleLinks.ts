/**
 * Utility functions for generating Google Workspace deep links.
 * Centralizes URL generation logic to keep components clean.
 */

/**
 * Generate Gmail compose URL with pre-filled fields.
 * Opens Gmail compose window with to address and subject pre-filled.
 * 
 * @param to - Email address to send to
 * @param subject - Email subject line
 * @returns Gmail compose URL
 * 
 * @example
 * const url = getGmailComposeUrl('john@example.com', 'Meeting Follow-up')
 * window.open(url, '_blank', 'width=800,height=600')
 */
export function getGmailComposeUrl(to: string, subject: string): string {
  // Basic email validation - ensure the email has a reasonable format
  const sanitizedTo = to.trim()
  if (!sanitizedTo || !sanitizedTo.includes('@')) {
    console.warn('[googleLinks] Invalid email address provided:', to)
  }
  
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: sanitizedTo,
    su: subject,
  })
  return `https://mail.google.com/mail/?${params.toString()}`
}

/**
 * Generate Google Calendar day view URL for a specific date.
 * Opens Google Calendar directly to the specified date in day view.
 * 
 * @param date - Date to view in the calendar
 * @returns Google Calendar day view URL
 * 
 * @example
 * const url = getGoogleCalendarDayUrl(new Date('2024-03-15'))
 * // Returns: https://calendar.google.com/calendar/u/0/r/day/2024/3/15
 */
export function getGoogleCalendarDayUrl(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // getMonth() is 0-indexed
  const day = date.getDate()
  return `https://calendar.google.com/calendar/u/0/r/day/${year}/${month}/${day}`
}

/**
 * Clean and validate a phone number for use with tel: protocol.
 * Removes all non-numeric characters and returns the clean number.
 * 
 * @param phone - Phone number string (may contain formatting characters)
 * @returns Object with cleaned phone number and validation status
 * 
 * @example
 * const { cleanPhone, isValid } = cleanPhoneNumber('+55 (11) 99999-8888')
 * // Returns: { cleanPhone: '5511999998888', isValid: true }
 */
export function cleanPhoneNumber(phone: string): { cleanPhone: string; isValid: boolean } {
  const cleanPhone = phone.replace(/\D/g, '')
  const isValid = cleanPhone.length >= 8 // Minimum length for a valid phone number
  
  if (!isValid) {
    console.warn('[googleLinks] Invalid phone number provided:', phone)
  }
  
  return { cleanPhone, isValid }
}

/**
 * Generate WhatsApp Web URL with the phone number.
 * Opens WhatsApp Web directly to the chat with the specified phone number.
 * 
 * @param phone - Phone number in E.164 format (digits only, no plus sign)
 * @returns WhatsApp Web URL
 * 
 * @example
 * const url = getWhatsAppWebUrl('5511999998888')
 * // Returns: https://web.whatsapp.com/send?phone=5511999998888
 */
export function getWhatsAppWebUrl(phone: string): string {
  // Reuse cleanPhoneNumber to ensure consistent phone cleaning logic
  const { cleanPhone } = cleanPhoneNumber(phone)
  return `https://web.whatsapp.com/send?phone=${cleanPhone}`
}
