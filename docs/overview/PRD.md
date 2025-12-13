# Product Requirements Document (PRD) - PipeDesk

> ⚠️ **AVISO IMPORTANTE - DEZEMBRO 2025**
> 
> Este documento foi criado durante o planejamento inicial do projeto e contém algumas **discrepâncias com a implementação real**.
> 
> **Para informações PRECISAS e ATUALIZADAS:**
> - ✅ **Status Real das Features:** [FEATURES_STATUS.md](FEATURES_STATUS.md)
> - 📋 **Roadmap Atualizado:** [ROADMAP.md](ROADMAP.md)
> - 🔍 **Auditoria Completa:** [DOCUMENTATION_AUDIT.md](DOCUMENTATION_AUDIT.md)
> 
> **Principais Discrepâncias Neste Documento:**
> - ❌ "Global Search" marcado como implementado → **NÃO implementado**
> - ❌ "Bulk Operations" marcado como implementado → **NÃO implementado**
> - ❌ "File Upload" marcado como implementado → **PARCIALMENTE implementado**
> - ✅ "Custom Fields" marcado como planejado → **JÁ IMPLEMENTADO**
> - ⚠️ "Google Integration" marcado como completo → **PARCIALMENTE implementado**
> - ⚠️ "AI Features" marcado como completo → **PARCIALMENTE implementado**
> 
> Este documento está sendo mantido por **referência histórica**. Use FEATURES_STATUS.md para decisões baseadas no estado atual.

---

## Implementation Status

### ✅ Completed Features

1. **Master Deal Management** - Fully implemented with create, view, edit capabilities, and cascading rules ✨
   - Auto-generate Drive folder integration (with Google Workspace)
   - Cascading cancel rules to child player tracks
   - Status management with automatic propagation
2. **Player Track System** - Complete with stage-based tracking, weighted forecasts, and team assignment ✨
   - Win triggers auto-cancel of sibling players
   - Role-based anonymization for external users
   - Team assignment for players
   - Multi-view workspace (Kanban, Gantt, Calendar, List)
3. **Task Dependencies & Milestones** - Task management with dependencies and milestone support
4. **Role-Based Access Control** - Complete authentication and permission system ✅
   - User creation and editing
   - Role assignment (admin, analyst, newbusiness, client)
   - Magic link authentication with secure token generation
   - Email invitation system with customizable expiration
   - Token revocation and status management
   - Player name anonymization for clients
   - Permission-based feature visibility
   - Authentication flow with state management
5. **Multi-View Workspace** - Complete with all 4 view types ✨
   - Kanban board with WIP limits and drag-and-drop
   - List view with inline task editing
   - Gantt chart with D3 timeline visualization
   - Calendar view with monthly navigation
   - Per-track view state persistence
6. **Advanced Analytics** - Comprehensive analytics dashboard with filtering and export ✨
   - Real-time pipeline metrics
   - Time-in-stage tracking with stage history
   - SLA monitoring and breach detection
   - Team workload distribution
   - Date/team/type filtering
   - Excel/CSV export functionality (admin only)
   - Weighted forecast calculations
7. **Centralized Inbox** - Notification center with filtering and navigation ✨
   - Filter by notification type (mentions, assignments, status changes)
   - Navigate to context on click
   - Mark as read/unread functionality
   - Unread count indicators
7. **Google Workspace Integration** - ⚠️ **PARCIALMENTE IMPLEMENTADO** (OAuth e schema existem, funcionalidades completas incertas)
   - OAuth connection management with token tracking
   - Drive folder automation with custom naming patterns
   - Calendar sync with configurable intervals
   - Gmail thread sync (beta)
   - Folder hierarchy (Master > Player)
   - Event creation for deadlines and milestones
   - Token expiration warnings
   - **Status Real:** Ver [FEATURES_STATUS.md](FEATURES_STATUS.md#23-google-workspace-integration-)
8. **Comments System with Mentions** - Full-featured commenting with @mentions ✅
   - Real-time mention detection and autocomplete
   - User notifications for mentions
   - Comment thread AI summarization (se configurado)
   - Rich comment display with mention highlighting
9. **AI-Powered Intelligence** - ⚠️ **PARCIALMENTE IMPLEMENTADO** (componente existe, integração LLM incerta)
   - Comment thread summarization
   - Next-step suggestions based on deal/track context
   - Context-aware recommendations by stage
   - Priority and category classification
   - **Status Real:** Ver [FEATURES_STATUS.md](FEATURES_STATUS.md#24-ai-powered-intelligence-)
10. **Global Search** - ❌ **NÃO IMPLEMENTADO** (marcado incorretamente como completo)
   - ~~Search deals, players, tasks, and comments~~
   - ~~Grouped results by entity type~~
   - ~~Click-to-navigate to results~~
   - ~~Respects player anonymization rules~~
   - **Status Real:** Feature não encontrada no código. Ver [ROADMAP.md](ROADMAP.md#2-global-search-completo) para planos
11. **Activity History/Audit Log** - Complete audit trail ✅
   - All CRUD operations logged
   - User attribution and timestamps
   - Filterable by entity
   - Activity grouping by date
   - Detailed metadata capture
12. **Master Kanban View** - Grid visualization of deals and players ✅
   - Stage-based kanban layout
   - Desktop grid with drill-down cells
   - Mobile carousel adaptation
   - Weighted pipeline calculations per deal
   - Click-through to player details
13. **File Upload and Document Management** - ⚠️ **PARCIALMENTE IMPLEMENTADO** (DataRoom existe, funcionalidades completas incertas)
   - ~~Multi-file upload support~~
   - ~~File type detection and icons~~
   - ~~Document preview and download~~
   - ~~Activity logging for uploads~~
   - ~~Size validation (10MB limit)~~
   - **Status Real:** Ver [FEATURES_STATUS.md](FEATURES_STATUS.md#25-document-management--data-room-)
14. **Bulk Operations** - ❌ **NÃO IMPLEMENTADO** (marcado incorretamente como completo)
   - ~~Bulk delete, status change, stage change~~
   - ~~Bulk assignment and task completion~~
   - ~~Confirmation dialogs~~
   - ~~Activity logging for all operations~~
   - ~~Smart entity selection~~
   - **Status Real:** Componentes não encontrados no código. Ver [ROADMAP.md](ROADMAP.md#3-bulk-operations) para planos
15. **Task Management System** - Comprehensive task tracking and workflow ✅
   - Centralized task view with filtering and search
   - Multiple view modes (List, Kanban)
   - Task status tracking (To Do, In Progress, Blocked, Completed)
   - Advanced filtering (My Tasks, Overdue, Today, This Week, Milestones, Completed)
   - Multi-sort options (Due Date, Priority, Created, Updated, Alphabetical)
   - Real-time statistics dashboard
   - Task detail dialog with full information
   - Dependency visualization
   - Comments integration
   - Quick complete/uncomplete actions
   - Mobile-responsive design
16. **Cross-Tagging (Multi-Homing)** - Wrike-inspired organizational flexibility ✅
   - Single entity appears in multiple folders simultaneously
   - Primary folder designation with star indicator
   - Hierarchical folder structure (Projects, Teams, Sprints, Categories)
   - Folder browser with collapsible tree navigation
   - Real-time cross-reference updates
   - Visual folder organization with custom colors and icons
   - Untagged items detection and management
   - Supports deals, player tracks, and tasks
   - Zero data duplication with single source of truth
   - Tag management dialog with multi-select interface
17. **Phase Validation with Conditional Requirements** - Pipefy-inspired process engineering ✅
   - Configure rules that block phase transitions based on field conditions
   - Multiple validation operators (equals, greater_than, less_than, contains, is_filled, is_empty)
   - Support for both track and deal fields in validation rules
   - AND/OR logic for multiple conditions
   - Custom error messages per rule
   - Visual feedback when validation fails
   - Enable/disable rules without deletion
   - Prevents human error by enforcing compliance requirements
   - Guarantees critical information is collected before advancing
   - Admin-configurable validation rules
18. **Custom Fields/Metadata** - ✅ **JÁ IMPLEMENTADO** (marcado incorretamente como planejado)
   - ✅ Extensible data model for dynamic field definitions
   - ✅ Field types: text, number, date, select, multiselect, boolean, url, email
   - ✅ Entity types: deal, track, task
   - ✅ Required/optional fields
   - ✅ Admin UI at `/settings/custom-fields`
   - **Status Real:** Feature COMPLETA. Ver [FEATURES_STATUS.md](FEATURES_STATUS.md#15-custom-fields-)

### 🚧 Planned for Future Iterations

19. **Companies & Contacts Management** - ✅ **JÁ IMPLEMENTADO** (não estava no PRD original!)
   - ✅ Companies CRUD com types e relationship levels
   - ✅ Contacts CRUD com linking para companies
   - ✅ Páginas em `/companies` e `/contacts`
   - **Status Real:** Ver [FEATURES_STATUS.md](FEATURES_STATUS.md)
20. **Leads Management** - ✅ **JÁ IMPLEMENTADO** (não estava no PRD original!)
   - ✅ Leads CRUD com qualification workflow
   - ✅ Status: new, contacted, qualified, disqualified
   - ✅ Página em `/leads`
   - **Status Real:** Ver [FEATURES_STATUS.md](FEATURES_STATUS.md)
21. **Advanced Edge Case Handling** - 📋 Planejado
   - Orphaned task recovery with soft delete
   - Concurrent edit detection with conflict UI
   - Offline edit queue with sync on reconnect
   - Magic link expiry handling
19. **Production OAuth Integration** - Replace mock OAuth with real Google API credentials
20. **Email Digest** - Daily summary notifications for team members
21. **Advanced Gantt Features** - Critical path highlighting and resource allocation
22. **Real-time Collaboration** - WebSocket-based live updates across users
23. **Mobile Apps** - Native iOS and Android applications
24. **Automation Workflows** - Zapier-style if-this-then-that automation builder

---

# Planning Guide

DCM - Koa Capital is a specialized hierarchical project management system for M&A and investment banking professionals to manage complex multi-party financial deals with strict privacy controls and client anonymization.

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

### Cross-Tagging (Multi-Homing)
- **Functionality**: Single task/deal/track can exist in multiple folders simultaneously without duplication
- **Purpose**: Enable matrix organizations to view same entity from different perspectives (project view, team view, sprint view)
- **Trigger**: Click tag icon on any entity or use folder browser
- **Progression**: Open cross-tag dialog → Select multiple folders → Designate primary folder with star → Save → Entity appears in all selected locations → Any edit updates everywhere
- **Success criteria**: Entity count badges accurate, primary folder indicator visible, updates propagate instantly, no data duplication

### Phase Validation with Conditional Requirements
- **Functionality**: Configurable rules that prevent stage transitions when specific field conditions aren't met
- **Purpose**: Enforce compliance and process standardization by ensuring critical data is collected before advancing
- **Trigger**: Admin configures rules in Phase Validation Manager, triggered automatically when user changes player track stage
- **Progression**: Admin creates rule → Sets from/to stages → Adds conditions → User attempts stage change → Validation runs → If passes: stage changes → If fails: dialog shows blocked with requirements → User fills missing data → Retries successfully
- **Success criteria**: Rules block transitions correctly, validation feedback is clear, custom error messages display, enable/disable works, supports AND/OR logic


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
