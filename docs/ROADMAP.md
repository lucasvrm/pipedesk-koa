# Roadmap PipeDesk

**Última atualização:** 06 de dezembro de 2025  
**Versão Atual:** 0.3.0

## Visão Geral

Este roadmap apresenta funcionalidades planejadas mas ainda não implementadas no PipeDesk, organizadas por prioridade e impacto. Para ver funcionalidades já implementadas, consulte [FEATURES_STATUS.md](FEATURES_STATUS.md).

---

## 🎯 Legenda de Status

- ✅ **Implementado** - Feature completa e em uso
- 🚧 **Em Desenvolvimento** - Feature parcialmente implementada
- 📋 **Planejado** - Feature aprovada mas não iniciada
- 💡 **Proposto** - Ideia em avaliação
- ❌ **Não Prioritário** - Feature adiada ou cancelada

---

## 📊 Sumário Executivo

### Por Status
- **Implementado:** 20+ features core
- **Em Desenvolvimento:** 3 features
- **Planejado:** 7 features
- **Proposto:** 4 features

### Por Prioridade
- **P0 (Crítica):** 2 features
- **P1 (Alta):** 5 features
- **P2 (Média):** 4 features
- **P3 (Baixa):** 3 features

---

## 🚨 P0 - Prioridade Crítica

### 1. Production OAuth Integration
**Status:** 🚧 Em Desenvolvimento  
**Impacto:** Crítico  
**Esforço:** Baixo (1-2 dias)

**Problema:**
Atualmente a integração Google Workspace pode estar usando credenciais de desenvolvimento ou implementação parcial.

**Solução:**
- Configurar OAuth production credentials no Google Cloud Console
- Implementar refresh token handling robusto
- Adicionar tratamento de erro para tokens expirados
- Testar fluxo completo de autorização

**Dependências:**
- Conta Google Cloud Console com billing ativado
- Domínio verificado para OAuth consent screen

**Critérios de Aceitação:**
- [ ] OAuth flow funciona em produção
- [ ] Tokens são renovados automaticamente
- [ ] Usuários recebem notificação de expiração
- [ ] Documentação de setup para admin

---

### 2. Global Search Completo
**Status:** 🚧 Em Desenvolvimento  
**Impacto:** Alto  
**Esforço:** Médio (3-5 dias)

**Problema:**
Busca global pode estar parcialmente implementada ou faltando funcionalidades.

**Funcionalidades Necessárias:**
- [ ] Search bar global acessível de qualquer página
- [ ] Busca em deals, players, tasks, companies, leads, contacts
- [ ] Resultados agrupados por tipo de entidade
- [ ] Keyboard shortcuts (Cmd/Ctrl + K)
- [ ] Highlight de termos buscados
- [ ] Filtros por tipo e data
- [ ] Histórico de buscas recentes
- [ ] Respeitar RLS e anonymization rules

**Tecnologias Sugeridas:**
- Supabase Full Text Search
- Debounced search input
- Command palette UI (cmdk library já instalada)

**Critérios de Aceitação:**
- [ ] Busca retorna resultados em <500ms
- [ ] Funciona offline com cache
- [ ] Testes E2E cobrindo todos os tipos
- [ ] Documentação de uso

---

## 🔥 P1 - Prioridade Alta

### 3. Bulk Operations
**Status:** 📋 Planejado  
**Impacto:** Alto  
**Esforço:** Médio (4-6 dias)

**Descrição:**
Permitir operações em massa para aumentar produtividade de analistas.

**Funcionalidades:**
- [ ] Seleção múltipla em listas (deals, players, tasks, companies)
- [ ] Bulk delete com confirmação
- [ ] Bulk status change
- [ ] Bulk stage change
- [ ] Bulk assignment (atribuir responsáveis)
- [ ] Bulk tagging (adicionar a folders)
- [ ] Bulk task completion
- [ ] Bulk export (CSV/Excel)
- [ ] Activity log para todas as operações

**UX Considerations:**
- Checkbox para seleção individual
- "Select All" com count indicator
- Sticky action bar mostrando X items selected
- Undo toast para operações não destrutivas
- Confirmation dialog para operações destrutivas

**Critérios de Aceitação:**
- [ ] Suporta 100+ items simultâneos
- [ ] Feedback de progresso para operações longas
- [ ] Rollback em caso de erro
- [ ] Audit log registra todas as operações
- [ ] Testes de performance

---

### 4. Email Digest & Notifications
**Status:** 🚧 Em Desenvolvimento  
**Impacto:** Alto  
**Esforço:** Médio (4-5 dias)

**Situação Atual:**
- ✅ Inbox exists (`src/features/inbox/`)
- ✅ `notifications` table no schema
- ❌ Email sending não implementado

**Funcionalidades Necessárias:**
- [ ] Daily digest email (resumo de atividades)
- [ ] Real-time notifications para eventos críticos
- [ ] Notification preferences (email, push, in-app)
- [ ] Digest configuration (frequency, content)
- [ ] Email templates profissionais
- [ ] Unsubscribe links

**Tipos de Notifications:**
- Mentions em comments
- Task assignments
- Deadline approaching (24h, 1 week)
- Status changes em deals/tracks
- SLA breaches
- Document uploads
- New Q&A questions

**Tecnologias:**
- Supabase Edge Functions para email sending
- Resend ou SendGrid para email delivery
- React Email para templates

**Critérios de Aceitação:**
- [ ] Emails enviados em <5min de evento
- [ ] Digest batching funciona corretamente
- [ ] Usuários podem configurar preferências
- [ ] Unsubscribe funciona e persiste
- [ ] Templates são mobile-responsive

---

### 5. Q&A System UI
**Status:** 📋 Planejado  
**Impacto:** Médio  
**Esforço:** Médio (3-4 dias)

**Situação Atual:**
- ✅ Schema implementado (`questions`, `answers` tables)
- ❌ UI não encontrada

**Descrição:**
Sistema de perguntas e respostas para deals/players, permitindo comunicação estruturada entre stakeholders.

**Funcionalidades:**
- [ ] Q&A tab em deal/player detail pages
- [ ] Create question dialog
- [ ] Rich text editor para perguntas e respostas
- [ ] Thread-style display
- [ ] Mark as answered
- [ ] Internal vs external questions
- [ ] Notifications quando pergunta é respondida
- [ ] Search/filter questions
- [ ] Export Q&A log

**Use Cases:**
- Due diligence questions
- Compliance clarifications
- Information requests de clients
- Internal team discussions

**Critérios de Aceitação:**
- [ ] Clients veem apenas external questions
- [ ] Analysts podem marcar como internal
- [ ] Email notifications funcionam
- [ ] Search encontra por keywords
- [ ] Audit log registra Q&A activity

---

### 6. Advanced AI Features
**Status:** 🚧 Em Desenvolvimento  
**Impacto:** Médio  
**Esforço:** Alto (8-10 dias)

**Situação Atual:**
- ✅ `AINextSteps.tsx` existe
- ❌ Integração com LLM não clara

**Funcionalidades Planejadas:**
- [ ] **Deal Description Generator**
  - Input: volume, operation type, sector
  - Output: Professional deal description
  
- [ ] **Comment Thread Summarizer**
  - Input: Long comment threads
  - Output: Concise summary with key points
  
- [ ] **Next Steps Suggester** (pode já existir)
  - Input: Deal context, current stage
  - Output: Actionable next steps
  
- [ ] **Document Analysis**
  - Input: Uploaded PDFs/docs
  - Output: Key information extraction
  
- [ ] **Risk Assessment**
  - Input: Deal data, market conditions
  - Output: Risk score and factors

**Tecnologias:**
- OpenAI GPT-4 ou Anthropic Claude
- Langchain para orchestration
- Vector database para context
- RAG para deal-specific knowledge

**Considerações:**
- Privacy: Não enviar PII sem consentimento
- Cost control: Rate limiting
- Fallback behavior se API falhar
- User feedback loop

**Critérios de Aceitação:**
- [ ] Responses em <3 segundos
- [ ] Accuracy >90% validado por analysts
- [ ] Cost por query <$0.10
- [ ] Compliance com LGPD/GDPR
- [ ] Usuários podem disable AI features

---

### 7. Document Management Completo
**Status:** 🚧 Em Desenvolvimento  
**Impacto:** Alto  
**Esforço:** Médio (5-7 dias)

**Situação Atual:**
- ✅ DataRoomView existe
- ❌ Funcionalidades podem estar incompletas

**Funcionalidades Necessárias:**
- [ ] File upload com drag & drop
- [ ] Folder structure dentro de deals
- [ ] File versioning
- [ ] Document preview (PDF, images, office docs)
- [ ] Download tracking (who downloaded what)
- [ ] Expiration dates para links
- [ ] Watermarking para PDFs
- [ ] OCR para searchable PDFs
- [ ] Document templates
- [ ] E-signature integration

**Storage:**
- Supabase Storage para files
- Google Drive sync (opcional)
- Encryption at rest

**Critérios de Aceitação:**
- [ ] Suporta files até 100MB
- [ ] Preview funciona para formatos comuns
- [ ] Version history é rastreável
- [ ] Download links expiram corretamente
- [ ] Audit log registra acessos

---

## 🎯 P2 - Prioridade Média

### 8. Advanced Gantt Features
**Status:** 📋 Planejado  
**Impacto:** Baixo  
**Esforço:** Alto (6-8 dias)

**Situação Atual:**
- ✅ Gantt básico existe com D3.js

**Melhorias Planejadas:**
- [ ] Critical path highlighting
- [ ] Resource allocation view
- [ ] Baseline vs actual comparison
- [ ] What-if scenario planning
- [ ] Export to MS Project
- [ ] Dependency auto-scheduling
- [ ] Milestone markers with celebrations
- [ ] Zoom levels (day, week, month, quarter)

**Critérios de Aceitação:**
- [ ] Performance com 500+ tasks
- [ ] Drag to reschedule funciona
- [ ] Critical path calcula corretamente
- [ ] Export preserva formatting

---

### 9. Mobile Responsiveness Enhancements
**Status:** 📋 Planejado  
**Impacto:** Médio  
**Esforço:** Médio (4-6 dias)

**Situação Atual:**
- ✅ Responsive design básico existe
- ❌ Otimizações mobile podem estar incompletas

**Melhorias:**
- [ ] Bottom navigation para mobile
- [ ] Swipe gestures para actions
- [ ] Offline mode com sync
- [ ] Touch-optimized tables
- [ ] Reduced data mode
- [ ] Push notifications (PWA)
- [ ] Mobile-specific kanban
- [ ] Quick add shortcuts

**Critérios de Aceitação:**
- [ ] Lighthouse mobile score >90
- [ ] Works on iOS Safari e Android Chrome
- [ ] Offline funciona para viewing
- [ ] Sync automático ao reconectar

---

### 10. Advanced Analytics & Reporting
**Status:** 📋 Planejado  
**Impacto:** Médio  
**Esforço:** Alto (7-10 dias)

**Situação Atual:**
- ✅ Analytics dashboard básico existe

**Funcionalidades Adicionais:**
- [ ] Custom report builder
- [ ] Scheduled report generation
- [ ] Interactive charts com drill-down
- [ ] Cohort analysis
- [ ] Forecasting com ML
- [ ] Comparative analytics (vs last period)
- [ ] Team performance leaderboards
- [ ] Client-facing reports (branded)
- [ ] API para external BI tools

**Métricas Adicionais:**
- Win rate por analyst
- Average time to close
- Pipeline velocity
- Lead conversion funnel
- Revenue attribution
- Activity correlations

**Critérios de Aceitação:**
- [ ] Reports geram em <10 segundos
- [ ] Export para PDF, Excel, PowerPoint
- [ ] Scheduled emails funcionam
- [ ] Queries não impactam performance

---

### 11. Automation Workflows
**Status:** 💡 Proposto  
**Impacto:** Alto  
**Esforço:** Muito Alto (15-20 dias)

**Descrição:**
Sistema de automação estilo Zapier/Make para workflows internos.

**Funcionalidades:**
- [ ] Visual workflow builder
- [ ] Triggers: stage change, field update, date reached, etc
- [ ] Actions: send email, create task, update field, call webhook
- [ ] Conditions: if/else logic
- [ ] Delays: wait X days
- [ ] Loops: repeat for each item
- [ ] Variables: dynamic field values
- [ ] Templates: common workflows pré-configurados

**Use Cases:**
- Auto-criar tasks ao mudar stage
- Send reminder 3 days before deadline
- Escalate SLA breaches to admin
- Auto-qualify leads baseado em criteria
- Weekly digest to clients

**Critérios de Aceitação:**
- [ ] No-code interface intuitiva
- [ ] Suporta 10+ types de triggers
- [ ] Suporta 20+ types de actions
- [ ] Error handling e retry logic
- [ ] Activity log para debugging

---

## 🌟 P3 - Prioridade Baixa / Visão de Futuro

### 12. Real-time Collaboration
**Status:** 💡 Proposto  
**Impacto:** Baixo  
**Esforço:** Alto (8-10 dias)

**Descrição:**
Colaboração simultânea estilo Google Docs.

**Funcionalidades:**
- [ ] See who's viewing same page
- [ ] Cursor tracking
- [ ] Live typing indicators em forms
- [ ] Conflict resolution para concurrent edits
- [ ] Presence indicators
- [ ] Live comments

**Nota:** Supabase Realtime já fornece updates em real-time. Esta feature é sobre UX adicional.

**Critérios de Aceitação:**
- [ ] Max 500ms latency
- [ ] Não aumenta load significativo
- [ ] Graceful degradation se offline

---

### 13. Native Mobile Apps
**Status:** 💡 Proposto  
**Impacto:** Baixo  
**Esforço:** Muito Alto (30+ dias)

**Descrição:**
Apps nativos iOS e Android.

**Tecnologias:**
- React Native ou Flutter
- Code sharing com web app

**Funcionalidades:**
- Todas as features web
- Native push notifications
- Biometric authentication
- Offline-first architecture
- Camera integration para docs

**Critérios de Aceitação:**
- [ ] App store approval
- [ ] Feature parity com web
- [ ] <100MB download size
- [ ] Works offline 100%

---

### 14. Advanced Edge Case Handling
**Status:** 📋 Planejado  
**Impacto:** Baixo  
**Esforço:** Médio (4-5 dias)

**Situação Atual:**
- ✅ Tratamento básico de erros existe

**Melhorias:**
- [ ] Orphaned task recovery com soft delete
- [ ] Concurrent edit detection com conflict UI
- [ ] Offline edit queue com sync
- [ ] Magic link expiry handling melhorado
- [ ] Circular dependency prevention em tasks
- [ ] Data validation mais robusta
- [ ] Automatic data repair scripts

**Critérios de Aceitação:**
- [ ] Zero data loss em edge cases
- [ ] User sempre tem feedback claro
- [ ] Recovery é automático quando possível

---

## 🔮 Futuro Distante (6+ meses)

### Ideas em Consideração

1. **Integrações Adicionais**
   - Slack notifications
   - Microsoft Teams
   - Salesforce sync
   - HubSpot integration
   - DocuSign e-signature

2. **Advanced Features**
   - Multi-tenancy para white-label
   - API pública para integrações
   - Webhooks para eventos
   - GraphQL API
   - Marketplace de plugins

3. **Enterprise Features**
   - SSO/SAML authentication
   - Advanced audit & compliance
   - Custom branding
   - SLA guarantees
   - Priority support

---

## 📈 Roadmap por Trimestre

### Q1 2026 (Jan-Mar)
**Foco:** Estabilidade e Produtividade

- ✅ Production OAuth Integration
- ✅ Global Search Completo
- ✅ Bulk Operations
- 🚧 Email Digest

### Q2 2026 (Apr-Jun)
**Foco:** Features de Colaboração

- Q&A System UI
- Document Management Completo
- Advanced AI Features
- Mobile Responsiveness

### Q3 2026 (Jul-Sep)
**Foco:** Analytics e Automação

- Advanced Analytics & Reporting
- Automation Workflows (Fase 1)
- Advanced Gantt Features

### Q4 2026 (Oct-Dec)
**Foco:** Refinamento

- Advanced Edge Case Handling
- Real-time Collaboration
- Performance optimizations
- Security enhancements

---

## 🎬 Como Contribuir com o Roadmap

### Sugerir Novas Features
1. Abra uma issue no GitHub com tag `feature-request`
2. Descreva o problema que a feature resolve
3. Proponha uma solução
4. Indique casos de uso

### Votar em Features
- Adicione 👍 em issues existentes
- Comente com seu caso de uso
- Features mais votadas sobem na prioridade

### Implementar Features
- Veja issues com tag `good-first-issue`
- Siga [CONTRIBUTING.md](CONTRIBUTING.md)
- Coordene com maintainers antes de grandes features

---

## 📊 Métricas de Progresso

### Completion Score
- **Core Features:** 90% (18/20)
- **Advanced Features:** 40% (4/10)
- **Future Features:** 0% (0/5)

### Velocity (features/month)
- **Q4 2025:** 2.5 features
- **Target Q1 2026:** 3.0 features

---

## 🔗 Documentos Relacionados

- [FEATURES_STATUS.md](FEATURES_STATUS.md) - Status de features implementadas
- [DOCUMENTATION_AUDIT.md](DOCUMENTATION_AUDIT.md) - Auditoria completa da documentação
- [PRD.md](PRD.md) - Product Requirements Document
- [CONTRIBUTING.md](CONTRIBUTING.md) - Como contribuir
- [CURRENT_STATUS.md](CURRENT_STATUS.md) - Estado atual do projeto

---

**Última atualização:** 06 de dezembro de 2025  
**Mantido por:** PipeDesk Core Team  
**Próxima revisão:** Janeiro 2026  
**Versão do Roadmap:** 1.0
