# Quick Actions Menu - React Hooks Violation Fix

## Problem Description

### Error
```
React Error #310: Rendered more hooks than during the previous render
```

### Root Cause
The Quick Actions Menu implementation was calling React hooks (`useDealQuickActions`, `useCompanyQuickActions`) inside the `.map()` function when rendering table rows. This violates React's [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks):

**Rule**: Hooks must be called at the top level of a component, not inside loops, conditions, or nested functions.

### Problematic Code (Before)
```tsx
// DealsView.tsx - INCORRECT ❌
{currentDeals.map((deal) => (
  <TableRow key={deal.id}>
    {/* ... */}
    <TableCell>
      <QuickActionsMenu
        actions={useDealQuickActions({ // ❌ Hook called inside .map()
          deal,
          onEdit: () => handleEdit(deal),
        })}
      />
    </TableCell>
  </TableRow>
))}
```

## Solution

### Approach
Convert React hooks into factory functions that accept hook results as parameters:

1. **Call React hooks at component level** (outside any loops)
2. **Convert action generators to factory functions** (not hooks)
3. **Pass hook results as parameters** to factory functions inside loops

### Fixed Code (After)

#### Component Level
```tsx
// DealsView.tsx - CORRECT ✅
export default function DealsView() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  // ✅ Hooks called at component level
  const updateDealMutation = useUpdateDeal()
  const deleteDealMutation = useDeleteDeal()
  
  // ... rest of component
}
```

#### Inside Map
```tsx
// DealsView.tsx - CORRECT ✅
{currentDeals.map((deal) => (
  <TableRow key={deal.id}>
    {/* ... */}
    <TableCell>
      <QuickActionsMenu
        actions={getDealQuickActions({ // ✅ Regular function, not a hook
          deal,
          navigate,
          updateDeal: updateDealMutation,
          deleteDeal: deleteDealMutation,
          profileId: profile?.id,
          onEdit: () => handleEdit(deal),
        })}
      />
    </TableCell>
  </TableRow>
))}
```

### Factory Function Implementation
```tsx
// useQuickActions.tsx
interface GetDealQuickActionsProps {
  deal: MasterDeal
  navigate: NavigateFunction
  updateDeal: UseMutationResult<any, Error, { dealId: string; updates: any }, unknown>
  deleteDeal: UseMutationResult<any, Error, string, unknown>
  profileId?: string
  onEdit?: () => void
  // ... other callbacks
}

/**
 * Factory function that returns quick actions for a Deal entity
 * Note: This is NOT a React hook - call it inside your component render
 */
export function getDealQuickActions({
  deal,
  navigate,
  updateDeal,
  deleteDeal,
  profileId,
  onEdit,
  // ...
}: GetDealQuickActionsProps): QuickAction[] {
  // Implementation remains the same
  return [
    // ... actions
  ]
}
```

## Files Changed

### Core Changes
- `src/hooks/useQuickActions.tsx`
  - Converted 6 hooks to factory functions
  - Removed `useMemo` wrappers (not needed per-item)
  - Updated function signatures to accept dependencies

### Integration Updates
- `src/features/deals/components/DealsView.tsx`
  - Added `useAuth()`, `useUpdateDeal()` at component level
  - Updated QuickActionsMenu usage to call factory function

- `src/features/companies/pages/CompaniesListPage.tsx`
  - Updated QuickActionsMenu usage to call factory function
  - Pass `navigate` and `deleteCompanyMutation`

## Converted Functions

| Before (Hook) | After (Factory Function) |
|--------------|-------------------------|
| `useDealQuickActions` | `getDealQuickActions` |
| `useTrackQuickActions` | `getTrackQuickActions` |
| `useTaskQuickActions` | `getTaskQuickActions` |
| `useCompanyQuickActions` | `getCompanyQuickActions` |
| `useContactQuickActions` | `getContactQuickActions` |
| `useLeadQuickActions` | `getLeadQuickActions` |

## Benefits of This Approach

1. **Complies with React Rules** - No hooks called in loops
2. **Maintains Same API** - Minimal changes to calling code
3. **Better Performance** - Hooks called once per component, not per item
4. **Type Safety** - Full TypeScript support maintained
5. **Explicit Dependencies** - Clear what each function needs

## Testing

### Build Verification
```bash
npm run build
# ✓ built in 15.33s
```

### Lint Check
```bash
npm run lint
# No errors in modified files
```

## Migration Guide

If you need to add new entity types with quick actions:

### Do ✅
```tsx
// 1. Create factory function in useQuickActions.tsx
export function getMyEntityQuickActions({
  entity,
  navigate,
  updateEntity,
  deleteEntity,
  profileId,
  // ...
}: GetMyEntityQuickActionsProps): QuickAction[] {
  // ... implementation
}

// 2. Call hooks at component level
function MyEntityList() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const updateEntity = useUpdateEntity()
  const deleteEntity = useDeleteEntity()
  
  // 3. Use factory function in render
  return entities.map(entity => (
    <QuickActionsMenu
      actions={getMyEntityQuickActions({
        entity,
        navigate,
        updateEntity,
        deleteEntity,
        profileId: profile?.id,
      })}
    />
  ))
}
```

### Don't ❌
```tsx
// DON'T create hook and call inside loop
export function useMyEntityQuickActions(...) {
  const navigate = useNavigate() // ❌
  const updateEntity = useUpdateEntity() // ❌
  // ...
}

// DON'T call inside map
entities.map(entity => (
  <QuickActionsMenu
    actions={useMyEntityQuickActions({ entity })} // ❌
  />
))
```

## References

- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [React Error #310](https://react.dev/errors/310)
- GitHub Issue: #164 - Quick Actions Menu Implementation
