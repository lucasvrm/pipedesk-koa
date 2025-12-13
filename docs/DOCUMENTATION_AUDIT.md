# Auditoria de Documentação PipeDesk

**Data:** 2026-02-28
**Objetivo:** identificar arquivos obsoletos ou redundantes, manter somente referências que refletem o código atual e mover o restante para o arquivo.

## Resumo Executivo
- **Ativos:** 55 arquivos `.md` dentro de `docs/`.
- **Arquivados:** 37 arquivos `.md` em `docs/archive/`.
- **Ações nesta rodada:**
  - Planos antigos (backend, fase 1, command center) movidos para `docs/archive/plans/` por não refletirem o estado atual.
  - Pacote de Quick Actions movido para `docs/archive/features/quick-actions/` porque a aplicação não possui módulo dedicado em `src/features`.
  - Status, README e changelog revisados para remover links quebrados e sinalizar o que é legado.

## Inventário de Documentos Ativos (curados)
- **Onboarding:** `docs/getting-started/*`
- **Planejamento vivo:** `docs/plans/ACTION_PLAN.md`
- **Visão geral e produto:** `docs/overview/{EXECUTIVE_SUMMARY.md,PRD.md,ROADMAP.md}`
- **Status:** `docs/status/CURRENT_STATUS.md` (atualizado nesta auditoria)
- **Segurança:** `docs/security/{SECURITY.md,SECURITY_SUMMARY_PHASE1.md,ROLE_METADATA_REFACTORING.md,SystemMetadataContext-Expansion.md}`
- **Dados & Configuração:** `docs/data/*` (mantidos por terem correspondência com scripts e serviços ativos)
- **Desenvolvimento:** `docs/development/{CONTRIBUTING.md,TESTING.md}`
- **Frontend:** `docs/frontend/*` (referenciam utilitários e contratos de drive em uso)
- **Features:** `docs/features/{deals.md,companies-contacts.md,rbac.md,ui-components.md}`
- **Guias operacionais:** `docs/guides/*` (mantidos até revisão de produto)
- **Incidentes:** `docs/incidents/**` (históricos úteis para evitar regressões)

## Arquivo e Legado
- **Planos desatualizados:** `docs/archive/plans/` contém `BACKEND_INTEGRATION_PLAN.md`, `ROADMAP_PHASE1_COMPONENTS.md`, `COMMAND_CENTER_COMPONENTS.md`.
- **Quick Actions:** `docs/archive/features/quick-actions/` reúne os três documentos movidos por ausência de feature ativa no código.
- **Históricos e migrações:** permanecem em `docs/archive/{migrations,phases,reports}` sem alterações.

## Pontos Verificados contra o Código
- O front-end continua em React 19, Vite 7, Tailwind 4 e shadcn/ui (vide `package.json`).
- Módulos ativos em `src/features/`: `admin`, `analytics`, `calendar`, `companies`, `contacts`, `dashboard`, `deals`, `inbox`, `leads`, `players`, `rbac`, `shared`, `tasks`, `tracks`.
- Não há pasta `quick-actions` em `src/features`, reforçando a migração desses guias para o arquivo.

## Próximos Passos Recomendados
1. Revisar os guias em `docs/guides/` e consolidar com as páginas de features correspondentes.
2. Atualizar `docs/overview/PRD.md` para alinhar nomenclatura e cobertura às features realmente presentes em `src/features/`.
3. Validar se os relatórios de incidentes ainda representam riscos presentes; caso contrário, mover para `docs/archive/incidents/`.
4. Manter o limite de até quatro arquivos `.md` por pasta; estado atual cumpre esta regra.
