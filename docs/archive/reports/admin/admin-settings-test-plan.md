# Admin Settings (/admin/settings) – Estado atual e plano de testes

## O que a UI espera do backend
- A página `SettingsPage` expõe CRUDs para `products`, `deal_sources`, `loss_reasons`, `player_categories`, `holidays`, `communication_templates`, `track_statuses`, `operation_types`, `task_statuses` e `task_priorities`, todos resolvidos via `SettingsTable` e os services correspondentes. 【F:src/pages/admin/SettingsPage.tsx†L63-L152】
- O `settingsService` mapeia tipos para tabelas físicas e opera campos `id`, `name`, `description`, `is_active`, `created_at` e, para `communication_templates`, também `title`, `subject`, `content`, `category`, `variables`, `updated_at`, `created_by`. 【F:src/services/settingsService.ts†L11-L239】
- Serviços específicos (`trackStatusService`, `operationTypeService`, `taskStatusService`, `taskPriorityService`) chamam tabelas homônimas com colunas `id`, `name`, `description`, `is_active`, `created_at`, `updated_at` (mais `color`/`code` conforme tipo). 【F:src/pages/admin/SettingsPage.tsx†L102-L152】

## Lacunas conhecidas (comparando com o schema recebido)
- Ausência de tabelas `track_statuses`, `operation_types`, `task_statuses`, `task_priorities` no schema informado → todos os handlers dessas abas falham por falta de tabela. 【F:src/pages/admin/SettingsPage.tsx†L102-L152】
- `communication_templates` no schema não menciona `is_active`; a UI chama `toggleActive` e espera o campo `is_active`. 【F:src/services/settingsService.ts†L92-L104】【F:src/pages/admin/SettingsPage.tsx†L96-L100】
- `system_settings` precisa ter registro `key='auth_config'` para a leitura em `settingsService.getAuthSettings`. 【F:src/services/settingsService.ts†L109-L147】

## Testes executados nesta sessão
- `npm install` (necessário para rodar vitest/playwright) falhou por 403 ao baixar `react-dom`; nenhum teste automatizado pôde ser executado. 【9003c6†L1-L6】

## Plano de ação (mantendo layout e funcionalidades inalterados)
1) **Backend/migrações (o usuário já assumiu):** criar as tabelas faltantes de status/prioridade com colunas esperadas e políticas RLS equivalentes às de `loss_reasons`/`player_categories`.
2) **Harmonização mínima de schema existente (sem alterar layout/funcionalidade):**
   - Incluir `is_active` em `communication_templates` (ou remover o toggle no adapter/UI, caso aprovado).
   - Confirmar colunas esperadas em `products`, `deal_sources`, `loss_reasons`, `player_categories`, `holidays` (`id`, `name`, `description`, `is_active`, `created_at`, defaults coerentes) e ajustar RLS para leitura geral + escrita por admins.
   - Garantir seed de `system_settings` com `key='auth_config'` e JSON padrão (`enableMagicLinks`, `restrictDomain`, `allowedDomain`).
3) **Após migrações, rodada de QA manual focada na rota `/admin/settings` (sem mudar layout/funcionalidade):**
   - Verificar todas as tabs: carregar lista, abrir modal de novo item, salvar, editar, excluir, e alternar toggle de ativo (quando existir).
   - Validar que modais são clicáveis e fecham corretamente; confirmar toasts de sucesso/erro.
   - Monitorar console do navegador em cada aba para garantir ausência de erros de rede ou JS; inspecionar requests para confirmar 200/201/204.
   - Repetir checks para `Roles` e `Tags` (componentes integrados) para garantir ausência de erros de console.
4) **Testes automatizados (quando o registro npm estiver acessível):** instalar dependências e rodar `npm run test` (unitários) e, se disponível, `npm run test:e2e` com cenário navegando `/admin/settings` para cobrir modais e toggles.

## Entrega esperada
Com os passos acima concluídos (migrações + harmonização mínima + QA manual/automático), a rota `/admin/settings` deve oferecer CRUD completo sem erros de console, mantendo o layout e as funcionalidades atuais.
