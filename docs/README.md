# PipeDesk Documentation

Welcome to the PipeDesk documentation! This guide will help you understand, set up, and use PipeDesk effectively.

## 📖 What is PipeDesk?

PipeDesk is a modern Deal Flow Management Platform designed for investment banking and financial deal management. It provides a comprehensive solution for managing complex multi-party financial deals with strict privacy controls, role-based access, and collaborative features.

## 🚀 Quick Links

- **New to PipeDesk?** Start with [Installation Guide](getting-started/installation.md)
- **What's implemented?** See [Features Status](FEATURES_STATUS.md)
- **What's planned?** Check [Roadmap](ROADMAP.md)
- **Want to contribute?** Read [Contributing Guidelines](CONTRIBUTING.md)
- **Security concerns?** Check [Security Policy](SECURITY.md)
- **Testing the app?** See [Testing Guide](TESTING.md)

## 📚 Documentation Structure

### Getting Started
- [Installation & Setup](getting-started/installation.md) - Install dependencies and configure the application
- [Quick Start Guide](getting-started/quick-start.md) - Get up and running in minutes
- [Configuration](getting-started/configuration.md) - Environment variables and Supabase setup

### Core Documentation
- [Features Status](FEATURES_STATUS.md) - ✅ **O que está implementado** (lista completa com status real)
- [Roadmap](ROADMAP.md) - 📋 **O que está planejado** (features futuras por prioridade)
- [Documentation Audit](DOCUMENTATION_AUDIT.md) - 🔍 Auditoria completa da documentação
- [Product Requirements](PRD.md) - Requisitos do produto (⚠️ precisa atualização)
- [Current Status](CURRENT_STATUS.md) - Status geral do projeto (⚠️ precisa atualização)

### Features (Implemented)
Documentação de features implementadas:
- [RBAC & Permissions](features/rbac.md) - ✅ Role-based access control completo
- [Cross-Tagging Guide](CROSS_TAGGING_GUIDE.md) - ✅ Sistema de multi-homing (mover para features/)
- [Task Management](TASK_MANAGEMENT_GUIDE.md) - ✅ Gestão de tasks (mover para features/)
- [Audit Log](VDR_AUDIT_LOG_GUIDE.md) - ✅ Activity tracking (mover para features/)
- [Leads Schema](leads-schema.md) - ✅ Schema de leads (expandir e mover para features/)

### Features (Need Documentation)
Features implementadas mas sem documentação:
- Deals Management - ❌ Precisa criar `features/deals.md`
- Companies Management - ❌ Precisa criar `features/companies.md`
- Contacts Management - ❌ Precisa criar `features/contacts.md`
- Analytics Dashboard - ❌ Precisa criar `features/analytics.md`
- Custom Fields - ❌ Precisa criar `features/custom-fields.md`
- Google Integration - ❌ Precisa criar `features/google-integration.md`
- Document Management - ❌ Precisa criar `features/dataroom.md`
- Notifications & Inbox - ❌ Precisa criar `features/inbox.md`

### Development
For developers and contributors:
- [Testing Guide](TESTING.md) - Testing strategy and guidelines
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute
- [Security Policy](SECURITY.md) - Security guidelines
- Architecture - ❌ Precisa criar `development/architecture.md`
- Database Schema - ❌ Precisa criar `development/database-schema.md`
- Troubleshooting - ❌ Precisa criar `development/troubleshooting.md`

### API Reference
- Supabase API - ❌ Precisa criar `api/supabase-api.md`

## 🎯 Key Features

### ✅ Core Features (Implementadas)

**Deal Flow Management:**
- Master Deal Management - Negócios principais com volume, tipo, deadline
- Player Track System - Negociações individuais com probability tracking
- Multi-View Workspace - Kanban, List, Gantt, Calendar views
- Master Matrix View - Grid visualization de deals x players

**CRM:**
- Companies Management - Gestão de empresas com types e relationship levels
- Contacts Management - Gestão de contatos com linking para companies
- Leads Management - Pipeline de qualificação de leads
- Lead Qualification - Workflow de lead → company + deal

**Task & Project Management:**
- Task Management System - Tasks com dependências e milestones
- Cross-Tagging (Multi-Homing) - Organização flexível com folders
- Phase Validation - Regras configuráveis bloqueando transitions
- Bulk Operations - ❌ **Não implementado** (documentado incorretamente no PRD)

**Analytics & Reporting:**
- Analytics Dashboard - Métricas em tempo real
- Pipeline Metrics - Volume, conversion rates, weighted forecasts
- Time Tracking - Time-in-stage e SLA monitoring
- Team Analytics - Workload distribution

**Security & Governance:**
- RBAC (Role-Based Access Control) - 4 níveis de permissão
- RLS Policies - Row-level security no Supabase
- Player Anonymization - Proteção de dados para clientes
- Audit Trail - Log completo de atividades

**Collaboration:**
- Comments System - Comentários com @mentions
- Notifications - In-app notification center
- Email Digest - ❌ **Não implementado**
- Q&A System - 🔒 **Schema existe, UI não implementada**

**Administration:**
- User Management - CRUD de usuários e roles
- Custom Fields - Campos customizáveis por entity type
- Pipeline Settings - Configuração de stages
- Tag Settings - Gestão de tags organizacionais

### ⚠️ Features Parcialmente Implementadas

1. **Google Workspace Integration** - OAuth e schema existem, funcionalidades completas incertas
2. **AI-Powered Intelligence** - Componente existe, integração LLM não clara
3. **Document Management** - DataRoom existe, funcionalidades completas incertas

### ❌ Features Não Implementadas (mas documentadas como implementadas)

1. **Global Search** - Não encontrado no código
2. **Bulk Operations** - Não encontrado no código
3. **File Upload Completo** - Parcialmente implementado
4. **Email Notifications** - Inbox existe, email sending não

**Ver lista completa:** [FEATURES_STATUS.md](FEATURES_STATUS.md)

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
**Features Status:**
- ✅ Implementadas: 22/30 (73%)
- ⚠️ Parciais: 3/30 (10%)
- ❌ Não Implementadas: 5/30 (17%)

**Documentação:**
- ✅ Documentos Corretos: 8/19 (42%)
- ⚠️ Documentos Desatualizados: 6/19 (32%)
- ❌ Features sem Docs: 12 features

**Ver detalhes:**
- [FEATURES_STATUS.md](FEATURES_STATUS.md) - Status detalhado de cada feature
- [ROADMAP.md](ROADMAP.md) - Roadmap de features planejadas
- [DOCUMENTATION_AUDIT.md](DOCUMENTATION_AUDIT.md) - Auditoria completa

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
