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
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to,
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
