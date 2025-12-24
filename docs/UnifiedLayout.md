# UnifiedLayout Component

## Overview

The `UnifiedLayout` component is a wrapper that combines the `UnifiedSidebar` with a main content area that includes automatic breadcrumb navigation. It provides a consistent layout structure for all application pages.

## Dependencies

- **UnifiedSidebar** - The left sidebar navigation
- **ScrollArea** - Radix UI scroll area for content
- **React Router** - For navigation and location tracking
- **lucide-react** - For breadcrumb icons (Home, ChevronRight)

## Features

- ✅ Unified sidebar with profile, management, and settings sections
- ✅ Automatic breadcrumb generation based on current route
- ✅ Optional custom breadcrumbs
- ✅ Optional page header with title and description
- ✅ Scrollable content area
- ✅ Fully responsive layout
- ✅ TypeScript support with strict types

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | ✅ | - | Content to display in the main area |
| `title` | `string` | ❌ | - | Optional page title displayed in header |
| `description` | `string` | ❌ | - | Optional page description below title |
| `breadcrumbs` | `Breadcrumb[]` | ❌ | auto | Custom breadcrumbs (auto-generated if not provided) |
| `activeSection` | `'profile' \| 'management' \| 'settings'` | ❌ | auto | Active sidebar section |
| `activeItem` | `string` | ❌ | auto | Active sidebar item ID |
| `className` | `string` | ❌ | - | Additional CSS classes for root container |
| `contentClassName` | `string` | ❌ | - | Additional CSS classes for content area |
| `showBreadcrumbs` | `boolean` | ❌ | `true` | Whether to show breadcrumbs |

### Breadcrumb Interface

```typescript
interface Breadcrumb {
  label: string;
  path?: string;
}
```

## Automatic Breadcrumb Generation

The component automatically generates breadcrumbs based on the current route:

### Profile Routes

| Route | Breadcrumbs |
|-------|-------------|
| `/profile` | Meu Perfil → Dados Pessoais |
| `/profile/preferences` | Meu Perfil → Preferências de Notificação |

### Settings Routes

For `/admin/settings` routes, breadcrumbs are generated based on `category` and `section` query params:

| Category | Label |
|----------|-------|
| `crm` | CRM & Vendas |
| `products` | Produtos & Operações |
| `system` | Sistema & Segurança |
| `productivity` | Produtividade |
| `integrations` | Integrações & Automação |

**Example:**
- `/admin/settings?category=crm` → Configurações → CRM & Vendas
- `/admin/settings?category=crm&section=leads` → Configurações → CRM & Vendas → Leads

## Usage Examples

### Basic Usage with Auto Breadcrumbs

```tsx
import { UnifiedLayout } from '@/components/UnifiedLayout';

export default function ProfilePage() {
  return (
    <UnifiedLayout
      activeSection="profile"
      activeItem="personal"
      title="Dados Pessoais"
      description="Gerencie suas informações pessoais e documentos"
    >
      {/* Your content here */}
    </UnifiedLayout>
  );
}
```

### With Custom Breadcrumbs

```tsx
import { UnifiedLayout } from '@/components/UnifiedLayout';

export default function CustomPage() {
  return (
    <UnifiedLayout
      activeSection="management"
      activeItem="analytics"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Analytics' }
      ]}
      title="Analytics Dashboard"
    >
      {/* Your content here */}
    </UnifiedLayout>
  );
}
```

### Without Breadcrumbs

```tsx
import { UnifiedLayout } from '@/components/UnifiedLayout';

export default function SimplePage() {
  return (
    <UnifiedLayout
      activeSection="settings"
      activeItem="crm"
      showBreadcrumbs={false}
    >
      {/* Your content here */}
    </UnifiedLayout>
  );
}
```

### Without Header

```tsx
import { UnifiedLayout } from '@/components/UnifiedLayout';

export default function MinimalPage() {
  return (
    <UnifiedLayout
      activeSection="profile"
      activeItem="personal"
    >
      {/* Your content here - no title/description header will be shown */}
    </UnifiedLayout>
  );
}
```

### Settings Page Example

```tsx
import { UnifiedLayout } from '@/components/UnifiedLayout';
import { useSearchParams } from 'react-router-dom';

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'crm';

  return (
    <UnifiedLayout
      activeSection="settings"
      activeItem={category}
    >
      {/* Settings content based on category */}
    </UnifiedLayout>
  );
}
```

## Layout Structure

```
┌─────────────────────────────────────────────┐
│  UnifiedSidebar  │ Breadcrumbs Bar         │
│                  ├─────────────────────────┤
│                  │ Page Header (optional)  │
│                  ├─────────────────────────┤
│                  │                         │
│                  │  ScrollArea             │
│                  │  (Content)              │
│                  │                         │
└─────────────────────────────────────────────┘
```

## Key Features

### Breadcrumb Navigation

- Home icon links to `/dashboard`
- Clickable breadcrumb links for navigation
- Last breadcrumb is bold and non-clickable
- Chevron separators between breadcrumbs

### Content Area

- Uses `ScrollArea` component for smooth scrolling
- Padding: `p-6` (24px)
- Customizable via `contentClassName` prop

### Responsive Behavior

- Fixed height: `h-[calc(100vh-4rem)]` (accounts for top bar)
- Sidebar is always visible (no collapse on this component)
- Content area flexes to fill available space
- Overflow handled via ScrollArea

## Edge Cases Handled

- ✅ No breadcrumbs: Component renders without breadcrumb bar
- ✅ No title/description: Header section is not rendered
- ✅ Unknown route: Returns empty breadcrumbs array
- ✅ Missing query params: Defaults to 'crm' category
- ✅ Long breadcrumb labels: Text truncates gracefully

## Dependencies Required

```json
{
  "react-router-dom": "^6.x",
  "lucide-react": "^0.x",
  "@radix-ui/react-scroll-area": "^1.x"
}
```

## Related Components

- `UnifiedSidebar` - The sidebar navigation component
- `ScrollArea` - Radix UI scroll area primitive
- `cn` - Utility function for className merging

## Testing

A test page is available at `/test/unified-layout` or see `src/pages/UnifiedLayoutTest.tsx` for a complete example.

## Migration Guide

If you're migrating from a custom layout:

1. Replace your custom layout wrapper with `UnifiedLayout`
2. Remove sidebar implementation (now handled by UnifiedSidebar)
3. Remove breadcrumb logic (now automatic)
4. Adjust `activeSection` and `activeItem` props based on your page
5. Optional: Add `title` and `description` for page header

## Best Practices

1. **Always wrap in TooltipProvider**: The UnifiedSidebar uses tooltips
   ```tsx
   <TooltipProvider>
     <UnifiedLayout>...</UnifiedLayout>
   </TooltipProvider>
   ```

2. **Use semantic HTML**: The content area is wrapped in a scrollable div, so structure your content accordingly

3. **Consistent activeSection/activeItem**: Ensure these props match your navigation structure for proper highlighting

4. **Custom breadcrumbs for complex flows**: Use the `breadcrumbs` prop for multi-step or nested pages not covered by auto-generation

## Notes

- The component uses `h-[calc(100vh-4rem)]` assuming a 4rem top bar exists
- All navigation goes through React Router (SPA navigation)
- The sidebar is not collapsible in this component (handled at a higher level if needed)
- Breadcrumbs are only shown when `showBreadcrumbs={true}` AND breadcrumbs array is not empty
