# PipeDesk Documentation

PipeDesk é uma plataforma moderna de Deal Flow Management para bancos de investimento e profissionais de M&A, com foco em governança, colaboração e segurança (RBAC + RLS). Esta documentação centraliza guias, planos e relatórios para instalar, operar e evoluir o produto.

## 🚀 Quick Start

```bash
# Clone o repositório
git clone https://github.com/lucasvrm/pipedesk-koa.git
cd pipedesk-koa

# Instale dependências
npm install --legacy-peer-deps

# Configure o ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

- Acesse: http://localhost:5173
- O repositório inclui `.npmrc` com `legacy-peer-deps=true`; execute `npm install` e `npm ci` com essa flag até todas as dependências suportarem React 19.
- Guia completo de instalação: [`docs/getting-started/installation.md`](docs/getting-started/installation.md)

## 📚 Mapa da Documentação

### Visão Geral
- Visão executiva: [`docs/overview/EXECUTIVE_SUMMARY.md`](docs/overview/EXECUTIVE_SUMMARY.md)
- Produto e requisitos: [`docs/overview/PRD.md`](docs/overview/PRD.md)
- Roteiro macro: [`docs/overview/ROADMAP.md`](docs/overview/ROADMAP.md)
- Referências visuais: [`docs/overview/DASHBOARD_TEMPLATES.md`](docs/overview/DASHBOARD_TEMPLATES.md)

### Status e Progresso
- Estado atual: [`docs/status/CURRENT_STATUS.md`](docs/status/CURRENT_STATUS.md)
- Lista de features: [`docs/status/FEATURES_STATUS.md`](docs/status/FEATURES_STATUS.md)

### Planejamento
- Plano de ação ativo: [`docs/plans/ACTION_PLAN.md`](docs/plans/ACTION_PLAN.md)
- Planos legados movidos para arquivo: [`docs/archive/plans/`](docs/archive/plans/)

### Guias Operacionais
- Cross-tagging: [`docs/guides/CROSS_TAGGING_GUIDE.md`](docs/guides/CROSS_TAGGING_GUIDE.md)
- Gestão de tarefas: [`docs/guides/TASK_MANAGEMENT_GUIDE.md`](docs/guides/TASK_MANAGEMENT_GUIDE.md)
- Quick Actions (correções): [`docs/guides/QUICK_ACTIONS_FIX.md`](docs/guides/QUICK_ACTIONS_FIX.md)
- Audit log (VDR): [`docs/guides/VDR_AUDIT_LOG_GUIDE.md`](docs/guides/VDR_AUDIT_LOG_GUIDE.md)

### Segurança e Governança
- Política de segurança: [`docs/security/SECURITY.md`](docs/security/SECURITY.md)
- Resumo de segurança (fase 1): [`docs/security/SECURITY_SUMMARY_PHASE1.md`](docs/security/SECURITY_SUMMARY_PHASE1.md)
- Metadados de papéis: [`docs/security/ROLE_METADATA_REFACTORING.md`](docs/security/ROLE_METADATA_REFACTORING.md)
- Expansão de SystemMetadataContext: [`docs/security/SystemMetadataContext-Expansion.md`](docs/security/SystemMetadataContext-Expansion.md)

### Operações e Integrações
- Refatoração de analytics: [`docs/operations/analytics-service-refactoring.md`](docs/operations/analytics-service-refactoring.md)
- Busca no Drive: [`docs/operations/DRIVE_SEARCH_FEATURES.md`](docs/operations/DRIVE_SEARCH_FEATURES.md)
- Uso do serviço Drive: [`docs/operations/DRIVE_SERVICE_USAGE.md`](docs/operations/DRIVE_SERVICE_USAGE.md)
- Hierarquia de pastas do Google Drive: [`docs/operations/google-drive-folder-hierarchy.md`](docs/operations/google-drive-folder-hierarchy.md)

### Dados e Configuração
- Configurações de dados sintéticos: [`docs/data/SYNTHETIC_DATA_SETTINGS.md`](docs/data/SYNTHETIC_DATA_SETTINGS.md)
- Sumário de implementação de dados sintéticos: [`docs/data/IMPLEMENTATION_SUMMARY_SYNTHETIC_SETTINGS.md`](docs/data/IMPLEMENTATION_SUMMARY_SYNTHETIC_SETTINGS.md)
- Esquema de leads: [`docs/data/leads-schema.md`](docs/data/leads-schema.md)
- Guia do SettingsService: [`docs/data/settingsService-Guide.md`](docs/data/settingsService-Guide.md)

### Desenvolvimento
- Guia de contribuição: [`docs/development/CONTRIBUTING.md`](docs/development/CONTRIBUTING.md)
- Guia de testes: [`docs/development/TESTING.md`](docs/development/TESTING.md)

### Funcionalidades
- Deals: [`docs/features/deals.md`](docs/features/deals.md)
- Companies & Contacts: [`docs/features/companies-contacts.md`](docs/features/companies-contacts.md)
- RBAC: [`docs/features/rbac.md`](docs/features/rbac.md)
- UI Components: [`docs/features/ui-components.md`](docs/features/ui-components.md)
- Quick Actions (arquivado por obsolescência): [`docs/archive/features/quick-actions/`](docs/archive/features/quick-actions/)

### Incidentes e Pós-Mortems
- React Error 185 (diagnóstico): [`docs/incidents/react-error-185/diagnostics/`](docs/incidents/react-error-185/diagnostics/)
- React Error 185 (correções): [`docs/incidents/react-error-185/fixes/`](docs/incidents/react-error-185/fixes/)
- Sales View (análises): [`docs/incidents/sales-view/analysis/`](docs/incidents/sales-view/analysis/)
- Sales View (resiliência): [`docs/incidents/sales-view/resilience/`](docs/incidents/sales-view/resilience/)
- Data Toolbar: [`docs/incidents/data-toolbar/DATATOOLBAR_FIX_EXPLANATION.md`](docs/incidents/data-toolbar/DATATOOLBAR_FIX_EXPLANATION.md)

### Relatórios e Arquivo
- Implementações: [`docs/reports/implementations/`](docs/reports/implementations/)
- Histórico e reports legados: [`docs/archive/`](docs/archive/)

---

- Auditoria da documentação: [`docs/DOCUMENTATION_AUDIT.md`](docs/DOCUMENTATION_AUDIT.md)
- Changelog da documentação: [`docs/DOCUMENTATION_CHANGELOG.md`](docs/DOCUMENTATION_CHANGELOG.md)
