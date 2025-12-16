# 📋 ACTION_PLAN.md - Ajustes em /leads

## 🚧 Status: ✅ CONCLUÍDO (Filtrar Leads Qualificados de TODAS as Views)

**Data:** 2025-12-16  
**Autor:** GitHub Copilot Agent  
**Escopo:** Frontend - leadService.ts, leadsSalesViewService.ts, LeadDetailPage.tsx

---

## 🎯 Objetivo Atual - Filtrar Leads Qualificados

Ajustar o frontend para ocultar leads com status "qualified" ou "soft deleted" de TODAS as views (sales, kanban, grid), mantendo mensagens claras para leads qualificados acessados diretamente.

### ✅ Tarefas Concluídas
- [x] Atualizar hook `useLeads` para filtrar leads qualificados por padrão
- [x] Atualizar hook `useSalesViewLeads` para filtrar leads qualificados por padrão
- [x] Atualizar hook `useLeadsSalesView` para filtrar leads qualificados e soft deleted por padrão
- [x] Atualizar interface `LeadSalesViewItem` para incluir campos `qualifiedAt` e `deletedAt`
- [x] Atualizar `LeadDetailPage` para exibir mensagem quando lead está qualificado
- [x] Adicionar navegação para negócio e empresa associados no card de lead qualificado
- [x] Adicionar opção `includeQualified` para relatórios avançados
- [x] Adicionar testes unitários para o comportamento de filtragem
- [x] Mensagens em português claras para o usuário
- [x] Build passando

---

## 📝 Alterações Realizadas

### Arquivos Modificados
- `src/services/leadService.ts` - Hooks `useLeads` e `useSalesViewLeads` agora filtram leads qualificados por padrão
- `src/services/leadsSalesViewService.ts` - Hook `useLeadsSalesView` filtra leads qualificados e soft deleted; interface `LeadSalesViewItem` atualizada com campos de qualificação
- `src/features/leads/pages/LeadDetailPage.tsx` - Card informativo para leads qualificados
- `tests/unit/services/leadsSalesViewService.test.tsx` - 5 novos testes para validar comportamento de filtragem

### Detalhes da Implementação

#### 1. Filtro no Hook `useLeads` (Grid/Kanban Views)
```typescript
export function useLeads(filters?: LeadFilters, options?: { includeQualified?: boolean }) {
  return useQuery({
    queryKey: ['leads', filters, options?.includeQualified],
    queryFn: async () => {
      const leads = await getLeads(filters);
      if (!options?.includeQualified) {
        return leads.filter(lead => !lead.qualifiedAt);
      }
      return leads;
    }
  });
}
```

#### 2. Filtro no Hook `useSalesViewLeads`
```typescript
export function useSalesViewLeads(filters?: SalesViewFilters, options?: { enabled?: boolean; includeQualified?: boolean }) {
  return useQuery({
    queryKey: ['leads', 'sales-view', filters, options?.includeQualified],
    queryFn: async () => {
      const leads = await getSalesViewLeads(filters);
      if (!options?.includeQualified) {
        return leads.filter(lead => !lead.qualifiedAt);
      }
      return leads;
    },
    enabled: options?.enabled ?? true
  });
}
```

#### 3. Filtro no Hook `useLeadsSalesView`
```typescript
export function useLeadsSalesView(params: LeadSalesViewQuery, options?: { enabled?: boolean; includeQualified?: boolean }) {
  return useQuery({
    queryKey: ['leads-sales-view', params, options?.includeQualified],
    queryFn: async () => {
      const response = await fetchSalesView(params);
      if (!options?.includeQualified) {
        const filteredData = response.data.filter(lead => {
          const qualifiedAt = lead.qualifiedAt ?? lead.qualified_at;
          const deletedAt = lead.deletedAt ?? lead.deleted_at;
          return !qualifiedAt && !deletedAt;
        });
        return {
          ...response,
          data: filteredData
          // Note: We keep the original pagination.total from the server since this is a defensive
          // client-side filter. The server should already be excluding qualified/deleted leads.
        };
      }
      return response;
    },
    // ... outras opções
  });
}
```

#### 4. Interface Atualizada `LeadSalesViewItem`
```typescript
export interface LeadSalesViewItem {
  // ... outros campos
  qualifiedAt?: string | null
  qualified_at?: string | null
  deletedAt?: string | null
  deleted_at?: string | null
}
```

#### 5. Card de Lead Qualificado
Quando o usuário acessa um lead qualificado diretamente (via URL ou link antigo):
- Exibe ícone de sucesso (CheckCircle) em verde
- Título "Lead Qualificado"
- Mensagem explicando que o lead foi convertido em negócio
- Botões para navegar ao negócio e empresa associados
- Botão para voltar à lista de leads

---

## ✅ Checklist de Qualidade

| Item | Status |
|------|--------|
| Hook `useLeads` filtra leads qualificados (grid/kanban) | ✅ |
| Hook `useSalesViewLeads` filtra leads qualificados | ✅ |
| Hook `useLeadsSalesView` filtra leads qualificados e deleted | ✅ |
| Opção `includeQualified` para bypass em todos os hooks | ✅ |
| Interface `LeadSalesViewItem` inclui campos de qualificação | ✅ |
| LeadDetailPage mostra card informativo | ✅ |
| Link para negócio associado | ✅ |
| Link para empresa associada | ✅ |
| Mensagens em português | ✅ |
| Testes unitários para filtragem | ✅ (5 testes) |
| Build passando | ✅ |

---

## 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | ~120 |
| Linhas removidas | ~10 |
| Arquivos modificados | 4 |
| APIs alteradas | 0 (apenas cliente) |
| Testes adicionados | 5 |
| Contratos quebrados | 0 |

**Risco:** 🟢 Baixo (filtro adicional, não quebra funcionalidade existente)

---

## Decisões Técnicas

1. **Por que filtrar no frontend em vez do backend?**
   - Backend já filtra com `deleted_at IS NULL`, mas leads qualificados mantêm `deleted_at = null`
   - A qualificação é identificada pelo campo `qualifiedAt`
   - Filtro cliente-side serve como defesa adicional e garante consistência
   - Mantém regra de negócio: leads qualificados não devem ser visíveis na lista

2. **Por que adicionar opção `includeQualified`?**
   - Permite flexibilidade para relatórios que precisam incluir leads qualificados
   - Mantém compatibilidade com casos de uso futuros

3. **Por que suportar snake_case e camelCase?**
   - Backend pode retornar campos em ambos os formatos
   - Garante compatibilidade com diferentes versões da API

4. **Por que mostrar card informativo ao invés de 404?**
   - Melhor UX: usuário entende que o lead foi convertido
   - Facilita navegação para o negócio associado
   - Evita confusão com links antigos ou bookmarks

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
