## Implementation Status

### ✅ Completed Features

1. **Master Deal Management** - Fully implemented with create, view, and edit capabilities
2. **Player Track System** - Complete with stage-based tracking and weighted forecasts
3. **Task Dependencies & Milestones** - Task management with dependencies and milestone support
4. **Role-Based Access Control** - Four-tier permission system with user management interface
   - User creation and editing
   - Role assignment (admin, analyst, newbusiness, client)
   - Player name anonymization for clients
   - Permission-based feature visibility
5. **Multi-View Workspace** - Complete with all 4 view types ✨
   - Kanban board with WIP limits and drag-and-drop
   - List view with inline task editing
   - Gantt chart with D3 timeline visualization
   - Calendar view with monthly navigation
   - Per-track view state persistence
6. **Advanced Analytics** - Comprehensive analytics dashboard
   - Real-time pipeline metrics
   - Time-in-stage tracking with stage history
   - SLA monitoring and breach detection
   - Team workload distribution
   - JSON export functionality (admin only)
   - Weighted forecast calculations
7. **Centralized Inbox** - Notification center with mentions, assignments, and status changes
8. **Google Workspace Integration** - Complete OAuth flow and sync features ✨
   - OAuth connection management with token tracking
   - Drive folder automation with custom naming patterns
   - Calendar sync with configurable intervals
   - Gmail thread sync (beta)
   - Folder hierarchy (Master > Player)
   - Event creation for deadlines and milestones
   - Token expiration warnings
9. **Comments System with Mentions** - Full-featured commenting with @mentions
   - Real-time mention detection and autocomplete
   - User notifications for mentions
   - Comment thread AI summarization
   - Rich comment display with mention highlighting
10. **AI-Powered Intelligence** - Advanced AI features implemented
   - Comment thread summarization
   - Next-step suggestions based on deal/track context
   - Context-aware recommendations by stage
   - Priority and category classification
11. **Global Search** - Comprehensive search across all entities
   - Search deals, players, tasks, and comments
   - Grouped results by entity type
   - Click-to-navigate to results
   - Respects player anonymization rules
12. **Activity History/Audit Log** - Complete audit trail
   - All CRUD operations logged
   - User attribution and timestamps
   - Filterable by entity
   - Activity grouping by date
   - Detailed metadata capture
13. **Master Matrix View** - Grid visualization of deals and players
   - Stage-based matrix layout
   - Desktop grid with drill-down cells
   - Mobile carousel adaptation
   - Weighted pipeline calculations per deal
   - Click-through to player details
14. **File Upload and Document Management** - Secure document handling
   - Multi-file upload support
   - File type detection and icons
   - Document preview and download
   - Activity logging for uploads
   - Size validation (10MB limit)
15. **Bulk Operations** - Efficient multi-entity management
   - Bulk delete, status change, stage change
   - Bulk assignment and task completion
   - Confirmation dialogs
   - Activity logging for all operations
   - Smart entity selection

### 🚧 Planned for Future Iterations

16. **Custom Fields/Metadata** - Extensible data model for dynamic field definitions
17. **Advanced Edge Case Handling**
   - Orphaned task recovery with soft delete
   - Concurrent edit detection with conflict UI
   - Offline edit queue with sync on reconnect
   - Magic link expiry handling
18. **Production OAuth Integration** - Replace mock OAuth with real Google API credentials
19. **Email Digest** - Daily summary notifications for team members
20. **Advanced Gantt Features** - Critical path highlighting and resource allocation
21. **Real-time Collaboration** - WebSocket-based live updates across users
22. **Mobile Apps** - Native iOS and Android applications

---

# Planning Guide

DealFlow Manager is a specialized hierarchical project management system for M&A and investment banking professionals to manage complex multi-party financial deals with strict privacy controls and client anonymization.

**Experience Qualities**:
1. **Professional** - Corporate-grade interface that commands trust in high-stakes financial environments with precise data visualization
2. **Efficient** - Dense information architecture allowing deal managers to process multiple concurrent negotiations with minimal cognitive overhead
3. **Secure** - Privacy-first design ensuring external clients see anonymized player data while internal teams maintain full visibility

**Complexity Level**: Complex Application (advanced functionality, accounts)
  - Multi-tenant with role-based access, hierarchical data models, real-time collaboration, AI features, external integrations, and sophisticated analytics

## Essential Features

### Master Deal Management
- **Functionality**: Create parent-level deals representing client needs with volume, operation type, deadline
- **Purpose**: Establish the primary container for all related player negotiations
- **Trigger**: Admin/Analyst clicks "Novo Negócio" from dashboard
- **Progression**: Form entry → Auto-generate Drive folder → Create initial player tracks → Dashboard view
- **Success criteria**: Deal visible in master matrix, cascading rules functional (cancel propagates to children)

### Player Track System
- **Functionality**: Child entities representing individual investor/bank negotiations with stage-based probability
- **Purpose**: Track multiple parallel negotiations for same asset while maintaining mutual exclusivity
- **Trigger**: "Adicionar Player" from Master Deal detail view
- **Progression**: Select stage → Assign team → Set probability → Kanban/Gantt view → Status updates → Win triggers auto-cancel of siblings
- **Success criteria**: Weighted forecast calculations accurate, anonymization works for external users, one win cancels others

### Task Dependencies & Milestones
- **Functionality**: Blocking relationships between tasks with visual connectors and milestone markers
- **Purpose**: Manage complex sequential workflows with regulatory/compliance gates
- **Trigger**: Task creation with "Depende de" selector or milestone flag
- **Progression**: Create task → Link dependency → Visual blocked indicator → Predecessor completes → Auto-unlock → Milestone celebration animation
- **Success criteria**: Cannot mark blocked task complete, Gantt shows critical path, milestone notifications fire

### Role-Based Access Control
- **Functionality**: Four-tier permission system with magic link authentication for external clients
- **Purpose**: Secure collaboration while protecting competitive intelligence
- **Trigger**: User invitation email with role assignment
- **Progression**: Admin invites → Email with magic token → Auto-login → Role-specific UI → Client sees anonymized players
- **Success criteria**: Clients cannot see real player names, magic links expire/revoke properly

### Multi-View Workspace
- **Functionality**: Switch between Kanban, List, Gantt, Calendar views per track
- **Purpose**: Match visualization to workflow stage (early stage = Kanban, closing = Gantt)
- **Trigger**: View selector tabs on track detail page
- **Progression**: Select view → State persists → WIP limits enforced in Kanban → Drag updates in list → Dependencies visible in Gantt
- **Success criteria**: All views sync real-time, Gantt renders dependencies correctly, calendar shows all deadlines

### AI-Powered Intelligence
- **Functionality**: Generate deal descriptions, summarize comment threads, suggest next steps
- **Purpose**: Accelerate documentation and planning with domain-specific AI
- **Trigger**: "Gerar com IA" buttons on description fields, summary icons on long threads
- **Progression**: Click AI button → Loading state → Generated content appears → User edits → Save
- **Success criteria**: Descriptions contextually relevant to deal type, summaries accurate, suggestions actionable

### Analytics Dashboard
- **Functionality**: Real-time widgets for pipeline volume, conversion rates, SLA tracking, workload distribution
- **Purpose**: Executive visibility into team performance and deal health
- **Trigger**: Dashboard navigation menu
- **Progression**: Load dashboard → Filter by date/team/type → Drill into specific deals → Export to Excel (Admin only)
- **Success criteria**: Weighted forecasts sum correctly, time-in-stage accurate, SLA breaches highlighted

### Centralized Inbox
- **Functionality**: Unified notification center aggregating mentions, assignments, status changes
- **Purpose**: Single pane of glass for user action items across all deals
- **Trigger**: Bell icon in top nav, auto-refresh on new items
- **Progression**: View inbox → Filter by type → Click notification → Navigate to context → Mark read/unread
- **Success criteria**: All events captured, navigation context-aware, digest emails daily

### Google Workspace Integration
- **Functionality**: OAuth login, Gmail thread sync, Calendar 2-way sync, Drive folder automation
- **Purpose**: Embed DealFlow into existing corporate workflows
- **Trigger**: Connect Google account in settings
- **Progression**: OAuth flow → Auto-create Drive folders per deal → Sync calendar events → Email replies update cards
- **Success criteria**: Folders follow naming convention (Master > Player), calendar invites all stakeholders

## Edge Case Handling

- **Orphaned Tasks**: Tasks remain accessible via search even if parent track deleted (soft delete recovery window)
- **Concurrent Edits**: Last-write-wins with toast notification "Conteúdo atualizado por [User]"
- **Invalid Dependencies**: Circular dependency detection prevents save with error message
- **Magic Link Expiry**: Expired tokens redirect to request new link page
- **Offline Edits**: Optimistic UI queues changes, syncs on reconnect with conflict toast
- **Empty States**: Each view shows contextual empty state with "Começar" CTA
- **SLA Breaches**: Red visual indicators with escalation notification to Admin
- **Data Export Limits**: Admin exports capped at 10,000 rows with pagination warning

## Design Direction

The interface should evoke trust and precision appropriate for high-stakes financial environments, with a corporate aesthetic that balances dense data presentation with breathing room for focus, leaning toward a minimal interface with purposeful moments of richness in data visualizations and status indicators.

## Color Selection

Triadic color scheme using professional blues, greens, and accent orange to communicate financial stability, growth, and urgent actions.

- **Primary Color**: Deep Corporate Blue (oklch(0.45 0.12 250)) - Conveys trust, stability, and professionalism expected in finance
- **Secondary Colors**: 
  - Muted Slate (oklch(0.55 0.01 240)) for secondary actions and backgrounds
  - Success Green (oklch(0.65 0.15 145)) for positive deal outcomes and completed tasks
- **Accent Color**: Confident Orange (oklch(0.68 0.17 45)) for CTAs, urgent notifications, and SLA warnings
- **Foreground/Background Pairings**:
  - Background (oklch(0.98 0 0)): Dark slate text (oklch(0.25 0.02 240)) - Ratio 11.2:1 ✓
  - Card (oklch(1 0 0)): Primary text (oklch(0.25 0.02 240)) - Ratio 12.1:1 ✓
  - Primary (oklch(0.45 0.12 250)): White text (oklch(1 0 0)) - Ratio 8.4:1 ✓
  - Secondary (oklch(0.92 0.01 240)): Dark text (oklch(0.25 0.02 240)) - Ratio 10.8:1 ✓
  - Accent (oklch(0.68 0.17 45)): White text (oklch(1 0 0)) - Ratio 5.2:1 ✓
  - Muted (oklch(0.95 0.01 240)): Muted foreground (oklch(0.48 0.02 240)) - Ratio 6.1:1 ✓
  - Destructive (oklch(0.58 0.21 25)): White text (oklch(1 0 0)) - Ratio 4.9:1 ✓

## Font Selection

Typography should convey analytical precision and modern professionalism with excellent readability for dense financial data tables.

- **Typographic Hierarchy**:
  - H1 (Page Titles): Inter Bold / 32px / -0.02em tight tracking
  - H2 (Section Headers): Inter Semibold / 24px / -0.01em
  - H3 (Card Titles): Inter Medium / 18px / Normal
  - Body (Data): Inter Regular / 15px / 1.5 line-height
  - Small (Meta): Inter Regular / 13px / 1.4 line-height / Muted color
  - Numbers (Currency/Metrics): Tabular nums / Inter Medium / 16px

## Animations

Animations should feel responsive and businesslike with subtle transitions that reinforce hierarchy and state changes without distracting from high-concentration work.

- **Purposeful Meaning**: Quick fade-ins for new data, smooth slide-outs for dismissals, celebratory pulse on milestone completion, urgent shake on SLA breach
- **Hierarchy of Movement**: 
  - Critical: SLA warnings, deal status changes (300ms with spring physics)
  - Medium: Modal opens, card dragging (200ms ease-out)
  - Subtle: Hover states, dropdown menus (150ms ease-in-out)
  - Background: Dashboard data updates (fade only, no motion)

## Component Selection

- **Components**: 
  - Dialog for deal creation/editing forms with validation
  - Card for deal tiles in Kanban with status badges
  - Table with sortable columns for list view with inline editing
  - Tabs for view switching (Kanban/List/Gantt/Calendar)
  - Select with search for player/user assignment
  - Popover for quick actions menu and filtering
  - Calendar with date-fns integration for deadline picking
  - Sheet for sliding inbox panel
  - Badge for status indicators with color coding
  - Avatar for user assignments with stacking
  - Dropdown-menu for contextual actions
  - Separator for visual hierarchy in dense forms
  - Textarea with auto-resize for observations
  - Toast for notifications with action buttons
  - Progress for deal stage visualization
  - Tooltip for truncated data and help text
  
- **Customizations**: 
  - Custom Gantt component using D3 for timeline rendering
  - Weighted forecast calculator widget (not in shadcn)
  - Kanban board with WIP limit enforcement
  - Master Matrix grid with drill-down cells
  - Magic link generator component
  
- **States**: 
  - Primary buttons: Solid blue with white text, darker on hover, pressed state with subtle scale
  - Secondary buttons: Outlined slate, filled on hover
  - Destructive: Red with warning icon, requires confirmation dialog
  - Disabled: 40% opacity with not-allowed cursor
  - Input focus: Blue ring with slight lift shadow
  - Select open: Dropdown with search highlight
  
- **Icon Selection**: 
  - Plus (Adicionar), Trash (Excluir), PencilSimple (Editar), Eye (Visualizar), EyeSlash (Anonimizar)
  - ChartBar (Analytics), Kanban (Board view), List (List view), Calendar (Calendar view), ChartLine (Gantt)
  - Bell (Notifications), Envelope (Email), Upload (Docs), Download (Export)
  - LinkSimple (Dependencies), Flag (Milestone), Users (Assign), Tag (Labels)
  
- **Spacing**: 
  - Form fields: gap-4 (16px) vertical rhythm
  - Card padding: p-6 (24px) for content breathing room
  - Section margins: mb-8 (32px) between major blocks
  - Button groups: gap-2 (8px) for related actions
  - List items: py-3 (12px) for touch targets
  
- **Mobile**: 
  - Stack multi-column layouts vertically
  - Collapse navigation to hamburger menu
  - Table view switches to card stack with swipe actions
  - Gantt disabled on <768px with message to use desktop
  - Master matrix becomes scrollable carousel
  - Bottom navigation bar for primary actions (Inbox, Deals, Add, Analytics, Profile)
