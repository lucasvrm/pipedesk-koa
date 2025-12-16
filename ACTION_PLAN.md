# 📋 ACTION_PLAN.md - Ajustes em /leads

## 🚧 Status: ✅ CONCLUÍDO (Filtrar Leads Qualificados da Interface)

**Data:** 2025-12-16  
**Autor:** GitHub Copilot Agent  
**Escopo:** Frontend - leadService.ts, LeadDetailPage.tsx

---

## 🎯 Objetivo Atual - Filtrar Leads Qualificados

Ajustar o frontend para ocultar leads com status "qualified" das listagens, mantendo mensagens claras para ações que não são mais possíveis.

### ✅ Tarefas Concluídas
- [x] Atualizar hook `useLeads` para filtrar leads qualificados por padrão
- [x] Atualizar `LeadDetailPage` para exibir mensagem quando lead está qualificado
- [x] Adicionar navegação para negócio e empresa associados no card de lead qualificado
- [x] Manter compatibilidade com busca direta (backend já filtra via `deleted_at`)
- [x] Mensagens em português claras para o usuário
- [x] Build e typecheck passando

---

## 📝 Alterações Realizadas

### Arquivos Modificados
- `src/services/leadService.ts` - Hook `useLeads` agora filtra leads com `qualifiedAt` por padrão
- `src/features/leads/pages/LeadDetailPage.tsx` - Card informativo para leads qualificados

### Detalhes da Implementação

#### 1. Filtro no Hook `useLeads`
```typescript
export function useLeads(filters?: LeadFilters, options?: { includeQualified?: boolean }) {
  return useQuery({
    queryKey: ['leads', filters, options?.includeQualified],
    queryFn: async () => {
      const leads = await getLeads(filters);
      // Filtra leads qualificados por padrão (soft delete)
      if (!options?.includeQualified) {
        return leads.filter(lead => !lead.qualifiedAt);
      }
      return leads;
    }
  });
}
```

#### 2. Card de Lead Qualificado
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
| Hook `useLeads` filtra leads qualificados | ✅ |
| Opção `includeQualified` para bypass | ✅ |
| LeadDetailPage mostra card informativo | ✅ |
| Link para negócio associado | ✅ |
| Link para empresa associada | ✅ |
| Mensagens em português | ✅ |
| Typecheck passando | ✅ |
| Build passando | ✅ |

---

## 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | ~75 |
| Linhas removidas | ~3 |
| Arquivos modificados | 2 |
| APIs alteradas | 0 (apenas cliente) |
| Contratos quebrados | 0 |

**Risco:** 🟢 Baixo (filtro adicional, não quebra funcionalidade existente)

---

## Decisões Técnicas

1. **Por que filtrar no frontend em vez do backend?**
   - Backend já filtra com `deleted_at IS NULL`, mas leads qualificados mantêm `deleted_at = null`
   - A qualificação é identificada pelo campo `qualifiedAt`
   - Mantém consistência com a regra de negócio: leads qualificados não devem ser visíveis na lista

2. **Por que adicionar opção `includeQualified`?**
   - Permite flexibilidade para relatórios que precisam incluir leads qualificados
   - Mantém compatibilidade com casos de uso futuros

3. **Por que mostrar card informativo ao invés de 404?**
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
