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

9. **Guided Onboarding** 🎯
   - Interactive product tour using react-joyride
   - Step-by-step walkthrough of key features
   - Automatic trigger for new users
   - Completion tracking

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern browser with JavaScript enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/lucasvrm/pipedesk-koa.git
cd pipedesk-koa

# Install dependencies
# Note: Use --legacy-peer-deps flag due to React 19 compatibility with react-joyride
npm install --legacy-peer-deps

# Create .env file (optional - for Supabase integration)
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test:run

# Run tests with coverage
npx vitest run --coverage
```

### React 19 and react-joyride Compatibility

This project uses **React 19** for the latest features and performance improvements. The onboarding tour feature relies on **react-joyride v2.9.3**, which currently lists React 15-18 as peer dependencies.

**Current Status:**
- ✅ react-joyride works correctly with React 19 in runtime
- ⚠️ npm install requires `--legacy-peer-deps` flag to bypass peer dependency warnings
- ✅ No functional issues detected - the onboarding tour works as expected
- ✅ All tests passing, no runtime errors

**Why we use --legacy-peer-deps:**
React-joyride's internal dependency `react-floater` specifies React 15-18 as peer dependencies. However, testing confirms the library is compatible with React 19. We use `--legacy-peer-deps` as a conscious decision to proceed with this setup while awaiting an official React 19-compatible release.

**Future considerations:**
- Monitor [react-joyride repository](https://github.com/gilbarbara/react-joyride) for React 19 support
- Consider alternative onboarding libraries if issues arise
- Current approach is production-ready but requires documentation for new developers

### Onboarding Tour Setup

The application includes an interactive onboarding tour that automatically launches for new users. The tour is implemented using **react-joyride** and guides users through key features.

**Tour Features:**
- ✨ Automatic detection of first-time users
- 🎯 Step-by-step walkthrough of main features
- ⏭️ Skippable at any time
- ✅ Completion tracking in user profile
- 🔄 Can be re-triggered from Help Center

**Tour Steps:**
1. Welcome message
2. Create Deal button
3. Deals navigation
4. Kanban view
5. Analytics dashboard
6. Notification center

**Configuration:**
The tour steps are defined in `/src/components/OnboardingTour.tsx`. To customize:

```typescript
const tourSteps: Step[] = [
  {
    target: 'body',
    content: <div>Your custom content</div>,
    placement: 'center',
  },
  // Add more steps...
]
```

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
- **Onboarding**: react-joyride v2.9.3
- **State**: React hooks + `@github/spark/hooks`
- **Persistence**: Spark KV store + Supabase
- **Build**: Vite 6.4.1
- **Testing**: Vitest 4.0.12 + Testing Library

## 🎯 Performance Optimizations

### Code Splitting & Lazy Loading

The application uses advanced code splitting to optimize bundle size and initial load time:

**Bundle Breakdown:**
- Main chunk: **476.86 kB (145.33 kB gzip)** ✨ 82.7% smaller than original
- Vendor chunks separated by category:
  - React core: 12.34 kB
  - UI components: 120.17 kB  
  - Charts (D3/Recharts): 423.47 kB
- Feature chunks loaded on-demand:
  - Analytics: 993.54 kB
  - Deals: 182.90 kB
  - Tasks: 19.00 kB
  - Data Room: 436.49 kB
  - Audit Log: 80.17 kB

**Benefits:**
- Fast initial page load
- Heavy features only downloaded when needed
- Better caching strategy
- Improved user experience on slow connections

## 🧪 Testing

**Current Test Coverage:** 3.52%

The project includes comprehensive tests for critical business logic:

- **RBAC/Permissions**: 100% coverage (65 tests)
  - Role-based permission checks
  - Player name anonymization
  - Permission mapping for all user roles

- **Analytics Calculations**: 100% coverage (38 tests)
  - Pipeline value and weighted forecasts
  - Conversion rates and win rates
  - Stage-based metrics
  - Fee calculations

- **Task Dependencies**: 96% coverage (25 tests)
  - Circular dependency detection
  - Task blocking logic
  - Dependency management

- **Helper Functions**: 35% coverage (39 tests)
  - Currency formatting
  - Date handling
  - Weighted volume calculations

**Running Tests:**
```bash
# Run all tests
npm run test:run

# Run tests with coverage
npx vitest run --coverage

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn components
│   ├── OnboardingTour.tsx     # Product tour ⭐
│   ├── HelpCenter.tsx         # Help and documentation
│   └── ...
├── features/
│   ├── analytics/             # Analytics dashboard and calculations
│   │   ├── components/
│   │   ├── utils/
│   │   └── __tests__/
│   ├── deals/                 # Deal management
│   │   ├── components/
│   │   ├── hooks/
│   │   └── __tests__/
│   ├── tasks/                 # Task management with dependencies
│   │   ├── components/
│   │   ├── utils/
│   │   └── __tests__/
│   ├── rbac/                  # Role-based access control
│   │   ├── components/
│   │   └── hooks/
│   └── inbox/                 # Notifications
├── lib/
│   ├── auth.ts                # Auth utilities ⭐
│   ├── permissions.ts         # RBAC system ⭐
│   ├── types.ts               # TypeScript types
│   ├── helpers.ts             # Utility functions
│   └── __tests__/             # Unit tests for core logic
├── contexts/
│   ├── AuthContext.tsx        # Authentication state
│   └── ImpersonationContext.tsx
└── App.tsx                    # Main app with lazy loading
```

## 📖 Documentation

- [PRD.md](./PRD.md) - Product Requirements Document
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Feature completion status
- [RBAC_GUIDE.md](./RBAC_GUIDE.md) - Authentication & permissions guide ⭐
- [QA_REPORT.md](./QA_REPORT.md) - Quality assurance report

## 🎯 Current Progress

**Overall Completion**: ~85%

- ✅ Master Deal Management
- ✅ Player Track System  
- ✅ Task Dependencies & Milestones
- ✅ Role-Based Access Control ⭐
- ✅ Multi-View Workspace
- ✅ Analytics Dashboard
- ✅ Centralized Inbox
- ✅ Google Workspace Integration
- ✅ Guided Onboarding Tour ⭐
- ✅ Code Splitting & Performance ⭐
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
- Supabase integration for production data
- Hot reload enabled for fast development
- TypeScript with strict mode
- ESLint for code quality
- Vitest for testing

### Adding Dependencies

**For most packages:**
```bash
npm install package-name --legacy-peer-deps
```

**Why --legacy-peer-deps?**
Required due to React 19 compatibility with react-joyride. This is a temporary workaround until the library officially supports React 19.

### Build & Deploy

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run build && ls -lh dist/assets/
```

## 🐛 Troubleshooting

### Installation Issues

**Problem:** npm install fails with peer dependency errors
```bash
npm ERR! ERESOLVE could not resolve
npm ERR! peer react@"15 - 18" from react-joyride@2.9.3
```

**Solution:** Use the `--legacy-peer-deps` flag:
```bash
npm install --legacy-peer-deps
```

### Onboarding Tour Not Showing

**Problem:** Tour doesn't launch for new users

**Possible causes:**
1. User profile has `has_completed_onboarding: true`
2. DOM elements with `data-tour` attributes are missing
3. Browser console shows react-joyride errors

**Solution:** 
- Check user profile in database/KV store
- Verify tour target elements have correct `data-tour` attributes
- Check browser console for errors

### Code Coverage Not Generating

**Problem:** Coverage reports are missing

**Solution:**
```bash
# Install coverage provider
npm install --save-dev @vitest/coverage-v8 --legacy-peer-deps

# Run tests with coverage
npx vitest run --coverage
```

## 📝 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
