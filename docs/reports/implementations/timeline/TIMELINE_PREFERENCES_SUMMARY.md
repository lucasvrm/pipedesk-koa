# Timeline v2 Dynamic Configuration - Implementation Summary

**Date:** 2024-12-25  
**Status:** ✅ Partially Complete (Core Preferences System)

---

## ✅ What Was Completed

### 1. Type System & Constants ✅
- **File:** `src/lib/types.ts`
  - Added `TimelineEventType` with 11 event types (7 available, 4 future)
  - Added `TimelinePreferences` interface
  - Added `UserPreferences` interface
  - Updated `User` interface to use `UserPreferences` instead of `Record<string, any>`

- **File:** `src/constants/timeline.ts`
  - Created comprehensive constants for timeline events:
    - `TIMELINE_EVENT_LABELS`: User-friendly labels for each event type
    - `TIMELINE_EVENT_ICONS`: Lucide-react icon names for each event
    - `DEFAULT_TIMELINE_COLORS`: Default hex colors for each event type
    - `DEFAULT_ENABLED_EVENTS`: Default enabled/disabled state
    - `AVAILABLE_EVENTS`: List of implemented events
    - `FUTURE_EVENTS`: List of future/planned events
  - Added helper function `getColorWithOpacity()` for rgba conversion

### 2. Custom Hook ✅
- **File:** `src/hooks/useTimelinePreferences.ts`
  - Reads user preferences from AuthContext
  - Merges user preferences with defaults
  - Provides `isEventEnabled(eventType)` helper
  - Provides `getEventColor(eventType)` helper
  - Returns `enabledEvents` and `eventColors` objects

### 3. Settings UI Component ✅
- **File:** `src/pages/Profile/components/TimelineSettings.tsx`
  - Comprehensive settings interface with:
    - **Header**: Title, description, Reset and Save buttons
    - **Active Events Card**: 
      - Toggle switches for each available event
      - Color pickers for each event
      - Icon preview with dynamic colors
      - Shows "X of Y active" badge
    - **In Development Card**:
      - Shows future events in disabled state
      - "Em breve" badge for each
    - **Preview Card**:
      - Visual preview of enabled events with custom colors
  - State management for preferences
  - Save function that updates Supabase `profiles.preferences` JSONB field
  - Reset function to restore defaults
  - Loading states and error handling
  - Toast notifications for user feedback

### 4. Profile Page Integration ✅
- **File:** `src/pages/Profile/index.tsx`
  - Added "Timeline" tab with Activity icon
  - Imported and rendered `TimelineSettings` component
  - Fixed minor issue with Shield icon (removed from financial section)

---

## ⚠️ What Remains To Be Done

### 5. Timeline v2 Integration (CRITICAL)

**Issue**: The existing Timeline v2 uses different type system than preferences.

**Current Timeline Types** (in `src/components/timeline-v2/types.ts`):
```typescript
type TimelineItemType = 'comment' | 'email' | 'meeting' | 'audit' | 'system'
```

**New Preference Types** (in `src/lib/types.ts`):
```typescript
type TimelineEventType = 
  | 'status_change' | 'comments' | 'mentions' | 'assignment' 
  | 'task_completed' | 'notes' | 'file_upload'
  | 'priority_change' | 'contact_associated' | 'loss_reason' | 'calendar_event'
```

**Required Actions**:

#### A. Create Type Mapping
**File to create/modify:** `src/hooks/useUnifiedTimeline.ts` or create new `src/hooks/useTimelineWithPreferences.ts`

```typescript
// Map preference types to actual timeline types
const PREFERENCE_TO_TIMELINE_TYPE_MAP: Record<TimelineEventType, TimelineItemType[]> = {
  comments: ['comment'],
  mentions: ['comment'], // filter by mentions in metadata
  status_change: ['system', 'audit'],
  assignment: ['system', 'audit'],
  task_completed: ['system'], // NEW: needs implementation
  notes: ['comment'], // or new type
  file_upload: ['system', 'audit'],
  priority_change: ['audit'], // FUTURE
  contact_associated: ['audit'], // FUTURE
  loss_reason: ['audit'], // FUTURE
  calendar_event: ['meeting'], // FUTURE
};
```

#### B. Apply Filters in Timeline Components

**Option 1**: Wrap existing `useUnifiedTimeline` with preferences filter
```typescript
// src/hooks/useTimelineWithPreferences.ts
export function useTimelineWithPreferences(entityId: string, entityType: 'deal' | 'lead' | 'company') {
  const { items, isLoading, error, refetch } = useUnifiedTimeline(entityId, entityType);
  const { isEventEnabled, getEventColor } = useTimelinePreferences();
  
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Map timeline type to preference type and check if enabled
      // TODO: Implement mapping logic
      return true; // placeholder
    });
  }, [items, isEventEnabled]);
  
  // Enhance items with custom colors
  const enhancedItems = useMemo(() => {
    return filteredItems.map(item => ({
      ...item,
      customColor: getEventColor(/* mapped type */)
    }));
  }, [filteredItems, getEventColor]);
  
  return { items: enhancedItems, isLoading, error, refetch };
}
```

**Option 2**: Modify `TimelineVisual` component directly
- Update `src/components/timeline-v2/TimelineVisual.tsx`
- Import `useTimelinePreferences`
- Apply filtering before rendering
- Pass custom colors to `ActivityCard`

#### C. Update ActivityCard for Custom Colors

**File:** `src/components/timeline-v2/ActivityCard.tsx`

Currently, ActivityCard has hardcoded colors in `getTypeConfig()` function (lines 47-91).

**Changes needed**:
1. Add optional `color` prop to `ActivityCardProps`:
   ```typescript
   interface ActivityCardProps {
     item: TimelineItem
     currentUserId: string
     color?: string // NEW
     // ... rest
   }
   ```

2. Use custom color if provided:
   ```typescript
   function ActivityCard({ item, color, /* ... */ }: ActivityCardProps) {
     const typeConfig = getTypeConfig(item.type);
     const finalColor = color || typeConfig.borderClass; // Use custom or default
     
     return (
       <div className={cn("border-l-4", finalColor)}>
         {/* ... */}
       </div>
     );
   }
   ```

### 6. Task Completed Event Support

**File:** `src/hooks/useUnifiedTimeline.ts` (lines 250-350)

**Current behavior**: Timeline fetches comments, activities, meetings, emails, audits.

**Required**: Add query for completed tasks.

```typescript
// In useUnifiedTimeline hook, after existing queries:

// NEW: Fetch completed tasks
const { data: completedTasks, isLoading: tasksLoading } = useQuery({
  queryKey: ['timeline-tasks', entityType, entityId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        completed_at,
        completed_by,
        assignees!inner (
          id,
          name,
          avatar_url
        )
      `)
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('completed', true)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  enabled: !!entityId
});

// Then in the timelineItems useMemo (line 250):
if (completedTasks) {
  completedTasks.forEach(task => {
    if (seenIds.has(`task-${task.id}`)) return;
    seenIds.add(`task-${task.id}`);
    
    items.push({
      id: `task-${task.id}`,
      type: 'system', // or create new 'task_completed' type
      date: task.completed_at,
      title: 'Tarefa Concluída',
      author: {
        id: task.assignees?.id,
        name: task.assignees?.name || 'Usuário',
        avatar: task.assignees?.avatar_url
      },
      content: task.title,
      metadata: { taskId: task.id },
      parentId: null,
      isEditable: false,
      isDeletable: false
    });
  });
}
```

**Note**: Verify the exact schema of the `tasks` table. Fields like `entity_id`, `entity_type`, `completed`, `completed_at`, and `completed_by` need to exist.

---

## 📋 Testing Checklist

### Preferences Page
- [ ] Navigate to Profile → Timeline tab
- [ ] Toggle events on/off
- [ ] Change event colors
- [ ] Click "Resetar" → verify defaults restored (but not saved)
- [ ] Click "Salvar" → verify toast appears
- [ ] Refresh page → verify preferences persisted
- [ ] Check preview section updates in real-time

### Timeline Integration (Once Implemented)
- [ ] Go to Lead detail page → Timeline tab
- [ ] Disable "Comentários" in preferences
- [ ] Verify comments don't appear in timeline
- [ ] Change "Status" color to red in preferences
- [ ] Verify status change events have red color
- [ ] Complete a task
- [ ] Verify "Conclusão de Tarefas" event appears
- [ ] Disable "Tarefas" in preferences
- [ ] Verify task completion events disappear

### Edge Cases
- [ ] User with no preferences → uses defaults
- [ ] User with old preferences (missing task_completed) → merges correctly
- [ ] Profile loading → component shows loading state
- [ ] Save error → shows error toast

---

## 🔧 Migration Path

If you need to migrate existing users to have default preferences:

```sql
-- Update all users without timeline preferences
UPDATE profiles
SET preferences = jsonb_set(
  COALESCE(preferences, '{}'::jsonb),
  '{timeline}',
  '{
    "enabledEvents": {
      "status_change": true,
      "comments": true,
      "mentions": true,
      "assignment": true,
      "task_completed": true,
      "notes": true,
      "file_upload": true,
      "priority_change": false,
      "contact_associated": false,
      "loss_reason": false,
      "calendar_event": false
    },
    "eventColors": {
      "status_change": "#3b82f6",
      "comments": "#eab308",
      "mentions": "#f59e0b",
      "assignment": "#8b5cf6",
      "task_completed": "#10b981",
      "notes": "#6366f1",
      "file_upload": "#06b6d4",
      "priority_change": "#f97316",
      "contact_associated": "#14b8a6",
      "loss_reason": "#ef4444",
      "calendar_event": "#ec4899"
    }
  }'::jsonb
)
WHERE preferences IS NULL 
   OR preferences->'timeline' IS NULL;
```

---

## 🎯 Next Steps

1. **Immediate**: Implement type mapping (Section 5A)
2. **High Priority**: Update TimelineVisual to use preferences (Section 5B)
3. **High Priority**: Add custom colors to ActivityCard (Section 5C)
4. **Medium Priority**: Add task_completed events (Section 6)
5. **Testing**: Run through testing checklist
6. **Documentation**: Update user-facing docs if needed

---

## 📊 Complexity Breakdown

| Task | Estimated Time | Complexity |
|------|----------------|------------|
| ✅ Types & Constants | — | Done |
| ✅ Hook | — | Done |
| ✅ Settings UI | — | Done |
| ✅ Profile Integration | — | Done |
| ⚠️ Type Mapping | 20-30 min | Medium |
| ⚠️ Timeline Filtering | 30-40 min | Medium-High |
| ⚠️ Custom Colors | 20-30 min | Medium |
| ⚠️ Task Completed Events | 30-40 min | Medium-High |
| ⚠️ Testing | 30-45 min | Medium |

**Total Remaining**: ~2.5-3 hours

---

## 📚 Files Modified/Created

### Created
- ✅ `src/constants/timeline.ts` (107 lines)
- ✅ `src/hooks/useTimelinePreferences.ts` (38 lines)
- ✅ `src/pages/Profile/components/TimelineSettings.tsx` (346 lines)

### Modified
- ✅ `src/lib/types.ts` (+27 lines)
- ✅ `src/pages/Profile/index.tsx` (+3 lines, -1 line)

### To Modify (Pending)
- ⚠️ `src/hooks/useUnifiedTimeline.ts`
- ⚠️ `src/components/timeline-v2/TimelineVisual.tsx`
- ⚠️ `src/components/timeline-v2/ActivityCard.tsx`

---

## 🚨 Known Issues & Risks

### Issue 1: Type System Mismatch
**Risk Level**: 🔴 High  
**Impact**: Filtering won't work until types are mapped  
**Mitigation**: Create explicit mapping table (Section 5A)

### Issue 2: Task Schema Unknown
**Risk Level**: 🟡 Medium  
**Impact**: task_completed events may fail if schema differs  
**Mitigation**: Verify `tasks` table structure before implementing

### Issue 3: ActivityCard Refactor
**Risk Level**: 🟢 Low  
**Impact**: Colors may not apply if ActivityCard isn't updated  
**Mitigation**: Add optional color prop, use inline styles

---

## 💡 Alternative Approaches

If the type mapping becomes too complex:

1. **Option A**: Migrate Timeline v2 to use `TimelineEventType` instead of `TimelineItemType`
   - **Pros**: Clean, consistent type system
   - **Cons**: Requires more extensive refactoring

2. **Option B**: Keep separate type systems, add metadata field for preference type
   ```typescript
   interface TimelineItem {
     // ... existing fields
     preferenceType?: TimelineEventType; // NEW
   }
   ```
   - **Pros**: Minimal changes to existing code
   - **Cons**: Duplicate information

3. **Option C** (Recommended): Use mapping layer as described in Section 5A
   - **Pros**: Non-invasive, backwards compatible
   - **Cons**: Requires maintenance of mapping table

---

## ✅ Success Criteria

1. User can open Profile → Timeline tab ✅
2. User can toggle events on/off ✅ (UI ready, filtering pending)
3. User can change event colors ✅ (UI ready, application pending)
4. Preferences save to database ✅
5. Preferences persist across sessions ✅
6. Timeline filters events based on preferences ⚠️ (Pending)
7. Timeline uses custom colors ⚠️ (Pending)
8. Task completed events appear ⚠️ (Pending)

**Current Status**: 5/8 complete (62.5%)

---

## 📞 Questions for Product Owner

1. Should we migrate existing Timeline v2 to use the new type system, or maintain dual systems?
2. What's the exact schema for the `tasks` table?
3. Should "mentions" be filtered by analyzing comment content, or is there a separate field?
4. Are "notes" separate from "comments" in the current system?
5. Priority for shipping: settings UI only, or full integration?

---

**End of Summary**
