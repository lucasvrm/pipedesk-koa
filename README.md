# PipeDesk

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.3.0-green.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)

A modern Deal Flow Management Platform for investment banking and M&A professionals.

## 🏷️ Activity Badges
- **Purpose:** Visual indicators for item freshness across detail pages
- **Badges:** "Novo" (created within 24h) and "Atualizado hoje" (updated today)
- **Location:** Headers of Lead, Deal, Contact, Company, Player, and Track detail pages
- **Implementation:** Uses `ActivityBadges` component and `dateUtils` utilities
- **Documentation:** See [UI Components Guide](./docs/features/ui-components.md)

## 🚀 Governance & RBAC

PipeDesk é uma plataforma completa de gestão de fluxo de negócios (deal flow) projetada para bancos de investimento e profissionais de M&A. Com foco em privacidade, controle de acesso e colaboração, o PipeDesk permite gerenciar negociações complexas multi-partes com anonimização de dados para clientes externos.

### ✨ Principais Funcionalidades

- **Deal Flow Management** - Gestão de deals mestres e player tracks com forecasting ponderado
- **CRM Completo** - Companies, Contacts e Leads com pipeline de qualificação
- **Task Management** - Tasks com dependências, milestones e múltiplas views (Lista/Kanban)
- **RBAC Avançado** - 4 níveis de permissão com RLS policies e anonimização
- **Analytics** - Dashboard em tempo real com métricas de pipeline e performance
- **Cross-Tagging** - Sistema de multi-homing para organização flexível
- **Audit Trail** - Log completo de atividades para compliance
- **Custom Fields** - Campos customizáveis para deals, tracks e tasks

📖 **[Ver lista completa de features →](docs/FEATURES_STATUS.md)**

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

**Acesse:** http://localhost:5173

> ℹ️ O repositório inclui um `.npmrc` com `legacy-peer-deps` ativado para evitar erros de resolução com pacotes que ainda não declaram compatibilidade com React 19 (ex.: `react-beautiful-dnd`).

📘 **[Guia de Instalação Completo →](docs/getting-started/installation.md)**

## 📚 Documentação

### Para Usuários
- [Instalação & Setup](docs/getting-started/installation.md)
- [Quick Start Guide](docs/getting-started/quick-start.md)
- [Configuração](docs/getting-started/configuration.md)

### Para Desenvolvedores
- [Guia de Contribuição](docs/CONTRIBUTING.md)
- [Testing Guide](docs/TESTING.md)
- [Security Policy](docs/SECURITY.md)

### Referência
- [Status de Features](docs/FEATURES_STATUS.md) - O que está implementado
- [Roadmap](docs/ROADMAP.md) - O que está planejado
- [Documentação Completa](docs/README.md) - Índice master

## 🛠️ Stack Tecnológico

- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui v4
- **Icons:** Phosphor Icons
- **Charts:** D3.js, Recharts
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Build:** Vite 6.4.1
- **Testing:** Vitest 4.0.12 + Playwright

## 🔐 Segurança & Compliance

- Magic link authentication
- Row-Level Security (RLS) no Supabase
- Role-Based Access Control (RBAC)
- Anonimização de players para clientes externos
- Audit logging completo

📜 **[Ver Política de Segurança →](docs/SECURITY.md)**

## 📋 Padrões de UI

### Listagens Compartilhadas
- **Layout:** `SharedListLayout` e `SharedListFiltersBar` para consistência
- **Paginação:** Controles no rodapé com seletor de itens por página
- **Ações:** Coluna de ações sempre visível
- **Implementado em:** `/deals`, `/companies`, `/contacts`, `/leads`

### RBAC & Governance
- Access control via Supabase RLS policies
- 4 níveis: Admin, Analyst, New Business, Client
- Feature flags via System Settings

👉 **[Documentação RBAC Completa →](docs/features/rbac.md)**

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Leia o [Guia de Contribuição](docs/CONTRIBUTING.md)
2. Fork o projeto
3. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
4. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
5. Push para a branch (`git push origin feature/AmazingFeature`)
6. Abra um Pull Request

## 📊 Status do Projeto

- **Versão Atual:** 0.3.0
- **Features Implementadas:** 22/30 (73%)
- **Cobertura de Testes:** Em desenvolvimento
- **Status:** Em desenvolvimento ativo

📈 **[Ver Status Detalhado →](docs/FEATURES_STATUS.md)**

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Documentação:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/lucasvrm/pipedesk-koa/issues)
- **Changelog:** [DOCUMENTATION_CHANGELOG.md](docs/DOCUMENTATION_CHANGELOG.md)

---

**Desenvolvido com ❤️ pela equipe PipeDesk**
