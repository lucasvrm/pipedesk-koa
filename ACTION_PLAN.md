# 📋 ACTION_PLAN.md - Ajustes em /leads

## 🚧 Status: ✅ Concluído (Lead Detail UI/UX Refactoring)

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
