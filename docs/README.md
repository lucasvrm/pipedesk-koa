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
- Guia completo de instalação: [`getting-started/installation.md`](getting-started/installation.md)

## 📚 Mapa da Documentação

### Visão Geral
- Visão executiva: [`overview/EXECUTIVE_SUMMARY.md`](overview/EXECUTIVE_SUMMARY.md)
- Produto e requisitos: [`overview/PRD.md`](overview/PRD.md)
- Roteiro macro: [`overview/ROADMAP.md`](overview/ROADMAP.md)
- Referências visuais: [`overview/DASHBOARD_TEMPLATES.md`](overview/DASHBOARD_TEMPLATES.md)

### Status e Progresso
- Estado atual: [`status/CURRENT_STATUS.md`](status/CURRENT_STATUS.md)
- Lista de features: [`status/FEATURES_STATUS.md`](status/FEATURES_STATUS.md)

### Planejamento
- Plano de ação: [`plans/ACTION_PLAN.md`](plans/ACTION_PLAN.md)
- Integração backend: [`plans/BACKEND_INTEGRATION_PLAN.md`](plans/BACKEND_INTEGRATION_PLAN.md)
- Componentes (fase 1): [`plans/ROADMAP_PHASE1_COMPONENTS.md`](plans/ROADMAP_PHASE1_COMPONENTS.md)
- Command Center: [`plans/COMMAND_CENTER_COMPONENTS.md`](plans/COMMAND_CENTER_COMPONENTS.md)

### Guias Operacionais
- Cross-tagging: [`guides/CROSS_TAGGING_GUIDE.md`](guides/CROSS_TAGGING_GUIDE.md)
- Gestão de tarefas: [`guides/TASK_MANAGEMENT_GUIDE.md`](guides/TASK_MANAGEMENT_GUIDE.md)
- Quick Actions (correções): [`guides/QUICK_ACTIONS_FIX.md`](guides/QUICK_ACTIONS_FIX.md)
- Audit log (VDR): [`guides/VDR_AUDIT_LOG_GUIDE.md`](guides/VDR_AUDIT_LOG_GUIDE.md)

### Segurança e Governança
- Política de segurança: [`security/SECURITY.md`](security/SECURITY.md)
- Resumo de segurança (fase 1): [`security/SECURITY_SUMMARY_PHASE1.md`](security/SECURITY_SUMMARY_PHASE1.md)
- Metadados de papéis: [`security/ROLE_METADATA_REFACTORING.md`](security/ROLE_METADATA_REFACTORING.md)
- Expansão de SystemMetadataContext: [`security/SystemMetadataContext-Expansion.md`](security/SystemMetadataContext-Expansion.md)

### Operações e Integrações
- Refatoração de analytics: [`operations/analytics-service-refactoring.md`](operations/analytics-service-refactoring.md)
- Busca no Drive: [`operations/DRIVE_SEARCH_FEATURES.md`](operations/DRIVE_SEARCH_FEATURES.md)
- Uso do serviço Drive: [`operations/DRIVE_SERVICE_USAGE.md`](operations/DRIVE_SERVICE_USAGE.md)
- Hierarquia de pastas do Google Drive: [`operations/google-drive-folder-hierarchy.md`](operations/google-drive-folder-hierarchy.md)

### Dados e Configuração
- Configurações de dados sintéticos: [`data/SYNTHETIC_DATA_SETTINGS.md`](data/SYNTHETIC_DATA_SETTINGS.md)
- Sumário de implementação de dados sintéticos: [`data/IMPLEMENTATION_SUMMARY_SYNTHETIC_SETTINGS.md`](data/IMPLEMENTATION_SUMMARY_SYNTHETIC_SETTINGS.md)
- Esquema de leads: [`data/leads-schema.md`](data/leads-schema.md)
- Guia do SettingsService: [`data/settingsService-Guide.md`](data/settingsService-Guide.md)

### Desenvolvimento
- Guia de contribuição: [`development/CONTRIBUTING.md`](development/CONTRIBUTING.md)
- Guia de testes: [`development/TESTING.md`](development/TESTING.md)

### Funcionalidades
- Deals: [`features/deals.md`](features/deals.md)
- Companies & Contacts: [`features/companies-contacts.md`](features/companies-contacts.md)
- RBAC: [`features/rbac.md`](features/rbac.md)
- UI Components: [`features/ui-components.md`](features/ui-components.md)
- Quick Actions: [`features/quick-actions/quick-actions.md`](features/quick-actions/quick-actions.md), [`quick-actions-business-analysis.md`](features/quick-actions/quick-actions-business-analysis.md), [`QUICK_ACTIONS_SUMMARY.md`](features/quick-actions/QUICK_ACTIONS_SUMMARY.md)

### Incidentes e Pós-Mortems
- React Error 185 (diagnóstico): [`incidents/react-error-185/diagnostics/`](incidents/react-error-185/diagnostics/)
- React Error 185 (correções): [`incidents/react-error-185/fixes/`](incidents/react-error-185/fixes/)
- Sales View (análises): [`incidents/sales-view/analysis/`](incidents/sales-view/analysis/)
- Sales View (resiliência): [`incidents/sales-view/resilience/`](incidents/sales-view/resilience/)
- Data Toolbar: [`incidents/data-toolbar/DATATOOLBAR_FIX_EXPLANATION.md`](incidents/data-toolbar/DATATOOLBAR_FIX_EXPLANATION.md)

### Relatórios e Arquivo
- Implementações: [`reports/implementations/`](reports/implementations/)
- Histórico e reports legados: [`archive/`](archive/)

---

- Auditoria da documentação: [`DOCUMENTATION_AUDIT.md`](DOCUMENTATION_AUDIT.md)
- Changelog da documentação: [`DOCUMENTATION_CHANGELOG.md`](DOCUMENTATION_CHANGELOG.md)
