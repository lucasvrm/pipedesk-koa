# Integração Google Drive via `pd-google`

## Visão Geral

A integração de documentos do PipeDesk com Google Drive é feita através do serviço `pd-google` (FastAPI), exposto como um microsserviço independente.

O frontend (`pipedesk-koa`) **não fala diretamente com a API do Google Drive**.  
Ele consome endpoints HTTP do `pd-google`, que encapsula:

- Criação da pasta raiz da entidade
- Aplicação de templates de estrutura de pastas
- Upload de arquivos
- Controle de permissões (nível de acesso por papel)

---

## 1. Mapeamento de `entity_type`

### 1.1. Valores usados no `pd-google`

No `pd-google`, a tabela `google_drive_folders` armazena:

- `entity_type: String`
- `entity_id: String`
- `folder_id: String` (pasta raiz no Drive)

Os `entity_type` atualmente padronizados entre app e backend são:

| Entidade de negócio | `entity_type` no `pd-google` |
| -------------------- | ---------------------------- |
| Lead                 | `lead`                       |
| Empresa (Company)    | `company`                    |
| Contato              | `contact`                    |
| Deal (Master Deal)   | `deal`                       |

### 1.2. Correspondência com o schema Supabase

No Supabase, as entidades e usos típicos de `entity_type` são:

- `lead` → tabela `leads`
- `company` → tabela `companies`
- `deal` → tabela `deals` (usada para master deal)
- `contact` → tabela `contacts` (ainda não usada em colunas polimórficas, mas reservada para esta integração)

O **contrato** é:

> O `entity_id` enviado pelo frontend para o `pd-google` é o mesmo `id` da entidade correspondente no Supabase.

---

## 2. Autenticação e Identidade (Headers)

O `pd-google` **não lida com login/autenticação** diretamente.  
Ele recebe a identidade do usuário através de headers HTTP, enviados pelo frontend.

### 2.1. Headers utilizados

- `x-user-id`: `string`
  - `users.id` do Supabase (ou equivalente) identificando o usuário logado.
- `x-user-role`: `string`
  - Papel de negócio do usuário no app.

Exemplo de chamada:

```http
GET /drive/deal/123 HTTP/1.1
Host: google-api-xwhd.onrender.com
x-user-id: 8d4e5f52-1234-5678-90ab-abcdef123456
x-user-role: admin
