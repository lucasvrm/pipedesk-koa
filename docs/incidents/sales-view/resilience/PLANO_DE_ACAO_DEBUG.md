# PLANO DE AÇÃO DETALHADO - DEBUG DO ERRO 185 EM /LEADS

## RESUMO EXECUTIVO

Após análise estática do repositório, identificamos que o erro React #185 (tentativa de renderizar um objeto como child do React) está ocorrendo na rota `/leads` em produção, especificamente quando a página está no modo "sales view". O erro acontece durante a renderização de componentes de tabela que usam `.map()` para iterar sobre dados da API `/api/leads/sales-view`.

**Principais suspeitos identificados:**
1. Campos de dados da API retornando objetos/arrays onde o React espera strings/primitivos
2. Possível problema com tags, nextAction, ou outros campos complexos sendo renderizados diretamente
3. O ambiente local quebrado sugere erro na inicialização (providers, env vars, ou routing)

---

## 1. RESUMO DA ANÁLISE ESTÁTICA DO CÓDIGO

### 1.1 Componentes Envolvidos na Rota /leads

**Hierarquia de componentes identificada:**

```
main.tsx
└── GlobalErrorBoundary
    └── QueryClientProvider
        └── BrowserRouter
            └── AuthProvider
                └── ImpersonationProvider
                    └── SystemMetadataProvider
                        └── App.tsx
                            └── Routes
                                └── /leads → LeadsListPage.tsx
                                    ├── SharedListLayout
                                    ├── SharedListToolbar
                                    └── LeadsSalesList.tsx (quando viewMode === 'sales')
                                        └── LeadSalesRow.tsx (para cada lead)
```

**Arquivos críticos para análise:**
- `/src/features/leads/pages/LeadsListPage.tsx` - Componente principal da página
- `/src/features/leads/components/LeadsSalesList.tsx` - Lista de leads em modo sales
- `/src/features/leads/components/LeadSalesRow.tsx` - Row individual da tabela
- `/src/services/leadsSalesViewService.ts` - Serviço que faz fetch da API
- `/src/components/layouts/SharedListToolbar.tsx` - Toolbar com filtros
- `/backend/sales_view.py` - Backend Python que fornece os dados

### 1.2 Uso de Array.map() Identificado

**No LeadsListPage.tsx:**
- Linha 100: `leadStatuses.filter(...).map(status => status.code)`
- Linha 105: `leadOrigins.filter(...).map(origin => origin.code)`
- Linha 117: `.map(tag => tag.id)`
- Linha 342: `currentLeads.map(lead => getLeadId(lead))`
- Linha 593: `leadStatuses.filter(...).map((status) => <SelectItem>)`
- Linha 605: `leadOrigins.filter(...).map((origin) => <SelectItem>)`
- Linha 622: `tags.map(tag => <Badge>)`
- Linha 768: `paginatedLeads.map(lead => <Card>)` - **GRID VIEW**

**No LeadsSalesList.tsx:**
- Linha 52: `validLeads.map((lead) => lead.leadId ?? lead.lead_id ?? lead.id)`
- Linha 104: `.map((tag) => { ... })` - Transforma tags
- Linha 191: `Array.from({ length: 5 }).map((_, index) => <LeadSalesRowSkeleton>)` - Skeleton loader
- Linha 228: `validLeads.map((lead) => { try { return renderLeadRowSafely(lead) } ... })` - **RENDERIZAÇÃO PRINCIPAL**

**No LeadSalesRow.tsx:**
- Linha 200: `safeTags.slice(0, 3).map((tag) => <Badge>)` - **RENDERIZAÇÃO DE TAGS**

### 1.3 Pontos Onde Objetos Podem Ser Renderizados Como Children

**Suspeitas primárias (campos que podem conter objetos):**

1. **Tags (LeadSalesRow.tsx, linha 200-208):**
   ```tsx
   {safeTags.slice(0, 3).map((tag) => (
     <Badge key={tag.id ?? tag.name} ...>
       {displayText(tag.name, '—')}  // Se tag.name for objeto → ERRO 185
     </Badge>
   ))}
   ```

2. **NextAction (LeadSalesRow.tsx, linha 177):**
   ```tsx
   <span className="text-sm font-semibold text-foreground">{safeNextActionLabel}</span>
   // Se safeNextActionLabel não for string → ERRO 185
   ```

3. **Priority Description (LeadSalesRow.tsx, linha 117):**
   ```tsx
   {safePriorityDescription && (
     <div className="text-primary-foreground/80 text-xs leading-relaxed">
       {safePriorityDescription}  // Se for objeto → ERRO 185
     </div>
   )}
   ```

4. **Primary Contact (LeadSalesRow.tsx, linha 144-145):**
   ```tsx
   <div className="font-medium text-sm leading-tight">{safePrimaryContactName}</div>
   {safePrimaryContactRole && <div className="text-xs text-muted-foreground">{safePrimaryContactRole}</div>}
   ```

5. **Owner (LeadSalesRow.tsx, linha 227):**
   ```tsx
   <div className="text-sm font-medium leading-tight">{safeOwnerName}</div>
   ```

**Todos esses campos passam por funções de sanitização (`displayText`, `displayOptionalText`), mas:**
- Se o backend retornar objetos aninhados inesperados, a sanitização pode falhar
- Se houver nulls/undefined mal tratados, podem passar como objetos
- Arrays vazios ou objetos vazios podem passar pela validação

### 1.4 Estrutura de Dados Esperada vs. Real

**Tipo esperado (LeadSalesViewItem - leadsSalesViewService.ts):**
```typescript
export interface LeadSalesViewItem {
  id?: string
  leadId?: string
  lead_id?: string
  priorityScore?: number | null
  priorityDescription?: string | null  // ← Deveria ser string
  legalName?: string
  tradeName?: string | null
  primaryContact?: {
    name: string  // ← Deveria ser string
    role?: string | null
    avatar?: string | null
  }
  nextAction?: {
    code: string
    label: string  // ← Deveria ser string
    reason?: string | null
  }
  owner?: {
    name: string  // ← Deveria ser string
    avatar?: string | null
  }
  tags?: Array<{
    id?: string
    name: string  // ← Deveria ser string
    color?: string | null
  }>
}
```

**Possíveis inconsistências a verificar:**
- `tag.name` sendo retornado como `{ en: "Tag Name", pt: "Nome da Tag" }` (objeto i18n)
- `primaryContact.name` ou `owner.name` sendo `{ first: "John", last: "Doe" }`
- `nextAction.label` sendo um objeto em vez de string
- `priorityDescription` sendo um array ou objeto
- Tags sendo retornadas como `tags: [null, undefined, { ... }]` com valores inválidos

---

## 2. PLANO DE AÇÃO FASEADO PARA INVESTIGAÇÃO

### FASE 1 – COLETA DE EVIDÊNCIAS EM PRODUÇÃO

**Objetivo:** Capturar o máximo de informações sobre o erro 185 em produção sem modificar código.

#### Passo 1.1: Preparar o Navegador
1. Abra o Chrome/Edge em modo anônimo
2. Abra o DevTools (F12)
3. Vá para a aba **Console**
4. Marque a opção "Preserve log" (para não perder logs ao navegar)
5. Vá para a aba **Network**
6. Marque a opção "Preserve log" também
7. Desmarque "Disable cache"

#### Passo 1.2: Reproduzir o Erro
1. Acesse https://pipedesk.vercel.app/login
2. Faça login com suas credenciais
3. Após login bem-sucedido, navegue diretamente para: https://pipedesk.vercel.app/leads
4. Aguarde a página carregar completamente
5. **AGUARDE** o erro 185 aparecer no console

#### Passo 1.3: Capturar o Console Completo
1. No console, clique com botão direito e selecione "Save as..."
2. Salve como `console-leads-error-185-[data].txt`
3. **IMPORTANTE:** Procure pela linha que mostra o erro minificado completo:
   ```
   Error: Minified React error #185; visit https://react.dev/errors/185 ...
   ```
4. Expanda o stack trace (clique na seta) e copie TODO o conteúdo
5. Procure por logs relacionados:
   - `[Supabase] Client Init OK`
   - `[ProtectedRoute] Check: { path: '/leads', ... }`
   - Qualquer log de erro ou warning entre o login e o crash

#### Passo 1.4: Capturar HAR da Requisição da API
1. Na aba **Network**, procure pela requisição `/api/leads/sales-view?...`
2. Clique nela com botão direito → "Copy" → "Copy as HAR"
3. Cole em um arquivo `api-leads-sales-view-[data].har`
4. **OU** clique na requisição e vá para "Response" tab, copie o JSON completo
5. Salve como `api-leads-sales-view-response-[data].json`

#### Passo 1.5: Mapear o Stack Trace (se sourcemaps funcionarem)
1. No console, clique no link do erro (por exemplo: `LeadsListPage-xyz.js:123`)
2. Isso deve abrir a aba **Sources** com o arquivo mapeado para `.tsx`
3. **Se abrir o .tsx original:**
   - Anote o nome do arquivo (ex: `LeadsListPage.tsx`)
   - Anote o número da linha exata
   - Copie as ~10 linhas ao redor do erro
4. **Se NÃO abrir o .tsx (sourcemap não funcionou):**
   - Anote o nome do chunk minificado (ex: `LeadsListPage-abc123.js`)
   - Anote a linha/coluna do erro
   - Copie o código minificado dessa região

#### Passo 1.6: Testar Diferentes Filtros/Parâmetros
1. Se o erro 185 aparecer imediatamente, tente variar os parâmetros da URL:
   - `/leads?order_by=last_interaction`
   - `/leads?order_by=created_at`
   - `/leads?priority=hot`
   - `/leads?owner=me`
2. Para cada variação, anote se o erro:
   - Continua acontecendo (mesma stack?)
   - Desaparece
   - Muda de comportamento
3. Tente alternar entre os modos de visualização (se possível antes do crash):
   - Botão "Grid" (ícone SquaresFour)
   - Botão "Kanban" (ícone Kanban)
   - Observe se o erro só ocorre no modo "Sales" (Target)

#### Passo 1.7: Screenshot do Estado de Erro
1. Assim que o erro 185 aparecer e a página quebrar
2. Tire um screenshot da tela inteira
3. Tire outro screenshot do DevTools mostrando o console com o erro expandido
4. Salve como `erro-185-screenshot-[data].png`

**Deliverables da Fase 1:**
- [ ] Arquivo de console completo (.txt)
- [ ] HAR ou JSON da resposta de `/api/leads/sales-view`
- [ ] Stack trace expandido (minificado ou mapeado)
- [ ] Notas sobre comportamento com diferentes parâmetros
- [ ] Screenshots do erro

---

### FASE 2 – ANÁLISE DO PAYLOAD DA API

**Objetivo:** Validar se os dados retornados pela API `/api/leads/sales-view` estão no formato correto.

#### Passo 2.1: Inspecionar a Resposta JSON Completa
1. Abra o arquivo `api-leads-sales-view-response-[data].json` (da Fase 1)
2. Use um validador JSON online (https://jsonlint.com) para formatar
3. **OU** use um editor (VSCode) e formate com `Format Document`

#### Passo 2.2: Verificar Estrutura de Alto Nível
1. Confirme que existe `data` ou `items`:
   ```json
   {
     "data": [ ... ],
     "pagination": { ... }
   }
   ```
2. Se a resposta for diferente, anote a estrutura real
3. Conte quantos leads foram retornados: `data.length` ou `items.length`

#### Passo 2.3: Analisar o Primeiro Lead em Detalhe
1. Pegue o primeiro item do array `data[0]`
2. Verifique CADA campo esperado e anote o tipo real:

   | Campo Esperado | Tipo Esperado | Tipo Real | Exemplo do Valor |
   |----------------|---------------|-----------|------------------|
   | `id` ou `leadId` ou `lead_id` | string | ? | ? |
   | `legalName` ou `legal_name` | string | ? | ? |
   | `tradeName` ou `trade_name` | string \| null | ? | ? |
   | `priorityBucket` ou `priority_bucket` | "hot"\|"warm"\|"cold" | ? | ? |
   | `priorityScore` ou `priority_score` | number \| null | ? | ? |
   | `priorityDescription` ou `priority_description` | string \| null | ? | ? |
   | `primaryContact` ou `primary_contact` | object \| undefined | ? | ? |
   | `primaryContact.name` | string | ? | ? |
   | `primaryContact.role` | string \| null | ? | ? |
   | `primaryContact.avatar` | string \| null | ? | ? |
   | `lastInteractionAt` ou `last_interaction_at` | string (ISO) \| null | ? | ? |
   | `lastInteractionType` ou `last_interaction_type` | "email"\|"event"\|null | ? | ? |
   | `nextAction` ou `next_action` | object \| undefined | ? | ? |
   | `nextAction.code` | string | ? | ? |
   | `nextAction.label` | string | ? | ? |
   | `nextAction.reason` | string \| null | ? | ? |
   | `owner` | object \| undefined | ? | ? |
   | `owner.name` | string | ? | ? |
   | `owner.avatar` | string \| null | ? | ? |
   | `tags` | Array \| undefined | ? | ? |
   | `tags[0].id` | string | ? | ? |
   | `tags[0].name` | string | ? | ? |
   | `tags[0].color` | string \| null | ? | ? |

#### Passo 2.4: Procurar Inconsistências Específicas

**Verificações prioritárias:**

1. **Tags com `name` não-string:**
   ```json
   // ERRADO:
   "tags": [
     { "id": "1", "name": { "en": "Hot Lead" }, "color": "#ff0000" }
   ]
   // CERTO:
   "tags": [
     { "id": "1", "name": "Hot Lead", "color": "#ff0000" }
   ]
   ```

2. **NextAction com `label` não-string:**
   ```json
   // ERRADO:
   "nextAction": {
     "code": "call_first_time",
     "label": ["Ligar", "pela", "primeira", "vez"]
   }
   // CERTO:
   "nextAction": {
     "code": "call_first_time",
     "label": "Ligar pela primeira vez"
   }
   ```

3. **PrimaryContact com `name` não-string:**
   ```json
   // ERRADO:
   "primaryContact": {
     "name": { "first": "João", "last": "Silva" }
   }
   // CERTO:
   "primaryContact": {
     "name": "João Silva"
   }
   ```

4. **Owner com `name` não-string:**
   ```json
   // ERRADO:
   "owner": {
     "name": { "display": "Maria Souza", "username": "maria" }
   }
   // CERTO:
   "owner": {
     "name": "Maria Souza"
   }
   ```

5. **PriorityDescription como array ou objeto:**
   ```json
   // ERRADO:
   "priorityDescription": ["Lead com", "alta prioridade"]
   // OU
   "priorityDescription": { "text": "Lead com alta prioridade" }
   // CERTO:
   "priorityDescription": "Lead com alta prioridade"
   ```

6. **Tags com valores null/undefined no array:**
   ```json
   // ERRADO:
   "tags": [
     { "id": "1", "name": "Tag1" },
     null,
     undefined,
     { "id": "2", "name": "Tag2" }
   ]
   // CERTO:
   "tags": [
     { "id": "1", "name": "Tag1" },
     { "id": "2", "name": "Tag2" }
   ]
   ```

#### Passo 2.5: Verificar TODOS os Leads Retornados
1. Use um script de análise ou faça manualmente:
2. Para cada lead em `data`, verifique se algum tem:
   - `tags` com `name` não-string
   - `nextAction.label` não-string
   - `primaryContact.name` não-string
   - `owner.name` não-string
   - `priorityDescription` não-string (se não null)
3. Anote o índice do(s) lead(s) problemático(s)

#### Passo 2.6: Comparar com a Interface TypeScript
1. Abra `/src/services/leadsSalesViewService.ts`
2. Compare a interface `LeadSalesViewItem` com os dados reais
3. Anote qualquer desvio:
   - Campos faltando
   - Campos extras não tipados
   - Tipos incompatíveis

**Deliverables da Fase 2:**
- [ ] Tabela preenchida com tipos reais vs. esperados
- [ ] Lista de inconsistências encontradas (com índices dos leads)
- [ ] Conclusão: os dados estão 100% corretos? Se não, o que está errado?

---

### FASE 3 – VERIFICAÇÃO DO AMBIENTE LOCAL

**Objetivo:** Entender por que o app fica com tela branca em localhost e corrigir para poder testar localmente.

#### Passo 3.1: Instalação Limpa
1. No terminal, na raiz do projeto:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Aguarde a instalação completa
3. Verifique se não há erros de instalação

#### Passo 3.2: Verificar Variáveis de Ambiente
1. Verifique se existe arquivo `.env` ou `.env.local` na raiz:
   ```bash
   ls -la | grep .env
   ```
2. Se NÃO existir, copie do exemplo:
   ```bash
   cp .env.example .env.local
   ```
3. Abra `.env.local` e preencha as variáveis:
   ```
   VITE_SUPABASE_URL="https://gaogmmgozmjcwwckudcg.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   VITE_DRIVE_API_URL="https://seu-backend.onrender.com"
   ```
4. **IMPORTANTE:** Confirme que as variáveis estão exatamente como em produção

#### Passo 3.3: Tentar Build de Produção Localmente
1. Execute:
   ```bash
   npm run build
   ```
2. Observe a saída:
   - Se houver **erros de TypeScript**, anote-os
   - Se houver **warnings de bundle size**, ignore
   - Se o build **completar com sucesso**, continue
3. Se o build FALHAR:
   - Copie todo o output do erro
   - Identifique o arquivo/linha do erro
   - Anote para investigação futura

#### Passo 3.4: Iniciar Dev Server
1. Execute:
   ```bash
   npm run dev
   ```
2. Aguarde o servidor iniciar
3. Deve mostrar algo como:
   ```
   VITE v7.x.x ready in XXX ms
   ➜ Local:   http://localhost:12000/
   ➜ Network: http://0.0.0.0:12000/
   ```
4. **Se o servidor NÃO iniciar:**
   - Copie todo o erro do terminal
   - Verifique se a porta 12000 está ocupada
   - Tente mudar a porta em `vite.config.ts`

#### Passo 3.5: Acessar Localhost no Navegador
1. Abra o navegador em modo anônimo
2. Abra DevTools (F12)
3. Vá para Console e Network (preserve log em ambos)
4. Acesse: http://localhost:12000
5. Observe o que acontece:

   **Caso A: Tela branca sem nenhum log**
   - Verifique a aba Sources no DevTools
   - Veja se os arquivos .tsx estão carregando
   - Verifique se há erro de CORS ou 404
   - Anote qualquer erro na aba Network

   **Caso B: Tela branca com erro no console**
   - Copie o erro completo
   - Expanda o stack trace
   - Anote qual arquivo/componente está quebrando

   **Caso C: Página de login aparece**
   - SUCESSO! O app carregou
   - Faça login
   - Navegue para /leads
   - Observe se o erro 185 também acontece localmente

#### Passo 3.6: Inspecionar Logs do Terminal (Dev Server)
1. Enquanto o `npm run dev` está rodando
2. Observe o terminal para:
   - Erros de compilação
   - Avisos de importação circular
   - Erros de HMR (Hot Module Replacement)
3. Se houver erros, copie-os

#### Passo 3.7: Verificar Configurações de Build
1. Abra `vite.config.ts`
2. Confirme que `sourcemap: true` está presente (linha 27)
3. Abra `tsconfig.json`
4. Verifique se não há erros de configuração

#### Passo 3.8: Diagnosticar Providers/Context
Se a tela continuar branca, o problema pode estar nos Providers:

1. Abra `/src/main.tsx`
2. Observe a hierarquia:
   ```tsx
   <GlobalErrorBoundary>
     <QueryClientProvider>
       <BrowserRouter>
         <AuthProvider>
           <ImpersonationProvider>
             <SystemMetadataProvider>
               <App />
   ```
3. **Teste isolado:** Comente temporariamente os providers internos:
   ```tsx
   // Teste 1: Comentar SystemMetadataProvider
   // Teste 2: Comentar ImpersonationProvider
   // Teste 3: Comentar AuthProvider
   ```
4. Para cada teste, veja se o app pelo menos carrega (mesmo que quebrado)
5. Isso ajuda a identificar QUAL provider está causando o problema

**Deliverables da Fase 3:**
- [ ] Resultado da instalação limpa
- [ ] Conteúdo do .env.local (sem keys sensíveis)
- [ ] Output do `npm run build`
- [ ] Logs do console ao acessar localhost
- [ ] Logs do terminal do dev server
- [ ] Identificação de qual provider está quebrando (se aplicável)

---

### FASE 4 – HIPÓTESES E PRÓXIMOS PASSOS

**Objetivo:** Consolidar as evidências e formular hipóteses testáveis para a causa raiz do erro 185.

#### Hipótese 1: Tags com `name` não-string

**Evidências a favor:**
- LeadSalesRow.tsx linha 200-208 renderiza `{displayText(tag.name, '—')}`
- Se `tag.name` for um objeto (ex: `{ en: "Tag" }`), `displayText()` pode retornar o objeto
- Função `displayText` checa `typeof value === 'string'`, mas se passar objeto, retorna fallback ou undefined

**Evidências contra:**
- LeadsSalesList.tsx linha 104-110 já normaliza tags antes de passar para LeadSalesRow
- A normalização faz `normalizeString(tag.name, 'Tag')`

**Experimento para confirmar:**
1. Na Fase 2, verificar se algum `tag.name` NÃO é string
2. Se encontrar, essa é a causa raiz
3. Se não encontrar, descartar hipótese

**Tipo de correção necessária (se confirmado):**
- Adicionar validação extra no backend ou frontend para garantir `tag.name` sempre string
- Melhorar `displayText()` para serializar objetos: `JSON.stringify()` ou `String(value)`

---

#### Hipótese 2: NextAction.label retornando objeto/array

**Evidências a favor:**
- LeadSalesRow.tsx linha 177 renderiza `{safeNextActionLabel}`
- `safeNextActionLabel` vem de `displayText(safeNextAction.label)`
- Backend Python (`sales_view.py`) retorna `nextAction.label` de um dicionário `ACTION_LABELS`
- Se o backend tiver um bug e retornar objeto, React crasharia

**Evidências contra:**
- `sales_view.py` linha 42-48 define `ACTION_LABELS` como `dict[str, str]`, sempre strings
- Código parece correto no backend

**Experimento para confirmar:**
1. Na Fase 2, verificar se `nextAction.label` é sempre string
2. Testar com diferentes `order_by` e filtros para ver se algum lead tem `nextAction.label` como objeto

**Tipo de correção necessária (se confirmado):**
- Fix no backend Python para garantir strings
- OU sanitização extra no frontend

---

#### Hipótese 3: PriorityDescription como array ou objeto aninhado

**Evidências a favor:**
- LeadSalesRow.tsx linha 117 renderiza `{safePriorityDescription}`
- Se o backend retornar array ou objeto, pode passar pela validação inicial

**Evidências contra:**
- Não há evidência clara de onde `priorityDescription` seria objeto
- Backend não calcula `priorityDescription` explicitamente em `sales_view.py`

**Experimento para confirmar:**
1. Verificar se algum lead tem `priorityDescription` não-string
2. Verificar se o campo sequer existe na resposta (pode ser calculado em outro lugar)

---

#### Hipótese 4: Primary Contact ou Owner com `name` não-string

**Evidências a favor:**
- Se Supabase retornar `primaryContact.name` como objeto `{ first, last }`
- Se joins no SQL retornarem estrutura aninhada

**Evidências contra:**
- LeadSalesRow.tsx linha 73-78 normaliza `primaryContact.name` antes de usar
- Código já tem proteções

**Experimento para confirmar:**
1. Verificar estrutura de `primaryContact` e `owner` na resposta da API

---

#### Hipótese 5: Problema em outro componente da árvore (não LeadSalesRow)

**Evidências a favor:**
- O stack trace em produção menciona "vendor-ui-*.js" e componentes intermediários
- Pode ser um problema em SharedListToolbar, Button, ou outro componente UI
- Talvez algum prop sendo passado como objeto em vez de string

**Evidências contra:**
- LeadsSalesList já tem try/catch ao redor de `renderLeadRowSafely` (linha 228-239)
- Se erro fosse no row, seria capturado e loggado

**Experimento para confirmar:**
1. Se o erro 185 acontecer ANTES de renderizar os rows, pode ser no toolbar/filtros
2. Verificar se o erro acontece em diferentes modos de view (grid vs kanban vs sales)
3. Se só acontecer no modo "sales", reforça que é problema nos dados da API

---

#### Hipótese 6: Ambiente local quebrado por falta de env vars ou erro em provider

**Evidências a favor:**
- Tela branca em localhost sugere erro na inicialização
- Providers (AuthProvider, SystemMetadataProvider) fazem chamadas de API
- Se Supabase não estiver configurado, pode travar o app

**Evidências contra:**
- Produção funciona (exceto /leads), então providers funcionam

**Experimento para confirmar:**
1. Fase 3 deve revelar se é problema de env vars ou provider
2. Se console mostrar erro de Supabase init, é problema de configuração
3. Se mostrar erro em um provider específico, isolar qual

---

### Estratégia de Resolução Recomendada

**Ordem de investigação:**
1. **PRIMEIRO:** Executar Fase 1 e Fase 2 em produção para identificar dados inválidos
2. **SEGUNDO:** Executar Fase 3 para corrigir ambiente local e testar reprodução
3. **TERCEIRO:** Baseado nos achados das Fases 1-2, formular patch de correção

**Se encontrar dados inválidos na API:**
- Corrigir no backend Python (`sales_view.py`) ou no Supabase
- Adicionar validação extra no frontend como fallback

**Se NÃO encontrar dados inválidos:**
- Problema pode estar em edge case específico (ex: lead sem tags, sem nextAction, etc.)
- Revisar lógica de `displayText()` e `displayOptionalText()` para garantir que sempre retornam string ou undefined

---

## 3. CHECKLIST FINAL PARA APROVAÇÃO

Antes de sugerir qualquer patch de código, complete:

- [ ] **Fase 1 completa:** Logs, HAR, stack trace e screenshots capturados em produção
- [ ] **Fase 2 completa:** Análise completa do payload da API `/api/leads/sales-view` com identificação de inconsistências
- [ ] **Fase 3 completa:** Ambiente local funcionando OU diagnóstico claro do que está travando
- [ ] **Hipótese principal identificada:** Baseado nas evidências, qual a causa mais provável?
- [ ] **Dados de confirmação coletados:** Evidências que confirmam/refutam a hipótese principal
- [ ] **Teste de reprodução local:** Consegue reproduzir o erro 185 em localhost? (Se sim, facilita debug)

**Após completar este checklist, me envie:**
1. Resumo executivo dos achados de cada fase
2. A hipótese principal (qual campo/componente está causando o erro 185)
3. Exemplo concreto de dado problemático (se houver)
4. Confirmação se o ambiente local está funcionando

**Só então vou sugerir um patch de código preciso e cirúrgico.**

---

## 4. NOTAS TÉCNICAS ADICIONAIS

### React Error #185 - Explicação Detalhada

O erro `Minified React error #185` ocorre quando tentamos renderizar um **objeto** diretamente como filho (child) de um elemento JSX. React espera:
- Strings
- Numbers
- Booleans (renderizam como vazio)
- null/undefined (renderizam como vazio)
- Outros componentes React

**Exemplo que causa erro 185:**
```tsx
// ERRADO:
const data = { name: "John", age: 30 }
return <div>{data}</div>  // ❌ Error #185

// CERTO:
return <div>{data.name}</div>  // ✅ Renderiza "John"
// OU
return <div>{JSON.stringify(data)}</div>  // ✅ Renderiza '{"name":"John","age":30}'
```

### Sourcemaps e Debugging

O `vite.config.ts` já tem `sourcemap: true` (linha 27), o que significa:
- Os arquivos `.js` minificados incluem referências aos `.tsx` originais
- No Chrome DevTools, ao clicar no stack trace, deve abrir o arquivo original
- Se não abrir, pode ser problema de:
  - URL dos sourcemaps incorreta em produção (Vercel)
  - Sourcemaps não sendo uploadados para Vercel
  - DevTools não conseguindo baixar os .map

**Para verificar se sourcemaps estão disponíveis:**
1. Na aba Network, após o erro, procure arquivos `.js.map`
2. Se encontrar, clique neles e veja se retornam 200 (OK)
3. Se retornarem 404, sourcemaps não estão sendo servidos

### Estrutura de Sanitização Atual

Os componentes já têm sanitização defensiva:

**LeadSalesRow.tsx (linha 62-68):**
```tsx
const displayText = (value: unknown, fallback = '—') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

const displayOptionalText = (value: unknown) => {
  const valueAsText = displayText(value, '')
  return valueAsText || undefined
}
```

**Problema potencial:**
- Se `value` for um objeto, `typeof value === 'string'` retorna `false`
- Função retorna `fallback` (que é '—' por padrão)
- Isso DEVERIA prevenir objetos de serem renderizados
- **MAS:** Se o fallback em si for passado como objeto (improvável), crasharia
- **OU:** Se a função for chamada sem fallback e retornar `undefined`, e o código depois fizer `{undefined.something}`, crasharia

**LeadsSalesList.tsx também normaliza (linha 62-127):**
- `toRowData()` sanitiza todos os campos antes de passar para LeadSalesRow
- Usa `normalizeString()` que é similar a `displayText()`

### Ponto de Falha Mais Provável

Dado que há **duas camadas de sanitização** (LeadsSalesList + LeadSalesRow), o erro 185 só aconteceria se:
1. Um objeto passar por ambas as camadas (bug na sanitização)
2. OU o erro estiver em componente ACIMA da tabela (toolbar, filtros, etc.)
3. OU o erro estiver em um componente renderizado DENTRO de um .map() mas fora de LeadSalesRow (ex: no .map() de tags/filtros em LeadsListPage)

**Candidato mais suspeito:**
- LeadsListPage.tsx linha 622-637: Renderização de tags no popover de filtros
- Se alguma tag tiver `tag.name` como objeto, o Badge tentará renderizar objeto
- Este código NÃO passa por sanitização

```tsx
{tags.map(tag => (
  <Badge
    key={tag.id}
    variant={tagFilter.includes(tag.id) ? 'default' : 'outline'}
    onClick={...}
    style={...}
  >
    {tag.name}  // ← SE tag.name for objeto, CRASH!
  </Badge>
))}
```

**Segunda suspeita:**
- Mesma área, linha 593-595 e 605-607: SelectItems para status e origem
- Se `status.label` ou `origin.label` forem objetos, CRASH

---

## 5. ANEXOS E REFERÊNCIAS

### Arquivos Críticos para Revisão

1. `/src/features/leads/pages/LeadsListPage.tsx` - 916 linhas
2. `/src/features/leads/components/LeadsSalesList.tsx` - 254 linhas
3. `/src/features/leads/components/LeadSalesRow.tsx` - 265 linhas
4. `/src/services/leadsSalesViewService.ts` - 110 linhas
5. `/src/components/layouts/SharedListToolbar.tsx` - 28 linhas
6. `/backend/sales_view.py` - 189 linhas
7. `/src/main.tsx` - 63 linhas (providers)
8. `/src/App.tsx` - 150 linhas (routing)

### Comandos Úteis

```bash
# Limpar e reinstalar dependências
rm -rf node_modules package-lock.json && npm install

# Build de produção local
npm run build

# Dev server
npm run dev

# Typecheck sem build
npm run typecheck

# Linting
npm run lint

# Ver logs do Vercel (se tiver CLI instalado)
vercel logs <deployment-url>

# Testar a API manualmente (substitua <token> pelo seu JWT)
curl "https://pipedesk.vercel.app/api/leads/sales-view?order_by=priority&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

### Links de Referência

- [React Error #185 Docs](https://react.dev/errors/185)
- [Vite Sourcemap Config](https://vitejs.dev/config/build-options.html#build-sourcemap)
- [Vercel Build Logs](https://vercel.com/docs/deployments/logs)
- [Chrome DevTools Network HAR](https://developer.chrome.com/docs/devtools/network/reference/#export-har)

---

## AGUARDO SUA APROVAÇÃO ANTES DE SUGERIR QUALQUER PATCH DE CÓDIGO

Por favor, execute as Fases 1, 2 e 3 e me retorne com os deliverables. Baseado nos achados, vou propor a correção mais cirúrgica e precisa possível.

**Perguntas para você responder após completar as fases:**
1. Conseguiu reproduzir o erro 185 em produção? O stack trace mapeou para .tsx?
2. A API `/api/leads/sales-view` retornou algum campo com tipo incorreto (objeto em vez de string)?
3. O ambiente local está funcionando? Se não, qual erro específico aparece?
4. Qual das hipóteses (1-6) parece mais provável baseado nas evidências?
