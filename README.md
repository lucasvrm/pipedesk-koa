# PipeDesk

A modern Deal Flow Management Platform.

## 📋 Padrão de Listagens Compartilhadas
- **Layout:** Utilize `SharedListLayout` e `SharedListFiltersBar` para alinhar cabeçalho, filtros e barra de ações em páginas de listas.
- **Paginação:** Controles ficam no rodapé da lista, sempre com seletor de itens por página e contagem "início–fim".
- **Ações:** A coluna de ações permanece visível (sem hover para revelar). O toggle de visualização (lista/grid) fica junto aos filtros.
- **Escopo Atual:** `/deals` e `/companies` já seguem o padrão de cores/bordas do container e filtros reagrupados.

## 🏷️ Activity Badges
- **Purpose:** Visual indicators for item freshness across detail pages
- **Badges:** "Novo" (created within 24h) and "Atualizado hoje" (updated today)
- **Location:** Headers of Lead, Deal, Contact, Company, Player, and Track detail pages
- **Implementation:** Uses `ActivityBadges` component and `dateUtils` utilities
- **Documentation:** See [UI Components Guide](./docs/features/ui-components.md)

## 🚀 Governance & RBAC

Access control is enforced via Supabase RLS policies and Role-Based Access Control (RBAC).

### Key Permissions & Documentation
For the complete list of permissions, governance rules, and implementation status, please refer to:

👉 **[RBAC Governance & Status](./docs/RBAC.md)**

### Feature Flags
Modules can be toggled via `tags_config` in System Settings. If a module is disabled, API endpoints return `FEATURE_DISABLED` to ensure integrity.
