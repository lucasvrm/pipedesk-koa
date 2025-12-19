# 📋 ACTION_PLAN.md - Ajustes em /leads

## 🚧 Status: ✅ Concluído (Lead Detail - Contatos UX Improvements)

**Data:** 2025-12-19  
**Autor:** GitHub Copilot Agent  
**Escopo:** Frontend - Melhorias UX em `/leads/:id` para seção de Contatos

---

## 🆕 Iteração atual - /leads/{id}: Contatos Clicáveis + EmptyState + Remoção do Mapa

### 🎯 Objetivo
1. **EmptyState com duas ações:** Quando não há contatos, exibir botões "Novo Contato" e "Vincular Existente".
2. **Renomear seção:** "Comitê de Compra" → "Contatos do Lead".
3. **Cards clicáveis:** Contatos clicáveis abrindo modal de preview com info + CTA para `/contacts/{id}`.
4. **Remover Mapa de Relacionamentos:** Seção removida completamente da página.

### ✅ Tarefas Concluídas
- [x] **A) EmptyState com ações secundárias**
  - Adicionado `secondaryAction` ao EmptyState quando `contacts.length === 0`.
  - Botões "Novo Contato" (primary) e "Vincular Existente" (secondary) lado a lado.

- [x] **B) Renomeação da seção de contatos**
  - Título alterado de "Comitê de Compra" para "Contatos do Lead".
  - Descrição alterada para "Pessoas associadas ao lead."

- [x] **C) Cards de contato clicáveis**
  - Adicionada prop `onClick` opcional ao `BuyingCommitteeCard`.
  - Implementado `role="button"`, `tabIndex={0}`, `cursor-pointer` quando clicável.
  - Suporte a teclado (Enter/Espaço) para acessibilidade.
  - Botões internos (Email/LinkedIn/Edit) com `e.stopPropagation()` para não disparar o modal.
  - Focus ring consistente com design system.

- [x] **D) Modal de preview de contato**
  - Dialog exibindo nome, cargo, email, telefone e LinkedIn.
  - Botão "Ver contato" que navega para `/contacts/{contactId}`.
  - Modal fecha via ESC ou clique fora.

- [x] **E) Remoção do Mapa de Relacionamentos**
  - Seção "Mapa de Relacionamentos" removida completamente.
  - Imports não utilizados removidos (`RelationshipMap`, `useCompany`, `useDeals`, `useTracks`).
  - useMemo `relationshipData` e handler `handleNodeClick` removidos.

- [x] **F) Fix no botão remover contato**
  - Wrapper do card agora tem `className="group"` para hover do botão X funcionar.
  - `e.stopPropagation()` adicionado ao onClick do botão remover.

- [x] **G) Testes adicionados**
  - `tests/unit/features/leads/LeadDetailPage.contacts.test.tsx` - 8 testes cobrindo:
    - Renomeação da seção
    - EmptyState com duas ações
    - Remoção do Mapa de Relacionamentos
  - `tests/unit/components/BuyingCommitteeCard.test.tsx` - 11 testes cobrindo:
    - Renderização correta
    - Props onClick (role, tabIndex, cursor)
    - Eventos de teclado (Enter, Space)
    - stopPropagation nos botões internos

### Arquivos Modificados
- `src/features/leads/pages/LeadDetailPage.tsx` - Todas as mudanças de UI
- `src/components/BuyingCommitteeCard.tsx` - Suporte a onClick

### Arquivos de Teste Criados
- `tests/unit/features/leads/LeadDetailPage.contacts.test.tsx`
- `tests/unit/components/BuyingCommitteeCard.test.tsx`

### ✅ Critérios de Aceite Atendidos
- ✅ No Lead Detail sem contatos: EmptyState mostra "Novo" + "Vincular", ambos funcionam.
- ✅ "Comitê de Compra" foi renomeado para "Contatos do Lead".
- ✅ Cards de "Contatos do Lead" são clicáveis com modal e CTA.
- ✅ Botões internos do card continuam operando sem abrir modal.
- ✅ "Mapa de relacionamentos" não aparece mais.
- ✅ Testes adicionados e passando (19 testes).

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | ~120 |
| Linhas removidas | ~85 |
| Arquivos modificados | 2 |
| Testes criados | 19 |
| Contratos quebrados | 0 |
| Libs novas adicionadas | 0 |
| Alertas de segurança | 0 |

**Risco:** 🟢 Baixo (mudança de UI/UX, sem alteração de lógica de negócio ou API)

---

## ✅ Iteração anterior - UI Polish Sidebar/Sheet Filtros (Wrapper pai/filho, badges, etc)

### 🎯 Objetivo
1. **Wrapper compartilhado de seção (pai/filho):** Implementar tipografia correta, badges de seleção, foco forte e "force mount" para estabilidade.
2. **Polimento do conteúdo:** Contagem de selecionados por seção, linhas de opção totalmente clicáveis, hover/focus consistentes.
3. **Tags:** Busca de Tags com ícone de busca + botão clear.
4. **Padding/spacing:** Alinhar padding entre sidebar desktop e sheet mobile.
5. **Testes:** Cobrir `aria-expanded` e badges.

### ✅ Tarefas Concluídas
- [x] **A) Refatoração do wrapper `LeadsFilterSection`**
  - Adicionado suporte a badge de contagem (`count > 0`).
  - Adicionada prop `variant` ('default' | 'sub') para tipografia hierárquica (Parent: semibold, Child: medium + padding).
  - Adicionado `focus-visible:ring-2` no trigger.
  - Implementado `forceMount` para estabilidade de layout.

- [x] **B) Atualização de `LeadsFiltersContent`**
  - Cálculo de contagens para todas as seções e subseções.
  - Atualização dos rows (checkbox/radio) para serem totalmente clicáveis (`w-full` label wrapper) com hover/focus consistente.
  - Melhoria no input de busca de Tags: ícone de busca à esquerda e botão de limpar (X) à direita.
  - Uso do novo wrapper `LeadsFilterSection` com contagens e variantes.

- [x] **C) Atualização de `LeadsFilterPanel` (Mobile Sheet)**
  - Ajuste de padding do container rolável para `px-4` (consistente com sidebar).

- [x] **D) Testes atualizados**
  - `LeadsFiltersSidebar.test.tsx` e `LeadsFilterPanel.test.tsx`:
    - Verificação de `aria-expanded` nos triggers.
    - Verificação de badges de contagem.
    - Verificação de `forceMount`.
    - Verificação da funcionalidade de limpar busca de tags.
  - Total: 50 testes passando.

### Arquivos Modificados
- `src/features/leads/components/LeadsFilterSection.tsx` - Wrapper aprimorado
- `src/features/leads/components/LeadsFiltersContent.tsx` - Conteúdo com contagens e UI aprimorada
- `src/features/leads/components/LeadsFilterPanel.tsx` - Ajuste de padding

### Arquivos de Teste Atualizados
- `tests/unit/features/leads/components/LeadsFiltersSidebar.test.tsx`
- `tests/unit/features/leads/components/LeadsFilterPanel.test.tsx`

### ✅ Checklist de QA manual

#### Desktop (/leads?view=sales)
- [ ] Seções "pai" (Filtros do sistema, Atividade) têm fonte mais forte.
- [ ] Seções "filha" têm indentação e fonte média.
- [ ] Selecionar filtros mostra badge de contagem no header da seção (pai e filha).
- [ ] Colapsar/expandir seções é suave e não causa pulo de layout (forceMount).
- [ ] Clicar em qualquer parte da linha de opção (checkbox + label) seleciona o filtro.
- [ ] Busca de tags tem ícone de lupa e botão X para limpar.

#### Mobile (/leads?view=sales)
- [ ] Sheet tem padding consistente com desktop.
- [ ] Mesmas funcionalidades de badge e colapsáveis.

### 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | ~120 |
| Linhas removidas | ~30 |
| Arquivos modificados | 3 |
| Testes atualizados | ~10 |
| Total testes relacionados | 50 (passando) |
| Contratos quebrados | 0 |
| Libs novas adicionadas | 0 |
| Alertas de segurança | 0 |

**Risco:** 🟢 Baixo (mudança de UI/UX, sem alteração de lógica de negócio ou API)

---

## ✅ Iteração anterior - Footer Condicional e Fixo no Rodapé (Prompt G)
...
