# Analytics Service Refactoring Documentation

## Overview

The analytics service has been refactored to remove hardcoded business logic and replace it with dynamic, injectable parameters. This makes the service more flexible, testable, and maintainable.

## Key Changes

### 1. New `AnalyticsOptions` Interface

A new options interface allows passing dynamic metadata to the analytics service:

```typescript
export interface AnalyticsOptions {
  /** Array of stages from metadata for probability lookups */
  stages?: Stage[];
  /** Array of team member IDs for workload filtering */
  teamMembers?: string[];
  /** Pre-calculated date range for filtering */
  dateRange?: DateRange;
  /** Team filter (user ID or 'all') */
  teamFilter?: string;
  /** Operation type filter */
  typeFilter?: string;
}
```

### 2. Removed Hardcoded Logic

#### Before:
- **Probability Map**: Used hardcoded slug-based fallback for stages
- **Date Calculations**: Manual switch/case for date filters
- **Team Roles**: Hardcoded `['analyst', 'admin', 'newbusiness']` roles
- **Conversion Trend**: Fixed 6-month loop regardless of date range

#### After:
- **Probability Map**: Uses stages from `SystemMetadataContext` or database
- **Date Calculations**: Uses `getDateRange()` utility from `dateRangeUtils`
- **Team Roles**: Uses team member IDs from `useOperationalTeam()` hook
- **Conversion Trend**: Dynamic grouping (week/month) based on date range

### 3. Dynamic Conversion Trend Logic

The conversion trend now adapts to the date range:

- **Short range (≤ 30 days)**: Groups by week
- **Medium range (≤ 90 days)**: Shows last 3 months
- **Long range (> 90 days)**: Shows last 6 months (previous default)

### 4. New Hooks

#### `useAnalyticsWithMetadata`
Enhanced version of `useAnalytics` that accepts metadata options:

```typescript
const { data, isLoading } = useAnalyticsWithMetadata(
  dateFilter,
  teamFilter,
  typeFilter,
  {
    stages: myStages,
    teamMembers: myTeamIds,
    dateRange: myDateRange
  }
)
```

#### `useEnhancedAnalytics`
Complete integration with system hooks for seamless usage:

```typescript
const { data, isLoading } = useEnhancedAnalytics(
  '30d',  // DateFilterType from metadata
  'all',
  'all'
)
```

This hook automatically:
- Fetches stages from `SystemMetadataContext`
- Fetches team members from `useOperationalTeam()`
- Calculates date ranges using `getDateRange()`
- Passes all data to the analytics service

## Migration Guide

### For Existing Code

The original `useAnalytics` hook remains unchanged for backward compatibility:

```typescript
// Still works exactly as before
const { data } = useAnalytics('30d', 'all', 'all')
```

### For New Code

Use the enhanced hook for better integration:

```typescript
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics'

function MyDashboard() {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('30d')
  
  const { data: metrics, isLoading } = useEnhancedAnalytics(
    dateFilter,
    'all',
    'all'
  )
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      <h2>Total Deals: {metrics?.totalDeals}</h2>
      <h2>Weighted Pipeline: ${metrics?.weightedPipeline.toLocaleString()}</h2>
      <h2>Team Workload:</h2>
      <ul>
        {metrics?.teamWorkload.map(member => (
          <li key={member.userId}>
            {member.userName}: {member.activeTracks} tracks, {member.activeTasks} tasks
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Custom Integration

For advanced use cases, call `getAnalyticsSummary` directly:

```typescript
import { getAnalyticsSummary } from '@/services/analyticsService'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { getDateRange } from '@/utils/dateRangeUtils'

async function customAnalytics() {
  const { stages } = useSystemMetadata()
  const dateRange = getDateRange('30d')
  
  const metrics = await getAnalyticsSummary('30d', 'all', 'all', {
    stages,
    dateRange,
    teamMembers: ['user-1', 'user-2']
  })
  
  return metrics
}
```

## Testing

Unit tests have been added to validate the new functionality:

- `tests/unit/services/analyticsService.test.ts`

Tests cover:
- Dynamic stage probability calculations
- Team member filtering for workload
- Date range filtering

## Benefits

1. **Flexibility**: No more hardcoded values - all configuration comes from the database
2. **Testability**: Easy to test with mock data
3. **Maintainability**: Changes to stages, roles, or date logic don't require code changes
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Backward Compatibility**: Existing code continues to work without changes

## Future Enhancements

Potential improvements:
- Add caching for metadata to reduce database queries
- Support for custom date ranges (not just predefined filters)
- More granular team filtering options
- Additional metrics based on dynamic metadata
