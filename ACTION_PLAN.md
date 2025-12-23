# 📋 ACTION_PLAN.md - Ajustes em /leads

## 🚧 Status: ✅ Concluído (Migration - lead_task_templates)

**Data:** 2024-12-23  
**Autor:** GitHub Copilot Agent  
**Escopo:** Database Migration - Tabela `lead_task_templates` para Next Actions

---

## 🆕 Iteração atual - Migration: Tabela lead_task_templates

**Data:** 2024-12-23  
**Autor:** GitHub Copilot Agent  
**Escopo:** Database - `supabase/migrations/20241223100100_create_lead_task_templates.sql`

### 🎯 Objetivo
Criar tabela de referência `lead_task_templates` para armazenar templates de tarefas pré-definidos usados no sistema de Next Actions. A tabela segue o mesmo padrão das tabelas existentes (`lead_statuses`, `lead_origins`, `lead_member_roles`).

### ✅ Tarefas Concluídas
- [x] Criada tabela `lead_task_templates` com estrutura padronizada (id, code, label, description, is_active, sort_order, created_at)
- [x] Adicionados índices para performance: `idx_lead_task_templates_code` e `idx_lead_task_templates_active_order`
- [x] Configurado RLS (Row Level Security) com políticas: SELECT para usuários autenticados, ALL para admins
- [x] Inseridos 11 templates pré-definidos com seed data
- [x] Criado arquivo de rollback `20241223100100_create_lead_task_templates_DOWN.sql`
- [x] Documentada a migração no ACTION_PLAN.md

### Arquivos Criados
- `supabase/migrations/20241223100100_create_lead_task_templates.sql` - Migration principal
- `supabase/migrations/20241223100100_create_lead_task_templates_DOWN.sql` - Rollback

### Templates Pré-Definidos (11 registros)

| sort_order | code | label |
|------------|------|-------|
| 1 | prepare_for_meeting | Preparar para reunião |
| 2 | post_meeting_follow_up | Follow-up pós-reunião |
| 3 | call_first_time | Fazer primeira ligação |
| 4 | handoff_to_deal | Fazer handoff (para deal) |
| 5 | qualify_to_company | Qualificar para empresa |
| 6 | schedule_meeting | Agendar reunião |
| 7 | call_again | Ligar novamente |
| 8 | send_value_asset | Enviar material / valor |
| 9 | send_follow_up | Enviar follow-up |
| 10 | reengage_cold_lead | Reengajar lead frio |
| 11 | disqualify | Desqualificar / encerrar |

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Arquivos criados | 2 |
| Arquivos modificados | 1 (ACTION_PLAN.md) |
| Nova tabela | 1 (lead_task_templates) |
| Registros seed | 11 |
| Políticas RLS | 2 |
| Índices | 2 |
| Alertas de segurança | 0 |
| Contratos quebrados | 0 |
| Libs novas adicionadas | 0 |

**Risco:** 🟢 Baixo (nova tabela, não altera existentes)

### 📝 ROADMAP Final

| Item Solicitado | Status | Observações |
|----------------|--------|-------------|
| Tabela lead_task_templates | ✅ | Estrutura padronizada seguindo referências existentes |
| Campos obrigatórios (id, code, label, is_active, sort_order, created_at) | ✅ | Todos presentes |
| Campo description opcional | ✅ | TEXT NULL |
| Índice por code | ✅ | idx_lead_task_templates_code |
| Índice por active/order | ✅ | idx_lead_task_templates_active_order com WHERE |
| RLS habilitado | ✅ | Políticas de SELECT e ALL configuradas |
| Política SELECT para autenticados | ✅ | Todos podem ler |
| Política ALL para admins | ✅ | Apenas admins podem modificar |
| Seed data (11 templates) | ✅ | INSERT com ON CONFLICT DO UPDATE |
| Rollback file | ✅ | DROP policies e table |
| Comentários na tabela | ✅ | COMMENT ON TABLE e COLUMN |

#### Legenda
- ✅ **Implementado** exatamente como solicitado

---

## 🚧 Status: ✅ Concluído (Migration - Tabela lead_tasks)
## 🚧 Status: ✅ Concluído (ChangeOwnerDialog Component)
## 🚧 Status: ✅ Concluído (Hook e Service para Alteração de Responsável)

**Data:** 2025-12-23  
**Autor:** GitHub Copilot Agent  
**Escopo:** Database - Criação da tabela lead_tasks com triggers e RLS

---

## 🆕 Iteração atual - Migration: Tabela lead_tasks

**Data:** 2025-12-23  
**Autor:** GitHub Copilot Agent  
**Escopo:** Database - `supabase/migrations/20241223100200_create_lead_tasks.sql`

### 🎯 Objetivo
Criar nova tabela `lead_tasks` para armazenar tarefas vinculadas a leads, incluindo o conceito de "next action" (próxima ação principal).

### ✅ Tarefas Concluídas
- [x] Criada tabela `lead_tasks` com campos: id, lead_id, template_id, title, description, is_next_action, status, due_date, sort_order, completed_at, completed_by, created_at, created_by
- [x] Adicionados comentários explicativos em colunas chave
- [x] Criados 4 indexes otimizados:
  - `idx_lead_tasks_lead_id` - buscar tarefas de um lead
  - `idx_lead_tasks_next_action` - buscar próxima ação ativa (partial index)
  - `idx_lead_tasks_pending_due` - buscar tarefas pendentes por data (partial index)
  - `idx_lead_tasks_template` - buscar por template (partial index)
- [x] Implementado trigger `ensure_single_next_action()` para garantir apenas uma next_action ativa por lead
- [x] Implementado trigger `auto_set_completed_at()` para gerenciar automaticamente completed_at baseado no status
- [x] Configuradas políticas RLS:
  - SELECT: todos autenticados podem ler
  - ALL: apenas roles admin, analyst, newbusiness podem criar/editar/deletar
- [x] Criado arquivo de rollback `20241223100200_create_lead_tasks_DOWN.sql`

### Arquivos Criados
- `supabase/migrations/20241223100200_create_lead_tasks.sql` (146 linhas)
- `supabase/migrations/20241223100200_create_lead_tasks_DOWN.sql` (8 linhas)

### Arquivos Modificados
- `ACTION_PLAN.md` - Documentação da migration

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Arquivos criados | 2 |
| Arquivos modificados | 1 |
| Linhas adicionadas | ~154 |
| Alertas de segurança | 0 |
| Contratos quebrados | 0 |
| Libs novas adicionadas | 0 |

**Risco:** 🟢 Baixo (nova tabela independente, não modifica schemas existentes)

### 🔍 Validações Necessárias (Manual no Supabase)

```sql
-- Verificar tabela
\d lead_tasks

-- Verificar triggers
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'lead_tasks';

-- Testar criação de tarefa
INSERT INTO lead_tasks (lead_id, title, is_next_action, created_by)
SELECT l.id, 'Teste', true, p.id
FROM leads l, profiles p
WHERE p.role = 'admin'
LIMIT 1
RETURNING *;

-- Testar constraint de single next_action
-- (segunda tarefa com is_next_action=true deve desmarcar a primeira)
```

### 📝 ROADMAP

| Item | Status | Observações |
|------|--------|-------------|
| Criar tabela lead_tasks | ✅ | Com todos os campos especificados |
| Adicionar comentários | ✅ | Table e colunas chave documentadas |
| Criar indexes | ✅ | 4 indexes, 3 com partial index para performance |
| Trigger single next_action | ✅ | Garante apenas 1 next_action ativa por lead |
| Trigger auto completed_at | ✅ | Seta/limpa automaticamente baseado em status |
| Configurar RLS | ✅ | Políticas para SELECT e ALL operations |
| Criar rollback | ✅ | Script DOWN completo |
| Documentar ACTION_PLAN | ✅ | Iteração documentada |

**Complexidade:** 25/100  
**Tempo gasto:** ~15 minutos  
**Dependências:** Tabela `lead_task_templates` (referência opcional via FK com ON DELETE SET NULL)

---

## 🆕 Iteração atual - LeadDetailPage: Ordem de Hooks (React #310)

**Data:** 2025-12-21  
**Autor:** GitHub Copilot Agent  
**Escopo:** Frontend - `src/features/leads/pages/LeadDetailPage.tsx`

### 🎯 Objetivo
- Corrigir o erro React #310 reorganizando todos os hooks antes dos early returns e respeitando a ordem exigida (roteamento/contexto → dados → memos → callbacks → states → mutations).

### ✅ Tarefas Concluídas
- [x] Reordenados hooks de rota, dados, memos, callbacks, estados e mutations para antes das condicionais de loading/lead.
- [x] Movidos handlers normais e variáveis derivadas para após os early returns.
- [x] Garantido que nenhum `useCallback` ou `useMemo` permaneça após os retornos condicionais.

### Arquivos Modificados
- `src/features/leads/pages/LeadDetailPage.tsx`

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Arquivos modificados | 1 |
| Linhas tocadas (aprox.) | ~80 |
| Alertas de segurança | 0 |
| Contratos quebrados | 0 |

---

## 🆕 Iteração atual - Hook e Service para Alteração de Responsável

### 🎯 Objetivo
1. Criar interface `ChangeLeadOwnerData` para tipar os dados enviados para a API.
2. Criar função `changeLeadOwner` que encapsula a chamada HTTP para o endpoint de alteração de responsável.
3. Criar hook `useChangeLeadOwner` com `useMutation` do React Query para gerenciar o estado da mutation.

### ✅ Tarefas Concluídas
- [x] Adicionada interface `ChangeLeadOwnerData` com campos: `leadId`, `newOwnerId`, `addPreviousOwnerAsMember`, `currentUserId`.
- [x] Criada função `changeLeadOwner(data: ChangeLeadOwnerData): Promise<void>` com endpoint `POST /leads/${data.leadId}/change-owner`.
- [x] Criado hook `useChangeLeadOwner()` usando `useMutation` com `onError` para logar erros no console.
- [x] Build passa sem erros.

### Arquivos Modificados
- `src/services/leadService.ts` - Adicionados interface, função e hook

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Arquivos modificados | 1 |
| Linhas adicionadas | ~35 |
| Linhas removidas | 0 |
| Alertas de segurança | 0 |
| Contratos quebrados | 0 |
| Libs novas adicionadas | 0 |

**Risco:** 🟢 Baixo (apenas adição de código, sem alteração de lógica existente)

---

## 🆕 Iteração atual - Regras de Ouro: Prevenir Erro 310

### 🎯 Objetivo
Documentar regra obrigatória para evitar Erro 310 (hooks após condicionais) nas `GOLDEN_RULES.md`.

### ✅ Tarefas Concluídas
- [x] Adicionada seção “Prevenir Erro 310 (hooks sempre no topo do componente)” descrevendo ordem obrigatória de hooks e exemplos de correto/incorreto.
- [x] Incluída checklist para identificar e corrigir violações.

### Arquivos Modificados
- `GOLDEN_RULES.md` - Nova seção com regras contra Erro 310.

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Arquivos modificados | 1 |
| Linhas adicionadas | ~67 |
| Linhas removidas | 0 |
| Testes adicionados | 0 |
| Alertas de segurança | 0 |
| Contratos quebrados | 0 |
| Libs novas adicionadas | 0 |

**Risco:** 🟢 Baixo (documentação apenas)

### 📝 ROADMAP Final

| Item Solicitado | Status | Observações |
|-----------------|--------|-------------|
| Registrar regra para evitar Erro 310 | ✅ | Seção adicionada em `GOLDEN_RULES.md` |
| Exemplos de correto/incorreto | ✅ | Incluídos com comentários explicativos |
| Checklist de correção | ✅ | Lista de verificação para revisões |

#### Legenda
- ✅ **Implementado** exatamente como solicitado

### 📝 ROADMAP Final

| Item Solicitado | Status | Observações |
|----------------|--------|-------------|
| Interface `ChangeLeadOwnerData` | ✅ | Campos: leadId, newOwnerId, addPreviousOwnerAsMember, currentUserId |
| Função `changeLeadOwner` | ✅ | POST `/leads/${leadId}/change-owner` |
| Hook `useChangeLeadOwner` | ✅ | useMutation + onError console.error |
| Invalidar queries após sucesso | ✅ | Invalida `leads` e `leads-sales-view` |
| Lint passa | ⚠️ | Erros pré-existentes (não relacionados às alterações) |
| Build passa | ✅ | Build concluído com sucesso |

#### Legenda
- ✅ **Implementado** exatamente como solicitado
- ⚠️ **Adaptado** - erros pré-existentes não corrigidos

---

## Iteração anterior - Lead Detail: Prioridade + Header + Status + Tags

**Data:** 2025-12-20  
**Autor:** GitHub Copilot Agent  
**Escopo:** Frontend - Componente ChangeOwnerDialog para alteração de responsável do lead

---

## 🆕 Iteração atual - ChangeOwnerDialog Component

### 🎯 Objetivo
Criar o componente de dialog para alteração de responsável do lead, com busca, seleção e opções de configuração.

### ✅ Tarefas Concluídas
- [x] Criar componente `ChangeOwnerDialog.tsx` com tipagem estrita (Props: open, onOpenChange, lead, currentUserId, availableUsers)
- [x] Implementar UI do Dialog (Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter)
- [x] Implementar Command para busca e seleção de usuários (Command, CommandInput, CommandList, CommandEmpty, CommandItem, CommandGroup)
- [x] Implementar componentes de UI (Button, Checkbox, Avatar, AvatarImage, AvatarFallback, Badge, Label)
- [x] Usar ícones do lucide-react (Loader2, Check, Search, UserPlus)
- [x] Implementar estados internos (selectedUser, searchQuery, keepAsMember com default true)
- [x] Implementar filtro de usuários (excluir owner atual, filtrar por nome/email, usar useMemo)
- [x] Implementar lógica de confirmação com `useUpdateLead` e `addLeadMember`
- [x] Tratar estados de UI: loading (Loader2), vazio (nenhum usuário disponível), busca sem resultados
- [x] Botão "Confirmar" disabled até selecionar usuário
- [x] Fechar dialog e resetar estado em caso de sucesso
- [x] Mostrar toast de sucesso/erro via sonner
- [x] Lint passa sem erros
- [x] Build passa sem erros

### Arquivos Criados
- `src/features/leads/components/ChangeOwnerDialog.tsx`

### ✅ Checklist de QA manual
- [ ] Dialog abre corretamente quando `open={true}`
- [ ] Busca filtra usuários por nome e email
- [ ] Owner atual do lead não aparece na lista
- [ ] Seleção de usuário mostra preview com avatar e informações
- [ ] Checkbox "Manter responsável anterior como membro" funciona
- [ ] Botão "Confirmar" fica disabled sem seleção
- [ ] Loading indicator aparece durante mutação
- [ ] Toast de sucesso aparece após confirmação
- [ ] Dialog fecha e reseta estado após sucesso
- [ ] Toast de erro aparece em caso de falha

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Arquivos criados | 1 |
| Arquivos modificados | 1 |
| Linhas adicionadas | ~285 |
| Linhas removidas | 0 |
| Testes adicionados | 0 |
| Alertas de segurança | 0 |
| Contratos quebrados | 0 |
| Libs novas adicionadas | 0 |

**Risco:** 🟢 Baixo (novo componente isolado, sem alteração de lógica existente ou API)

### 📝 ROADMAP Final

| Item Solicitado | Status | Observações |
|----------------|--------|-------------|
| Props tipadas (open, onOpenChange, lead, currentUserId, availableUsers) | ✅ | Interface `ChangeOwnerDialogProps` |
| Dialog com shadcn/ui components | ✅ | Dialog, DialogContent, DialogHeader, etc. |
| Command para busca de usuários | ✅ | Command, CommandInput, CommandList, etc. |
| Estados internos (selectedUser, searchQuery, keepAsMember) | ✅ | useState hooks |
| Filtro de usuários (excluir owner, busca por nome/email) | ✅ | useMemo com filtros |
| Integração com useUpdateLead | ✅ | Mutation para alterar ownerUserId |
| Opção keepAsMember | ✅ | Checkbox + addLeadMember |
| Estado de loading | ✅ | Loader2 + disabled buttons |
| Estado vazio | ✅ | CommandEmpty com mensagem |
| Estado de erro | ✅ | toast.error via sonner |
| Ícones lucide-react | ✅ | Loader2, Check, Search, UserPlus |
| Evitar TooltipTrigger loop | ✅ | Não usa TooltipTrigger |

---

## Iteração anterior - Lead Detail: Prioridade + Header + Status + Tags

### 🎯 Objetivo
1. Reutilizar o badge de prioridade existente do Sales View no Lead Detail e remover o componente duplicado.
2. Reorganizar o header: status + prioridade na primeira linha, nome do lead na segunda e empresa clicável + “Atualizado hoje” na terceira.
3. Reordenar campos da primeira coluna e posicionar Tags após o segundo separador.
4. Harmonizar cores de status na coluna direita com o StatusBadge do header.
5. Melhorar contraste do SmartTagSelector.

### ✅ Tarefas Concluídas
- [x] Extraído `LeadPriorityBadge` compartilhado a partir do `LeadSalesRow` e aplicado no Lead Detail.
- [x] Removido `LeadTemperatureBadge` e testes associados; criado `LeadPriorityBadge.test.tsx`.
- [x] Header reorganizado com link seguro para `/companies/{id}` e badge “Atualizado hoje” abaixo da empresa.
- [x] Primeira coluna reordenada (Operação → Contato → Telefone → E-mail → Cidade/UF → Responsável → Criado em) e Tags após separador.
- [x] Coluna direita agora usa a mesma paleta semântica do StatusBadge.
- [x] Melhorado contraste/hover/seleção no `SmartTagSelector`.
- [x] Teste adicional cobrindo link da empresa e badge de atualização no header.

### Arquivos Criados
- `src/features/leads/components/LeadPriorityBadge.tsx`
- `tests/unit/features/leads/components/LeadPriorityBadge.test.tsx`
- `tests/unit/features/leads/LeadDetailPage.headerLayout.test.tsx`

### Arquivos Modificados
- `src/features/leads/components/LeadSalesRow.tsx`
- `src/features/leads/pages/LeadDetailPage.tsx`
- `src/components/SmartTagSelector.tsx`

### ✅ Checklist de QA manual
- [ ] Badge de prioridade aparece no Lead Detail igual à Sales View.
- [ ] Empresa clicável navega para `/companies/{id}` (quando houver id).
- [ ] “Atualizado hoje” está na linha da empresa, alinhado à direita.
- [ ] Ordem da coluna esquerda conforme solicitado, Tags após segundo separador.
- [ ] Status atual na coluna direita respeita a cor semântica do StatusBadge.
- [ ] Seleção/adição/remoção de tags com contraste legível.

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Arquivos criados | 3 |
| Arquivos modificados | 3 |
| Linhas adicionadas | ~240 |
| Linhas removidas | ~120 |
| Testes adicionados | 2 |
| Alertas de segurança | 0 |
| Contratos quebrados | 0 |
| Libs novas adicionadas | 0 |

**Risco:** 🟢 Baixo (mudança de UI/UX localizada, sem alteração de lógica de negócio ou API)

---

## Iteração anterior - Lead Detail: Breadcrumbs + Sticky Topbar + Tabs + Temperature Badge

### 🎯 Objetivo
1. **Alinhar breadcrumbs:** Padding horizontal consistente com o header global (px-6).
2. **Topbar sticky:** Linha de breadcrumbs + Quick Actions fica visível ao rolar, abaixo do menu principal.
3. **Padronizar tabs:** Tabs com o mesmo estilo visual do `/deals/:id`.
4. **Badge de temperatura:** Mostrar temperatura (Quente/Morno/Frio) ao lado do status na primeira coluna.

### ✅ Tarefas Concluídas
- [x] **A) Alinhamento horizontal**
  - Alterado padding do header de `px-4` para `px-6` para alinhar com o header global.
  - Main container também usa `px-6` para consistência.

- [x] **B) Topbar sticky**
  - Adicionado `sticky top-16 z-40` ao header do Lead Detail.
  - Aplicado `bg-background/95 backdrop-blur` para visibilidade durante scroll.
  - Definida constante `HEADER_OFFSET_PX = 121` para cálculo de altura.

- [x] **C) Padronizar tabs**
  - Removido estilo antigo com `border-b` e `TAB_TRIGGER_STYLE`.
  - Aplicado padrão DealDetailPage: `bg-muted/40 border rounded-lg p-1`.
  - TabsTrigger usa `py-2 px-4` para consistência.

- [x] **D) Badge de temperatura**
  - Criado componente `LeadTemperatureBadge.tsx`.
  - Exibe "Quente" (hot), "Morno" (warm), "Frio" (cold) em PT-BR.
  - Retorna null quando `priorityBucket` é undefined/null.
  - Cores apropriadas: vermelho (hot), âmbar (warm), azul (cold).

- [x] **E) Integração**
  - Badge de temperatura ao lado do status na primeira coluna.
  - Layout com `flex items-center gap-2 flex-wrap`.

- [x] **F) Testes unitários**
  - `LeadTemperatureBadge.test.tsx`: 9 testes passando.
  - Corrigidos mocks em testes existentes.

### Arquivos Criados
- `src/features/leads/components/LeadTemperatureBadge.tsx`
- `tests/unit/features/leads/components/LeadTemperatureBadge.test.tsx`

### Arquivos Modificados
- `src/features/leads/pages/LeadDetailPage.tsx` - Sticky topbar, alinhamento, tabs, temperatura
- `tests/unit/features/leads/LeadDetailPage.tags.test.tsx` - Fix mocks
- `tests/unit/features/leads/components/LeadsSalesList.test.tsx` - Fix mocks

### ✅ Checklist de QA manual

#### Lead Detail (/leads/:id)
- [ ] Breadcrumbs alinhados com a logomarca/menu e conteúdo.
- [ ] Topbar (breadcrumbs + quick actions) fica sticky ao rolar, abaixo do header principal.
- [ ] Topbar não sobrepõe o conteúdo das colunas.
- [ ] Tabs (Contexto/Visão Geral/Docs) com visual igual ao `/deals/:id` (bg-muted/40, border, rounded).
- [ ] Badge de temperatura aparece ao lado do status quando `priorityBucket` existe.
- [ ] "Quente" mostra badge vermelho, "Morno" âmbar, "Frio" azul.
- [ ] Se lead não tem `priorityBucket`, badge de temperatura não aparece.
- [ ] Layout funciona em desktop e mobile.

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Arquivos criados | 2 |
| Arquivos modificados | 3 |
| Linhas adicionadas | ~120 |
| Linhas removidas | ~15 |
| Testes adicionados | 9 |
| Alertas de segurança | 0 |
| Contratos quebrados | 0 |
| Libs novas adicionadas | 0 |

**Risco:** 🟢 Baixo (mudança de UI/UX localizada, sem alteração de lógica de negócio ou API)

### 📝 ROADMAP Final

| Item Solicitado | Status | Observações |
|----------------|--------|-------------|
| Alinhamento breadcrumbs | ✅ | `px-6` no header |
| Topbar sticky | ✅ | `sticky top-16 z-40` + backdrop-blur |
| Tabs padrão DealDetailPage | ✅ | `bg-muted/40 border rounded-lg p-1` |
| Badge de temperatura | ✅ | `LeadTemperatureBadge` component |
| Temperatura ao lado do status | ✅ | Integrado na primeira coluna |
| Testes unitários | ✅ | 9 testes passando |
| Sem alteração de lógica | ✅ | Apenas UI/layout |
| Sem alteração de API | ✅ | Nenhuma mudança |

#### Legenda
- ✅ **Implementado** exatamente como solicitado

#### Decisões Técnicas
1. **Por que usar constante `HEADER_OFFSET_PX`?**
   - Evita "magic numbers" no código e facilita manutenção futura.
   
2. **Por que usar `backdrop-blur` no topbar sticky?**
   - Melhora visibilidade do conteúdo que passa por trás durante scroll.

3. **Por que extrair `BadgeVariant` e `TemperatureConfig` como tipos?**
   - Melhora legibilidade e type safety no componente de temperatura.

---

## ✅ Iteração anterior - Lead Detail UX: Contexto como Tab Padrão + Quick Actions Visíveis

### 🎯 Objetivo
1. **Tab Contexto como padrão:** Ao abrir `/leads/:id`, a aba "Contexto" (anteriormente "Atividades") é selecionada automaticamente.
2. **Renomear tab:** Alterar nome da tab de "Atividades" para "Contexto".
3. **Texto explicativo:** Adicionar texto curto explicando o conteúdo da aba Contexto.
4. **Quick Actions com labels:** Substituir botões apenas com ícones por botões com ícone + texto visível.

### ✅ Tarefas Concluídas
- [x] **A) Tab Contexto como padrão**
  - Alterado `defaultValue` de `"overview"` para `"timeline"` no componente `Tabs`.
  - Ao abrir `/leads/:id`, usuário cai diretamente na aba Contexto.

- [x] **B) Renomear tab para "Contexto"**
  - Atualizado texto do `TabsTrigger` de "Atividades" para "Contexto".

- [x] **C) Texto explicativo na aba Contexto**
  - Adicionado parágrafo: "Aqui você encontra o histórico completo de interações: anotações, eventos agendados, e-mails e atividades do lead."

- [x] **D) Quick Actions com labels visíveis**
  - Alterado layout de `flex items-center gap-1` para `flex flex-wrap gap-2`.
  - Botões alterados de `variant="ghost" size="icon"` para `variant="outline" size="sm"`.
  - Adicionados labels visíveis: WhatsApp, E-mail, Ligar, Drive, Agendar, Copiar ID.
  - Mantidos `aria-label`, `data-testid` e lógica de `disabled`.

- [x] **E) Testes unitários**
  - `LeadDetailPage.defaultTab.test.tsx`: 2 testes (tab padrão, texto explicativo).
  - Atualizado `LeadDetailQuickActions.test.tsx`: +1 teste (labels visíveis).
  - Total: 9 testes passando.

### Arquivos Modificados
- `src/features/leads/pages/LeadDetailPage.tsx` - Tab padrão + renomear tab + texto explicativo
- `src/features/leads/components/LeadDetailQuickActions.tsx` - Layout com labels visíveis

### Arquivos de Teste Criados/Modificados
- `tests/unit/features/leads/LeadDetailPage.defaultTab.test.tsx` - 2 testes (NOVO)
- `tests/unit/features/leads/components/LeadDetailQuickActions.test.tsx` - +1 teste

### ✅ Checklist de QA manual

#### Lead Detail (/leads/:id)
- [ ] Ao abrir a página, tab "Contexto" está selecionada (não "Visão Geral").
- [ ] Tab mostra texto "Contexto" (não "Atividades").
- [ ] Texto explicativo aparece no topo do conteúdo da aba Contexto.
- [ ] Quick Actions no sidebar mostram labels visíveis (WhatsApp, E-mail, etc.).
- [ ] Usuário identifica ações sem precisar de hover/tooltip.
- [ ] Botões desabilitados quando sem telefone/email continuam funcionando.
- [ ] Outras abas (Visão Geral, Docs) continuam funcionando normalmente.

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Arquivos modificados | 2 |
| Arquivos de teste criados | 1 |
| Arquivos de teste modificados | 1 |
| Linhas adicionadas | ~90 |
| Linhas removidas | ~30 |
| Testes adicionados | 3 |
| Alertas de segurança | 0 |
| Contratos quebrados | 0 |
| Libs novas adicionadas | 0 |

**Risco:** 🟢 Baixo (mudança de UI/UX localizada, sem alteração de lógica de negócio ou API)

### 📝 ROADMAP Final

| Item Solicitado | Status | Observações |
|----------------|--------|-------------|
| Tab "Contexto" como padrão | ✅ | `defaultValue="timeline"` |
| Renomear tab para "Contexto" | ✅ | TabsTrigger atualizado |
| Texto explicativo na aba | ✅ | Parágrafo adicionado |
| Quick Actions com labels visíveis | ✅ | Layout atualizado com `variant="outline"` + texto |
| Manter acessibilidade | ✅ | `aria-label` mantido |
| Manter disabled states | ✅ | Lógica preservada |
| Testes unitários | ✅ | 3 novos testes |
| Sem alteração de lógica | ✅ | Apenas UI/layout |
| Sem alteração de API | ✅ | Nenhuma mudança |

#### Legenda
- ✅ **Implementado** exatamente como solicitado

#### Decisões Técnicas
1. **Por que usar `variant="outline"` nos botões?**
   - Melhor visibilidade e hierarquia visual comparado ao `variant="ghost"`.
   
2. **Por que usar `flex flex-wrap gap-2`?**
   - Permite que os botões quebrem linha em telas menores, mantendo boa UX.

3. **Por que manter tooltips?**
   - Tooltips agora mostram descrições mais detalhadas (ex: "Enviar WhatsApp para o contato principal").

---

## ✅ Iteração anterior - Lead Detail Improvements
  - Adicionada prop `onClick` ao `BuyingCommitteeCard`.
  - Implementado suporte a teclado (Enter/Space).
  - Adicionado `cursor-pointer` e `role="button"` quando onClick é fornecido.
  - `stopPropagation()` nos botões internos (email/linkedin/edit).
  - Integrado `ContactPreviewModal` no `LeadDetailPage`.

- [x] **D) Remover Mapa de Relacionamentos**
  - Removida importação e uso de `RelationshipMap`.
  - Removidos hooks `useCompany`, `useDeals`, `useTracks`.
  - Removido `useMemo` de `relationshipData`.

- [x] **E) Quick Actions no Lead Detail**
  - Criado componente `LeadDetailQuickActions` com:
    - WhatsApp (MessageCircle icon verde)
    - Email (Mail icon azul)
    - Ligar (Phone icon)
    - Drive (HardDrive icon amarelo)
    - Agendar Reunião (Calendar icon laranja)
    - Copiar ID (Copy icon)
  - Ações desabilitadas quando dados não disponíveis (ex: sem telefone).
  - Mesma lógica e feedback do `/leads` list.

- [x] **F) Testes unitários**
  - `BuyingCommitteeCard.test.tsx`: 5 testes (clicável, keyboard, stopPropagation).
  - `LeadDetailQuickActions.test.tsx`: 6 testes (renderização, desabilitação, callbacks).

### Arquivos Criados
- `src/features/leads/components/LeadDetailQuickActions.tsx`
- `tests/unit/components/BuyingCommitteeCard.test.tsx`
- `tests/unit/features/leads/components/LeadDetailQuickActions.test.tsx`

### Arquivos Modificados
- `src/components/BuyingCommitteeCard.tsx` - Adicionada prop onClick
- `src/features/leads/pages/LeadDetailPage.tsx` - Todas as mudanças de UI

### ✅ Checklist de QA manual

#### Lead Detail (/leads/:id)
- [ ] Quando não há contatos, EmptyState mostra "Novo" e "Vincular".
- [ ] Clicar "Vincular" abre modal de vincular contato existente.
- [ ] Seção de contatos diz "Contatos do Lead" (não "Comitê de Compra").
- [ ] Clicar em um contato abre modal de preview.
- [ ] Botão "Ver contato" no modal navega para /contacts/:id.
- [ ] Clicar em email/linkedin no card NÃO abre o modal de preview.
- [ ] Ações rápidas aparecem no sidebar (WhatsApp, Email, etc.).
- [ ] Ações desabilitadas quando sem telefone/email.
- [ ] "Copiar ID" copia o ID e mostra toast de sucesso.
- [ ] Mapa de Relacionamentos NÃO aparece.

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Arquivos criados | 3 |
| Arquivos modificados | 2 |
| Linhas adicionadas | ~650 |
| Linhas removidas | ~120 |
| Testes adicionados | 11 |
| Alertas de segurança | 0 |
| Contratos quebrados | 0 |
| Libs novas adicionadas | 0 |

**Risco:** 🟢 Baixo (mudança de UI/UX, sem alteração de lógica de negócio ou API)

---

## ✅ Iteração anterior - UI Polish Sidebar/Sheet Filtros

**Data:** 2025-12-19  
**Autor:** GitHub Copilot Agent  
**Escopo:** Frontend - UI/UX refactoring da página Lead Detail (`/leads/:id`)

---

## 🆕 Iteração atual - Lead Detail UI/UX Refactoring (Layout Only)

### 🎯 Objetivo
Refatorar a experiência do Lead Detail para:
1. **Sidebar "always visible":** O sidebar fica fixo (sticky) no viewport e, se necessário, rola internamente.
2. **Hierarquia visual do header:** Melhor espaçamento e alinhamento.
3. **Conteúdo mais escaneável:** Cards padronizados com tipografia consistente.

### ✅ Tarefas Concluídas

- [x] **A) Sidebar com scroll interno**
  - `EntityDetailLayout` atualizado com `position: sticky` e `max-height: calc(100vh - 4rem)`.
  - Adicionado wrapper interno com `overflow-y-auto` para scroll interno do sidebar.
  - Sidebar não "rola junto" com o conteúdo principal - fica sempre visível.
  - Uso de elementos semânticos (`<aside>` e `<main>`) para acessibilidade.

- [x] **B) Cards padronizados na área de conteúdo**
  - Uso consistente de `CardTitle` (text-base) + `CardDescription` em todos os cards.
  - Removidas inconsistências como `border-b` em alguns CardHeaders.
  - Espaçamento uniforme com `pb-4` no CardHeader e `space-y-6` entre cards.

- [x] **C) Tabs com indentação corrigida**
  - Corrigida indentação no TabsTrigger de "Atividades".

- [x] **D) Testes criados**
  - `EntityDetailLayout.test.tsx` com 6 testes:
    - Verifica renderização de header, sidebar, content.
    - Verifica classes `lg:sticky` e `lg:top-6` no sidebar.
    - Verifica wrapper interno com `overflow-y-auto`.
    - Verifica `max-height` style no sidebar.
    - Verifica elementos semânticos `<aside>` e `<main>`.

### Arquivos Modificados
- `src/components/detail-layout/EntityDetailLayout.tsx` - Layout com sidebar sticky + internal scroll
- `src/features/leads/pages/LeadDetailPage.tsx` - Cards padronizados, CardDescription

### Arquivos de Teste Criados
- `tests/unit/components/EntityDetailLayout.test.tsx` - 6 testes passando

### ✅ Checklist de QA manual

#### Desktop (/leads/:id)
- [ ] Sidebar fica visível ao rolar a página (não rola junto com o conteúdo).
- [ ] Se o sidebar tiver mais conteúdo que a tela, ele rola internamente.
- [ ] Cards têm títulos consistentes (text-base) com descrições abaixo.
- [ ] Tabs estão funcionando corretamente (Visão Geral, Docs, Atividades).
- [ ] Breadcrumb está visível e funcional.

#### Mobile (/leads/:id)
- [ ] Sidebar aparece acima do conteúdo (layout 1 coluna).
- [ ] Navegação funciona normalmente.

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | ~60 |
| Linhas removidas | ~30 |
| Arquivos modificados | 2 |
| Testes criados | 6 |
| Total testes passando | 6 (EntityDetailLayout) |
| Contratos quebrados | 0 |
| Libs novas adicionadas | 0 |
| Alertas de segurança | 0 |

**Risco:** 🟢 Baixo (mudança de UI/UX, sem alteração de lógica de negócio ou API)

### 📝 ROADMAP Final

| Item Solicitado | Status | Observações |
|----------------|--------|-------------|
| Sidebar "always visible" (sticky) | ✅ | `EntityDetailLayout.tsx` - sticky + max-height |
| Sidebar com scroll interno | ✅ | `overflow-y-auto` no wrapper interno |
| Header com hierarquia visual | ✅ | Já existia, mantido |
| Cards padronizados | ✅ | `CardTitle` (text-base) + `CardDescription` |
| Tabs com espaçamento correto | ✅ | Indentação corrigida |
| Testes de layout | ✅ | 6 testes em `EntityDetailLayout.test.tsx` |
| Sem alteração de lógica de negócio | ✅ | Apenas layout/CSS |
| Sem alteração de contrato de API | ✅ | Nenhuma mudança |
| Mobile responsivo | ✅ | Layout 1 coluna em mobile |

#### Legenda
- ✅ **Implementado** exatamente como solicitado

#### Decisões Técnicas
1. **Por que usar `style={{ maxHeight }}` ao invés de classes Tailwind?**
   - O cálculo `calc(100vh - 4rem)` não é facilmente expressável em classes padrão do Tailwind.
   
2. **Por que usar `<aside>` e `<main>` ao invés de `<div>`?**
   - Melhora acessibilidade e semântica HTML5.

3. **Por que remover `border-b` dos CardHeaders?**
   - Padronização visual - todos os cards agora usam o mesmo estilo.

---

## ✅ Iteração anterior - UI Polish Sidebar/Sheet Filtros
...
