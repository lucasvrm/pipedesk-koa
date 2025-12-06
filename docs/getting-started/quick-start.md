# Quick Start Guide

Get up and running with PipeDesk in minutes! This guide assumes you've already completed the [Installation](installation.md).

## First Login

### Using Supabase Authentication

1. Navigate to `http://localhost:5000/`
2. Click "Magic Link" tab
3. Enter your email address
4. Click "Send Magic Link"
5. Check your email and click the link
6. You'll be redirected and automatically logged in

### Default Admin Account (Development)

For local testing with seed data:
- **Email**: `joao.silva@empresa.com`
- **Name**: João Silva
- **Role**: Admin

## Main Navigation

After logging in, you'll see the main dashboard with these sections:

### 📊 Dashboard
- Overview of your pipeline
- Key metrics and analytics
- Recent activity

### 💼 Deals
- **List View**: All master deals
- **Kanban View**: Drag-and-drop deal management
- **Create Deal**: Start a new deal

### 🏢 Companies
- Manage company profiles
- Track relationships
- Filter by type (Client, Investor, Partner, etc.)

### 👥 Contacts
- Contact management
- Link to companies
- Track interactions

### 📋 Leads
- Lead capture
- Qualification workflow
- Convert to deals

### ✅ Tasks
- Centralized task management
- Dependencies and milestones
- Filter by status, due date, assignee

### 📈 Analytics
- Pipeline metrics
- Time-in-stage tracking
- Team performance
- Export reports (Admin only)

## Creating Your First Deal

1. **Navigate to Deals**
   - Click "Deals" in the sidebar
   - Click "Create Deal" button

2. **Fill in Deal Information**
   - **Name**: e.g., "Acquisition of Company XYZ"
   - **Description**: Brief description
   - **Volume**: Deal size (e.g., R$ 10.000.000)
   - **Operation Type**: Acquisition, Merger, Investment, etc.
   - **Expected Closing**: Target date
   - **Responsible**: Assign a team member

3. **Create Player Tracks**
   - After creating the deal, click "Add Player Track"
   - **Player Name**: e.g., "Bank ABC"
   - **Stage**: Initial stage (typically "NDA" or "Analysis")
   - **Probability**: Likelihood of success (0-100%)
   - **Responsible**: Team member handling this track

4. **Add Tasks**
   - In the deal or track view, click "Add Task"
   - Define task details, assignee, and due date
   - Set dependencies if needed

## Understanding the Workflow

### Deal Hierarchy

```
Master Deal (Client Need)
├── Player Track 1 (Investor/Bank 1)
│   ├── Task 1
│   ├── Task 2
│   └── Task 3
├── Player Track 2 (Investor/Bank 2)
│   ├── Task 1
│   └── Task 2
└── Player Track 3 (Investor/Bank 3)
    └── Task 1
```

### Player Track Stages

Deals progress through these stages (configurable):

1. **NDA** - Non-disclosure agreement
2. **Analysis** - Due diligence and analysis
3. **Proposal** - Proposal preparation
4. **Negotiation** - Terms negotiation
5. **Closing** - Final documentation

Each stage has:
- **Probability**: Confidence level
- **SLA**: Time limit warning
- **Tasks**: Required activities

### Status Management

**Deal Status:**
- **Active**: Deal is ongoing
- **Cancelled**: Deal was abandoned
- **Concluded**: Deal was completed

**Track Status:**
- When a track wins, sibling tracks auto-cancel
- When a deal is cancelled, all tracks are cancelled

## Using Different Views

### Kanban View
- Drag tracks between stages
- Visual pipeline overview
- WIP (Work in Progress) limits

### List View
- Sortable columns
- Inline editing
- Bulk operations

### Gantt View
- Timeline visualization
- Dependencies
- Critical path

### Calendar View
- Deadline tracking
- Monthly overview
- Milestone markers

## Role-Based Features

### Admin
- Full access to all features
- User management
- Pipeline configuration
- Data export
- Integration setup

### Analyst
- Create and manage deals
- Assign tasks
- View analytics
- Cannot manage users or settings

### New Business
- View-only access to deals and analytics
- Cannot create or modify

### Client
- Limited external access
- Anonymized player names
- Read-only view of specific deals

## Key Shortcuts

- **Global Search**: `Cmd/Ctrl + K`
- **Create Deal**: Click "+" button in Deals view
- **Navigation**: Use sidebar menu

## Notifications

### Notification Types
- **Assignments**: When you're assigned a task or track
- **Status Changes**: When deals or tracks change status
- **SLA Alerts**: When deadlines approach
- **Mentions**: When someone @mentions you

### Managing Notifications
1. Click the bell icon in the header
2. Filter by type
3. Mark as read/unread
4. Click to navigate to context

## Data Management

### Import Data
- Use synthetic data generator (Admin only)
- Navigate to Admin → Generate Data
- Choose number of deals to create

### Export Data
- Navigate to Analytics
- Click "Export" (Admin only)
- Choose Excel or CSV format

## Google Workspace Integration

### Connect Google Account
1. Navigate to Admin → Integrations → Google
2. Click "Connect Google Account"
3. Authorize access
4. Configure sync settings

### Features
- **Drive Folders**: Auto-create folders for deals
- **Calendar Sync**: Sync deadlines to Google Calendar
- **Gmail Sync**: (Beta) Link email threads

## Customization

### Custom Fields
1. Navigate to Custom Fields
2. Define new fields for Deals, Tracks, or Tasks
3. Choose field type (Text, Number, Date, Select)
4. Set field as required or optional

### Pipeline Configuration (Admin)
1. Navigate to Admin → Pipeline Settings
2. Add/edit/remove stages
3. Configure SLA timeframes
4. Set stage transitions

### Tags
1. Navigate to Admin → Tag Settings
2. Create tags for categorization
3. Enable/disable tag modules
4. Set tag colors

## Best Practices

### Deal Management
- ✅ Use descriptive deal names
- ✅ Keep deal descriptions updated
- ✅ Set realistic probabilities
- ✅ Update stages regularly
- ✅ Add notes in comments

### Task Management
- ✅ Break down work into small tasks
- ✅ Set dependencies for sequential work
- ✅ Use milestones for major checkpoints
- ✅ Assign clear ownership
- ✅ Update status promptly

### Collaboration
- ✅ Use @mentions in comments
- ✅ Add context in task descriptions
- ✅ Update stakeholders regularly
- ✅ Document decisions in comments

## Next Steps

- [Learn about Deals Management](../features/deals.md)
- [Understand RBAC and Permissions](../features/rbac.md)
- [Configure Google Integration](../features/google-integration.md)
- [Set up Custom Fields](configuration.md)

## Need Help?

- **Documentation**: Browse the [Features](../features/) section
- **Troubleshooting**: Check [Common Issues](../development/troubleshooting.md)
- **Support**: Open an [issue on GitHub](https://github.com/lucasvrm/pipedesk-koa/issues)

---

**Previous:** [Installation](installation.md) | **Next:** [Configuration](configuration.md)
