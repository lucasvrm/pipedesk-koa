# DealFlow Manager

A specialized hierarchical project management system for M&A and investment banking professionals to manage complex multi-party financial deals with strict privacy controls and client anonymization.

## 🌟 Key Features

### ✅ Implemented (Iteration 3)

1. **Master Deal Management**
   - Create and track parent-level deals representing client needs
   - AI-powered description generation
   - Volume, operation type, and deadline tracking
   - Status management (active, cancelled, concluded)

2. **Player Track System**
   - Child entities for individual investor/bank negotiations
   - Stage-based probability calculations
   - Weighted forecast calculations
   - Win/cancel cascading logic

3. **Task Dependencies & Milestones**
   - Task creation with dependency linking
   - Milestone markers and celebration
   - Circular dependency detection
   - Visual blocked indicators
   - Kanban and list views

4. **Role-Based Access Control** ⭐ NEW
   - Four-tier permission system (Admin, Analyst, New Business, Client)
   - Magic link authentication with secure tokens
   - Email invitation system with customizable expiration
   - Token management dashboard with revocation
   - Player name anonymization for external clients
   - Permission-based UI rendering
   - See [RBAC_GUIDE.md](./RBAC_GUIDE.md) for details

5. **Multi-View Workspace**
   - Kanban board with drag-and-drop
   - List view with inline editing
   - Gantt chart with D3 timeline
   - Calendar view for deadlines
   - Per-track view state persistence

6. **Advanced Analytics**
   - Real-time pipeline metrics
   - Time-in-stage tracking
   - SLA monitoring
   - Team workload distribution
   - Weighted forecast calculations

7. **Centralized Inbox**
   - Unified notification center
   - Assignment and status change alerts
   - Mark as read/unread
   - SLA breach notifications

8. **Google Workspace Integration**
   - OAuth connection management
   - Drive folder automation
   - Calendar sync
   - Gmail thread sync (beta)

## 🚀 Getting Started

### Default Admin Account
- **Email**: joao.silva@empresa.com
- **Name**: João Silva
- **Role**: Admin

### Inviting Users

1. Navigate to your avatar → **Gerenciar Usuários**
2. Click **Enviar Convite**
3. Fill in user details and select role
4. Copy magic link and send to user
5. User clicks link to authenticate

See [RBAC_GUIDE.md](./RBAC_GUIDE.md) for complete authentication documentation.

## 📊 Permission Levels

| Role | Description | Key Permissions |
|------|-------------|----------------|
| **Admin** | Full system access | User management, integrations, data export |
| **Analyst** | Deal management | Create/edit deals, assign tasks, analytics |
| **New Business** | View-only access | See all data without modifications |
| **Client** | Limited external access | Anonymized player names, read-only |

## 🏗️ Technical Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui v4
- **Icons**: Phosphor Icons
- **Charts**: D3.js, Recharts
- **State**: React hooks + `@github/spark/hooks`
- **Persistence**: Spark KV store
- **Build**: Vite

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn components
│   ├── Dashboard.tsx          # Main dashboard
│   ├── DealsView.tsx          # Deals list
│   ├── InviteUserDialog.tsx   # User invitation ⭐
│   ├── MagicLinksDialog.tsx   # Link management ⭐
│   ├── MagicLinkAuth.tsx      # Auth flow ⭐
│   ├── RBACDemo.tsx           # Permission demo ⭐
│   └── ...
├── lib/
│   ├── auth.ts                # Auth utilities ⭐
│   ├── permissions.ts         # RBAC system ⭐
│   ├── types.ts               # TypeScript types
│   └── helpers.ts             # Utility functions
└── App.tsx                    # Main app component
```

## 📖 Documentation

- [PRD.md](./PRD.md) - Product Requirements Document
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Feature completion status
- [RBAC_GUIDE.md](./RBAC_GUIDE.md) - Authentication & permissions guide ⭐

## 🎯 Current Progress

**Overall Completion**: ~80%

- ✅ Master Deal Management
- ✅ Player Track System  
- ✅ Task Dependencies & Milestones
- ✅ Role-Based Access Control ⭐
- ✅ Multi-View Workspace
- ✅ Analytics Dashboard
- ✅ Centralized Inbox
- ✅ Google Workspace Integration
- 🔄 Comments & Mentions (planned)
- 🔄 Document Management (planned)
- 🔄 Activity Audit Log (planned)

## 🔐 Security Features

- Secure magic link tokens (64-character)
- One-time use authentication
- Token expiration and revocation
- Player name anonymization for clients
- Permission-based access control
- Session management with persistence

## 🛠️ Development

This Spark app runs in a special runtime environment optimized for React + TypeScript.

### Key Points
- Uses `useKV` for persistent data storage
- No backend required - all data in browser
- Hot reload enabled for fast development
- TypeScript with strict mode

### Adding Dependencies
```bash
npm install package-name
```

## 📝 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
