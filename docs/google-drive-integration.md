# Integração Google Drive (Conta de Serviço)

Este documento descreve como a UI do Pipedesk passa a consumir o Google Drive via uma conta de serviço, a convenção de pastas para cada entidade e como as permissões dinâmicas são persistidas em `system_settings`.

## Componentes e serviços criados/atualizados

- **Serviço**: `src/services/googleDriveService.ts`
  - Expõe operações de pasta/arquivo (`listEntityDocuments`, `uploadFiles`, `createFolder`, `deleteFile`, `deleteFolder`, `getFileLink`).
  - Define convenção de hierarquia: `Pipedesk Drive` → coleção por tipo (`Leads`, `Deals`, `Empresas`, `Usuarios`, `Tracks`, `Tasks`) → pasta da entidade (`<Coleção> - <id> - <nome>`), com subpasta `Uploads` gerada automaticamente.
  - Persiste ACL dinâmica em `system_settings` na chave `drive.permissions`, já inicializada com as regras solicitadas (admin/analista = full; novos_negocios = full em próprios leads/deals; cliente = leitura em próprios deals).
  - Implementação local mock (localStorage/memória) para permitir uso mesmo sem backend ainda publicado; ao apontar para um backend, substituir o adapter interno.

- **Hook**: `src/hooks/useDriveDocuments.ts`
  - Consulta e invalida cache via React Query para listar pastas/arquivos por entidade.
  - Disponibiliza mutações de criação de pasta, upload e exclusão.
  - Expõe `rootFolderId` para que a UI saiba qual é a “raiz” da entidade dentro do Drive.

- **UI**: `src/components/DocumentManager.tsx`
  - Agora consome o hook do Drive, com breadcrumbs reais, exclusão com tratamento de erro, download via link do Drive e mensagens de sincronização.
  - Log de atividade permanece, reutilizando o `logActivity` com os nomes enviados.

- **Perfil do usuário**: `src/pages/Profile.tsx`
  - Upload dos documentos pessoais passou a usar o serviço do Drive, gravando o ID do arquivo na tabela `profiles` (campos `doc_*`).
  - Downloads passam a abrir o link retornado pelo Drive; o fallback mock usa data URLs.

## Como configurar (ambientes reais)

1. **Conta de serviço**: criar no Console Google Cloud, habilitar Google Drive API, gerar chave JSON e compartilhar a pasta raiz com a conta de serviço.
2. **Variáveis**: mapear a raiz no backend e expor via env (ex.: `VITE_DRIVE_ROOT_NAME` para o nome lógico). Tokens/JSON **não** devem ir para o front.
3. **Backend/adapter**: substituir o adapter mock por chamadas ao backend que faça proxy para o Drive com a conta de serviço. O contrato esperado é o mesmo usado em `googleDriveService` (upload, createFolder, delete, link).
4. **Permissões dinâmicas**: ajustar a chave `drive.permissions` em `system_settings` na tela `/admin/settings` (tab Permissões) para refletir regras específicas de cada ambiente. O seed inicial já cobre admin, analista, novos_negocios e cliente.
5. **Migração do legado**: mover arquivos existentes do Supabase para o Drive e atualizar colunas com o novo `fileId`. O serviço atual já grava apenas IDs do Drive.

## Convenção de nomes e hierarquia

- **Coleções**: `Leads`, `Deals`, `Empresas`, `Usuarios`, `Tracks`, `Tasks`.
- **Pasta de entidade**: `<Coleção> - <id> - <nome-sanitizado>` (caracteres `/` e `\` são removidos).
- **Subpastas padrão**: `Uploads` (gerada automaticamente na criação da pasta da entidade).
- **Extensões adicionais**: se desejar adicionar `Contratos`/`Financeiro`/etc., basta criar via `createFolder` com `parentId` da pasta da entidade ou da subpasta desejada.

## Fluxo típico de uso

1. A UI chama `listEntityDocuments(entityId, entityType, entityName)`; o serviço garante que a hierarquia exista e retorna `folders`/`files` + `rootFolderId` da entidade.
2. Ao fazer upload, a UI envia `uploadFiles({ files, folderId, entityId, entityType, uploadedBy })`; o serviço armazena metadados e devolve IDs e links.
3. Exclusões usam `deleteFile` ou `deleteFolder`; a query é invalidada automaticamente para refletir o estado mais recente.
4. Downloads usam `getFileLink(fileId)`; no backend real, retornar link de visualização/assinatura do Drive.

## Próximos passos recomendados

- Substituir o adapter mock por integração real (fetch para API interna), mantendo o contrato atual.
- Incluir criação automática de pastas no backend quando novas entidades forem criadas (leads, deals, empresas, usuários) reutilizando `buildEntityFolderName` do serviço.
- Implementar migração programática dos arquivos legados do Supabase para o Drive, atualizando as colunas com os novos IDs.
