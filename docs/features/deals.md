# Deals Management

Gerenciamento de negociações (Deal Flow) no PipeDesk através de Master Deals e Player Tracks.

## 📖 Visão Geral

O sistema de deals do PipeDesk é baseado em uma hierarquia de dois níveis:

1. **Master Deal** - Representa a necessidade do cliente (ex: venda de uma empresa)
2. **Player Tracks** - Negociações individuais com potenciais compradores/investidores

Esta arquitetura permite rastrear múltiplas negociações paralelas para o mesmo ativo, mantendo independência entre elas enquanto calcula forecasts consolidados.

## 🎯 Conceitos Principais

### Master Deal

Um Master Deal representa uma oportunidade de negócio principal:
- Cliente específico (empresa vendedora, por exemplo)
- Volume esperado da transação
- Tipo de operação (acquisition, merger, investment, divestment)
- Deadline para conclusão
- Status geral (active, cancelled, concluded)

### Player Track

Cada Player Track representa uma negociação individual:
- Player específico (comprador/investidor potencial)
- Stage atual no pipeline (nda → analysis → proposal → negotiation → closing)
- Probability de sucesso (0-100%)
- Volume específico deste track (pode diferir do master deal)
- Responsáveis pela negociação
- Status independente

### Weighted Forecast

O PipeDesk calcula automaticamente o valor ponderado de cada track:
```
Weighted Value = Track Volume × (Probability / 100)
```

E o forecast total do Master Deal:
```
Master Deal Forecast = Σ(Track Weighted Values)
```

## 🚀 Funcionalidades

### Master Deals

#### Criar Master Deal

**Rota:** `/deals` → Botão "Novo Negócio"

**Campos:**
- **Client Name** (obrigatório) - Nome do cliente
- **Volume** - Valor esperado da transação
- **Operation Type** - Tipo de operação:
  - `acquisition` - Aquisição
  - `merger` - Fusão
  - `investment` - Investimento
  - `divestment` - Desinvestimento
- **Deadline** - Data limite para conclusão
- **Observations** - Observações gerais
- **Fee Percentage** - Percentual de fee cobrado

**Regras:**
- Apenas Admin, Analyst, e New Business podem criar deals
- `created_by` é automaticamente setado para o usuário atual
- Status inicial é sempre `active`
- ID único gerado automaticamente (UUID)

#### Visualizar Master Deals

**Views Disponíveis:**

1. **List View** (`/deals`)
   - Tabela com todas as deals
   - Colunas: Client, Volume, Operation Type, Status, Deadline
   - Filtros por status e operation type
   - Paginação
   - Ordenação por coluna

2. **Kanban View** (integrado em list view)
   - Cards agrupados por status
   - Drag & drop para mudar status
   - Visual indicators de deadline

3. **Master Matrix View** (`/kanban`)
   - Grid visualization: Deals × Players
   - Mostra todos os players de cada deal
   - Weighted forecast por deal
   - Drill-down para player details

4. **Deal Detail Page** (`/deals/:id`)
   - Informações completas do deal
   - Lista de player tracks
   - Comentários e activity log
   - Documentos anexados
   - Custom fields

#### Editar Master Deal

**Permissões:**
- Admin, Analyst, New Business: podem editar qualquer deal
- Clients: podem ver apenas deals que criaram

**Campos Editáveis:**
- Todos os campos menos `id`, `created_by`, `created_at`
- `updated_at` é automaticamente atualizado

#### Deletar Master Deal

**Comportamento:**
- Soft delete: seta `deleted_at` timestamp
- Deal não aparece mais em listagens
- Pode ser recuperado por Admin se necessário
- **Cascading:** Todos os player tracks são deletados (hard delete)

**Permissões:**
- Apenas Admin e Analyst podem deletar

### Player Tracks

#### Criar Player Track

**Rota:** Deal Detail Page → "Adicionar Player"

**Campos:**
- **Player Name** (obrigatório) - Nome do investidor/comprador
- **Track Volume** - Valor específico deste track (default: master deal volume)
- **Current Stage** - Stage inicial (default: `nda`)
- **Probability** - Probabilidade de sucesso 0-100% (default: 10%)
- **Responsibles** - Array de user IDs responsáveis
- **Notes** - Observações específicas do track

**Regras:**
- Player Track sempre vinculado a um Master Deal
- Multiple players podem existir para o mesmo deal
- Cada player é independente

#### Pipeline Stages

Stages disponíveis (em ordem):

1. **NDA** - Acordo de confidencialidade
   - Probability sugerida: 10-20%
   - Ações típicas: Enviar NDA, aguardar assinatura

2. **Analysis** - Análise de viabilidade
   - Probability sugerida: 30-40%
   - Ações típicas: Due diligence inicial, análise financeira

3. **Proposal** - Proposta apresentada
   - Probability sugerida: 50-60%
   - Ações típicas: Preparar proposta, negociar termos

4. **Negotiation** - Negociação ativa
   - Probability sugerida: 70-80%
   - Ações típicas: Ajustes contratuais, DD profunda

5. **Closing** - Fechamento
   - Probability sugerida: 90-95%
   - Ações típicas: Assinatura de contratos, transferência

**Configuração:**
- Stages são configuráveis em `/admin/pipeline`
- Cores customizáveis por stage
- Ordem configurável

#### Phase Validation

Regras podem bloquear transitions entre stages:

**Exemplo:**
```
Regra: Não pode avançar para "Proposal" se campo "Due Diligence Report" estiver vazio
```

**Configuração:** `/admin/phase-validation`

**Features:**
- Operators: equals, greater_than, less_than, contains, is_filled, is_empty
- AND/OR logic
- Custom error messages
- Enable/disable rules

#### Player Anonymization

**Para Clients:**
- Player names são substituídos por "Player A", "Player B", etc
- Protege informação competitiva
- Mantém analytics funcionando

**Implementação:**
- RLS policy no Supabase verifica role
- Frontend aplica masking
- Audit log registra tentativas de acesso

#### Win/Cancel Cascading

**Regra de Exclusividade:**
Quando um player track é marcado como **Won** (concluded com sucesso):
1. Automaticamente cancela todos os outros player tracks do mesmo master deal
2. Atualiza status do master deal para `concluded`
3. Notifica responsáveis dos outros tracks
4. Audit log registra a ação

**Implementação:**
```sql
-- Trigger no Supabase
-- Quando player_track.status = 'concluded' e foi won
-- UPDATE player_tracks SET status = 'cancelled' 
-- WHERE master_deal_id = X AND id != winner_id
```

#### Weighted Forecast

**Cálculo Automático:**

Para cada track:
```typescript
const weightedValue = trackVolume * (probability / 100)
```

Para o master deal:
```typescript
const masterForecast = playerTracks.reduce((sum, track) => {
  return sum + (track.track_volume * track.probability / 100)
}, 0)
```

**Visualização:**
- Master Matrix View mostra forecast total
- Analytics Dashboard mostra pipeline total
- Deal Detail mostra breakdown por player

### Multi-View Workspace

Cada Player Track pode ser visualizado em 4 modos diferentes:

#### 1. Kanban View
- Cards organizados por stage
- Drag & drop para mover stages
- WIP limits (opcional)
- Visual badges (overdue, milestone, etc)

**Acesso:** Track Detail Page → Tab "Kanban"

#### 2. List View
- Tabela de tasks
- Inline editing
- Ordenação por qualquer coluna
- Filtros avançados

**Acesso:** Track Detail Page → Tab "List"

#### 3. Gantt View
- Timeline visualization com D3.js
- Task dependencies
- Critical path highlighting (se configurado)
- Zoom por período (dia/semana/mês)

**Acesso:** Track Detail Page → Tab "Gantt"

**Limitação:** Desktop only (mobile mostra message)

#### 4. Calendar View
- Monthly calendar
- Deadlines e milestones
- Color coded by priority
- Click to edit

**Acesso:** Track Detail Page → Tab "Calendar"

### Tasks Management

Tasks são vinculadas a Player Tracks (não ao Master Deal diretamente).

**Features:**
- Task dependencies (bloqueia predecessoras)
- Milestones
- Multiple assignees
- Due dates
- Status tracking
- Priority levels

**Documentação Completa:** [tasks.md](tasks.md) ou [TASK_MANAGEMENT_GUIDE.md](../TASK_MANAGEMENT_GUIDE.md)

### Comments & Collaboration

**Comments em Deals e Tracks:**
- Rich text
- @mentions com autocomplete
- Notifications para mencionados
- Threaded comments
- Attachments (se document management configurado)

**Activity Log:**
- Todas as ações são logadas
- Quem fez, quando, o que mudou
- Before/after values
- Filterable por entity

## 🔐 Permissões e RLS

### Master Deals

**View (SELECT):**
- ✅ Admin, Analyst, New Business: todos os deals ativos
- ✅ Client: apenas deals que criou
- ❌ Deleted deals não aparecem (a menos que seja Admin)

**Create (INSERT):**
- ✅ Admin, Analyst, New Business
- ❌ Client

**Update:**
- ✅ Admin, Analyst, New Business: qualquer deal
- ❌ Client: não pode editar

**Delete:**
- ✅ Admin, Analyst
- ❌ New Business, Client

### Player Tracks

**View:**
- Herda do Master Deal (se pode ver deal, pode ver tracks)
- Client vê player names anonimizados

**Manage (CRUD):**
- ✅ Admin, Analyst, New Business
- ❌ Client (read-only)

**RLS Policies:**
```sql
-- Simplified example
CREATE POLICY "Users can view master_deals" ON master_deals
  FOR SELECT USING (
    deleted_at IS NULL AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
      OR created_by = auth.uid()
    )
  );
```

## 💡 Casos de Uso

### Caso 1: M&A Buy-Side

**Cenário:** Cliente quer vender sua empresa.

**Workflow:**
1. Analyst cria Master Deal:
   - Client Name: "Acme Corp"
   - Volume: R$ 100M
   - Operation Type: divestment
   - Deadline: 6 meses

2. Identifica potenciais compradores e cria Player Tracks:
   - Player A (PE Fund Alpha): R$ 100M, 30%, Stage: Analysis
   - Player B (Strategic Buyer): R$ 120M, 50%, Stage: Proposal
   - Player C (PE Fund Beta): R$ 90M, 20%, Stage: NDA

3. Weighted Forecast:
   - Player A: R$ 30M (100M × 30%)
   - Player B: R$ 60M (120M × 50%)
   - Player C: R$ 18M (90M × 20%)
   - **Total: R$ 108M**

4. Durante negociação:
   - Player B avança para Negotiation (80%): R$ 96M
   - Player A estagna em Analysis: mantém 30%
   - Player C é descartado: 0%
   - **Novo Forecast: R$ 126M**

5. Fechamento:
   - Player B fecha deal
   - Status → Concluded
   - Players A e C são automaticamente cancelados
   - Master Deal → Concluded

### Caso 2: Deal com Milestone Gates

**Cenário:** Regulatory approval necessário antes de avançar.

**Setup:**
1. Admin configura Phase Validation Rule:
   - From Stage: Proposal
   - To Stage: Negotiation
   - Condition: Custom Field "Regulatory Approval" is_filled
   - Error: "Aguardando aprovação regulatória para avançar"

2. Analyst tenta mover Player Track para Negotiation
   - Sistema bloqueia: "Aguardando aprovação regulatória"
   - Analyst adiciona approval document
   - Sistema permite transition

### Caso 3: Client View (Anonimizado)

**Cenário:** Cliente quer acompanhar progresso sem ver concorrentes.

**Configuração:**
1. Admin convida cliente via email com role `client`
2. Cliente faz login via magic link
3. Cliente acessa deal detail page

**O que Cliente vê:**
- ✅ Master Deal info (client name, volume, deadline)
- ✅ "Player A", "Player B", "Player C" (anonimizados)
- ✅ Stages e probabilities
- ✅ Weighted forecast total
- ❌ **Não vê:** nomes reais dos players
- ❌ **Não vê:** deals de outros clientes

## 📊 Analytics

**Métricas Disponíveis:**

**Por Deal:**
- Total pipeline value
- Weighted forecast
- Number of active players
- Average probability
- Days since created
- Days to deadline

**Por Player Track:**
- Time in each stage
- Probability evolution over time
- Tasks completed vs pending
- SLA compliance

**Dashboard Global:**
- Total deals active/concluded/cancelled
- Total pipeline value
- Forecast accuracy (backtest)
- Win rate by analyst
- Average time to close
- Conversion funnel (stage → stage)

**Rota:** `/analytics`

**Documentação:** [analytics.md](analytics.md) (a criar)

## 🔗 Integrações

### Google Drive

**Feature:** Auto-create folders para cada deal/player.

**Estrutura:**
```
Deals/
  └── Master Deal: Acme Corp/
      ├── Player A - PE Fund Alpha/
      ├── Player B - Strategic Buyer/
      └── Player C - PE Fund Beta/
```

**Configuração:** `/admin/google`

**Status:** ⚠️ Parcialmente implementado (verificar funcionalidade)

### Custom Fields

**Feature:** Adicionar campos customizados a deals e tracks.

**Tipos suportados:**
- text, number, date
- select, multiselect
- boolean, url, email

**Configuração:** `/settings/custom-fields`

**Uso:** Campos aparecem em formulários de create/edit

### Audit Log

**Feature:** Todas as ações em deals/tracks são logadas.

**Informações capturadas:**
- User ID e nome
- Action type (create, update, delete)
- Entity ID e tipo
- Before/after values (JSON)
- Timestamp

**Rota:** Integrado em Deal Detail Page ou `/audit`

## 🎨 UI/UX

### Shared List Layout

Deals e Companies seguem o padrão SharedListLayout:

**Features:**
- Header fixo com título e ações
- Filters bar com search e filtros específicos
- Paginação no footer
- Actions column sempre visível
- Responsive (mobile: cards, desktop: table)

### Visual Indicators

**Status Colors:**
- Active: Blue
- Concluded: Green
- Cancelled: Red

**Stage Colors:**
- Configurável por stage em Pipeline Settings
- Default: gradient azul → verde

**Priority Badges:**
- Urgent: Red
- High: Orange
- Medium: Yellow
- Low: Gray

## 🧪 Testing

**Testes Recomendados:**

1. **Unit Tests:**
   - Weighted forecast calculation
   - Win/cancel cascading logic
   - Permission checks

2. **Integration Tests:**
   - Create deal → create players → close winner
   - Phase validation rules
   - RLS policies

3. **E2E Tests:**
   - Full deal lifecycle
   - Client anonimizado view
   - Multi-view switching

**Framework:** Vitest + Playwright

**Documentação:** [TESTING.md](../TESTING.md)

## 🔧 Troubleshooting

### Forecast não está calculando

**Possíveis causas:**
1. Track volume é null
2. Probability não está entre 0-100
3. Status do track não é 'active'

**Solução:**
```sql
SELECT 
  id, 
  player_name, 
  track_volume, 
  probability,
  (track_volume * probability / 100) as weighted_value
FROM player_tracks
WHERE master_deal_id = 'uuid-here' AND status = 'active';
```

### Player não aparece no Master Matrix

**Possíveis causas:**
1. Player track status = 'cancelled' ou 'concluded'
2. Master deal está deleted (deleted_at IS NOT NULL)
3. Usuário não tem permissão

**Solução:**
- Verificar status do track
- Verificar RLS policies
- Check deleted_at do master deal

### Client consegue ver player names

**Causa:** RLS policy ou frontend masking falhando

**Solução:**
1. Verificar role do usuário no Supabase
2. Check implementation do masking no frontend
3. Verificar se RLS está enabled na tabela

## 📚 Referências

**Código:**
- Master Deals: `src/features/deals/`
- Player Tracks: `src/features/players/`, `src/features/tracks/`
- Views: `src/features/deals/components/`
- Matrix: `src/features/deals/components/MasterMatrixView.tsx`

**Schema:**
- Tables: `master_deals`, `player_tracks`, `pipeline_stages`
- Migrations: `supabase/migrations/001_initial_schema.sql`

**Documentação Relacionada:**
- [RBAC](rbac.md) - Permissões e roles
- [Tasks](tasks.md) ou [TASK_MANAGEMENT_GUIDE](../TASK_MANAGEMENT_GUIDE.md)
- [Cross-Tagging](../CROSS_TAGGING_GUIDE.md) - Organização em folders
- [Audit Log](../VDR_AUDIT_LOG_GUIDE.md) - Activity tracking

---

**Última atualização:** 06 de dezembro de 2025  
**Status:** ✅ Feature completamente implementada  
**Mantido por:** PipeDesk Team
