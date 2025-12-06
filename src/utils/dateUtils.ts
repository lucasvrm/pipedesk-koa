/**
 * Date utility functions for activity indicators and date operations
 */

/**
 * Checks if a given date is today
 * @param date - Date string or Date object to check
 * @returns true if the date is today, false otherwise
 */
export function isToday(date: string | Date): boolean {
  if (!date) return false
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return false
  
  const today = new Date()
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
}

/**
 * Checks if a given date is within a specified number of hours from now
 * Useful for determining "new" items (e.g., created within last 24 hours)
 * @param date - Date string or Date object to check
 * @param hours - Number of hours to check within
 * @returns true if the date is within the specified hours, false otherwise
 */
export function isWithinHours(date: string | Date, hours: number): boolean {
  if (!date) return false
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return false
  
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  return diffHours >= 0 && diffHours <= hours
}

/**
 * Checks if a date was updated today (using updatedAt timestamp)
 * @param updatedAt - Updated timestamp as string or Date
 * @returns true if updated today
 */
export function isUpdatedToday(updatedAt: string | Date | undefined): boolean {
  if (!updatedAt) return false
  return isToday(updatedAt)
}

/**
 * Checks if an item is "new" (created within last 24 hours)
 * @param createdAt - Created timestamp as string or Date
 * @returns true if created within last 24 hours
 */
export function isNew(createdAt: string | Date | undefined): boolean {
  if (!createdAt) return false
  return isWithinHours(createdAt, 24)
}
