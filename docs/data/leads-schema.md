# Tabelas do Módulo de Leads

As tabelas abaixo compõem o módulo de Leads no esquema fornecido. Cada tabela apresenta suas colunas, tipos e detalhes principais.

## public.leads

| Coluna | Tipo | Detalhes |
| --- | --- | --- |
| id | uuid | Chave primária, `uuid_generate_v4()` por padrão. |
| legal_name | text | Razão social (obrigatória). |
| trade_name | text | Nome fantasia. |
| cnpj | text | CNPJ da empresa. |
| website | text | Site. |
| segment | text | Segmento de atuação. |
| address_city | text | Cidade do endereço. |
| address_state | text | Estado do endereço. |
| description | text | Descrição do lead. |
| status | text | Estado do lead; padrão `new`, valores: `new`, `contacted`, `qualified`, `disqualified`. |
| origin | text | Origem; padrão `outbound`, valores: `inbound`, `outbound`, `referral`, `event`, `other`. |
| owner_user_id | uuid | Dono do lead; FK para `public.profiles(id)`. |
| qualified_at | timestamptz | Data/hora de qualificação. |
| qualified_company_id | uuid | Empresa qualificada; FK para `public.companies(id)`. |
| qualified_master_deal_id | uuid | Master deal qualificado; FK para `public.master_deals(id)`. |
| created_at | timestamptz | Criado em; padrão `now()`. |
| updated_at | timestamptz | Atualizado em; padrão `now()`. |
| created_by | uuid | Criado por; FK para `public.profiles(id)`. |
| deleted_at | timestamptz | Data/hora de exclusão lógica. |
| is_synthetic | boolean | Flag sintético; padrão `false`. |
| operation_type | text | Tipo de operação; valores permitidos como `acquisition`, `merger`, `investment`, etc. |

## public.lead_contacts

| Coluna | Tipo | Detalhes |
| --- | --- | --- |
| lead_id | uuid | Parte da chave primária; FK para `public.leads(id)`. |
| contact_id | uuid | Parte da chave primária; FK para `public.contacts(id)`. |
| is_primary | boolean | Indica contato principal; padrão `false`. |
| added_at | timestamptz | Data de adição; padrão `now()`. |

## public.lead_members

| Coluna | Tipo | Detalhes |
| --- | --- | --- |
| lead_id | uuid | Parte da chave primária; FK para `public.leads(id)`. |
| user_id | uuid | Parte da chave primária; FK para `public.profiles(id)`. |
| role | text | Papel; padrão `collaborator`, valores: `owner`, `collaborator`, `watcher`. |
| added_at | timestamptz | Data de adição; padrão `now()`. |

Estas tabelas registram os leads e vinculam seus contatos e membros responsáveis.

## Campos dinâmicos acessíveis via /admin

Nenhuma das colunas listadas nas tabelas `leads`, `lead_contacts` ou `lead_members` é exposta para edição em rotas `/admin`. As telas de administração existentes (`/admin/settings`, `/admin/pipeline`, `/admin/tags`, `/admin/users`, `/admin/gerador-dados`, `/admin/integrations/google`) não incluem CRUD específico para essas tabelas; `/admin/settings` cobre apenas tabelas como `products`, `deal_sources`, `loss_reasons`, `player_categories`, `holidays`, `communication_templates`, `track_statuses`, `operation_types`, `task_statuses` e `task_priorities`. 【F:src/App.tsx†L108-L116】【F:src/pages/admin/SettingsPage.tsx†L63-L152】
