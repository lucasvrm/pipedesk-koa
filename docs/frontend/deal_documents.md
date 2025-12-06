# Documentação: Aba de Documentos na Deal Detail Page

## Visão Geral

Esta documentação descreve a implementação da aba "Documentos" na página de detalhes do negócio (Deal Detail Page), que utiliza o `driveClient.ts` para listar e exibir documentos associados a um negócio.

## Arquitetura

### Componentes Principais

1. **DealDetailPage** (`src/features/deals/pages/DealDetailPage.tsx`)
   - Página principal de detalhes do negócio
   - Contém a estrutura de abas (Players, Docs, Atividades)
   - Renderiza o componente `DealDocumentsList` na aba "Docs"

2. **DealDocumentsList** (`src/features/deals/components/DealDocumentsList.tsx`)
   - Componente responsável por listar documentos de um negócio
   - Utiliza `driveClient.listDriveItems("deal", dealId)` para buscar documentos
   - Exibe os documentos em formato de tabela

3. **driveClient** (`src/lib/driveClient.ts`)
   - Cliente HTTP para comunicação com a API do Drive
   - Suporta consultas baseadas em entidade (entity-based queries)
   - Função principal: `listDriveItems(entityType, entityId)`

## Implementação Detalhada

### 1. Extensão do driveClient

O `driveClient.ts` foi estendido para suportar dois tipos de consultas:

#### Consulta por Pasta (Folder-based)
```typescript
// Lista itens de uma pasta específica
const items = await listDriveItems('folder-id-123')
```

#### Consulta por Entidade (Entity-based)
```typescript
// Lista itens associados a uma entidade
const items = await listDriveItems('deal', 'deal-id-123')
```

**Assinatura da Função:**
```typescript
export async function listDriveItems(
  folderIdOrEntityType?: string,
  entityId?: string | number,
  page: number = 1,
  limit: number = 50
): Promise<ListDriveItemsResponse>
```

**Parâmetros:**
- `folderIdOrEntityType`: ID da pasta OU tipo de entidade ('deal', 'lead', 'company', etc.)
- `entityId`: ID da entidade (obrigatório quando o primeiro parâmetro é um tipo de entidade)
- `page`: Número da página para paginação (padrão: 1)
- `limit`: Número de itens por página (padrão: 50)

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
  updatedAt?: string;
  parentId?: string;
  url?: string;
  permission?: 'read' | 'write' | 'admin';
}
```

### 2. Componente DealDocumentsList

O componente foi criado para fornecer uma visualização simples e direta dos documentos.

**Características:**
- ✅ Carregamento automático ao montar
- ✅ Estados de loading, error e empty
- ✅ Exibição em tabela com colunas: Tipo, Nome, Tamanho, Data de Criação
- ✅ Diferenciação visual entre arquivos e pastas
- ✅ Formatação adequada de tamanhos (KB, MB, etc.)
- ✅ Formatação de datas no padrão brasileiro
- ✅ Tratamento de erros com mensagens amigáveis

**Props:**
```typescript
interface DealDocumentsListProps {
  dealId: string  // ID do negócio
}
```

**Estados:**
```typescript
const [items, setItems] = useState<DriveItem[]>([])      // Lista de itens
const [loading, setLoading] = useState(true)              // Estado de carregamento
const [error, setError] = useState<string | null>(null)   // Mensagem de erro
const [total, setTotal] = useState(0)                     // Total de itens
```

### 3. Integração na DealDetailPage

A aba "Docs" foi atualizada para usar o novo componente:

```tsx
<TabsContent value="documents">
  <DealDocumentsList dealId={deal.id} />
</TabsContent>
```

## Fluxo de Carregamento

```mermaid
graph TD
    A[DealDocumentsList montado] --> B[useEffect executado]
    B --> C[setLoading true]
    C --> D{dealId existe?}
    D -->|Sim| E[Chamar listDriveItems deal, dealId]
    D -->|Não| F[Não fazer nada]
    E --> G{Sucesso?}
    G -->|Sim| H[setItems + setTotal]
    G -->|Não| I[setError + toast.error]
    H --> J[setLoading false]
    I --> J
    J --> K[Renderizar UI]
```

## UI/UX

### Estados da Interface

#### 1. Estado de Carregamento (Loading)
- **Quando:** Dados estão sendo buscados
- **Exibição:** Skeleton loaders (5 linhas pulsando)
- **Componentes:** Card com título "Documentos" + Skeletons

#### 2. Estado Vazio (Empty)
- **Quando:** Nenhum documento encontrado (total = 0)
- **Exibição:** 
  - Ícone de arquivo centralizado
  - Mensagem: "Nenhum documento encontrado para este negócio."
- **Componentes:** Card com ícone e texto centralizados

#### 3. Estado de Erro (Error)
- **Quando:** Falha ao carregar documentos
- **Exibição:**
  - Mensagem de erro específica
  - Texto auxiliar: "Verifique se a API do Drive está configurada corretamente."
  - Toast de erro
- **Componentes:** Card com mensagem de erro

#### 4. Estado com Dados (Success)
- **Quando:** Documentos carregados com sucesso
- **Exibição:** Tabela com documentos
- **Componentes:** 
  - Card com título "Documentos"
  - Badge com contador de itens
  - Tabela responsiva

### Layout da Tabela

| Coluna | Largura | Conteúdo | Exemplo |
|--------|---------|----------|---------|
| **Tipo** | 50px | Ícone (📁 pasta / 📄 arquivo) | [Ícone azul] |
| **Nome** | Flex | Nome + Badge de tipo | "Contrato.pdf" + Badge "Arquivo" |
| **Tamanho** | 120px | Tamanho formatado ou "—" | "1.5 MB" ou "—" |
| **Data de Criação** | 180px | Data formatada | "15/01/2024" |

### Elementos Visuais

#### Ícones
- **Arquivo:** Ícone `FileText` em azul (`text-blue-500`)
- **Pasta:** Ícone `Folder` preenchido em amarelo (`text-yellow-500`, `weight="fill"`)

#### Badges
- **Contador de itens:** Badge secundário no cabeçalho
  - Singular: "1 item"
  - Plural: "2 itens"
- **Tipo de item:** Badge outline em cada linha
  - "Arquivo" para files
  - "Pasta" para folders

#### Cores e Estilos
- Borda da tabela: `rounded-md border`
- Hover nas linhas: `hover:bg-muted/50`
- Texto secundário: `text-muted-foreground`
- Fonte média: `font-medium` para nomes

## Exemplo de Uso

### Chamada da Função
```typescript
// No componente DealDocumentsList
const response = await listDriveItems('deal', dealId)
```

### Resposta da API (Exemplo)
```json
{
  "items": [
    {
      "id": "doc-001",
      "name": "Proposta Comercial.pdf",
      "type": "file",
      "size": 2048576,
      "createdAt": "2024-01-15T10:30:00Z",
      "url": "https://drive.example.com/files/doc-001"
    },
    {
      "id": "folder-001",
      "name": "Contratos",
      "type": "folder",
      "createdAt": "2024-01-10T14:00:00Z"
    }
  ],
  "total": 2
}
```

### Renderização
```
┌─────────────────────────────────────────────────────────┐
│ Documentos                                    [2 itens] │
├─────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ Tipo │ Nome                   │ Tamanho │ Data     │ │
│ ├──────┼────────────────────────┼─────────┼──────────┤ │
│ │ 📄   │ Proposta Comercial.pdf │ 2 MB    │15/01/2024│ │
│ │      │ [Arquivo]              │         │          │ │
│ ├──────┼────────────────────────┼─────────┼──────────┤ │
│ │ 📁   │ Contratos              │ —       │10/01/2024│ │
│ │      │ [Pasta]                │         │          │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Testes

### Cobertura de Testes

#### driveClient.test.ts
- ✅ Listagem básica de itens
- ✅ Listagem com folderId
- ✅ Listagem com entityType e entityId
- ✅ Paginação
- ✅ Tratamento de erros (401, 403, 404, 500)
- ✅ Validação de autenticação
- ✅ Total: 23 testes

#### DealDocumentsList.test.tsx
- ✅ Estado de loading
- ✅ Estado vazio
- ✅ Listagem com sucesso
- ✅ Exibição de badges de tipo
- ✅ Exibição de tamanhos
- ✅ Tratamento de erros
- ✅ Formatação de datas
- ✅ Contador singular/plural
- ✅ Total: 8 testes

**Total Geral:** 31 testes passando ✅

### Executar Testes

```bash
# Testar driveClient
npm run test:run tests/unit/lib/driveClient.test.ts

# Testar DealDocumentsList
npm run test:run tests/unit/features/deals/DealDocumentsList.test.tsx

# Testar tudo
npm run test:run
```

## Configuração Necessária

### Variáveis de Ambiente

```env
# .env ou .env.local
VITE_DRIVE_API_URL=https://seu-backend.onrender.com
```

**Importante:** Sem esta variável configurada, o componente exibirá uma mensagem de erro informando que a API não está configurada.

### Requisitos da API Backend

O backend deve implementar o endpoint:

```
GET /api/drive/items?entityType={type}&entityId={id}&page={page}&limit={limit}
```

**Headers esperados:**
- `Authorization: Bearer {token}` - Token do Supabase

**Resposta esperada:**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "type": "file" | "folder",
      "size": number,
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)",
      "url": "string"
    }
  ],
  "total": number
}
```

## Navegação

### Localização na Interface

1. Acessar página de Negócios: `/deals`
2. Clicar em um negócio específico
3. Na página de detalhes: `/deals/{id}`
4. Clicar na aba "**Docs**" (segunda aba, ícone de documento)

### Breadcrumbs

```
Negócios > [Empresa] > [Nome do Cliente] > Docs (aba ativa)
```

## Melhorias Futuras

Possíveis extensões da funcionalidade:

- [ ] Ações inline (download, visualizar, excluir)
- [ ] Upload de novos documentos
- [ ] Navegação em subpastas
- [ ] Busca/filtro de documentos
- [ ] Ordenação de colunas
- [ ] Preview de documentos (imagens, PDFs)
- [ ] Compartilhamento de links
- [ ] Gestão de permissões
- [ ] Integração com DocumentManager para funcionalidades avançadas

## Diferenças: DealDocumentsList vs DocumentManager

| Característica | DealDocumentsList | DocumentManager |
|----------------|-------------------|-----------------|
| Complexidade | Simples | Completa |
| API Utilizada | driveClient.ts | useDriveDocuments hook |
| Upload | ❌ Não | ✅ Sim |
| Criação de pastas | ❌ Não | ✅ Sim |
| Exclusão | ❌ Não | ✅ Sim |
| Navegação em pastas | ❌ Não | ✅ Sim |
| Preview | ❌ Não | ✅ Sim |
| Drag & Drop | ❌ Não | ✅ Sim |
| Filtros | ❌ Não | ✅ Sim (PDF, imagens, etc) |
| Visualização | Tabela | Grid + Lista |
| Objetivo | Listagem simples | Gerenciamento completo |

**DealDocumentsList** foi criado para atender especificamente o requisito de usar `driveClient.ts` diretamente e fornecer uma visualização simples de documentos.

## Troubleshooting

### Problema: "Drive API URL not configured"

**Causa:** Variável `VITE_DRIVE_API_URL` não está definida

**Solução:**
1. Criar arquivo `.env.local`
2. Adicionar: `VITE_DRIVE_API_URL=https://seu-backend.onrender.com`
3. Reiniciar o servidor de desenvolvimento

### Problema: "No authentication token available"

**Causa:** Usuário não está autenticado ou sessão expirou

**Solução:**
1. Fazer logout
2. Fazer login novamente
3. Verificar se token do Supabase está válido

### Problema: Documentos não aparecem

**Possíveis causas:**
1. API do Drive retorna lista vazia
2. Backend não implementa entity-based queries
3. Entidade não tem pasta associada no Drive
4. Erro de permissões

**Verificação:**
1. Abrir DevTools > Network
2. Verificar requisição para `/api/drive/items`
3. Verificar parâmetros: `entityType=deal&entityId={id}`
4. Verificar resposta da API

### Problema: Erro 403 (Forbidden)

**Causa:** Usuário não tem permissão para visualizar documentos

**Solução:**
1. Verificar permissões do usuário
2. Verificar papel (role) do usuário
3. Contatar administrador do sistema

## Referências

- [Drive Client Documentation](./drive_client.md)
- [Drive Types Documentation](./drive_types.md)
- [Google Drive Integration](../archive/reports/GOOGLE_DRIVE_PD_GOOGLE_INTEGRATION.md)

## Changelog

### v1.0.0 - 2024-12-06

**Adicionado:**
- ✅ Componente `DealDocumentsList`
- ✅ Extensão de `driveClient.ts` para entity-based queries
- ✅ Integração na `DealDetailPage`
- ✅ Testes unitários completos (31 testes)
- ✅ Documentação completa

**Implementado conforme requisitos:**
- ✅ Uso de `driveClient.ts`
- ✅ Chamada `listDriveItems("deal", deal.id)`
- ✅ Renderização de lista com nome, tipo, tamanho e data
- ✅ Documentação em `docs/frontend/deal_documents.md`

---

**Autor:** GitHub Copilot  
**Data:** 06/12/2024  
**Versão:** 1.0.0
