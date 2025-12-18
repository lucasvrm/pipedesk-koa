# 📋 ACTION_PLAN.md - Ajustes em /leads

## 🚧 Status: ✅ Concluído (Correção de Filtros Responsável e Sem interação há)

**Data:** 2025-12-18  
**Autor:** GitHub Copilot Agent  
**Escopo:** Frontend - leadsSalesViewService, correção de parâmetro API

---

## 🆕 Iteração atual - Correção de Filtros "Responsável" e "Sem interação há"

### 🎯 Problema Resolvido
- Bug: os filtros "Responsável" e "Sem interação há" apareciam na UI e mudavam visualmente, mas não alteravam a lista de leads

### 📍 Causa Raiz Identificada
O serviço `leadsSalesViewService.ts` estava enviando o parâmetro `ownerIds` para a API, mas o backend espera `owners` (conforme implementado em `leadService.ts` - a implementação original).

**Código problemático (antes):**
```typescript
if (filters.ownerIds?.length) searchParams.set('ownerIds', filters.ownerIds.join(','))
```

**Código corrigido (depois):**
```typescript
if (filters.ownerIds?.length) searchParams.set('owners', filters.ownerIds.join(','))
```

### ✅ Tarefas Concluídas
- [x] Identificar causa raiz: parâmetro API incorreto (`ownerIds` vs `owners`)
- [x] Corrigir `leadsSalesViewService.ts`: mudar param de `ownerIds` para `owners`
- [x] Adicionar 6 novos testes específicos para filtros Responsável e Sem interação há
- [x] Atualizar teste existente para esperar `owners`
- [x] Build de produção bem-sucedido
- [x] 51 testes de filtros passando

### Arquivos Modificados
- `src/services/leadsSalesViewService.ts` - Correção do parâmetro API (linha 155)
- `tests/unit/services/leadsSalesViewService.test.tsx` - Novos testes e correção

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | ~140 |
| Linhas modificadas | 2 |
| Arquivos modificados | 2 |
| Testes adicionados | 6 |
| Total testes filtros | 51 |
| Contratos quebrados | 0 |
| Alertas de segurança | 0 |

**Risco:** 🟢 Baixo (correção cirúrgica de um parâmetro, testes extensivos)

### ✅ Checklist de QA manual (/leads)
- [ ] Filtro Responsável: Meus → URL inclui `owner=me` e lista filtra
- [ ] Filtro Responsável: Todos → URL sem `owner` e lista mostra todos
- [ ] Filtro Responsável: Selecionar usuários → URL inclui `ownerIds=...` e API recebe `owners=...`
- [ ] Filtro Sem interação há: 7 dias → URL inclui `days_without_interaction=7` e lista filtra
- [ ] Filtro Sem interação há: Qualquer → URL sem param e lista sem filtro
- [ ] Back/Forward no navegador → filtros persistem
- [ ] Refresh da página → filtros persistem via URL

---

## ✅ Iteração anterior - URL-first Filter System + Inline Filter Bar

### 🎯 Problema Resolvido
- Bug: mudanças de filtros não refletiam na lista (UI muda, lista não atualiza)
- UX: Sheet de filtros era ruim de navegar
- Causa raiz: estado duplicado entre useState e URL

### ✅ Tarefas Concluídas
- [x] Criar hook `useLeadsFiltersSearchParams` como fonte única de verdade (URL-first)
  - Parse de searchParams para objeto tipado `appliedFilters`
  - Serialize de mudanças para URL
  - Helpers: toggleMulti, setMulti, clearFilter, clearAll
  - Reset automático de página ao mudar filtros
- [x] Criar componente `LeadsFiltersBar` com triggers inline e Popovers
  - Filtros aparecem como botões compactos na toolbar
  - Cada botão abre Popover com busca e checkboxes
  - Mudanças aplicam IMEDIATAMENTE via URL (sem modo draft)
- [x] Criar componente `LeadsFiltersChips` para chips removíveis
  - Linha de chips abaixo da toolbar
  - Cada chip remove filtro específico
  - Botão "Limpar tudo" quando múltiplos ativos
- [x] Refatorar `LeadsListPage` para usar o novo hook
  - `salesFilters` derivado diretamente de `appliedFilters` (não mais de useState)
  - queryKey inclui `appliedFilters` para invalidação correta
  - Remover useState duplicados para filtros de sales view
- [x] Adicionar 43 novos testes (25 hook + 18 componentes)
- [x] Build de produção bem-sucedido
- [x] 72 testes de filtros passando

### Arquivos Criados
- `src/features/leads/hooks/useLeadsFiltersSearchParams.ts` - Hook central para filtros URL-first
- `src/features/leads/components/LeadsFiltersBar.tsx` - Filter bar inline + chips
- `tests/unit/features/leads/hooks/useLeadsFiltersSearchParams.test.tsx` - 25 testes
- `tests/unit/features/leads/components/LeadsFiltersBar.test.tsx` - 18 testes

### Arquivos Modificados
- `src/features/leads/pages/LeadsListPage.tsx` - Refatoração para usar hook URL-first

### Arquitetura Implementada (URL como fonte única de verdade)

```
┌─────────────────────────────────────────────────────────────────┐
│                         ANTES (problemático)                    │
├─────────────────────────────────────────────────────────────────┤
│  URL ←→ useState (init) ←→ draftState (Sheet) ←→ callbacks     │
│                                                                 │
│  Problema: estados divergem, mudanças não refletem na lista    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         DEPOIS (correto)                        │
├─────────────────────────────────────────────────────────────────┤
│  URL (fonte de verdade)                                         │
│    ↓                                                            │
│  useLeadsFiltersSearchParams() → appliedFilters                 │
│    ↓                                                            │
│  salesFilters/queryKey → React Query                            │
│    ↓                                                            │
│  Fetch automático ao mudar URL                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Layout Implementado (Inline Filter Bar)

```
┌─────────────────────────────────────────────────────────────────┐
│ TOOLBAR                                                          │
│ ┌────────────────────┐ ┌───────────────────────────────────────┐│
│ │ 🔍 Buscar leads... │ │ Ordenar ▼ │ Filtros inline...        ││
│ └────────────────────┘ └───────────────────────────────────────┘│
│                                                                  │
│ FILTROS INLINE:                                                  │
│ [Meus][Todos][Selecionar▼] [Status▼] [Prioridade▼] [Origem▼]   │
│ [Tags▼] [Próxima ação▼] [Sem interação▼] [Limpar 3]            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ CHIPS (quando filtros ativos)                                    │
│ Filtros ativos: [Status: Novo ×] [Prioridade: Hot ×] [Limpar]  │
├─────────────────────────────────────────────────────────────────┤
│ LISTA DE LEADS                                                   │
│ ...                                                              │
└─────────────────────────────────────────────────────────────────┘
```

### ✅ Checklist de QA manual (/leads)
- [ ] Clicar em filtro (ex: Status) → abre Popover com opções
- [ ] Selecionar opção → URL atualiza IMEDIATAMENTE (ver barra de endereço)
- [ ] Lista de leads reflete o filtro aplicado (com loading suave)
- [ ] Chips aparecem abaixo da toolbar com filtros ativos
- [ ] Clicar X no chip → remove filtro e atualiza URL e lista
- [ ] "Limpar tudo" → remove todos os filtros
- [ ] Navegar back/forward no navegador → filtros e lista acompanham
- [ ] Recarregar página → filtros persistem via URL
- [ ] view=sales: filtro "Próxima ação" aparece com 11 opções canônicas
- [ ] view!=sales: filtro "Próxima ação" não aparece

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | ~1800 |
| Linhas removidas | ~189 |
| Arquivos criados | 4 |
| Arquivos modificados | 1 |
| Testes adicionados | 43 |
| Total de testes filtros | 72 |
| Contratos quebrados | 0 |
| Alertas de segurança | 0 |

**Risco:** 🟢 Baixo (mudanças localizadas em Sales view, Grid/Kanban mantidos intactos)

---

## ✅ Iteração anterior - Filtros Multi-Opção em Popover + UI Compacta

### ✅ Tarefas Concluídas
- [x] Remover botão textual "FECHAR" do Sheet de filtros (fechamento pelo X nativo Radix/shadcn)
- [x] Remover "(padrão)" do dropdown de Ordenação ("Prioridade (padrão)" → "Prioridade")
- [x] Reordenar controles do toolbar: Busca → Ordenação → Filtros
- [x] Remover badge placeholder "Tags" quando lead não tem tags (célula em branco)
- [x] Mover botão min/max cards para linha do subtítulo "Gerencie seus potenciais clientes."
- [x] Suporte a modo controlado no LeadsSummaryCards (isCollapsed, onToggle, hideToggle)
- [x] Hook useSummaryCardsState exportado para controle externo do toggle
- [x] Atualizar testes para remover referências ao botão "Fechar"
- [x] Adicionar testes para modo controlado do LeadsSummaryCards (7 novos testes)
- [x] Adicionar testes para coluna Tags vazia (2 novos testes)
- [x] Build de produção bem-sucedido

### Arquivos Modificados
- `src/features/leads/components/LeadsSmartFilters.tsx` - Remover botão "Fechar" e "(padrão)"
- `src/features/leads/components/LeadsSummaryCards.tsx` - Modo controlado + hook exportado
- `src/features/leads/components/LeadSalesRow.tsx` - Remover badge "Tags" placeholder
- `src/features/leads/pages/LeadsListPage.tsx` - Reordenar toolbar + integrar toggle externo
- `tests/unit/components/LeadsSmartFilters.test.tsx` - Atualizar testes
- `tests/unit/features/leads/components/LeadsSummaryCards.test.tsx` - Testes modo controlado
- `tests/unit/features/leads/components/LeadSalesRow.test.tsx` - Testes tags vazia

### ✅ Checklist de QA manual (/leads)
- [ ] Sheet de filtros abre pelo trigger "Filtros"; NÃO existe botão textual "FECHAR"
- [ ] Fechamento do Sheet funciona pelo X nativo (canto superior direito)
- [ ] Dropdown de ordenação mostra "Prioridade" (sem "(padrão)")
- [ ] Toolbar: ordem visual é Busca → Ordenação → Filtros
- [ ] Leads sem tags: célula de tags está em branco (sem badge "Tags")
- [ ] Leads com tags: badges coloridos aparecem corretamente
- [ ] Botão min/max cards está à direita do subtítulo "Gerencie seus potenciais clientes."
- [ ] Clicar no botão minimiza/maximiza os cards de métricas
- [ ] Estado de min/max persiste após reload (localStorage)
- [ ] Responsivo: botão min/max visível em mobile e desktop

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | ~180 |
| Linhas removidas | ~80 |
| Arquivos modificados | 7 |
| Arquivos criados | 0 |
| Testes adicionados | 9 |
| Contratos quebrados | 0 |
| Alertas de segurança | 0 |

**Risco:** 🟢 Baixo (mudanças de UI/UX localizadas, sem alteração de lógica de negócio)

---

## ✅ Iteração anterior - Minimizar/Maximizar Cards + Correção de Métricas

### ✅ Tarefas Concluídas
- [x] Criar componente `LeadsSummaryCards` com toggle minimizar/maximizar
- [x] Implementar persistência de estado via `localStorage` (key: `leads.summaryCards.collapsed`)
- [x] Adicionar acessibilidade (aria-expanded, aria-controls)
- [x] Criar hook `useLeadMonthlyMetrics` para buscar contagens via Supabase
- [x] Queries eficientes: `created_at` >= startOfMonth UTC e `qualified_at` >= startOfMonth UTC
- [x] Aplicar filtros de owner/origin consistentes com o contexto atual
- [x] Integrar métricas no `LeadsListPage` substituindo cálculo client-side
- [x] Estados de loading (skeleton) e erro (—) para métricas
- [x] Minimizado: exibe resumo compacto com totais inline
- [x] Testes unitários para `LeadsSummaryCards` (17 testes)
- [x] Testes unitários para `useLeadMonthlyMetrics` (7 testes)
- [x] Build de produção bem-sucedido
- [x] Code review - addressed feedback (memoize dates, add comments, remove unused callback)
- [x] CodeQL security scan - 0 alerts

### Regras de Negócio Implementadas
- **Criados no mês**: quantidade de leads com `created_at` entre `startOfMonthUtc` (inclusive) e `startOfNextMonthUtc` (exclusivo)
- **Qualificados no mês**: quantidade de leads com `qualified_at` no mesmo intervalo, independente do filtro de listagem
- **Leads em aberto**: continua usando `pagination.total` da Sales View ou contagem local para outras views

### Arquivos Criados
- `src/features/leads/components/LeadsSummaryCards.tsx`
- `src/hooks/useLeadMonthlyMetrics.ts`
- `tests/unit/features/leads/components/LeadsSummaryCards.test.tsx`
- `tests/unit/hooks/useLeadMonthlyMetrics.test.tsx`

### Arquivos Modificados
- `src/features/leads/pages/LeadsListPage.tsx`

### ✅ Checklist de QA manual (/leads)
- [ ] Clicar no botão "Minimizar" → cards colapsam para resumo compacto
- [ ] Dar reload → estado minimizado/maximizado persiste
- [ ] "Criados no mês" e "Qualificados no mês" exibem valores corretos (não 0)
- [ ] Em loading, métricas mostram skeleton (não valores antigos)
- [ ] Responsivo: cards em grid 3 colunas no desktop, empilhados em mobile

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | ~420 |
| Linhas removidas | ~40 |
| Arquivos criados | 4 |
| Arquivos modificados | 2 |
| Testes adicionados | 24 |
| Contratos quebrados | 0 |
| Alertas de segurança | 0 |

**Risco:** 🟢 Baixo (nova funcionalidade isolada, sem mudanças em APIs)

---

## ✅ Iteração anterior - Popover → Sheet com Draft Mode (Remodelação UX)

### ✅ Tarefas Concluídas
- [x] Substituir Popover por Sheet (painel lateral) para filtros
- [x] Implementar modo rascunho (draftFilters) - alterações só aplicadas ao clicar "Aplicar filtros"
- [x] Header do Sheet com título, subtítulo, "Limpar tudo" e "Fechar"
- [x] Seção 1: Resumo com chips removíveis dos filtros do draft
- [x] Seção 2: Essenciais (Responsável, Status, Prioridade, Próxima ação quando view=sales)
- [x] Seção 3: Avançados em Accordion recolhido (Origem, Dias sem interação, Tags)
- [x] Footer fixo com "Cancelar" e "Aplicar filtros"
- [x] Manter badges de filtros ativos fora do Sheet
- [x] Atualizar todos os testes para novo comportamento (27 testes)
- [x] Build de produção bem-sucedido

### Decisão de UX: Modo Rascunho
- Ao abrir o Sheet: cria `draftFilters` baseado nos filtros aplicados
- Alterações no painel modificam apenas `draftFilters`
- Rodapé fixo:
  - **Cancelar**: descarta `draftFilters` e fecha o Sheet
  - **Aplicar filtros**: comita `draftFilters` para o state/URL, dispara fetch e fecha
- "Limpar tudo" no header limpa o `draftFilters` sem fechar

### Estrutura do Painel (Sheet)
```
┌─────────────────────────────────────────────────────┐
│ HEADER (fixo)                                       │
│ ├─ Título: "Filtros"                               │
│ ├─ Subtítulo: "Ajuste os filtros para refinar..."  │
│ └─ Ações: [Limpar tudo] [X Fechar]                 │
├─────────────────────────────────────────────────────┤
│ RESUMO (chips do draft)                            │
│ [Status (1) ×] [Prioridade (2) ×] [Origem (1) ×]  │
├─────────────────────────────────────────────────────┤
│ ESSENCIAIS                                          │
│ ├─ Responsável: [Meus] [Todos] [Selecionar ▼]      │
│ ├─ Status: Command multi-select com busca          │
│ ├─ Prioridade: [Hot] [Warm] [Cold] pill group      │
│ └─ Próxima ação (view=sales): Command + ações     │
├─────────────────────────────────────────────────────┤
│ AVANÇADOS (Accordion recolhido)                    │
│ ├─ ▶ Origem                                        │
│ ├─ ▶ Dias sem interação (presets 3/7/14/Qualquer) │
│ └─ ▶ Tags                                          │
├─────────────────────────────────────────────────────┤
│ FOOTER (fixo)                                       │
│ [Cancelar]                    [Aplicar filtros (N)]│
└─────────────────────────────────────────────────────┘
```

### ✅ Checklist de QA manual (/leads)
- [ ] Clicar "Filtros" → abre painel lateral (não popover)
- [ ] Selecionar filtros no draft → URL não muda
- [ ] "Aplicar filtros" → URL muda e lista reflete filtros
- [ ] "Cancelar" → descarta e não muda URL
- [ ] view=sales: selecionar Próxima ação → aplicar → request inclui next_action=...
- [ ] "Limpar tudo" limpa draft mas mantém Sheet aberto
- [ ] Chips de resumo mostram filtros do draft com X para remover
- [ ] Estado vazio mostra "Nenhum filtro aplicado"

---

## ✅ Iteração anterior - Filtro "Próxima Ação" com lista canônica (11 opções)

### ✅ Tarefas Concluídas
- [x] Atualizar `NEXT_ACTION_OPTIONS` com a lista canônica de 11 códigos únicos (PT-BR)
- [x] Manter seção "Próxima ação" visível apenas em `view=sales` (showNextActionFilter)
- [x] Adicionar testes para verificar que todas as 11 opções são renderizadas
- [x] Adicionar teste para verificar que a seção NÃO aparece quando showNextActionFilter=false
- [x] Adicionar teste para verificar que chips de resumo incluem "Próxima ação"
- [x] Rodar lint/typecheck/test/build (baseline já possui falhas; testes específicos passam)

### Lista canônica de opções de Próxima Ação (11 codes)
```typescript
const NEXT_ACTION_OPTIONS = [
  { code: 'prepare_for_meeting', label: 'Preparar para reunião' },
  { code: 'post_meeting_follow_up', label: 'Follow-up pós-reunião' },
  { code: 'call_first_time', label: 'Fazer primeira ligação' },
  { code: 'handoff_to_deal', label: 'Fazer handoff (para deal)' },
  { code: 'qualify_to_company', label: 'Qualificar para empresa' },
  { code: 'schedule_meeting', label: 'Agendar reunião' },
  { code: 'call_again', label: 'Ligar novamente' },
  { code: 'send_value_asset', label: 'Enviar material / valor' },
  { code: 'send_follow_up', label: 'Enviar follow-up' },
  { code: 'reengage_cold_lead', label: 'Reengajar lead frio' },
  { code: 'disqualify', label: 'Desqualificar / encerrar' },
]
```

### ✅ Checklist de validação manual proposta (/leads)
- [x] Abrir popover e confirmar bloco **Essenciais** visível e **Mais filtros** fechado por padrão
- [x] Expandir **Mais filtros** e validar contadores por categoria (Tempo, Categorização)
- [x] Ativar filtro de origem e conferir contador "Mais filtros (N)" atualizado
- [x] Abrir modal **Selecionar tags...** pela ação do popover e aplicar tags sem inflar a altura
- [x] Remover filtros ativos pelos chips de resumo no topo e verificar atualização dos contadores
- [x] Em view=sales: verificar que "Próxima ação" aparece com as 11 opções PT-BR
- [x] Em view!=sales: verificar que seção "Próxima ação" não aparece

## ✅ Iteração anterior - UI/UX Filtros Inteligentes em `/leads`
- [x] Reorganizar popover em blocos **Essenciais** (Responsável, Status, Prioridade, Tags) e **Mais filtros** (colapsado por padrão)
- [x] Adicionar resumo de filtros ativos com chips removíveis e contadores por seção (incluindo "Mais filtros (N)")
- [x] Implementar ação "Selecionar tags..." em modal secundário com busca para evitar listas longas no popover principal
- [x] Atualizar testes de UI (RTL) para novo comportamento (accordion fechado, contador, modal de tags, chips removendo filtros)
- [x] Registrar checklist de validação manual para `/leads`

## ✅ Iteração anterior - Filtro de Próxima Ação + botão Fechar
- [x] Tornar o popover de Filtros Inteligentes controlado e adicionar botão **Fechar** após **Limpar**
- [x] Renderizar seção **Próxima ação** apenas em `view=sales` com multi-select fixo (11 codes)
- [x] Persistir seleção em estado/querystring e enviar `next_action=<csv>` para `/api/leads/sales-view`
- [x] Atualizar checklists/QA e executar lint/typecheck/test/build

---

## 📜 Iteração anterior (Backend como Fonte de Verdade para Filtragem)

### 🎯 Objetivo - Remover Filtragem Client-Side

O backend é agora a fonte de verdade para filtragem de leads qualificados e deletados. O frontend não deve mais filtrar esses dados, confiando no backend para entregar dados já filtrados e manter a paginação consistente.

### ✅ Tarefas Concluídas
- [x] Remover filtragem client-side em `useLeadsSalesView` (leadsSalesViewService.ts)
- [x] Remover filtragem client-side em `useSalesViewLeads` (leadService.ts)
- [x] Passar `includeQualified=true` via query param para o backend quando necessário
- [x] Atualizar testes para validar abordagem backend-first
- [x] Documentar decisão de arquitetura

---

## 📝 Alterações Realizadas

### Arquivos Modificados (iteração atual - Próxima Ação Canônica 2025-12-17)
- `src/features/leads/components/LeadsSmartFilters.tsx` - Atualizado `NEXT_ACTION_OPTIONS` com lista canônica de 11 códigos PT-BR
- `tests/unit/components/LeadsSmartFilters.test.tsx` - Adicionados 3 novos testes para comportamento de filtro Próxima Ação

### Arquivos Modificados (iteração anterior - UI/UX)
- `src/services/leadService.ts` - Filtro server-side para `qualified` com cache de status e remoção do filtro client-side
- `tests/unit/services/leadService.test.ts` - Teste garante que `.or()` exclui `lead_status_id` de qualified quando `includeQualified=false`

### Arquivos Modificados (iteração anterior)
- `src/services/leadsSalesViewService.ts` - Removida filtragem client-side; `includeQualified` passado via query param
- `src/services/leadService.ts` - Removida filtragem client-side em `getSalesViewLeads` e `useSalesViewLeads`
- `tests/unit/services/leadsSalesViewService.test.tsx` - Testes atualizados para validar comportamento backend-first

### Detalhes da Implementação (iteração atual - Próxima Ação Canônica)

1. `NEXT_ACTION_OPTIONS` agora contém lista fixa de 11 códigos conforme especificação:
   - Códigos não derivam da página atual (são canônicos)
   - Labels em PT-BR
   - Seção renderiza apenas quando `showNextActionFilter=true` (view=sales)

2. Novos testes adicionados:
   - Verificação de que todas as 11 opções são renderizadas
   - Verificação de que seção não aparece quando `showNextActionFilter=false`
   - Verificação de que chips de resumo incluem seleção de Próxima Ação

### Detalhes da Implementação (iteração anterior)

1. `getQualifiedStatusId` usa cache em memória para buscar o ID via `lead_statuses` (code = 'qualified').
2. `getLeads` aplica `.or('lead_status_id.is.null,lead_status_id.neq.<qualified>')` e `qualified_at IS NULL` quando `includeQualified=false`.
3. `useLeads` delega a filtragem para a query Supabase (remove filtro client-side).
4. Teste unitário valida que o filtro é aplicado/omitido conforme `includeQualified`.

### Detalhes da Implementação (iteração anterior)

#### 1. `fetchSalesView` (leadsSalesViewService.ts)
```typescript
async function fetchSalesView(params, options?: { includeQualified?: boolean }) {
  // ...
  if (options?.includeQualified) {
    searchParams.set('includeQualified', 'true')
  }
  // ...
}
```

#### 2. `useLeadsSalesView` (leadsSalesViewService.ts)
```typescript
export function useLeadsSalesView(params, options?) {
  return useQuery({
    queryKey: ['leads-sales-view', params, options?.includeQualified],
    queryFn: async () => {
      // Backend é agora a fonte de verdade para filtragem
      const response = await fetchSalesView(params, { includeQualified: options?.includeQualified });
      return response;
    },
    // ...
  });
}
```

#### 3. `getSalesViewLeads` (leadService.ts)
```typescript
export async function getSalesViewLeads(filters?, options?: { includeQualified?: boolean }) {
  // ...
  if (options?.includeQualified) {
    params.set('includeQualified', 'true');
  }
  // ...
}
```

#### 4. `useSalesViewLeads` (leadService.ts)
```typescript
export function useSalesViewLeads(filters?, options?) {
  return useQuery({
    queryFn: async () => {
      // Backend é agora a fonte de verdade para filtragem
      const leads = await getSalesViewLeads(filters, { includeQualified: options?.includeQualified });
      return leads;
    },
    // ...
  });
}
```

---

## ✅ Checklist de Qualidade (Próxima Ação Canônica - 2025-12-17)

| Item | Status |
|------|--------|
| `NEXT_ACTION_OPTIONS` atualizado com 11 códigos canônicos PT-BR | ✅ |
| Seção "Próxima ação" renderiza apenas quando `showNextActionFilter=true` | ✅ |
| Teste verificando todas as 11 opções canônicas | ✅ |
| Teste verificando seção oculta quando `showNextActionFilter=false` | ✅ |
| Teste verificando chips de resumo incluem Próxima Ação | ✅ |
| Todos os 26 testes LeadsSmartFilters passando | ✅ |
| Build de produção bem-sucedido | ✅ |
| Code Review: sem comentários | ✅ |
| CodeQL Security Scan: 0 alertas | ✅ |

---

## 📊 Medição de Impacto (Próxima Ação Canônica - 2025-12-17)

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | ~65 |
| Linhas removidas | ~12 |
| Arquivos modificados | 2 |
| Arquivos criados | 0 |
| Testes adicionados | 3 |
| Total de testes | 26 |
| Contratos quebrados | 0 |
| Alertas de segurança | 0 |

**Risco:** 🟢 Baixo (mudança localizada em lista de opções, comportamento existente mantido)

---

## 📝 ROADMAP Final (Próxima Ação Canônica - 2025-12-17)

| Item Solicitado | Status | Observações |
|----------------|--------|-------------|
| Atualizar lista de Próxima Ação com 11 códigos canônicos | ✅ | `NEXT_ACTION_OPTIONS` em LeadsSmartFilters.tsx |
| Labels em PT-BR | ✅ | Todos os labels traduzidos |
| Seção renderiza apenas em view=sales | ✅ | Comportamento existente mantido via `showNextActionFilter` |
| Multi-select com checkboxes | ✅ | Comportamento existente mantido |
| Sincronização com URL/state | ✅ | Comportamento existente mantido |
| Proibido filtrar lista no frontend | ✅ | Nenhuma filtragem client-side adicionada |
| Testes atualizados | ✅ | 3 novos testes + 1 atualizado |

### Decisões Técnicas:
1. **Por que manter a estrutura existente do componente?**
   - O componente já implementa progressive disclosure corretamente
   - A estrutura de seções (Essenciais / Mais filtros) já atende os requisitos de UX
   - Mudança focada apenas na lista de opções minimiza risco de regressão

2. **Por que não derivar opções da página atual?**
   - Conforme especificação, os 11 códigos são canônicos e fixos
   - Evita inconsistência entre views
   - Simplifica manutenção

---

## ✅ Checklist de Qualidade (iteração anterior)

| Item | Status |
|------|--------|
| Filtro server-side exclui status `qualified` quando `includeQualified=false` | ✅ |
| Filtragem client-side baseada em `qualifiedAt` removida em `useLeads` | ✅ |
| Teste unitário garantindo o filtro da query | ✅ |
| Lint/typecheck/tests/build pós-ajustes | ⚠️ (lint/typecheck/test falham no baseline; build ✅) |

---

## ✅ Checklist de Qualidade (iteração anterior)

| Item | Status |
|------|--------|
| Removida filtragem client-side em `useLeadsSalesView` | ✅ |
| Removida filtragem client-side em `useSalesViewLeads` | ✅ |
| `includeQualified=true` passado via query param | ✅ |
| Testes atualizados para abordagem backend-first | ✅ (5 testes) |
| Contratos de API mantidos (data, pagination) | ✅ |

---

## 📊 Medição de Impacto (iteração atual)

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | 183 |
| Linhas removidas | 19 |
| Arquivos modificados | 2 |
| Arquivos criados | 1 |
| Contratos quebrados | 0 |

---

## 📊 Medição de Impacto (iteração anterior)

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | ~15 |
| Linhas removidas | ~25 |
| Arquivos modificados | 3 |
| APIs alteradas | 0 (apenas query param) |
| Testes modificados | 5 |
| Contratos quebrados | 0 |

**Risco:** 🟡 Médio (requer backend ajustado para filtrar leads qualificados/deletados)

---

## Decisões Técnicas

1. **Por que remover filtragem client-side?**
   - A filtragem client-side causava inconsistência entre `data.length` e `pagination.total`
   - O backend já deve filtrar leads qualificados/deletados
   - Centralizar filtragem no backend garante paginação consistente
   - Evita duplicação de lógica de negócio

2. **Por que passar `includeQualified` como query param?**
   - Permite que relatórios avançados incluam leads qualificados quando necessário
   - Mantém compatibilidade com a API existente
   - Segue padrão RESTful de passar opções via query string

3. **Quando fazer o deploy?**
   - Esta mudança deve ser coordenada com o deploy do backend
   - O backend deve estar ajustado para filtrar leads qualificados/deletados antes desta mudança no FE

---

## Histórico de Alterações Anteriores

### Modal de Criação de Leads Aprimorado (2025-12-15)
- Arquivos:
  - `src/features/leads/components/CreateLeadModal.tsx` (criado)
  - `src/features/leads/pages/LeadsListPage.tsx` (modificado)
- Objetivo: Aprimorar modal de criação de leads com validação Zod e campos dinâmicos
- Funcionalidades:
  - Campo Razão Social com foco automático
  - Dropdown Origem do Lead consumindo `useSystemMetadata`
  - Dropdown Tipo de Operação
  - Seção Contato Principal com toggle Vincular/Criar Novo
  - Campos Cidade/UF com dropdown de estados brasileiros
  - Campo Descrição com contador de caracteres (max 500)
  - Seleção múltipla de Tags com popover
- Status: ✅ Concluído

### Urgency Color System for Next Action Cards (2025-12-15)
- Arquivos: 
  - `src/features/leads/components/LeadSalesRow.tsx`
  - `src/services/leadsSalesViewService.ts`
  - `tests/unit/features/leads/components/LeadSalesRow.test.tsx`
- Objetivo: Implementar sistema de cores de urgência para cards de "Próxima Ação"
- Funcionalidades:
  - 🔴 **Urgente** (atrasado/vence hoje): Vermelho, borda e fundo com contraste acessível
  - 🟡 **Importante** (vence em 1-3 dias): Amarelo/Amber, contraste WCAG 2.1 AA
  - 🔵 **Normal** (vence em 4+ dias): Azul, estilo simplificado
  - ⚪ **Sem próxima ação**: Neutro (cinza discreto)
- Implementação:
  - Criada função `getUrgencyLevel(dueAt)` para calcular nível de urgência baseado na data
  - Adicionado tipo `UrgencyLevel` exportado para uso em outros componentes
  - Configuração `URGENCY_STYLES` com estilos Tailwind para borda e fundo (light + dark mode)
  - Badge de próxima ação agora usa estilos dinâmicos baseados na urgência
  - Interface `LeadSalesViewItem` atualizada para incluir campo `dueAt` em `nextAction`
- Testes: 12 testes unitários adicionados para `getUrgencyLevel`
- Status: ✅ Concluído

### Priority Tooltip Colors (2025-12-15)
- Arquivo: `src/features/leads/components/LeadSalesRow.tsx`
- Objetivo: Ajustar cores dos tooltips de prioridade (hot=vermelho, warm=amarelo, cold=azul)
- Status: ✅ Concluído
