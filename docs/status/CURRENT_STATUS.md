# Status Atual do Projeto (PipeDesk)

**Última atualização:** 28/02/2026
**Escopo:** frente React + Supabase usada neste repositório (`pipedesk-koa`).

## Stack e arquitetura em uso
- **Frontend:** React 19, Vite 7, TypeScript 5.7, Tailwind 4 (ver `package.json`).
- **UI:** shadcn/ui + Radix; ícones `lucide-react` (há dependência de `@phosphor-icons/react`, mas não é recomendada segundo o AGENTS.md).
- **Estado/dados:** React Query, Context API; consumo de Supabase via `src/lib/supabaseClient.ts`.
- **Segurança:** fluxos de RBAC presentes em `src/features/rbac` e helpers em `src/lib/permissions.ts`.

## Módulos ativos (confirmados em `src/features/`)
- **Admin & RBAC:** `admin`, `rbac`.
- **Pipeline & CRM:** `deals`, `companies`, `contacts`, `leads`, `tracks`, `players`.
- **Produtividade:** `tasks`, `calendar`, `inbox`, `dashboard`, `analytics`.
- **Suporte compartilhado:** `shared` (componentes e utilitários comuns).

## Itens considerados legados ou ausentes
- **Quick Actions:** não há pasta ou rotas correspondentes em `src/features`; documentos movidos para `docs/archive/features/quick-actions/`.
- **Planos antigos de backend/command center/fase 1:** não refletem o código atual; movidos para `docs/archive/plans/`.
- **Busca global:** nenhum componente ou hook identificado com esse nome; precisa de especificação antes de planejar.

## Próximas atualizações recomendadas
1. Revisar dependências de ícones (`@phosphor-icons/react`) e substituir por `lucide-react` conforme orientação do AGENTS.md.
2. Validar integrações Google/Supabase descritas em `docs/operations/` versus o código atual de `src/lib/driveClient.ts` e `src/components/GoogleIntegrationDialog.tsx`.
3. Consolidar guias de `docs/guides/` com as páginas de features correspondentes, eliminando duplicidade.
4. Criar uma visão enxuta do roadmap atualizada após limpeza dos planos legados.
