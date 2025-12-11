/**
 * Tracks Sales View failures to enable automatic fallback behavior
 * when the feature is persistently unavailable.
 */

const STORAGE_KEY = 'sales-view-failure-tracker'
const FAILURE_THRESHOLD = 3 // Number of consecutive failures before auto-fallback
const FAILURE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes - reset counter if no failures in this window

interface FailureRecord {
  count: number
  lastFailureAt: number
  preferredFallback?: 'grid' | 'kanban'
}

/**
 * Get current failure tracking data
 */
function getFailureRecord(): FailureRecord {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { count: 0, lastFailureAt: 0 }
    return JSON.parse(stored)
  } catch (error) {
    console.error('[SalesView] Failed to read failure tracker:', error)
    return { count: 0, lastFailureAt: 0 }
  }
}

/**
 * Save failure tracking data
 */
function saveFailureRecord(record: FailureRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch (error) {
    console.error('[SalesView] Failed to save failure tracker:', error)
  }
}

/**
 * Record a Sales View failure
 */
export function recordSalesViewFailure(): void {
  const now = Date.now()
  const record = getFailureRecord()
  
  // Reset count if last failure was outside the window
  const timeSinceLastFailure = now - record.lastFailureAt
  const shouldReset = timeSinceLastFailure > FAILURE_WINDOW_MS
  
  const newRecord: FailureRecord = {
    count: shouldReset ? 1 : record.count + 1,
    lastFailureAt: now,
    preferredFallback: record.preferredFallback
  }
  
  saveFailureRecord(newRecord)
  
  console.log(`[SalesView] Failure recorded (${newRecord.count}/${FAILURE_THRESHOLD})`, {
    timeSinceLastFailure,
    shouldReset
  })
}

/**
 * Record a successful Sales View load
 */
export function recordSalesViewSuccess(): void {
  const record = getFailureRecord()
  
  // Only reset if there were previous failures
  if (record.count > 0) {
    console.log('[SalesView] Success after failures, resetting counter')
    // Preserve preferred fallback when resetting
    saveFailureRecord({ count: 0, lastFailureAt: 0, preferredFallback: record.preferredFallback })
  }
}

/**
 * Check if Sales View has been failing persistently
 */
export function hasPersistentFailures(): boolean {
  const record = getFailureRecord()
  const now = Date.now()
  const timeSinceLastFailure = now - record.lastFailureAt
  
  // Consider failures stale if they're outside the window
  if (timeSinceLastFailure > FAILURE_WINDOW_MS) {
    return false
  }
  
  return record.count >= FAILURE_THRESHOLD
}

/**
 * Get the preferred fallback view mode when Sales View is failing
 */
export function getPreferredFallback(): 'grid' | 'kanban' {
  const record = getFailureRecord()
  return record.preferredFallback || 'grid'
}

/**
 * Set the preferred fallback view mode
 */
export function setPreferredFallback(mode: 'grid' | 'kanban'): void {
  const record = getFailureRecord()
  saveFailureRecord({ ...record, preferredFallback: mode })
  console.log(`[SalesView] Preferred fallback set to: ${mode}`)
}

/**
 * Clear all failure tracking data (useful for testing/debugging)
 */
export function clearFailureTracking(): void {
  localStorage.removeItem(STORAGE_KEY)
  console.log('[SalesView] Failure tracking cleared')
}
