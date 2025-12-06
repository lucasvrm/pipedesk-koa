# UI Components

This document describes the shared UI components available in PipeDesk.

## Activity Badges

Activity badges provide visual indicators for item freshness and recent updates across detail pages.

### Overview

The `ActivityBadges` component provides two helper functions to display activity status:

- **New Badge** (`renderNewBadge`): Shows "Novo" badge for items created within the last 24 hours
- **Updated Today Badge** (`renderUpdatedTodayBadge`): Shows "Atualizado hoje" badge for items updated today

### Location

- **Component**: `/src/components/ui/ActivityBadges.tsx`
- **Utilities**: `/src/utils/dateUtils.ts`

### Usage

Import the render functions in your detail page:

```tsx
import { renderNewBadge, renderUpdatedTodayBadge } from '@/components/ui/ActivityBadges'
```

Then add badges to your entity header:

```tsx
<div className="flex items-center gap-2 flex-wrap">
  <h1>{entity.name}</h1>
  {renderNewBadge(entity.createdAt)}
  {renderUpdatedTodayBadge(entity.updatedAt)}
</div>
```

### Implementation

Activity badges are currently implemented in the following detail pages:

- **LeadDetailPage** (`/src/features/leads/pages/LeadDetailPage.tsx`)
- **DealDetailPage** (`/src/features/deals/pages/DealDetailPage.tsx`)
- **ContactDetailPage** (`/src/features/contacts/pages/ContactDetailPage.tsx`)
- **CompanyDetailPage** (`/src/features/companies/pages/CompanyDetailPage.tsx`)
- **PlayerDetailPage** (`/src/features/players/pages/PlayerDetailPage.tsx`)
- **TrackDetailPage** (`/src/features/tracks/pages/TrackDetailPage.tsx`)

### Date Utilities

The badges use the following utility functions from `dateUtils.ts`:

- `isNew(createdAt)`: Returns `true` if created within the last 24 hours
- `isUpdatedToday(updatedAt)`: Returns `true` if updated today
- `isToday(date)`: Helper to check if a date is today
- `isWithinHours(date, hours)`: Helper to check if a date is within N hours

### Styling

Badges use the standard `Badge` component with `variant="outline"` for consistency across the application. The flexible layout (`flex-wrap`) ensures badges don't break the mobile layout.

### Design Principles

1. **Non-intrusive**: Badges only appear when relevant (new or updated today)
2. **Consistent**: Same badge style and placement across all detail pages
3. **Mobile-friendly**: Uses flex-wrap to prevent layout breaks on small screens
4. **Semantic**: Clear labels in Portuguese ("Novo", "Atualizado hoje")

### Future Enhancements

Potential improvements for activity badges:

- Custom badge colors based on entity type
- Time-based gradients (newer items = brighter colors)
- Hover tooltips showing exact timestamps
- Configurable time windows (e.g., "new" = 48h instead of 24h)
