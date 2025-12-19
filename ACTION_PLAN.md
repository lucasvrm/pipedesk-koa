# 📋 ACTION_PLAN.md - Ajustes em /leads

## 🚧 Status: ✅ Concluído (UI Polish - Sidebar/Sheet Filtros)

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
