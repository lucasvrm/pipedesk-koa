# Checklist de QA Manual: Sales View de Leads

## Objetivo

Este documento descreve os passos para validação manual das funcionalidades de ordenação, renderização de próximas ações (nextAction.label) e comportamento de fallback na Sales View de Leads.

---

## Pré-requisitos

- Navegador moderno (Chrome, Firefox, Edge)
- Acesso à aplicação com usuário autenticado
- Dados de leads cadastrados no sistema

---

## Cenário 1: Testar Filtro de Ordenação por "Próxima Ação"

### Passos

1. **Acesse a Sales View**
   - Navegue para `/leads` ou clique em "Leads" no menu lateral
   - Alterne para a visualização Sales View (se não estiver ativa)

2. **Abra o painel de Filtros**
   - Clique no botão **"Filtros"** na barra de ferramentas superior
   - O painel de Filtros Inteligentes será exibido

3. **Selecione a ordenação "Próxima ação"**
   - Localize a seção **"Ordenação"** no painel de filtros
   - Clique no dropdown de ordenação
   - Selecione a opção **"Próxima ação"**

4. **Verifique a reordenação da lista**
   - A lista de leads deve ser recarregada automaticamente
   - Observe que a ordem dos leads foi alterada conforme o critério de próxima ação

### Resultado Esperado

- ✅ A lista de leads é reordenada após selecionar "Próxima ação"
- ✅ O dropdown exibe "Próxima ação" como opção selecionada
- ✅ A URL é atualizada com o parâmetro `order_by=next_action`

---

## Cenário 2: Verificar Request de Ordenação no Network

### Passos

1. **Abra o DevTools do navegador**
   - Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux) ou `Cmd+Option+I` (Mac)
   - Navegue até a aba **"Network"**

2. **Limpe os registros existentes**
   - Clique no ícone de 🚫 (Clear) para limpar a lista de requisições

3. **Selecione a ordenação "Próxima ação"**
   - No painel de Filtros, selecione **"Próxima ação"** no dropdown de Ordenação

4. **Identifique a requisição da API**
   - Na aba Network, localize a requisição para `/api/leads/sales-view`
   - Clique na requisição para ver os detalhes

5. **Verifique o parâmetro order_by**
   - Na aba **"Headers"** ou **"Payload"**, verifique os Query String Parameters
   - O parâmetro `order_by` deve ter o valor `next_action`

### Resultado Esperado

- ✅ A requisição inclui `order_by=next_action` nos query params
- ✅ Exemplo de URL: `/api/leads/sales-view?page=1&pageSize=10&order_by=next_action`

---

## Cenário 3: Renderização do nextAction.label (Ações 4–10)

### Passos

1. **Acesse a Sales View com leads que possuem nextAction**
   - Navegue para `/leads` na visualização Sales View

2. **Identifique a coluna "Próxima ação"**
   - A sexta coluna da tabela exibe "Próxima ação"

3. **Verifique a renderização do label**
   - Para leads com próxima ação definida, observe:
     - Um badge com fundo secundário
     - O texto "Próxima ação" em letras maiúsculas pequenas
     - O **label da ação** em destaque (vermelho/destructive)
     - Opcionalmente, o motivo (reason) abaixo do label

### Resultado Esperado

- ✅ O label da próxima ação é exibido em destaque (cor destructive/vermelho)
- ✅ O texto exibido corresponde ao `nextAction.label` retornado pelo backend
- ✅ Se houver `nextAction.reason`, ele aparece como texto secundário abaixo
- ✅ Hover no badge exibe tooltip com o motivo completo (se existir)

### Exemplos de Labels Esperados

| Código da Ação | Label Esperado |
|----------------|----------------|
| 1 | Primeiro contato |
| 2 | Follow-up |
| 3 | Qualificação |
| 4 | Apresentação |
| 5 | Proposta |
| 6 | Negociação |
| 7 | Fechamento |
| 8 | Onboarding |
| 9 | Pós-venda |
| 10 | Reativação |

---

## Cenário 4: Comportamento de Fallback quando nextAction está Ausente

### Passos

1. **Identifique leads sem próxima ação**
   - Na Sales View, procure por leads que não possuem `nextAction` definido no backend

2. **Verifique a renderização da célula**
   - Na coluna "Próxima ação", observe o conteúdo exibido

### Resultado Esperado

- ✅ Quando `nextAction` é `null` ou `undefined`, é exibido: **"Sem próxima ação"**
- ✅ O texto de fallback aparece em cor secundária (muted-foreground)
- ✅ Não há badge renderizado, apenas o texto simples
- ✅ Não ocorrem erros no console do navegador

---

## Cenário 5: Verificar Dados no Console (Debug)

### Passos

1. **Abra o DevTools**
   - Pressione `F12` ou `Ctrl+Shift+I`

2. **Navegue para a aba Console**

3. **Observe os logs durante o carregamento**
   - Verifique se não há erros relacionados a `nextAction`
   - Logs de erro são prefixados com `[SalesView]`

### Resultado Esperado

- ✅ Nenhum erro de renderização relacionado a `nextAction`
- ✅ Nenhum erro de tipo (TypeError) ao acessar propriedades de `nextAction`

---

## Resumo de Validação

| # | Cenário | Status |
|---|---------|--------|
| 1 | Filtro de ordenação funciona | ⬜ |
| 2 | Request com `order_by=next_action` | ⬜ |
| 3 | Labels de ações 4-10 renderizam corretamente | ⬜ |
| 4 | Fallback "Sem próxima ação" funciona | ⬜ |
| 5 | Sem erros no console | ⬜ |

---

## Referências

- **Componentes relacionados:**
  - `src/features/leads/pages/LeadSalesViewPage.tsx`
  - `src/features/leads/components/LeadsSmartFilters.tsx`
  - `src/features/leads/components/LeadSalesRow.tsx`
  - `src/services/leadsSalesViewService.ts`

- **Endpoint da API:**
  - `GET /api/leads/sales-view`
  - Parâmetros: `page`, `pageSize`, `order_by`, `priority`, `status`, etc.

---

**Autor:** GitHub Copilot  
**Data:** 14/12/2024  
**Versão:** 1.0.0
