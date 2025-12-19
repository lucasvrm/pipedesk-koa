# 📋 ACTION_PLAN.md - Ajustes em /leads

## 🚧 Status: ✅ Concluído (Lead Detail - Contatos + Quick Actions)

**Data:** 2025-12-19  
**Autor:** GitHub Copilot Agent  
**Escopo:** Frontend - /leads/:id - Contatos melhorados + Quick Actions + remover Mapa de Relacionamentos

---

## 🆕 Iteração atual - Lead Detail Improvements

### 🎯 Objetivo
1. **EmptyState de contatos:** Adicionar botão "Vincular" no EmptyState quando não há contatos.
2. **Renomear seção:** Alterar "Comitê de Compra" para "Contatos do Lead".
3. **Contatos clicáveis:** Tornar BuyingCommitteeCard clicável, abrindo modal com informações do contato.
4. **Remover Mapa de Relacionamentos:** Remover seção e queries desnecessárias.
5. **Quick Actions:** Adicionar as mesmas ações rápidas existentes em /leads list.

### ✅ Tarefas Concluídas
- [x] **A) EmptyState com Novo + Vincular**
  - Adicionado `secondaryAction` ao EmptyState com label "Vincular".
  - `primaryAction` com label "Novo".
  - Ambos abrem os modals corretos.

- [x] **B) Renomear seção para "Contatos do Lead"**
  - Atualizado CardTitle de "Comitê de Compra" para "Contatos do Lead".
  - Atualizada descrição para "Adicione contatos para este lead."

- [x] **C) Contatos clicáveis com modal**
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
**Escopo:** Frontend - UI polish do Sidebar/Sheet de filtros

---

## 🆕 Iteração atual - UI Polish Sidebar/Sheet Filtros (Wrapper pai/filho, badges, etc)

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
