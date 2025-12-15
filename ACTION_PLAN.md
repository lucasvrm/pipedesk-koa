# 📋 ACTION_PLAN.md - Ajustes em /leads

## 🚧 Status: ✅ CONCLUÍDO (Modal de Criação de Leads Aprimorado)

**Data:** 2025-12-15  
**Autor:** GitHub Copilot Agent  
**Escopo:** Frontend - CreateLeadModal.tsx, LeadsListPage.tsx

---

## 🎯 Objetivo Atual - Modal de Criação de Leads

Aprimorar o modal existente de criação de leads (botão "+ Novo Lead" na rota /leads) para consumir campos disponíveis no banco e adicionar validação rigorosa.

### ✅ Tarefas Concluídas
- [x] Criar novo componente `CreateLeadModal.tsx` com validação Zod
- [x] Implementar campo Razão Social (legalName) com foco automático
- [x] Implementar dropdown Origem do Lead (leadOriginId) consumindo `useSystemMetadata`
- [x] Implementar dropdown Tipo de Operação (operationType) consumindo dados do backend
- [x] Implementar seção Contato Principal com toggle Vincular/Criar Novo
- [x] Implementar campos Cidade/UF com dropdown de estados brasileiros
- [x] Implementar campo Descrição com contador de caracteres (max 500)
- [x] Implementar seleção múltipla de Tags com popover
- [x] Integrar modal no LeadsListPage.tsx substituindo Dialog antigo
- [x] Limpar imports não utilizados do LeadsListPage.tsx
- [x] Validar lint, typecheck e build

---

## 📝 Alterações Realizadas

### Arquivos Criados
- `src/features/leads/components/CreateLeadModal.tsx` - Novo modal completo com validação Zod

### Arquivos Modificados
- `src/features/leads/pages/LeadsListPage.tsx` - Integração do novo modal

### Detalhes da Implementação

#### 1. Schema de Validação Zod
```typescript
const createLeadSchema = z.object({
  legalName: z.string().min(3, 'Razão Social deve ter no mínimo 3 caracteres'),
  leadOriginId: z.string().min(1, 'Selecione a origem do lead'),
  operationType: z.string().min(1, 'Selecione o tipo de operação'),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  tags: z.array(z.string()).optional(),
  contactMode: z.enum(['link', 'create']),
  existingContactId: z.string().optional(),
  newContact: z.object({
    name: z.string().optional(),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
  }).optional(),
})
```

#### 2. Campos Implementados
| Campo | Tipo | Obrigatório | Fonte de Dados |
|-------|------|-------------|----------------|
| Razão Social | Input | ✅ | Usuário |
| Origem do Lead | Select | ✅ | `useSystemMetadata().leadOrigins` |
| Tipo de Operação | Select | ✅ | `useSystemMetadata().operationTypes` ou `OPERATION_LABELS` |
| Contato Principal | Tabs + Combobox/Form | ❌ | `useContacts()` |
| Cidade | Input | ❌ | Usuário |
| UF | Select | ❌ | Lista fixa `BRAZILIAN_STATES` |
| Descrição | Textarea | ❌ | Usuário (max 500 chars) |
| Tags | Multi-select Popover | ❌ | `useTags('lead')` |

#### 3. Funcionalidades de UX
- **Foco automático** no campo Razão Social ao abrir o modal
- **Contador de caracteres** em tempo real para descrição
- **Toggle Vincular/Criar** para contato principal
- **Combobox com busca** para seleção de contatos existentes
- **Badges visuais** para tags selecionadas com botão de remover
- **Estados de loading** nos botões durante submissão
- **Mensagens de erro** inline para validação de formulário

#### 4. Acessibilidade
- Labels associados corretamente via `htmlFor`
- `aria-expanded` e `aria-label` em comboboxes
- Navegação por teclado funcional
- Feedback visual de erros de validação

---

## ✅ Checklist de Qualidade

| Item | Status |
|------|--------|
| Componente CreateLeadModal criado | ✅ |
| Validação Zod implementada | ✅ |
| Campos obrigatórios marcados com * | ✅ |
| Consumo de APIs (origins, operationTypes, contacts, tags) | ✅ |
| Toggle Vincular/Criar contato | ✅ |
| Dropdown estados brasileiros | ✅ |
| Contador de caracteres descrição | ✅ |
| Seleção múltipla de tags | ✅ |
| Integração com LeadsListPage | ✅ |
| Lint passando | ✅ |
| Build passando | ✅ |

---

## 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | ~550 (CreateLeadModal.tsx) |
| Linhas removidas | ~30 (LeadsListPage.tsx - modal antigo) |
| Arquivos criados | 1 |
| Arquivos modificados | 1 |
| Componentes criados | 1 (CreateLeadModal) |
| APIs consumidas | 4 (leadOrigins, operationTypes, contacts, tags) |

**Risco:** 🟢 Baixo (componente novo, modal antigo completamente substituído)

---

## Decisões Técnicas

1. **Por que criar um componente separado?**
   - Separação de responsabilidades (SRP)
   - Facilita testes unitários
   - Reduz complexidade do LeadsListPage

2. **Por que usar Zod + React Hook Form?**
   - Padrão já estabelecido no projeto (CreateDealDialog)
   - Validação declarativa e type-safe
   - Integração nativa com shadcn/ui Form components

3. **Por que fallback para OPERATION_LABELS?**
   - Compatibilidade com banco sem operationTypes cadastrados
   - Garante que o dropdown sempre tenha opções

4. **Por que tags são opcionais no submit?**
   - Tags serão atribuídas após criação do lead via API de entity_tags
   - TODO comentado para futura implementação

---

## Histórico de Alterações Anteriores

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
