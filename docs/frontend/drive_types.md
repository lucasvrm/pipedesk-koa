# Drive Types Documentation

Este documento descreve todas as interfaces TypeScript exportadas pelo módulo `driveClient.ts` e sua relação com o contrato do backend.

## Visão Geral

O módulo `driveClient` fornece tipos seguros TypeScript para todas as operações com a API Drive. Todos os métodos retornam tipos explícitos e erros HTTP são encapsulados através da classe `DriveApiError`.

## Classes de Erro

### `DriveApiError`

Classe de erro customizada para encapsular erros da API Drive de forma previsível.

```typescript
export class DriveApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: string
  )
}
```

**Campos:**
- `message` (string): Mensagem descritiva do erro
- `statusCode` (number, opcional): Código de status HTTP da resposta
- `response` (string, opcional): Corpo da resposta de erro
- `name` (string): Sempre "DriveApiError"

**Uso:**
```typescript
try {
  await listDriveItems();
} catch (error) {
  if (error instanceof DriveApiError) {
    console.error(`API Error: ${error.message}`);
    console.error(`Status Code: ${error.statusCode}`);
    console.error(`Response: ${error.response}`);
  }
}
```

## Interfaces de Tipos

### `DriveItem`

Representa um item genérico no Drive (pode ser arquivo ou pasta).

```typescript
export interface DriveItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  url?: string;
  permission?: 'read' | 'write' | 'admin';
}
```

**Campos:**
- `id` (string): Identificador único do item
- `name` (string): Nome do item
- `type` ('file' | 'folder'): Tipo do item - arquivo ou pasta
- `size` (number, opcional): Tamanho em bytes (apenas para arquivos)
- `createdAt` (string): Data/hora de criação (ISO 8601)
- `updatedAt` (string, opcional): Data/hora da última atualização (ISO 8601)
- `parentId` (string, opcional): ID da pasta pai (se não for item raiz)
- `url` (string, opcional): URL de acesso ao item (principalmente para arquivos)
- `permission` ('read' | 'write' | 'admin', opcional): Nível de permissão do usuário atual sobre o item

**Relação com Backend:**
O backend retorna este tipo ao listar itens de uma pasta. O campo `type` permite diferenciar arquivos de pastas em listagens mistas.

### `DriveFolder`

Representa uma pasta no Drive.

```typescript
export interface DriveFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
  permission?: 'read' | 'write' | 'admin';
}
```

**Campos:**
- `id` (string): Identificador único da pasta
- `name` (string): Nome da pasta
- `parentId` (string, opcional): ID da pasta pai
- `createdAt` (string): Data/hora de criação (ISO 8601)
- `updatedAt` (string, opcional): Data/hora da última atualização (ISO 8601)
- `permission` ('read' | 'write' | 'admin', opcional): Nível de permissão do usuário atual sobre a pasta

**Relação com Backend:**
Retornado pelo backend ao criar uma pasta (`POST /api/drive/folders`). O campo `permission` indica o nível de acesso do usuário atual.

### `DriveFile`

Representa um arquivo no Drive.

```typescript
export interface DriveFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  folderId?: string;
  createdAt: string;
  updatedAt?: string;
  permission?: 'read' | 'write' | 'admin';
}
```

**Campos:**
- `id` (string): Identificador único do arquivo
- `name` (string): Nome do arquivo
- `size` (number): Tamanho do arquivo em bytes
- `mimeType` (string): Tipo MIME do arquivo (ex: 'application/pdf', 'image/jpeg')
- `url` (string): URL de acesso/download do arquivo
- `folderId` (string, opcional): ID da pasta onde o arquivo está armazenado
- `createdAt` (string): Data/hora de criação (ISO 8601)
- `updatedAt` (string, opcional): Data/hora da última atualização (ISO 8601)
- `permission` ('read' | 'write' | 'admin', opcional): Nível de permissão do usuário atual sobre o arquivo

**Relação com Backend:**
Retornado pelo backend ao fazer upload de um arquivo (`POST /api/drive/files`). O campo `url` é usado para acessar ou fazer download do arquivo.

### `DriveListResponse`

Representa a resposta completa de listagem de arquivos com paginação e permissões.

```typescript
export interface DriveListResponse {
  files: DriveItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  permission?: 'read' | 'write' | 'admin';
}
```

**Campos:**
- `files` (DriveItem[]): Array de itens (arquivos e pastas)
- `total` (number): Total de itens disponíveis (sem paginação)
- `page` (number): Número da página atual
- `page_size` (number): Quantidade de itens por página
- `total_pages` (number): Total de páginas disponíveis
- `permission` ('read' | 'write' | 'admin', opcional): Nível de permissão do usuário no contexto atual

**Relação com Backend:**
Esta interface define o contrato esperado para respostas de listagem paginadas do backend. Fornece todas as informações necessárias para implementar navegação por páginas na interface.

**Exemplo de Uso:**
```typescript
const response: DriveListResponse = {
  files: [/* array de DriveItem */],
  total: 150,
  page: 1,
  page_size: 50,
  total_pages: 3,
  permission: 'write'
};
```

### `ListDriveItemsResponse`

Resposta simplificada para listagem de itens (mantida para compatibilidade).

```typescript
export interface ListDriveItemsResponse {
  items: DriveItem[];
  total: number;
}
```

**Campos:**
- `items` (DriveItem[]): Array de itens do Drive
- `total` (number): Total de itens

**Relação com Backend:**
Esta é uma versão simplificada do `DriveListResponse`, usada quando a API não retorna informações de paginação completas. É o tipo de retorno atual da função `listDriveItems()`.

### `CreateDriveFolderResponse`

Resposta da criação de uma pasta.

```typescript
export interface CreateDriveFolderResponse {
  folder: DriveFolder;
}
```

**Campos:**
- `folder` (DriveFolder): Objeto com os dados da pasta criada

**Relação com Backend:**
Retornado pelo endpoint `POST /api/drive/folders` após criação bem-sucedida de uma pasta.

### `UploadDriveFileResponse`

Resposta do upload de um arquivo.

```typescript
export interface UploadDriveFileResponse {
  file: DriveFile;
}
```

**Campos:**
- `file` (DriveFile): Objeto com os dados do arquivo enviado

**Relação com Backend:**
Retornado pelo endpoint `POST /api/drive/files` após upload bem-sucedido de um arquivo.

### `DeleteResponse`

Resposta de operações de exclusão.

```typescript
export interface DeleteResponse {
  success: boolean;
  message?: string;
}
```

**Campos:**
- `success` (boolean): Indica se a exclusão foi bem-sucedida
- `message` (string, opcional): Mensagem descritiva sobre a operação

**Relação com Backend:**
Retornado pelos endpoints `DELETE /api/drive/files/:id` e `DELETE /api/drive/folders/:id` após exclusão de arquivos ou pastas.

## Tipos de Permissão

Todas as permissões seguem um modelo hierárquico:

- **`read`**: Permissão apenas de leitura
- **`write`**: Permissão de leitura e escrita
- **`admin`**: Permissão total (leitura, escrita e administração)

O backend determina as permissões com base no usuário autenticado e contexto do recurso.

## Funções Exportadas

Todas as funções abaixo são type-safe e lançam `DriveApiError` em caso de falha:

### `listDriveItems(folderId?, page?, limit?): Promise<ListDriveItemsResponse>`

Lista itens em uma pasta.

**Retorna:** `ListDriveItemsResponse` com array de itens e total
**Lança:** `DriveApiError` se a requisição falhar

### `createDriveFolder(name, parentId?): Promise<CreateDriveFolderResponse>`

Cria uma nova pasta.

**Retorna:** `CreateDriveFolderResponse` com dados da pasta criada
**Lança:** `DriveApiError` se a requisição falhar

### `uploadDriveFile(file, folderId?, onProgress?): Promise<UploadDriveFileResponse>`

Faz upload de um arquivo.

**Retorna:** `UploadDriveFileResponse` com dados do arquivo enviado
**Lança:** `DriveApiError` se a requisição falhar

### `deleteDriveFile(fileId): Promise<DeleteResponse>`

Deleta um arquivo.

**Retorna:** `DeleteResponse` confirmando a exclusão
**Lança:** `DriveApiError` se a requisição falhar

### `deleteDriveFolder(folderId, recursive?): Promise<DeleteResponse>`

Deleta uma pasta.

**Retorna:** `DeleteResponse` confirmando a exclusão
**Lança:** `DriveApiError` se a requisição falhar

## Relação com o Backend

### Endpoints da API

| Função | Método HTTP | Endpoint | Request Body | Response Type |
|--------|-------------|----------|--------------|---------------|
| `listDriveItems` | GET | `/api/drive/items?page=1&limit=50&folderId=...` | - | `ListDriveItemsResponse` |
| `createDriveFolder` | POST | `/api/drive/folders` | `{ name, parentId? }` | `CreateDriveFolderResponse` |
| `uploadDriveFile` | POST | `/api/drive/files` | FormData | `UploadDriveFileResponse` |
| `deleteDriveFile` | DELETE | `/api/drive/files/:id` | - | `DeleteResponse` |
| `deleteDriveFolder` | DELETE | `/api/drive/folders/:id?recursive=true` | - | `DeleteResponse` |

### Autenticação

Todas as requisições incluem o token de autenticação do Supabase no header:
```
Authorization: Bearer <token>
```

### Tratamento de Erros

O backend pode retornar os seguintes códigos de erro HTTP:

| Código | Significado |
|--------|-------------|
| 400 | Bad Request - Parâmetros inválidos |
| 401 | Unauthorized - Token inválido ou ausente |
| 403 | Forbidden - Usuário sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito na operação (ex: pasta não vazia) |
| 413 | Payload Too Large - Arquivo muito grande |
| 500 | Internal Server Error - Erro no servidor |

Todos esses erros são encapsulados em `DriveApiError` com `statusCode` e `response` apropriados.

## Exemplos de Uso

### Listagem com Tratamento de Erro

```typescript
import { listDriveItems, DriveApiError } from '@/lib/driveClient';

try {
  const result = await listDriveItems('folder-123', 1, 20);
  console.log(`Total: ${result.total}`);
  console.log(`Items:`, result.items);
} catch (error) {
  if (error instanceof DriveApiError) {
    if (error.statusCode === 404) {
      console.error('Pasta não encontrada');
    } else if (error.statusCode === 403) {
      console.error('Sem permissão para acessar esta pasta');
    } else {
      console.error(`Erro: ${error.message}`);
    }
  }
}
```

### Upload com Type Safety

```typescript
import { uploadDriveFile, DriveFile } from '@/lib/driveClient';

async function handleUpload(file: File) {
  try {
    const response = await uploadDriveFile(file, 'folder-123', (progress) => {
      console.log(`Upload: ${progress}%`);
    });
    
    // TypeScript sabe que response.file é do tipo DriveFile
    const uploadedFile: DriveFile = response.file;
    console.log(`Arquivo enviado: ${uploadedFile.url}`);
    console.log(`Tamanho: ${uploadedFile.size} bytes`);
    console.log(`Tipo: ${uploadedFile.mimeType}`);
  } catch (error) {
    // Erro já encapsulado em DriveApiError
    console.error('Falha no upload:', error);
  }
}
```

### Criação de Pasta com Permissões

```typescript
import { createDriveFolder, DriveFolder } from '@/lib/driveClient';

async function createFolder(name: string, parentId?: string) {
  const response = await createDriveFolder(name, parentId);
  const folder: DriveFolder = response.folder;
  
  // Verificar permissões
  if (folder.permission === 'admin') {
    console.log('Você tem controle total sobre esta pasta');
  } else if (folder.permission === 'write') {
    console.log('Você pode editar esta pasta');
  } else {
    console.log('Você tem acesso apenas de leitura');
  }
  
  return folder;
}
```

## Conclusão

Todos os tipos exportados pelo `driveClient.ts` são:

1. **Type-safe**: TypeScript garante verificação de tipos em tempo de compilação
2. **Documentados**: Cada interface tem documentação JSDoc completa
3. **Consistentes**: Seguem convenções do backend e padrões REST
4. **Previsíveis**: Erros HTTP são encapsulados em `DriveApiError` com informações estruturadas
5. **Extensíveis**: Campos opcionais como `permission` e `updatedAt` permitem evolução do contrato

Esta documentação deve ser mantida atualizada conforme o contrato do backend evolui.
