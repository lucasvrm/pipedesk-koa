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

---

## RelationshipMap

The RelationshipMap component provides an interactive visualization of entity relationships, displaying the chain: Lead → Company → Deal → Player.

### Overview

The `RelationshipMap` component uses D3.js to render a force-directed graph showing connections between entities in the PipeDesk ecosystem. Users can interact with nodes (click to navigate) and the graph auto-arranges based on relationships.

### Location

- **Component**: `/src/components/ui/RelationshipMap.tsx`
- **Type Definitions**: Exported from the component file

### Node Types

The component supports four entity types:

- **Lead** (blue): Initial prospect in the pipeline
- **Company** (green): Qualified company entity
- **Deal** (amber): Master deal/negotiation
- **Player** (purple): Individual player/track within a deal

### Usage

Import the component and types:

```tsx
import { RelationshipMap, RelationshipNode, RelationshipEdge } from '@/components/ui/RelationshipMap'
```

Build your graph data:

```tsx
const nodes: RelationshipNode[] = [
  { id: 'lead-1', label: 'Acme Corp', type: 'lead' },
  { id: 'company-1', label: 'Acme Inc', type: 'company' },
  { id: 'deal-1', label: 'Series A', type: 'deal' },
]

const edges: RelationshipEdge[] = [
  { from: 'lead-1', to: 'company-1' },
  { from: 'company-1', to: 'deal-1' },
]
```

Render the component:

```tsx
<RelationshipMap
  nodes={nodes}
  edges={edges}
  onNodeClick={(node) => navigate(`/${node.type}s/${node.id}`)}
/>
```

### Implementation

RelationshipMap is currently integrated in:

- **LeadDetailPage** (`/src/features/leads/pages/LeadDetailPage.tsx`)
  - Location: Overview tab
  - Shows: Lead → Company → Deal → Player chain
  - Visibility: Only when qualified and has relationships (nodes > 1)

- **DealDetailPage** (`/src/features/deals/pages/DealDetailPage.tsx`)
  - Location: Players tab
  - Shows: Lead → Company → Deal → Player chain (deal-centric view)
  - Visibility: Only when relationships exist (nodes > 1)

### Features

1. **Interactive Navigation**: Click any node to navigate to that entity's detail page
2. **Force-Directed Layout**: Automatic arrangement using D3.js force simulation
3. **Zoom & Pan**: Users can zoom and pan to explore complex relationships
4. **Drag Nodes**: Nodes can be dragged to adjust layout
5. **Hover States**: Visual feedback on hover with tooltips
6. **Color-Coded**: Each entity type has a distinct color

### Performance Optimizations

The component implementation includes:

- **Memoization**: Graph data building is memoized with `useMemo`
- **Set-based Deduplication**: Uses `Set` for O(1) player node tracking instead of O(n²) array find
- **Conditional Rendering**: Only renders when meaningful relationships exist
- **Efficient Updates**: Only recalculates when dependencies change

### Props

```tsx
interface RelationshipMapProps {
  nodes: RelationshipNode[]        // Array of graph nodes
  edges: RelationshipEdge[]        // Array of connections
  className?: string               // Optional CSS classes
  onNodeClick?: (node: RelationshipNode) => void  // Click handler
}

interface RelationshipNode {
  id: string                       // Unique identifier
  label: string                    // Display name
  type: RelationshipNodeType       // Entity type
}

interface RelationshipEdge {
  from: string                     // Source node ID
  to: string                       // Target node ID
}

type RelationshipNodeType = 'lead' | 'company' | 'deal' | 'player'
```

### Design Principles

1. **Clarity**: Clear visual hierarchy with color-coded node types
2. **Interactivity**: All nodes are clickable for navigation
3. **Scalability**: Handles complex relationship graphs efficiently
4. **Responsiveness**: Adapts to container size (minimum 400px height)
5. **Accessibility**: Hover tooltips provide context

### Best Practices

When integrating RelationshipMap:

1. **Conditional Rendering**: Only show when `nodes.length > 1` to avoid empty graphs
2. **Height Container**: Provide adequate height (recommended: 400px minimum)
3. **Error Handling**: Gracefully handle missing or null data
4. **Navigation**: Implement `onNodeClick` for seamless user experience
5. **Memoization**: Wrap data building logic in `useMemo` to prevent unnecessary recalculations

### Example Integration

```tsx
// In LeadDetailPage
const relationshipData = useMemo(() => {
  const nodes: RelationshipNode[] = []
  const edges: RelationshipEdge[] = []
  const addedPlayerIds = new Set<string>()

  // Add current lead
  nodes.push({
    id: lead.id,
    label: lead.legalName,
    type: 'lead'
  })

  // Add company if qualified
  if (lead.qualifiedCompanyId && company) {
    nodes.push({
      id: company.id,
      label: company.name,
      type: 'company'
    })
    edges.push({
      from: lead.id,
      to: company.id
    })

    // Add related deals and players...
  }

  return { nodes, edges }
}, [lead, company, allDeals, allTracks])

// Render conditionally
{relationshipData.nodes.length > 1 && (
  <Card>
    <CardHeader>
      <CardTitle>Mapa de Relacionamentos</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[400px]">
        <RelationshipMap
          nodes={relationshipData.nodes}
          edges={relationshipData.edges}
          onNodeClick={handleNodeClick}
        />
      </div>
    </CardContent>
  </Card>
)}
```

### Future Enhancements

Potential improvements for RelationshipMap:

- Support for additional entity types (e.g., contacts, tasks)
- Hierarchical layouts (tree view) as an alternative to force-directed
- Export to image (PNG/SVG)
- Minimap for navigation in large graphs
- Filter controls to show/hide specific node types
- Edge labels showing relationship types
- Custom node rendering with entity-specific icons
