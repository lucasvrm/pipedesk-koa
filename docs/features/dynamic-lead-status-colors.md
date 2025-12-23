# Dynamic Lead Status Colors - Implementation Guide

## 📋 Overview
This feature enables dynamic color configuration for lead statuses via the Admin Settings page (`/admin/settings`). Colors are stored in the database and used consistently across the UI (Kanban, tables, badges).

## 🗂️ Files Modified

### Backend (Service Layer)
- **`src/services/settingsService.ts`**
  - Added `color` field mapping for `lead_statuses` in `mapFromDb` (line ~434)
  - Added `color` field mapping for `lead_statuses` in `mapToDb` (line ~506)
  - Pattern follows existing `deal_statuses` implementation

### Frontend (UI Components)
- **`src/pages/admin/components/settings-sections/LeadSettingsSection.tsx`**
  - Created `LeadStatusSettingsTable` component with color support
  - Added color picker (native HTML5) + hex input field
  - Added color validation (hex format: `#RRGGBB`)
  - Added color preview in table (circle + hex value)
  - Fixed Phosphor icons → lucide-react

- **`src/features/leads/components/LeadsKanban.tsx`**
  - Removed hardcoded `statusColors` object
  - Updated columns to use `s.color` from metadata
  - Applied inline style for `border-top-color`
  - Fixed Phosphor icon → lucide-react

### Database
- **`supabase/migrations/20251223_add_color_to_lead_statuses.sql`**
  - Adds `color VARCHAR(7)` column to `lead_statuses`
  - Populates default colors for existing statuses
  - Enables RLS with admin-only policies

## 🚀 Installation Steps

### 1. Run Database Migration
```sql
-- Open Supabase Dashboard → SQL Editor
-- Execute: supabase/migrations/20251223_add_color_to_lead_statuses.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

### 2. Verify Migration
```sql
-- Check if color column exists
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lead_statuses' 
  AND column_name = 'color';

-- View current lead statuses with colors
SELECT id, code, label, color, sort_order, is_active 
FROM public.lead_statuses 
ORDER BY sort_order;
```

### 3. Deploy Frontend
The frontend changes are already committed. Deploy via your usual process (e.g., Vercel).

## 🎨 Default Colors

| Status | Code | Color | Hex |
|--------|------|-------|-----|
| Novo | `new` | Blue | `#3b82f6` |
| Contatado | `contacted` | Amber | `#f59e0b` |
| Qualificado | `qualified` | Emerald | `#10b981` |
| Desqualificado | `disqualified` | Rose | `#ef4444` |
| Nutrindo | `nurturing` | Violet | `#8b5cf6` |
| Acompanhamento | `follow_up` | Cyan | `#06b6d4` |
| *Others* | - | Gray | `#6b7280` |

## 🧪 Testing Checklist

### Admin Settings Page (`/admin/settings`)
- [ ] Navigate to "Configurações de Leads" section
- [ ] Click "Novo" to create a lead status
- [ ] Verify color picker appears and works
- [ ] Enter hex color manually (e.g., `#ff6b00`)
- [ ] Verify validation rejects invalid hex (e.g., `#ff`, `red`, `12345`)
- [ ] Save and verify color appears in table
- [ ] Edit existing status and change color
- [ ] Verify color preview shows correct color (circle + hex)

### Kanban View (`/leads?view=kanban`)
- [ ] Verify columns have colored top borders
- [ ] Colors match those configured in settings
- [ ] Drag a lead between columns
- [ ] Verify color persists after refresh

### Table View (`/leads`)
- [ ] Status badges use configured colors (if applicable)
- [ ] Check that fallback color `#6b7280` is used for statuses without color

### Edge Cases
- [ ] Create status without color → should default to `#6b7280`
- [ ] Edit status and remove color → should fallback to `#6b7280`
- [ ] Non-admin users cannot edit lead statuses (RLS)
- [ ] Colors work in both light and dark themes

## 🔒 Permissions

Only users with `role_level >= 100` (Admin) can:
- Create lead statuses
- Update lead statuses
- Delete lead statuses

All authenticated users can **view** lead statuses.

## 🐛 Troubleshooting

### Color not showing in Kanban
1. Check browser console for errors
2. Verify migration ran successfully: `SELECT color FROM lead_statuses WHERE code = 'new'`
3. Clear browser cache and refresh
4. Check that `SystemMetadataContext` loaded correctly

### Color validation failing
- Ensure format is exactly `#RRGGBB` (6 hex digits)
- Examples:
  - ✅ `#3b82f6`
  - ✅ `#FF5733`
  - ❌ `#f00` (too short)
  - ❌ `red` (not hex)
  - ❌ `rgb(255,0,0)` (wrong format)

### RLS Policy Error
If you get "permission denied" errors:
```sql
-- Check your role level
SELECT id, email, role_level FROM profiles WHERE id = auth.uid();

-- Verify RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'lead_statuses';
```

## 📚 Code References

### How to add color to other metadata tables
Follow the same pattern used for `lead_statuses`:

1. **Migration**: Add `color VARCHAR(7)` column
2. **settingsService.ts**: Add separate case for the table in `mapFromDb` and `mapToDb`
3. **Settings Component**: Create specialized component with color picker
4. **Usage**: Access via `metadata.color` with fallback

Example:
```typescript
// In mapFromDb
case 'your_table':
  return {
    ...metadataBase,
    color: item.color,
  }

// In UI
const color = yourMetadata.color || '#6b7280';
<div style={{ backgroundColor: color }} />
```

## 🔗 Related Files

- Type definitions: `src/types/metadata.ts` (LeadStatusMeta already has optional `color`)
- Context: `src/contexts/SystemMetadataContext.tsx`
- Hook: `src/hooks/useSystemMetadata.tsx`
- Deal Statuses Reference: `src/pages/admin/components/settings-sections/DealPipelineSettingsSection.tsx`

## 📝 Notes

- Color format is restricted to hex (`#RRGGBB`) for consistency
- Tailwind classes are NOT used (inline styles for dynamic colors)
- Fallback color `#6b7280` (gray-500) is applied when color is missing
- Color picker is native HTML5 (`<input type="color">`)
- Migration is idempotent (safe to run multiple times)

## ✅ Acceptance Criteria

- [x] Admin can create lead status with color
- [x] Admin can edit lead status color
- [x] Color is saved to database
- [x] Color appears in settings table with preview
- [x] Kanban columns use metadata colors
- [x] Hardcoded colors removed from LeadsKanban
- [x] Color validation (hex format)
- [x] Fallback to `#6b7280` if missing
- [x] RLS policies enforce admin-only access
- [x] Migration is idempotent

---

**Last Updated:** 2024-12-23  
**Version:** 1.0  
**Author:** GitHub Copilot Coding Agent
