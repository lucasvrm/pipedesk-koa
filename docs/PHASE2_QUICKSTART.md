# Phase 2 Features - Quick Start Guide

## 🎯 Three New Powerful Features

### 1️⃣ SLA Monitoring - Never Miss a Deadline

**What it does**: Automatically tracks how long deals stay in each stage and alerts you when they're at risk.

**How to use**:

#### For Admins - Configure SLA Limits
```
1. Click your user avatar in the top right
2. Select "Configurar SLA"
3. Adjust time limits for each stage:
   - NDA: Default 7 days
   - Analysis: Default 14 days
   - Proposal: Default 21 days
   - Negotiation: Default 30 days
   - Closing: Default 15 days
4. Set alert threshold (default 80% of max time)
5. Click "Salvar Alterações"
```

#### For Everyone - Monitor Status
**On Player Cards**:
- 🟢 Green badge = On track
- 🟡 Yellow badge = At risk (approaching limit)
- 🔴 Red badge = Overdue (exceeded limit)

**In Detail View**:
- Click any player track
- Go to "SLA" tab
- See full metrics with progress bar and days remaining

**Notifications**:
- Check inbox (bell icon)
- Filter by "SLA" to see all alerts
- Click notification to jump to deal

---

### 2️⃣ Activity Summaries - Instant Progress Reports

**What it does**: Generates intelligent summaries of all activity (comments, tasks, stage changes) for any time period.

**How to use**:

```
1. Open any Player Track detail dialog
2. Navigate to "Sumário" tab
3. Select time period:
   - Last 7 days → Weekly summary
   - Last 30 days → Monthly summary
   - Last 90 days → Quarterly summary
4. Click "Gerar Sumário"
5. Review the summary (includes):
   - Activity statistics
   - Recent comments
   - Tasks created/completed
   - Stage changes
   - Automated analysis
   - Suggested next steps
6. Click "Exportar" to download as Markdown
7. Browse previous summaries in "Histórico" tab
```

**Summary Contents**:
- 📊 Statistics: Total comments, tasks, stage changes
- 💬 Recent activity preview
- ✅ Completed tasks
- 📈 Stage transitions
- 🔍 Automated insights
- 👉 Next-step recommendations

---

### 3️⃣ Enhanced Search - Find Anything Fast

**What it does**: Smart search across all deals, players, tasks, and comments with typo tolerance.

**How to use**:

```
1. Click search icon in header
2. Type your query (typos are OK!)
   - Example: "johnn smit" finds "John Smith"
   - Example: "closng" finds "closing"
3. Results show automatically:
   - Relevance score (% match)
   - Entity type (Deal/Player/Task/Comment)
   - Preview text
4. Filter by tabs:
   - "Todos" - All results
   - "Deals" - Master deals only
   - "Players" - Player tracks only
   - "Tarefas" - Tasks only
   - "Comentários" - Comments only
5. Click any result to navigate
```

**Search Tips**:
- Don't worry about exact spelling
- Searches titles, descriptions, notes, comments
- Earlier words in your query are weighted higher
- Exact matches score highest

---

## 🎨 Visual Guide

### SLA Indicators

```
Player Card Example:

┌─────────────────────────────────────┐
│ Player A                            │
│ R$ 1.000.000 • Negotiation 🟡 5d   │
│ ▓▓▓▓▓▓▓▓░░ 75% prob.               │
└─────────────────────────────────────┘
       ↑
       SLA badge showing 5 days in current stage
       Yellow = approaching 30-day limit
```

### Summary Example

```
# Resumo de Atividades - 01/11/2025 até 30/11/2025

## Estatísticas Gerais
- Comentários: 12
- Tarefas criadas: 8
- Tarefas concluídas: 5
- Mudanças de etapa: 2

## Análise
✓ 5 tarefa(s) concluída(s) no período.
📊 2 mudança(s) de etapa.
💬 Alta atividade de comunicação (12 comentários).

## Próximos Passos Sugeridos
- Concluir 3 tarefa(s) pendente(s)
```

### Search Results

```
┌───────────────────────────────────────┐
│ Search: "aquisição tech"              │
├───────────────────────────────────────┤
│ [Todos 5] [Deals 2] [Players 3]      │
├───────────────────────────────────────┤
│ 💼 TechCorp Acquisition    95% match  │
│    acquisition • Active deal          │
├───────────────────────────────────────┤
│ 💼 Player A                87% match  │
│    TechCorp • negotiation             │
└───────────────────────────────────────┘
```

---

## ⚙️ Common Tasks

### Check SLA Status for All Deals
```
1. Go to Dashboard
2. Look for yellow/red badges on cards
3. Click inbox bell icon
4. Filter notifications by type
```

### Generate Weekly Progress Report
```
1. Open player track
2. Go to "Sumário" tab
3. Select "Últimos 7 dias"
4. Click "Gerar Sumário"
5. Click "Exportar"
6. Share with team
```

### Find All Tasks Mentioning "Contract"
```
1. Click search icon
2. Type "contract"
3. Switch to "Tarefas" tab
4. Click result to open task
```

---

## 🔧 Troubleshooting

**SLA badges not showing?**
- SLA config must be set (Admin menu)
- Player must be in active status
- Stage history must exist

**Summary is empty?**
- Check if activities exist in selected period
- Try a longer time period
- Verify data is in system

**Search not finding results?**
- Check spelling (but typos should work)
- Try broader terms
- Use "Todos" tab to see all results

---

## 💡 Pro Tips

1. **SLA Planning**: Set realistic time limits based on your historical data
2. **Regular Summaries**: Generate weekly summaries for team meetings
3. **Search Shortcuts**: Use search to quickly navigate to specific deals
4. **Alert Thresholds**: Adjust to 70% if you want earlier warnings
5. **Export Summaries**: Share with external stakeholders who don't have system access

---

## 📞 Need Help?

Check the comprehensive documentation:
- `PHASE2_IMPLEMENTATION.md` - Full technical details
- `PHASE2_FINAL_SUMMARY.md` - Implementation overview

Or click the Help icon (?) in the header for in-app guidance.
