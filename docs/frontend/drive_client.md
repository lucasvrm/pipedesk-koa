# Drive Client

Este documento descreve o uso do módulo `driveClient` para integração com o backend externo de armazenamento (Drive API).

## Visão Geral

O `driveClient` fornece funções para gerenciar arquivos e pastas em um backend externo de armazenamento, utilizando autenticação via Supabase. Todas as requisições são feitas usando o token de acesso do usuário atual.

## Configuração

Antes de usar o cliente, certifique-se de configurar a variável de ambiente:

```env
VITE_DRIVE_API_URL=https://seu-backend.onrender.com
```

Esta URL deve apontar para a base da API do seu backend de armazenamento.

## Autenticação

O cliente automaticamente obtém o token de acesso do Supabase e o envia em todas as requisições como:

```
Authorization: Bearer <token>
```

## Funções Disponíveis

### `listDriveItems`

Lista itens (arquivos e pastas) em uma pasta específica ou na raiz.

**Assinatura:**
```typescript
async function listDriveItems(
  folderId?: string,
  page?: number,
  limit?: number
): Promise<ListDriveItemsResponse>
```

**Parâmetros:**
- `folderId` (opcional): ID da pasta para listar. Se não fornecido, lista itens da raiz.
- `page` (opcional): Número da página para paginação. Padrão: `1`
- `limit` (opcional): Número de itens por página. Padrão: `50`

**Retorno:**
```typescript
interface ListDriveItemsResponse {
  items: DriveItem[];
  total: number;
}

interface DriveItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  url?: string;
}
```

**Exemplo de uso:**
```typescript
import { listDriveItems } from '@/lib/driveClient';

// Listar itens da raiz
const rootItems = await listDriveItems();
console.log(`Total de itens: ${rootItems.total}`);
console.log(rootItems.items);

// Listar itens de uma pasta específica
const folderItems = await listDriveItems('pasta-123');

// Listar com paginação
const page2 = await listDriveItems('pasta-123', 2, 25);
```

### `createDriveFolder`

Cria uma nova pasta no Drive.

**Assinatura:**
```typescript
async function createDriveFolder(
  name: string,
  parentId?: string
): Promise<CreateDriveFolderResponse>
```

**Parâmetros:**
- `name`: Nome da pasta a ser criada
- `parentId` (opcional): ID da pasta pai. Se não fornecido, cria na raiz.

**Retorno:**
```typescript
interface CreateDriveFolderResponse {
  folder: DriveFolder;
}

interface DriveFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
}
```

**Exemplo de uso:**
```typescript
import { createDriveFolder } from '@/lib/driveClient';

// Criar pasta na raiz
const rootFolder = await createDriveFolder('Meus Documentos');
console.log(`Pasta criada: ${rootFolder.folder.id}`);

// Criar subpasta
const subFolder = await createDriveFolder('Contratos', rootFolder.folder.id);
```

### `uploadDriveFile`

Faz upload de um arquivo para o Drive.

**Assinatura:**
```typescript
async function uploadDriveFile(
  file: File,
  folderId?: string,
  onProgress?: (progress: number) => void
): Promise<UploadDriveFileResponse>
```

**Parâmetros:**
- `file`: Objeto File a ser enviado
- `folderId` (opcional): ID da pasta onde o arquivo deve ser armazenado
- `onProgress` (opcional): Callback para acompanhar o progresso. **Nota:** Atualmente só é chamado ao finalizar (100%). Para progresso em tempo real, uma implementação customizada seria necessária.

**Retorno:**
```typescript
interface UploadDriveFileResponse {
  file: DriveFile;
}

interface DriveFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  folderId?: string;
  createdAt: string;
}
```

**Exemplo de uso:**
```typescript
import { uploadDriveFile } from '@/lib/driveClient';

// Upload básico
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const result = await uploadDriveFile(file);
console.log(`Arquivo enviado: ${result.file.url}`);

// Upload com pasta específica e callback de conclusão
const uploadWithProgress = await uploadDriveFile(
  file,
  'pasta-123',
  (progress) => {
    // Atualmente chamado apenas com 100% ao finalizar
    console.log(`Upload completo: ${progress}%`);
  }
);
```

### `deleteDriveFile`

Deleta um arquivo do Drive.

**Assinatura:**
```typescript
async function deleteDriveFile(fileId: string): Promise<DeleteResponse>
```

**Parâmetros:**
- `fileId`: ID do arquivo a ser deletado

**Retorno:**
```typescript
interface DeleteResponse {
  success: boolean;
  message?: string;
}
```

**Exemplo de uso:**
```typescript
import { deleteDriveFile } from '@/lib/driveClient';

const result = await deleteDriveFile('arquivo-123');
if (result.success) {
  console.log('Arquivo deletado com sucesso!');
}
```

### `deleteDriveFolder`

Deleta uma pasta do Drive.

**Assinatura:**
```typescript
async function deleteDriveFolder(
  folderId: string,
  recursive?: boolean
): Promise<DeleteResponse>
```

**Parâmetros:**
- `folderId`: ID da pasta a ser deletada
- `recursive` (opcional): Se `true`, deleta a pasta e todo seu conteúdo. Padrão: `false`

**Retorno:**
```typescript
interface DeleteResponse {
  success: boolean;
  message?: string;
}
```

**Exemplo de uso:**
```typescript
import { deleteDriveFolder } from '@/lib/driveClient';

// Deletar pasta vazia
const result = await deleteDriveFolder('pasta-123');

// Deletar pasta e todo seu conteúdo
const resultRecursive = await deleteDriveFolder('pasta-123', true);
if (resultRecursive.success) {
  console.log('Pasta e conteúdo deletados!');
}
```

## Tratamento de Erros

Todas as funções podem lançar exceções em caso de erro. É recomendado usar `try-catch` para tratá-las:

```typescript
import { listDriveItems } from '@/lib/driveClient';

try {
  const items = await listDriveItems();
  console.log(items);
} catch (error) {
  console.error('Erro ao listar itens:', error);
  // Tratar erro apropriadamente
}
```

### Erros Comuns

- **"Drive API URL not configured"**: A variável `VITE_DRIVE_API_URL` não está configurada
- **"No authentication token available"**: Usuário não está autenticado ou token expirou
- **HTTP 401**: Token de autenticação inválido ou expirado
- **HTTP 403**: Usuário não tem permissão para a operação
- **HTTP 404**: Arquivo ou pasta não encontrado
- **HTTP 409**: Conflito (ex: tentar deletar pasta não vazia sem `recursive`)
- **HTTP 413**: Arquivo muito grande

## Integração com React

Exemplo de uso em um componente React:

```typescript
import { useState } from 'react';
import { listDriveItems, uploadDriveFile, DriveItem } from '@/lib/driveClient';

function DriveExplorer() {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | undefined>();

  const loadItems = async (folderId?: string) => {
    setLoading(true);
    try {
      const response = await listDriveItems(folderId);
      setItems(response.items);
      setCurrentFolder(folderId);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      alert('Erro ao carregar itens do Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await uploadDriveFile(file, currentFolder, (progress) => {
        console.log(`Upload: ${progress}%`);
      });
      console.log('Arquivo enviado:', result.file);
      await loadItems(currentFolder); // Recarregar lista
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload do arquivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Drive Explorer</h1>
      <input type="file" onChange={handleFileUpload} disabled={loading} />
      
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <ul>
          {items.map(item => (
            <li key={item.id}>
              {item.type === 'folder' ? '📁' : '📄'} {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DriveExplorer;
```

## Notas de Implementação

- O cliente usa `safeFetch` internamente para garantir tratamento adequado de respostas HTML inesperadas
- Todos os logs de erro são prefixados com `[DriveClient]` para facilitar debugging
- As requisições são autenticadas automaticamente usando o token do Supabase
- O callback `onProgress` da função `uploadDriveFile` é atualmente limitado a indicar apenas a conclusão (100%). Para progresso em tempo real, seria necessária uma implementação customizada usando ReadableStream ou XMLHttpRequest com eventos de progresso.

## Próximos Passos

Possíveis melhorias futuras:
- Implementar progresso de upload real (0-100%) usando XMLHttpRequest
- Adicionar suporte a download de arquivos
- Implementar cache de listagens
- Adicionar suporte a busca/filtro de arquivos
- Implementar compartilhamento de arquivos/pastas
