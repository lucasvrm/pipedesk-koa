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
- **Persistence**: Spark KV store + Supabase
- **Build**: Vite
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + typescript-eslint

## ⚙️ Runtime Requirements

**⚠️ IMPORTANT**: This application is designed to run in the **GitHub Spark** runtime environment.

### GitHub Spark Integration

The application relies on GitHub Spark's Key-Value (KV) store for data persistence, which is accessed through the `/_spark/kv/*` endpoints. These endpoints are **only available when running in the GitHub Spark environment**.

**What this means:**
- ✅ The app works fully when deployed to GitHub Spark
- ⚠️ Local development will show 403 errors for KV endpoints
- ⚠️ Some features may not work completely in local development

### Local Development Limitations

When running locally (`npm run dev`), you will see errors like:
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
- http://localhost:5000/_spark/kv/notifications
- http://localhost:5000/_spark/loaded
```

This is **expected behavior** - these endpoints require the Spark runtime.

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

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/lucasvrm/pipedesk-koa.git
   cd pipedesk-koa
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   
   ⚠️ The `--legacy-peer-deps` flag is required due to React 19 compatibility issues with `react-joyride` (used for onboarding tours). This is a non-critical feature and does not affect core functionality.

3. **Create environment file**
   
   Create a `.env` file in the root directory:
   ```bash
   # Supabase Configuration (use dummy values for local testing)
   VITE_SUPABASE_URL=https://dummy-project.supabase.co
   VITE_SUPABASE_ANON_KEY=dummy_anon_key_for_local_testing_only
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5000/`

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Run tests**
   ```bash
   npm run test:run    # Run all tests
   npm run test        # Run tests in watch mode
   npm run test:ui     # Run tests with UI
   ```

7. **Lint code**
   ```bash
   npm run lint
   ```

8. **Type checking**
   ```bash
   npx tsc --noEmit
   ```

### Key Points
- Uses `useKV` from `@github/spark/hooks` for persistent data storage
- Data persists in Spark KV (when in Spark environment) or Supabase
- Hot reload enabled for fast development
- TypeScript with type-safe development

### Adding Dependencies
```bash
npm install --legacy-peer-deps package-name
```

Always use `--legacy-peer-deps` to avoid peer dependency conflicts.

## 🧪 Testing

See [TESTING.md](./TESTING.md) for detailed testing documentation.

### Quick Test Commands
```bash
npm run test:run     # Run all tests once
npm run test         # Watch mode
npm run test:ui      # Interactive UI
```

Current test coverage: ~5% (2 test files, 5 tests)
Target: 30%+ coverage on critical features

## 🐛 Troubleshooting

### Common Issues

#### 403 Forbidden on `/_spark/kv/*` endpoints

**Symptom**: Console shows errors like:
```
Failed to fetch KV key: Forbidden
GET http://localhost:5000/_spark/kv/notifications 403
```

**Cause**: You're running the app locally, but Spark KV endpoints are only available in the GitHub Spark runtime.

**Solution**: This is expected behavior for local development. The app is designed to run in GitHub Spark. Core UI and navigation will still work, but data persistence features will be limited.

#### npm install errors (peer dependency conflicts)

**Symptom**: npm install fails with peer dependency errors

**Solution**: Use `npm install --legacy-peer-deps`

**Reason**: react-joyride@2.9.3 requires React 15-18, but the project uses React 19. This is a non-critical dependency used only for onboarding tours.

#### TypeScript errors

**Symptom**: TypeScript compiler shows errors

**Solution**: Run `npx tsc --noEmit` to see all type errors. The codebase currently has 0 TypeScript errors.

#### Build warnings about chunk size

**Symptom**: 
```
(!) Some chunks are larger than 500 kB after minification
dist/assets/index-*.js: 2,754 kB (gzip: 826 kB)
```

**Solution**: This is a known issue. The bundle size is large due to:
- D3.js and Recharts for visualizations
- Multiple Radix UI components
- Full feature set loaded eagerly

**Future improvement**: Implement code splitting and lazy loading (see Phase 7 of QA roadmap).

### Getting Help

1. Check existing documentation:
   - [PRD.md](./PRD.md) - Product requirements
   - [RBAC_GUIDE.md](./RBAC_GUIDE.md) - Authentication guide
   - [TESTING.md](./TESTING.md) - Testing guide (if available)
   
2. Check the [QA_REPORT.md](./QA_REPORT.md) for known issues and improvement roadmap

3. Open an issue on GitHub with:
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, OS, etc.)

## 📝 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
