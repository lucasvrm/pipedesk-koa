# Status Atual do Projeto (PipeDesk)

**Data da Análise:** 12/03/2026
**Versão:** 0.3.0

## 🏗️ Arquitetura
- **Modelo:** Single-Tenant (Foco em uma organização por vez).
- **Frontend:** React 19, Vite, TailwindCSS v4.
- **Backend:** Supabase (Auth, Postgres, Realtime, Storage).
- **Roteamento:** React Router v6 com Lazy Loading.

## 🚀 Funcionalidades Implementadas

### Autenticação (`src/features/rbac`)
- ✅ Login via Magic Link (Email sem senha).
- ✅ Login via Email e Senha.
- ✅ Login Social (Google Workspace).
- ✅ Cadastro de novos usuários (com restrição opcional de domínio).
- ✅ Gestão de Sessão (AuthContext).

### Core Features
- **Deals (`src/features/deals`):** Kanban board, visualização em lista (layout unificado com filtros/ação fixa), detalhes do deal, criação e edição.
- **Companies (`src/features/companies`):** Lista com filtros por tipo/relacionamento, paginação e coluna de ações persistente.
- **Players (`src/features/players`):** Gestão de stakeholders, tracks de relacionamento.
- **Tasks (`src/features/tasks`):** Gerenciamento de tarefas associadas a deals/players.
- **Analytics (`src/features/analytics`):** Dashboards de performance e conversão.
- **Admin:** Gestão de usuários, configurações de pipeline, validação de fases.

## ⚠️ Dívida Técnica Conhecida
1. **Erros de Tipagem:** O projeto possui erros de TypeScript suprimidos no build.
2. **Duplicidade de Services:** Conflito entre `src/services/*.ts` e hooks locais.
3. **Listas e Paginação:** Faltam testes e validações automatizadas para o novo layout compartilhado (bordas, alinhamentos e reset de página ao alterar filtros/itens por página).
4. **Testes:** Cobertura baixa e estrutura de pastas inconsistente (`test` vs `tests`).
