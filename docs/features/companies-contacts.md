# Companies & Contacts Management

Gestão de empresas e contatos no PipeDesk para relacionamentos de longo prazo e pipeline CRM.

## 📖 Visão Geral

O PipeDesk oferece CRM completo para gerenciar:
- **Companies** - Empresas que são prospects, clientes, parceiros ou alvos de investimento
- **Contacts** - Pessoas físicas associadas a companies ou standalone

Esta funcionalidade complementa o deal flow permitindo:
- Rastrear relacionamento com empresas ao longo do tempo
- Manter network de contatos organizado
- Qualificar leads em companies e deals
- Historical tracking de interactions

## 🏢 Companies (Empresas)

### Conceito

Uma Company representa uma entidade corporativa com a qual você tem ou pode ter um relacionamento de negócios.

**Rota:** `/companies`

### Tipos de Companies

O campo `type` classifica o tipo de empresa:

| Type | Descrição | Uso Típico |
|------|-----------|------------|
| `corporation` | Corporação | Empresas estabelecidas, grande porte |
| `fund` | Fundo de Investimento | PE funds, VC funds, hedge funds |
| `startup` | Startup | Empresas em estágio inicial |
| `advisor` | Consultoria/Advisors | Service providers, consultores |
| `other` | Outro | Categorias especiais |

### Relationship Levels

O campo `relationship_level` indica o estágio do relacionamento:

| Level | Descrição | Ações Típicas |
|-------|-----------|---------------|
| `none` | Sem Relacionamento | Primeiro contato, cold outreach |
| `prospect` | Prospect | Em prospecção, interesse mútuo |
| `active_client` | Cliente Ativo | Deals em andamento ou recentes |
| `partner` | Parceiro | Relacionamento de longo prazo |
| `churned` | Churned | Ex-cliente, relacionamento encerrado |

### Campos

**Campos Principais:**
- `name` (obrigatório) - Nome da empresa
- `cnpj` - CNPJ (formato brasileiro)
- `site` - Website URL
- `description` - Descrição da empresa
- `type` - Tipo (ver tabela acima)
- `relationship_level` - Nível de relacionamento

**Campos de Sistema:**
- `id` - UUID único
- `created_at` - Timestamp de criação
- `updated_at` - Timestamp de última atualização
- `created_by` - User ID do criador
- `deleted_at` - Soft delete timestamp

### Funcionalidades

#### Criar Company

**Rota:** `/companies` → Botão "Nova Empresa"

**Formulário:**
```typescript
{
  name: string (required)
  cnpj: string (optional, formato: XX.XXX.XXX/XXXX-XX)
  site: string (optional, URL)
  description: string (optional)
  type: 'corporation' | 'fund' | 'startup' | 'advisor' | 'other'
  relationship_level: 'none' | 'prospect' | 'active_client' | 'partner' | 'churned'
}
```

**Validações:**
- Name é obrigatório e único (case-insensitive recomendado)
- CNPJ deve seguir formato brasileiro (se fornecido)
- Site deve ser URL válida (se fornecido)

**Permissões:**
- Admin, Analyst, New Business: podem criar
- Client: não pode criar

#### Listar Companies

**Rota:** `/companies`

**Views:**
- **Table View** (default)
  - Colunas: Name, Type, Relationship Level, CNPJ, Actions
  - Ordenação por qualquer coluna
  - Paginação (configurável: 10, 25, 50, 100 por página)
  
- **Grid View** (opcional, se implementado)
  - Cards com company info
  - Melhor para mobile

**Filtros:**
- **Por Type:** Filtro dropdown com todos os types
- **Por Relationship Level:** Filtro dropdown
- **Search:** Busca por name, CNPJ, ou description
- **Status:** Active (default) ou Deleted (admin only)

**Exemplo de Filtros:**
```
Type: fund
Relationship Level: active_client
Search: "XYZ"
→ Retorna: Fundos que são clientes ativos e contêm "XYZ" no nome
```

#### Visualizar Company Detail

**Rota:** `/companies/:id`

**Seções:**

1. **Company Info**
   - Name, CNPJ, Type, Relationship Level
   - Site (clickable link)
   - Description
   - Created/Updated timestamps

2. **Contacts** (Tab)
   - Lista de contacts associados
   - Primary contact indicator
   - Botão "Add Contact"

3. **Related Deals** (Tab, se integrado)
   - Deals onde esta company aparece
   - Como client no master deal
   - Como player em tracks

4. **Related Leads** (Tab)
   - Leads que foram qualified para esta company
   - Traceability do lead → company

5. **Activity Log** (Tab)
   - Histórico de mudanças
   - Quem fez, quando, o que mudou

6. **Comments** (Tab)
   - Comentários da equipe
   - @mentions
   - Notas internas

7. **Documents** (Tab, se DataRoom configurado)
   - Arquivos relacionados à company
   - Contratos, apresentações, etc

#### Editar Company

**Rota:** Company Detail → Botão "Edit"

**Campos Editáveis:**
- Todos exceto `id`, `created_at`, `created_by`
- `updated_at` é automaticamente atualizado

**Permissões:**
- Admin, Analyst, New Business: podem editar
- Client: read-only

#### Deletar Company

**Comportamento:**
- Soft delete: seta `deleted_at`
- Company não aparece em listagens
- Contacts associados permanecem (company_id nullable)
- Deals relacionados não são afetados

**Confirmação:**
```
"Tem certeza que deseja deletar [Company Name]?"
"X contacts estão associados. Eles permanecerão no sistema."
[ Cancelar ] [ Deletar ]
```

**Permissões:**
- Admin, Analyst: podem deletar
- New Business, Client: não podem

### Casos de Uso

#### Caso 1: Prospect → Active Client

**Workflow:**
1. Analyst cria company:
   ```
   Name: "Tech Ventures Fund"
   Type: fund
   Relationship Level: none
   ```

2. Após primeiro contato:
   ```
   Relationship Level: none → prospect
   + Add contact (João Silva, Partner)
   + Comment: "Primeiro call 06/12, interesse em tech deals"
   ```

3. Deal é criado:
   ```
   Master Deal com client "Tech Ventures Fund"
   Relationship Level: prospect → active_client
   ```

4. Deal fecha:
   ```
   Relationship Level continua: active_client
   Comment: "Deal fechado, manter relacionamento"
   ```

#### Caso 2: Lead Qualification

**Workflow:**
1. Lead "XYZ Corp" é criado em `/leads`
2. Analyst qualifica lead → cria company:
   ```
   Lead.qualified_company_id = new Company("XYZ Corp")
   Lead.status = qualified
   ```
3. Company agora rastreável para futuros deals

## 👤 Contacts (Contatos)

### Conceito

Um Contact representa uma pessoa física com quem você se relaciona profissionalmente.

**Características:**
- Pode estar associado a uma Company (opcional)
- Pode existir independentemente (ex: advisor individual)
- Rastreado para networking e relationship management

**Rota:** `/contacts`

### Campos

**Campos Principais:**
- `name` (obrigatório) - Nome completo
- `email` - Email profissional
- `phone` - Telefone
- `role` - Cargo/Função na empresa
- `company_id` (opcional) - FK para companies
- `is_primary` - Se é contato principal da company
- `linkedin` - URL do LinkedIn
- `department` - Departamento/Área
- `notes` - Notas sobre o contato
- `origin` - Como conheceu (ex: "referral", "event", "cold_email")

**Campos de Sistema:**
- `id` - UUID
- `created_at`, `updated_at`
- `created_by`, `updated_by`

### Funcionalidades

#### Criar Contact

**Rota:** 
- `/contacts` → "Novo Contato"
- `/companies/:id` → "Add Contact"

**Formulário:**
```typescript
{
  name: string (required)
  email: string (optional, validated)
  phone: string (optional)
  role: string (optional)
  company_id: UUID (optional, autocomplete)
  is_primary: boolean (default: false)
  linkedin: string (optional, URL)
  department: string (optional)
  notes: string (optional)
  origin: string (optional)
}
```

**Validações:**
- Email deve ser válido (se fornecido)
- LinkedIn deve ser URL válida (se fornecido)
- Se company_id fornecido, company deve existir
- Apenas 1 contact pode ser `is_primary` por company

**Auto-linking:**
Se criado via company detail page, `company_id` é pre-filled.

#### Listar Contacts

**Rota:** `/contacts`

**Table Columns:**
- Name
- Email
- Phone
- Role
- Company (linked)
- Actions

**Filtros:**
- **Search:** Name, email, role, company name
- **Company:** Dropdown de companies
- **Has Email:** Sim/Não
- **Primary Only:** Mostrar apenas primary contacts

**Ordenação:**
- Por Name (default)
- Por Company
- Por Created Date

#### Visualizar Contact Detail

**Rota:** `/contacts/:id`

**Seções:**

1. **Contact Info**
   - Name, Email, Phone
   - Role, Department
   - Company (linked)
   - LinkedIn (clickable)
   - Origin
   - Notes

2. **Associated Company** (se company_id existe)
   - Company card com link
   - Primary contact indicator

3. **Related Leads** (Tab)
   - Leads onde este contact está linkado
   - Via `lead_contacts` junction table

4. **Activity Log** (Tab)
   - Interactions registradas
   - Emails (se Gmail integration configurada)
   - Meetings (se Calendar integration configurada)

5. **Comments** (Tab)
   - Notas da equipe sobre o contato

#### Editar Contact

**Campos Editáveis:** Todos exceto system fields

**Permissões:** Admin, Analyst, New Business

#### Deletar Contact

**Comportamento:**
- Hard delete (sem soft delete para contacts)
- Se `is_primary`, company fica sem primary (precisa designar novo)
- Leads associations são removidas

**Confirmação:**
```
"Deletar [Contact Name]?"
"Este contato está associado a X leads."
[ Cancelar ] [ Deletar ]
```

### Primary Contact

**Conceito:**
Cada company pode ter 1 primary contact - a pessoa principal de contato.

**Features:**
- Badge visual: "Primary" no contact card
- Listagem rápida: `/companies/:id` mostra primary contact em destaque
- Business rules: Apenas 1 primary por company

**Toggle Primary:**
```
Company Detail → Contacts Tab → Contact Row → "Set as Primary"
→ Remove primary flag de outros contacts da mesma company
→ Seta este contact como primary
```

### Linking Contacts ↔ Companies

**Scenarios:**

1. **Contact criado sem company:**
   ```
   Contact: João Silva (independent advisor)
   company_id: null
   ```
   Depois pode associar: Edit Contact → Select Company

2. **Contact criado via company:**
   ```
   Company Detail → Add Contact
   → company_id auto-filled
   ```

3. **Contact mudou de empresa:**
   ```
   Edit Contact
   → Change company_id
   → is_primary automatically set to false
   ```

## 🔗 Integrações

### Com Leads

**Lead → Company:**
- Lead qualification cria ou associa company
- `leads.qualified_company_id` = `companies.id`
- Traceability mantida

**Lead ↔ Contacts:**
- Junction table: `lead_contacts`
- Multiple contacts por lead
- `is_primary` flag

**Workflow:**
```
1. Lead "Acme Corp" criado
2. Add contact: João (CEO), Maria (CFO)
3. Qualify lead → Create company "Acme Corp"
4. Contacts automaticamente associados à nova company
```

### Com Deals

**Company como Client:**
- Master Deal pode referenciar company
- Facilita análise de deals por cliente

**Company como Player:**
- Player Track pode linkar para company
- Análise de quem investe no que

### Com Custom Fields

Companies e Contacts podem ter custom fields:

**Exemplos:**
- Company: "Setor de Atuação", "Número de Funcionários", "Faturamento Anual"
- Contact: "Aniversário", "Preferência de Contato", "Idiomas"

**Configuração:** `/settings/custom-fields`

### Com Activity Log

Todas as ações são logadas:
- Company created/updated/deleted
- Contact created/updated/deleted
- Linking/unlinking
- Primary contact changes

## 📊 Analytics

**Métricas Disponíveis:**

**Por Companies:**
- Total companies por type
- Distribution por relationship_level
- Conversion rate (prospect → active_client)
- Churn rate (active_client → churned)
- Companies sem contacts associados

**Por Contacts:**
- Total contacts
- Contacts sem email
- Contacts sem company
- Primary vs non-primary ratio
- Origin distribution

**Rota:** `/analytics` (se analytics dashboard incluir CRM metrics)

## 🔐 Permissões

### Companies

**View:**
- ✅ Todos os roles podem ver companies ativas
- ✅ Admin pode ver deleted companies

**Create/Update/Delete:**
- ✅ Admin, Analyst, New Business
- ❌ Client (read-only)

**RLS Policy:**
```sql
-- View policy
CREATE POLICY "Companies viewable by everyone" 
ON companies FOR SELECT 
USING (deleted_at IS NULL);

-- Manage policy
CREATE POLICY "Companies manageable by users" 
ON companies FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'analyst', 'newbusiness')
  )
);
```

### Contacts

**View:**
- ✅ Todos os roles

**Manage:**
- ✅ Admin, Analyst, New Business
- ❌ Client

**RLS Policy:**
```sql
CREATE POLICY "Contacts viewable by everyone" 
ON contacts FOR SELECT 
USING (true);

CREATE POLICY "Contacts manageable by users" 
ON contacts FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'analyst', 'newbusiness')
  )
);
```

## 🎨 UI/UX

### Shared List Layout

Companies e Contacts seguem o padrão `SharedListLayout`:

**Features:**
- Header fixo
- Filters bar integrada
- Paginação no footer
- Actions column sempre visível
- Responsive design

**Consistência:**
Mesma UX de `/deals`, `/leads` para familiaridade.

### Visual Indicators

**Company Type Icons:**
- Corporation: Building icon
- Fund: Bank icon  
- Startup: Rocket icon
- Advisor: Users icon
- Other: Briefcase icon

**Relationship Level Colors:**
- None: Gray
- Prospect: Yellow
- Active Client: Green
- Partner: Blue
- Churned: Red

**Primary Contact Badge:**
- Star icon + "Primary" label

## 🧪 Testing

**Test Cases:**

1. **CRUD Operations**
   - Create, read, update, delete companies
   - Create, read, update, delete contacts

2. **Associations**
   - Link contact to company
   - Set primary contact
   - Only 1 primary per company

3. **Permissions**
   - Client cannot create/edit
   - Admin can see deleted

4. **Lead Integration**
   - Qualify lead → creates company
   - Contacts transfer to company

5. **Search & Filters**
   - Filter by type/relationship
   - Search by name/cnpj
   - Pagination works correctly

## 🔧 Troubleshooting

### Contact não aparece na company

**Causas:**
1. `company_id` é null
2. Company foi deleted

**Solução:**
```sql
SELECT c.*, co.name as company_name
FROM contacts c
LEFT JOIN companies co ON c.company_id = co.id
WHERE c.id = 'contact-uuid';
```

### Dois contacts primary na mesma company

**Causa:** Business rule não enforced

**Solução:**
```sql
-- Fix data
UPDATE contacts 
SET is_primary = false 
WHERE company_id = 'company-uuid';

-- Set correct primary
UPDATE contacts 
SET is_primary = true 
WHERE id = 'correct-primary-uuid';
```

### CNPJ não valida

**Causa:** Formato incorreto

**Solução:**
- Formato esperado: `XX.XXX.XXX/XXXX-XX`
- Implementar validator no frontend
- Backend pode aceitar sem formatação e formatar automaticamente

## 📚 Referências

**Código:**
- Companies: `src/features/companies/`
- Contacts: `src/features/contacts/`
- Pages: `CompaniesListPage.tsx`, `CompanyDetailPage.tsx`, `ContactDetailPage.tsx`

**Schema:**
- Tables: `companies`, `contacts`
- Migration: `supabase/migrations/007_leads_and_contacts.sql`
- Junction: `lead_contacts`

**Documentação Relacionada:**
- [Leads](leads.md) - Lead qualification workflow
- [Deals](deals.md) - Deal flow management
- [RBAC](rbac.md) - Permissões e roles

---

**Última atualização:** 06/12/2025  
**Status:** ✅ Feature completamente implementada  
**Mantido por:** PipeDesk Team
