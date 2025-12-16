# 📋 ACTION_PLAN.md - Ajustes em /leads

## 🚧 Status: ✅ Concluído (Filtro de qualified via Supabase)

**Data:** 2025-12-16  
**Autor:** GitHub Copilot Agent  
**Escopo:** Frontend - leadService.ts, leadsSalesViewService.ts

---

## 🆕 Iteração atual - Filtro de qualified na query do Supabase
- [x] Buscar o status `qualified` via `lead_statuses` com cache em memória
- [x] Aplicar filtro server-side por `lead_status_id` quando `includeQualified=false` sem excluir `NULL`
- [x] Remover filtragem client-side baseada em `qualifiedAt` em `useLeads`
- [x] Cobrir com teste unitário que valida o uso de `.or()` na query
- [x] Rodar lint/typecheck/test/build pós-ajuste e registrar resultado (lint/typecheck/test falham no baseline; build ✅)

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

### Arquivos Modificados (iteração atual)
- `src/services/leadService.ts` - Filtro server-side para `qualified` com cache de status e remoção do filtro client-side
- `tests/unit/services/leadService.test.ts` - Teste garante que `.or()` exclui `lead_status_id` de qualified quando `includeQualified=false`

### Arquivos Modificados (iteração anterior)
- `src/services/leadsSalesViewService.ts` - Removida filtragem client-side; `includeQualified` passado via query param
- `src/services/leadService.ts` - Removida filtragem client-side em `getSalesViewLeads` e `useSalesViewLeads`
- `tests/unit/services/leadsSalesViewService.test.tsx` - Testes atualizados para validar comportamento backend-first

### Detalhes da Implementação (iteração atual)

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

## ✅ Checklist de Qualidade (iteração atual)

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
