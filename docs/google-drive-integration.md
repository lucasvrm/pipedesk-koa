# Integração com Google Drive

Este guia descreve como configurar e operar a automação de pastas e documentos do Google Drive com delegação de domínio, OAuth do usuário e templates de estrutura/documentos. Ele também consolida convenções de nomenclatura, fluxos de criação automática e regras de ACL herdadas por função.

## Autenticação e delegação

### Delegação de domínio com conta de serviço + OAuth do usuário
- **Conta de serviço com delegação ampla**: crie uma conta de serviço no Google Cloud, ative a opção **Enable domain-wide delegation**, gere o JSON de credenciais e autorize no Admin Console os escopos `https://www.googleapis.com/auth/drive` e, se necessário, `https://www.googleapis.com/auth/drive.activity.readonly`.
- **Consentimento do usuário**: os usuários fazem OAuth (client ID/secret e redirect URI configurados no mesmo projeto) para vincular a conta corporativa e fornecer o `sub` que será usado como **subject** na delegação. O token do usuário não é usado para uploads, apenas para confirmar ownership e recuperar perfil/foto.
- **Impersonação controlada**: todas as ações em Drive usam a conta de serviço impersonando o usuário autenticado (ou o e-mail padrão de integração), garantindo auditoria por usuário e evitando limites de quota da conta de serviço.

### APIs obrigatórias e opcionais
- **Drive API**: obrigatória para criação de pastas, uploads, permissões e cópia de arquivos-modelo.
- **Drive Activity API** (opcional): habilite apenas se precisar registrar histórico de visualizações/edições; a funcionalidade principal de criação e ACL funciona sem ela.

### Políticas de ACL herdadas por role
- **Admin** → `owner` da raiz do cliente/deal e das pastas derivadas.
- **Gestor** → `organizer` nas pastas e `writer` nos arquivos, herdando para subpastas.
- **Colaborador** → `writer` nas pastas/arquivos criados pelo evento disparado.
- **Leitor/Convidado** → `reader` com herança automática; permissões explícitas adicionais só são adicionadas quando o tipo de documento exigir colaboradores externos.
- As ACLs são aplicadas ao criar a pasta e reaplicadas em novas subpastas/arquivos para manter consistência hierárquica.

## Configuração

1. **Credenciais**
   - `GOOGLE_SERVICE_ACCOUNT_JSON` ou caminho para o arquivo de credenciais.
   - `GOOGLE_DELEGATED_USER` (fallback quando o usuário ainda não fez OAuth) e `GOOGLE_OAUTH_CLIENT_ID`/`GOOGLE_OAUTH_CLIENT_SECRET`/`GOOGLE_OAUTH_REDIRECT`.
   - `DRIVE_ACTIVITY_ENABLED=true` apenas quando a API estiver habilitada no projeto.
2. **Scopes autorizados**: Drive sempre habilitado; Drive Activity somente quando `DRIVE_ACTIVITY_ENABLED=true`.
3. **Supabase**: nenhuma migração adicional é necessária; use as tabelas abaixo para estruturar templates e tipos de documento.

### Tabelas de Templates de Estrutura
- **`drive_structure_templates`**: define a hierarquia e a convenção de nomes.
  - Campos: `id` (uuid), `entity_type` (`client`, `lead`, `deal`, `pf`, `pj`), `name`, `path_pattern` (ex.: `{{root}}/010_Leads/{{lead_number}}_{{lead_name}}`), `version` (ex.: `v1`), `active` (bool), `created_at`.
  - Exemplo PF: `{{root}}/001_Clientes/PF/{{customer_number}}_{{customer_name}}/Docs_Pessoais`.
  - Exemplo PJ: `{{root}}/001_Clientes/PJ/{{customer_number}}_{{company_name}}/Contratos`.
- **`drive_structure_nodes`**: representa cada pasta/subpasta do template.
  - Campos: `template_id` (fk), `order` (int para prefixos numéricos), `folder_name` (sem prefixo), `full_prefix` (ex.: `020_Pipeline`), `parent_node_id` (fk), `on_demand` (bool), `description`.
  - Permite subpastas sob demanda marcadas como `on_demand=true` para criação apenas quando acionadas.

### Tabelas de Tipos de Documento
- **`drive_document_types`**: catálogo de documentos esperados.
  - Campos: `id`, `template_id` (fk opcional), `label`, `folder_node_id` (onde será salvo), `required_placeholders` (jsonb), `optional_placeholders` (jsonb), `versioning` (`v1+timestamp`), `requires_external_access` (bool), `created_at`.
  - Exemplo: `Comprovante de Endereço` com `required_placeholders=["customer_name","address"]` e `optional_placeholders=["billing_cycle"]`.
- **`drive_document_templates`**: arquivos-modelo associados a um tipo.
  - Campos: `document_type_id`, `drive_file_id` (ID do modelo), `mime_type`, `locale`, `created_at`.
  - Usado para cópia inicial e resolução de placeholders antes do upload final.
- **`drive_document_uploads`**: registros de uploads guiados.
  - Campos: `id`, `document_type_id`, `entity_id` (lead/deal), `uploader_id`, `drive_file_id`, `resolved_placeholders` (jsonb), `status` (`pending`, `ready`, `uploaded`), `created_at`.

## Convenções de hierarquia e nomenclatura
- **Raiz**: `{{root}}/001_Clientes` com separadores `PF` e `PJ`; `010_Leads` para leads antes da conversão; `020_Deals` para oportunidades ativas.
- **Prefixos numéricos**: cada nível recebe prefixo sequencial (`001_`, `002_`), preservado em subpastas (`001_Docs`, `002_Assinaturas`).
- **Regras por entidade**:
  - **Clientes (PF)**: `{{root}}/001_Clientes/PF/{{customer_number}}_{{customer_name}}/v{{version}}_{{timestamp}}`.
  - **Clientes (PJ)**: `{{root}}/001_Clientes/PJ/{{customer_number}}_{{company_name}}/v{{version}}_{{timestamp}}`.
  - **Leads**: `{{root}}/010_Leads/{{lead_number}}_{{lead_name}}/v{{version}}_{{timestamp}}`.
  - **Deals**: `{{root}}/020_Deals/{{deal_number}}_{{deal_name}}/Fase_{{stage}}/v{{version}}_{{timestamp}}`.
- **Versionamento**: `v1`, `v2`... sempre acompanhados de timestamp ISO curto (`2024-07-01T12-30Z`) para rastreabilidade; novas versões criam subpasta dentro da entidade.

## Fluxos automáticos

### Criação automática por evento/etapa
- **Lead criado** → cria a raiz em `010_Leads` seguindo o template `lead` e aplica ACL herdada.
- **Conversão de lead para cliente/deal** → move/recopia pastas para `001_Clientes/PF|PJ` e `020_Deals`, preservando histórico e versões.
- **Mudança de fase do deal** → cria subpasta `Fase_<stage>` e copia arquivos-modelo relevantes para a etapa.
- **Solicitação de documento** → cria subpasta on-demand marcada no template e agenda upload guiado.

### Resolução de placeholders
- Placeholders são substituídos com dados da entidade (nome, número, CNPJ/CPF, stage, datas-chave).
- Placeholders obrigatórios impedem criação/upload até estarem preenchidos; os opcionais são removidos ou substituídos por valor padrão.
- Ao copiar um arquivo-modelo, o conteúdo é processado para inserir valores resolvidos e registrar em `drive_document_uploads.resolved_placeholders`.

### Uploads guiados por tipo de documento
- Usuário escolhe o tipo; o sistema sugere arquivo-modelo e destino (`folder_node_id`).
- Validação exige todos os `required_placeholders` resolvidos; em falta, a UI aponta os campos ausentes.
- Se `requires_external_access=true`, a ACL adiciona o colaborador externo como `reader` ou `commenter` apenas no arquivo.

### Subpastas sob demanda e arquivos-modelo
- Templates com `on_demand=true` só são criados quando um evento/ação explícita dispara (ex.: solicitação de KYC adicional).
- Arquivos-modelo podem ser armazenados em uma pasta de modelos compartilhada; o sistema copia para a subpasta de destino já com placeholders resolvidos.
- O prefixo numérico e o versionamento são preservados tanto na subpasta quanto nos arquivos gerados.

