# Cross-Tagging (Multi-Homing) - Implementation Guide

## Overview

Cross-tagging, also known as multi-homing, is the signature feature that allows a single entity (deal, player track, or task) to exist in multiple organizational folders simultaneously without duplication. This is inspired by Wrike's powerful organizational system.

## The Problem It Solves

In traditional hierarchical systems, an item can only exist in one location. This creates problems for matrix organizations where:
- A task might belong to both "Project App V2" (for the PM) and "Design Team" (for the coordinator)
- A deal might be relevant to both "Q1 2024" and "Tech Sector" folders
- A player track needs to be visible in both "Active Negotiations" and "Team Alpha Assignments"

Without cross-tagging, teams resort to:
- Creating duplicate items (leading to sync issues)
- Using complex naming conventions
- Missing important context switches

## How It Works

### Core Concept: Single Source of Truth

The entity (deal, track, task) exists **once** in the database. Multiple `EntityLocation` records point to this single entity from different folders. When you update the entity, all locations see the change instantly because they're all referencing the same data.

```
Entity (Task): "Create App Layout"
  ↑
  ├── Location 1: Folder "Project App V2" (Primary)
  ├── Location 2: Folder "Design Team"
  └── Location 3: Folder "Sprint 4"
```

### Data Model

```typescript
interface Folder {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  parentId?: string              // Enables hierarchical nesting
  type: 'project' | 'team' | 'sprint' | 'category' | 'custom'
  createdAt: string
  createdBy: string
  position: number
}

interface EntityLocation {
  id: string
  entityId: string              // ID of the deal/track/task
  entityType: 'deal' | 'track' | 'task'
  folderId: string              // Which folder contains it
  isPrimary: boolean            // One location should be primary
  addedAt: string
  addedBy: string
}
```

## Key Features

### 1. Folder Management
- **Create Folders**: Organize work by projects, teams, sprints, or custom categories
- **Hierarchical Structure**: Folders can have subfolders (unlimited depth)
- **Visual Customization**: Each folder has a custom color and icon
- **Folder Types**: Pre-defined types help organize different perspectives

### 2. Cross-Tag Dialog
- **Multi-Select Interface**: Check multiple folders where entity should appear
- **Primary Folder**: Star indicator shows which folder is the "main" location
- **Visual Feedback**: Selected folders shown as badges with color indicators
- **Batch Operations**: Add/remove entity from multiple locations at once

### 3. Folder Browser
- **Tree Navigation**: Collapsible folder hierarchy
- **Entity Count Badges**: Shows how many items in each folder
- **Mixed Content**: Folders can contain deals, tracks, and tasks together
- **Untagged Section**: Special view for items not yet organized
- **Quick Actions**: Tag icon appears on hover for quick organization

### 4. Location Indicators
- **Multi-Location Badge**: Shows entity appears in N folders
- **Primary Star**: Visual indicator of primary folder
- **Folder Breadcrumbs**: Show all locations entity appears in

## User Workflows

### Workflow 1: Create and Organize New Task
1. User creates task "Design Homepage Mockup"
2. Click tag icon on task
3. Select folders: "Project Website Redesign" (primary), "Design Team", "Sprint 12"
4. Task now visible in all three locations
5. PM sees it in project view, Design Lead sees it in team view, Scrum Master sees it in sprint view

### Workflow 2: Reorganize Existing Items
1. Navigate to folder browser
2. Expand "Untagged" section
3. See items not yet organized
4. Click tag icon on each item
5. Assign to appropriate folders
6. All items now properly organized

### Workflow 3: Find Item from Different Perspectives
1. **Scenario**: Looking for task about API integration
2. **Option A**: Check "Backend Team" folder (team perspective)
3. **Option B**: Check "Q2 Deliverables" folder (timeline perspective)
4. **Option C**: Check "Platform Project" folder (project perspective)
5. Same task appears in all three because it was cross-tagged

### Workflow 4: Update Cross-Tagged Item
1. Open task from any folder location
2. Make edits (change assignee, update description, etc.)
3. Changes immediately visible in ALL folder locations
4. No manual sync needed - single source of truth

## Technical Implementation

### Storage Strategy
All data stored in Spark's KV storage:
- `folders`: Array of folder definitions
- `entity-locations`: Array of location mappings
- Entities continue to be stored in their original arrays (`masterDeals`, `playerTracks`, `tasks`)

### Query Patterns

**Get all entities in a folder:**
```typescript
const locations = await spark.kv.get('entity-locations')
const folderLocations = locations.filter(loc => loc.folderId === folderId)

// Then fetch actual entities
const deals = folderLocations
  .filter(loc => loc.entityType === 'deal')
  .map(loc => deals.find(d => d.id === loc.entityId))
```

**Get all folders containing an entity:**
```typescript
const locations = await spark.kv.get('entity-locations')
const entityLocations = locations.filter(
  loc => loc.entityId === entityId && loc.entityType === entityType
)
```

**Get primary folder for entity:**
```typescript
const primaryLocation = locations.find(
  loc => loc.entityId === entityId && loc.isPrimary
)
```

### Performance Considerations
- Location arrays are indexed by both `folderId` and `entityId` for fast lookups
- Folders are loaded once and cached in component state
- Entity queries filtered client-side (acceptable for MVP scale)
- For production scale, consider indexing strategies

## Benefits

### For Project Managers
- See all tasks/deals related to a specific project in one view
- No need to search across team-specific or timeline-specific views

### For Team Leads
- View all work assigned to their team, regardless of which project
- Workload balancing without losing project context

### For Scrum Masters
- Organize work by sprints without disconnecting from long-term projects
- Sprint planning shows all relevant items automatically

### For Executives
- View deals by sector, timeline, and team simultaneously
- Multiple analytical perspectives on the same data

## Advantages Over Traditional Systems

| Traditional Hierarchy | Cross-Tagging |
|----------------------|---------------|
| Item in one place only | Item in multiple places |
| Must choose: project OR team folder | Can be in project AND team folders |
| Duplicate items for multiple views | Single item, multiple views |
| Updates need manual sync | Updates automatic everywhere |
| Information silos | Shared visibility |
| Rigid organization | Flexible organization |

## UI/UX Design Principles

### Visual Language
- **Folders**: Color-coded with custom icons for instant recognition
- **Primary Indicator**: Star icon shows main organizational context
- **Count Badges**: Quick visibility of folder contents
- **Hover Actions**: Tag icon appears on hover for discoverability
- **Tree Hierarchy**: Familiar file-explorer metaphor

### Interaction Patterns
- **Checkbox Selection**: Familiar multi-select pattern
- **Star Toggle**: Click to make folder primary
- **Collapsible Trees**: Progressive disclosure of hierarchy
- **Inline Tagging**: Quick access without leaving context
- **Badge Feedback**: Visual confirmation of cross-tag state

### Information Architecture
```
Main Navigation
  └── Pastas (Folder Browser)
      ├── Projects
      │   ├── Project App V2
      │   └── Platform Redesign
      ├── Teams
      │   ├── Design Team
      │   ├── Backend Team
      │   └── Frontend Team
      ├── Sprints
      │   ├── Sprint 11
      │   ├── Sprint 12 (current)
      │   └── Sprint 13 (planned)
      └── Não Organizados (Untagged)
```

## Future Enhancements

### Planned Improvements
1. **Smart Folders**: Auto-tag based on rules (e.g., all tasks assigned to Design Team auto-appear in Design folder)
2. **Folder Templates**: Quick-create standard folder hierarchies
3. **Bulk Tagging**: Select multiple entities and tag them all at once
4. **Tag Analytics**: Show most-used folders, orphaned folders, over-tagged items
5. **Folder Permissions**: Control who can see/edit specific folders
6. **Saved Views**: Remember expanded/collapsed folder state per user
7. **Folder Search**: Quick find folders in large hierarchies
8. **Color Themes**: Coordinated color schemes for related folders

### Advanced Features
- **Virtual Folders**: Dynamically filter entities by criteria (saved searches)
- **Folder Relationships**: Link related folders (e.g., "Sprint 12" child of "Q2 2024")
- **Folder Timeline**: Historical view of folder contents over time
- **Cross-Workspace**: Share folders across different DCM instances

## Best Practices

### Organizational Strategy
1. **Start with 3-5 top-level categories**: Projects, Teams, Sprints are typical
2. **Use primary folder wisely**: Designate the "main home" for each entity
3. **Avoid over-tagging**: If something is in 10+ folders, it's probably too many
4. **Regular cleanup**: Review untagged items weekly
5. **Consistent naming**: Use clear, descriptive folder names

### Team Adoption
1. **Train on workflows**: Show how cross-tagging solves real problems
2. **Lead by example**: Managers organize their items first
3. **Create folder standards**: Team agreement on folder structure
4. **Monitor usage**: Check that folders are being used effectively
5. **Iterate**: Adjust folder structure based on team feedback

## Troubleshooting

### Common Issues

**Entity appears in wrong folder:**
- Open cross-tag dialog
- Uncheck unwanted folders
- Save changes

**Can't find an entity:**
- Check "Não Organizados" (Untagged) section
- Use global search (Ctrl+K)
- Check if entity was deleted vs. just untagged

**Folder structure too complex:**
- Flatten hierarchy - remove unnecessary nesting
- Merge similar folders
- Archive old/unused folders

**Performance slow with many folders:**
- Reduce folder count to < 50 for optimal performance
- Use folder types instead of creating many top-level folders
- Consider archiving completed project folders

## Migration Guide

### Moving from Traditional Structure

**Before: Single hierarchy**
```
Projects/
  ├── App V2/
  │   └── Tasks assigned to various teams
  └── Platform/
      └── More tasks assigned to various teams
```

**After: Cross-tagged organization**
```
Projects/                    Teams/                   Sprints/
  ├── App V2                  ├── Design Team          ├── Sprint 12
  │   └── Task A (primary)    │   └── Task A           │   └── Task A
  └── Platform                └── Backend Team         └── Sprint 13
      └── Task B (primary)        └── Task B               └── Task B
```

Same tasks, multiple organizational views!

---

**Implementation Status**: ✅ Fully Implemented
**Last Updated**: 2024
**Feature Owner**: DCM Development Team
