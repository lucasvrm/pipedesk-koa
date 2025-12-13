# Sales View Resilience Implementation - Complete Summary

## Overview
This document describes the implementation of improved resilience for the Sales View feature in the `/leads` route. The solution ensures users can continue working normally in Grid/Kanban views when Sales View is temporarily unavailable or experiencing persistent failures.

## Problem Statement
When Sales View API is down for extended periods (e.g., during development or temporary unavailability), users should be able to:
1. Continue working normally in Grid/Kanban modes
2. Understand clearly what's happening (specific to Sales View)
3. Have quick access to alternative views
4. Not be stuck in a broken state

## Solution Architecture

### 1. Failure Tracking System (`salesViewFailureTracker.ts`)

A new utility module that tracks Sales View failures persistently in localStorage.

**Key Features:**
- **Consecutive Failure Tracking**: Counts failures within a 5-minute window
- **Automatic Fallback**: After 3 consecutive failures, auto-switches to preferred view
- **Preferred View Memory**: Remembers user's chosen fallback (Grid or Kanban)
- **Auto-Reset**: Counter resets on successful loads
- **Time-Window Logic**: Failures older than 5 minutes don't count

**API:**
```typescript
// Track a failure
recordSalesViewFailure(): void

// Record success (resets counter if there were failures)
recordSalesViewSuccess(): void

// Check if failures are persistent
hasPersistentFailures(): boolean

// Get/Set preferred fallback view
getPreferredFallback(): 'grid' | 'kanban'
setPreferredFallback(mode: 'grid' | 'kanban'): void
```

**Configuration:**
- `FAILURE_THRESHOLD`: 3 failures
- `FAILURE_WINDOW_MS`: 5 minutes (300,000ms)
- `STORAGE_KEY`: 'sales-view-failure-tracker'

### 2. Smart View Initialization (LeadsListPage.tsx)

Enhanced the initial view mode selection logic to handle failures intelligently.

**Priority Order:**
1. URL parameter (`?view=grid/kanban/sales`) - highest priority for explicit navigation
2. Persistent failure check - auto-fallback if Sales View is consistently failing
3. Saved preferences - user's last selected view
4. Default - 'sales' mode when everything is healthy

**Code Flow:**
```typescript
// On component mount
1. Check URL param ?view=
2. If no URL param, check localStorage preferences
3. If preferences show 'sales', check hasPersistentFailures()
4. If persistent failures, use getPreferredFallback()
5. Otherwise, use saved preference or default to 'sales'
```

### 3. Enhanced Error UI

Completely redesigned error state in both LeadsListPage and LeadSalesViewPage.

**Changes Made:**
- **Larger, More Prominent Icon**: 20x20 (was 16x16) with ring decoration
- **Clearer Messaging**: Specific to Sales View feature, not generic error
- **Two Primary Actions**: Grid and Kanban buttons as large, primary actions
- **Icons on Buttons**: Visual indicators (SquaresFour, Kanban icons)
- **Retry as Secondary**: Moved to smaller, outline button below
- **Better Spacing**: More breathing room (gap-6 instead of gap-4)
- **Visual Hierarchy**: Uses border-dashed and destructive tint

**Error Message Strategy:**
- Old: "Não foi possível carregar a visão de vendas"
- New: "Sales View está temporariamente indisponível"
- Subtitle: "O problema é específico da visualização Sales. Continue trabalhando em modo Grade ou Kanban."

### 4. View Mode Tracking

Added intelligent tracking of user preferences during errors.

**Behavior:**
- When user switches from Sales to Grid/Kanban during error → saves as preferred fallback
- On next load with persistent failures → auto-switches to preferred view
- Resets counter on successful load → allows trying Sales View again
- Preserves preference even after counter reset → consistent fallback behavior

### 5. Independence Verification

Confirmed that Grid and Kanban views are completely independent of Sales View:

**Separate Data Sources:**
- **Grid/Kanban**: `useLeads(filters)` - standard leads API
- **Sales View**: `useLeadsSalesView(salesViewQuery, { enabled: viewMode === 'sales' })`

**Query Control:**
- Sales View query only enabled when `viewMode === 'sales'`
- Grid/Kanban work with any Sales View state (loading, error, success)
- No data dependencies between views

## User Experience Flows

### Flow 1: Sales View Working Normally
```
User visits /leads
  → viewMode initializes to 'sales' (default)
  → Sales View loads successfully
  → recordSalesViewSuccess() called
  → Counter reset (if any previous failures)
  → User sees Sales View data
```

### Flow 2: First Sales View Error
```
User visits /leads with Sales View enabled
  → Sales View API fails
  → recordSalesViewFailure() called (count: 1)
  → Error UI shown with retry option
  → User can:
    a) Click "Retry" → refetch attempted
    b) Click "Abrir em Grade" → switches to Grid, saves preference
    c) Click "Abrir em Kanban" → switches to Kanban, saves preference
```

### Flow 3: Persistent Failures (3+ times)
```
User visits /leads (Sales View would be default)
  → hasPersistentFailures() returns true
  → getPreferredFallback() returns 'grid' (or 'kanban')
  → viewMode automatically set to 'grid'
  → User sees Grid view immediately
  → No broken Sales View attempt
  → User can manually switch to Sales View if desired
```

### Flow 4: Recovery After Failures
```
Sales View becomes available again
  → User tries Sales View (manually or auto on next session)
  → Sales View loads successfully
  → recordSalesViewSuccess() called
  → Counter reset to 0
  → preferredFallback preserved for future failures
  → Normal operation resumed
```

## Technical Implementation Details

### Files Changed

1. **`src/features/leads/utils/salesViewFailureTracker.ts`** (NEW)
   - 113 lines
   - Handles all failure tracking logic
   - LocalStorage-based persistence
   - Type-safe interfaces

2. **`src/features/leads/pages/LeadsListPage.tsx`**
   - Added failure tracker imports
   - Enhanced viewMode initialization (lines 70-99)
   - Added setViewMode wrapper with tracking (lines 101-108)
   - Added success recording flag (line 133)
   - Updated error handling effect (lines 303-341)
   - Redesigned error UI (lines 889-929)
   - Added URL param support

3. **`src/features/leads/pages/LeadSalesViewPage.tsx`**
   - Added icon imports (SquaresFour, Kanban)
   - Enhanced error UI (lines 238-279)
   - Added navigation with query params

4. **`src/features/leads/constants/salesViewMessages.ts`**
   - Updated error messages to be more specific
   - Changed button labels to be more actionable
   - Added ERROR_DESCRIPTION_ALTERNATE message

### Code Quality

**Type Safety:**
- All functions properly typed
- Type guards for URL param validation
- No `any` types except adapter (existing code)

**Error Handling:**
- Try-catch blocks in localStorage operations
- Graceful degradation if storage fails
- Console logging for debugging

**Performance:**
- localStorage reads are minimal and cached
- No unnecessary re-renders
- Success recording happens once per load

**Testing:**
- Builds successfully: ✅
- Code review passed: ✅
- Security scan (CodeQL): ✅ 0 alerts
- Type checking: ✅

## Configuration & Tuning

The failure tracking can be tuned by modifying constants in `salesViewFailureTracker.ts`:

```typescript
// Number of failures before auto-fallback
const FAILURE_THRESHOLD = 3

// Time window for counting failures (5 minutes)
const FAILURE_WINDOW_MS = 5 * 60 * 1000
```

**Recommended Values:**
- **Development**: THRESHOLD=2, WINDOW=3 min (faster feedback)
- **Production**: THRESHOLD=3, WINDOW=5 min (current, balanced)
- **Strict**: THRESHOLD=5, WINDOW=10 min (more forgiving)

## Maintenance & Debugging

### Console Logging

All logs use `[SalesView]` prefix for easy filtering:

```
[SalesView] Failure recorded (1/3)
[SalesView] Failure recorded (2/3)
[SalesView] Failure recorded (3/3)
[SalesView] Persistent failures detected, falling back to: grid
[SalesView] User switched to grid during error, saving as preferred fallback
[SalesView] Success after failures, resetting counter
```

### Debugging Tips

1. **Check Failure State**: Open localStorage in DevTools, look for `sales-view-failure-tracker`
2. **Filter Console**: Search for `[SalesView]` to see all tracking events
3. **Manual Reset**: Call `clearFailureTracking()` from console
4. **Test Fallback**: Manually set failures with `recordSalesViewFailure()`

### Common Scenarios

**Scenario: User reports being stuck in Grid view**
- Check localStorage for failure tracker
- Verify `count` is >= 3
- Check `lastFailureAt` timestamp
- Clear tracker if stale: `clearFailureTracking()`

**Scenario: Sales View not auto-recovering**
- Check if counter is resetting on success
- Verify `recordSalesViewSuccess()` is being called
- Check console for success logging
- Ensure `hasSalesRecordedSuccess` flag is working

**Scenario: Fallback not working as expected**
- Verify `hasPersistentFailures()` logic
- Check time window calculation
- Ensure `getPreferredFallback()` returns valid view
- Confirm initialization logic runs before first render

## Future Enhancements (Out of Scope)

1. **Analytics Integration**: Track failure rates and patterns
2. **Server-Side Status**: API endpoint to check Sales View health
3. **User Notifications**: Persistent banner when in fallback mode
4. **Admin Dashboard**: View failure stats across users
5. **Automatic Recovery Attempts**: Background retry with exponential backoff
6. **Feature Flag Integration**: Disable Sales View from server if broken

## Testing Checklist

### Manual Testing Required

- [ ] **Flow 1: Normal Operation**
  - Visit /leads
  - Verify Sales View loads
  - Check console for success log
  - Verify no errors

- [ ] **Flow 2: Single Failure**
  - Simulate API failure (disconnect network or use mock)
  - Verify error UI appears
  - Check console for failure log (1/3)
  - Click "Retry" button
  - Verify refetch attempted

- [ ] **Flow 3: Switch During Error**
  - With Sales View in error state
  - Click "Abrir em Grade"
  - Verify Grid view loads
  - Check console for preference log
  - Verify Grid shows lead data

- [ ] **Flow 4: Persistent Failure Fallback**
  - Trigger 3 consecutive failures
  - Refresh page
  - Verify auto-fallback to Grid (or last preferred)
  - Check console for fallback log
  - Verify no Sales View attempt

- [ ] **Flow 5: Recovery**
  - After fallback state, restore API
  - Manually switch to Sales View
  - Verify Sales View loads successfully
  - Check console for success/reset log
  - Verify counter reset in localStorage

- [ ] **Flow 6: URL Navigation**
  - Visit /leads?view=grid
  - Verify Grid view loads (even if Sales is default)
  - Visit /leads?view=kanban
  - Verify Kanban view loads
  - Visit /leads?view=sales
  - Verify Sales View loads (or shows error if down)

## Migration Notes

**No Breaking Changes:**
- Existing functionality preserved
- New feature is additive only
- Graceful degradation if localStorage unavailable
- Default behavior unchanged when Sales View healthy

**Deployment:**
- No database migrations required
- No environment variable changes needed
- No API changes required
- Safe to deploy independently

## Conclusion

This implementation provides:
- ✅ Robust failure tracking with localStorage persistence
- ✅ Intelligent auto-fallback after persistent failures
- ✅ Clear, actionable error UI specific to Sales View
- ✅ User preference memory for consistent experience
- ✅ Complete independence of Grid/Kanban from Sales View
- ✅ No breaking changes to existing functionality
- ✅ Production-ready with security scan passing

**Success Criteria Met:**
1. ✅ Users can work normally in Grid/Kanban when Sales View is down
2. ✅ Clear messaging that problem is specific to Sales View
3. ✅ Prominent shortcuts to alternative views
4. ✅ View switching independent of Sales View state
5. ✅ Build passes successfully
6. ✅ Code review feedback addressed
7. ✅ Security scan passes (0 vulnerabilities)

---

**Implementation Date**: December 11, 2025  
**Author**: GitHub Copilot Agent  
**Branch**: `copilot/improve-sales-view-resilience`  
**Status**: Complete, ready for manual testing
