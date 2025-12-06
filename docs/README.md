# PipeDesk Documentation

Welcome to the PipeDesk documentation! This guide will help you understand, set up, and use PipeDesk effectively.

## 📖 What is PipeDesk?

PipeDesk is a modern Deal Flow Management Platform designed for investment banking and financial deal management. It provides a comprehensive solution for managing complex multi-party financial deals with strict privacy controls, role-based access, and collaborative features.

## 🚀 Quick Links

- **New to PipeDesk?** Start with [Installation Guide](getting-started/installation.md)
- **Want to contribute?** Read [Contributing Guidelines](CONTRIBUTING.md)
- **Security concerns?** Check [Security Policy](SECURITY.md)
- **Testing the app?** See [Testing Guide](development/testing.md)

## 📚 Documentation Structure

### Getting Started
- [Installation & Setup](getting-started/installation.md) - Install dependencies and configure the application
- [Quick Start Guide](getting-started/quick-start.md) - Get up and running in minutes
- [Configuration](getting-started/configuration.md) - Environment variables and Supabase setup

### Features
Core features of PipeDesk:
- [Deals Management](features/deals.md) - Master Deals and Player Tracks
- [Companies & Contacts](features/companies-contacts.md) - Relationship management
- [Leads](features/leads.md) - Lead capture and qualification
- [Tasks](features/tasks.md) - Task management with dependencies
- [Analytics](features/analytics.md) - Dashboard and reporting
- [RBAC & Permissions](features/rbac.md) - Role-based access control
- [Google Integration](features/google-integration.md) - Google Workspace sync
- [Cross-Tagging](features/cross-tagging.md) - Organizational tagging system
- [Audit Log](features/audit-log.md) - Activity tracking and compliance
- [UI Components](features/ui-components.md) - Shared UI components and patterns

### Development
For developers and contributors:
- [Architecture](development/architecture.md) - System design and structure
- [Database Schema](development/database-schema.md) - Supabase tables and relationships
- [Testing](development/testing.md) - Testing strategy and guidelines
- [Troubleshooting](development/troubleshooting.md) - Common issues and solutions

### API Reference
- [Supabase API](api/supabase-api.md) - Database API and RLS policies

## 🎯 Key Features

### ✅ Implemented Features

1. **Master Deal Management**
   - Create and track parent-level deals
   - AI-powered descriptions
   - Volume, operation type, and deadline tracking
   - Status management (active, cancelled, concluded)

2. **Player Track System**
   - Child entities for individual negotiations
   - Stage-based probability calculations
   - Weighted forecast calculations
   - Win/cancel cascading logic

3. **Task Dependencies & Milestones**
   - Task creation with dependency linking
   - Milestone markers
   - Circular dependency detection
   - Visual blocked indicators

4. **Role-Based Access Control (RBAC)**
   - Four-tier permission system (Admin, Analyst, New Business, Client)
   - Magic link authentication
   - Email invitation system
   - Player name anonymization for clients

5. **Multi-View Workspace**
   - Kanban board with drag-and-drop
   - List view with inline editing
   - Gantt chart with D3 timeline
   - Calendar view for deadlines

6. **Advanced Analytics**
   - Real-time pipeline metrics
   - Time-in-stage tracking
   - SLA monitoring
   - Team workload distribution

7. **Google Workspace Integration**
   - OAuth connection management
   - Drive folder automation
   - Calendar sync
   - Gmail thread sync (beta)

8. **Leads & Contact Management**
   - Lead capture and qualification
   - Contact relationship tracking
   - Company profiles

## 🏗️ Technical Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui v4
- **Icons**: Phosphor Icons
- **Charts**: D3.js, Recharts
- **State**: React hooks + TanStack Query
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Build**: Vite 6.4.1
- **Testing**: Vitest 4.0.12 + Playwright

## 📦 Quick Start

```bash
# Clone the repository
git clone https://github.com/lucasvrm/pipedesk-koa.git
cd pipedesk-koa

# Install dependencies
npm install --legacy-peer-deps

# Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev

# Run tests
npm run test:run
```

For detailed instructions, see the [Installation Guide](getting-started/installation.md).

## 🔐 Security

PipeDesk takes security seriously:
- Secure magic link authentication
- Row-level security (RLS) in Supabase
- Role-based access control
- Player name anonymization for external clients
- Audit logging for compliance

See [Security Policy](SECURITY.md) for more details.

## 🧪 Testing

PipeDesk uses Vitest for unit tests and Playwright for E2E tests:

```bash
npm run test:run        # Run unit tests
npm run test:coverage   # Run with coverage
npm run test:e2e        # Run E2E tests
```

See [Testing Guide](development/testing.md) for more information.

## 📊 Project Status

**Current Version**: 0.3.0  
**Overall Completion**: ~85%

See [CURRENT_STATUS.md](CURRENT_STATUS.md) for detailed status information.

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

- **Documentation**: This documentation
- **Issues**: [GitHub Issues](https://github.com/lucasvrm/pipedesk-koa/issues)
- **Archive**: Historical documentation is in [/docs/archive](archive/)

## 🗂️ Archive

Historical documentation (migration guides, phase reports, audits) has been moved to `/docs/archive` for reference:
- `archive/migrations/` - Database and system migration guides
- `archive/phases/` - Phase implementation summaries
- `archive/reports/` - QA reports and audit results

---

**Last Updated**: December 2025  
**Maintained by**: PipeDesk Team
