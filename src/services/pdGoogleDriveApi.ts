import {
  DriveEntityType,
  DriveFolder,
  DriveFile,
  DriveRole,
} from '@/services/googleDriveService'
import { supabase } from '@/lib/supabaseClient'

// URL base do Backend Python no Render
// Ex: https://pipedesk-drive-backend.onrender.com
const REMOTE_API_URL = import.meta.env.VITE_DRIVE_API_URL
const REMOTE_ENABLED = Boolean(REMOTE_API_URL)

if (typeof window !== 'undefined') {
  console.log('[pdGoogleDriveApi] Configuration Loaded:', {
    REMOTE_API_URL,
    REMOTE_ENABLED,
    PROXY_TARGET: 'Render Python Backend',
  })

  if (!REMOTE_ENABLED) {
    console.info(
      '[pdGoogleDriveApi] VITE_DRIVE_API_URL não está definida. O modo remoto de Drive permanecerá desativado.'
    )
  }
}

export type DrivePermission = 'owner' | 'writer' | 'reader'

export interface Breadcrumb {
  id: string | null
  name: string
}

export interface RemoteDriveSnapshot {
  rootFolderId: string
  folders: DriveFolder[]
  files: DriveFile[]
  permission: DrivePermission
  breadcrumbs: Breadcrumb[]
}

interface RemoteFileItem {
  id: string
  name: string
  mimeType?: string
  size?: number | string
  webViewLink?: string
  createdTime?: string
  deleted?: boolean
  [key: string]: unknown
}

/**
 * Normaliza o valor de permissão vindo do backend
 */
function normalizePermission(value: string | undefined): DrivePermission {
  const v = (value || '').toLowerCase()
  if (v === 'owner') return 'owner'
  if (v === 'writer') return 'writer'
  return 'reader'
}

/**
 * Verifica se o modo remoto está habilitado
 */
export function isRemoteDriveEnabled(): boolean {
  return REMOTE_ENABLED
}

/**
 * Realiza fetch para a API do Render.
 * Envia headers de autenticação (JWT) e legado (x-user-id) para compatibilidade.
 */
async function fetchFromDriveApi(
  path: string,
  options: RequestInit = {},
  actorId?: string,
  actorRole?: string
): Promise<Response> {
  if (!REMOTE_API_URL) {
    throw new Error('[pdGoogleDriveApi] URL do Backend Drive não configurada.')
  }

  // Autenticação: Sessão Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  const headers = new Headers(options.headers)

  // Header Seguro (Futuro)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Headers Legados (Compatibilidade Atual)
  // O backend confia nestes headers por enquanto. Devem ser removidos após a implementação da validação de JWT no backend.
  if (actorId) headers.set('x-user-id', actorId)
  if (actorRole) headers.set('x-user-role', actorRole)

  return fetch(`${REMOTE_API_URL}${path}`, {
    ...options,
    headers,
  })
}

/**
 * Carrega documentos de uma entidade a partir do backend pd-google.
 * Mapeia a resposta para DriveFolder/DriveFile usados na UI.
 * GET /drive/:entityType/:entityId
 */
export async function getRemoteEntityDocuments(
  entityType: DriveEntityType,
  entityId: string,
  actorId: string,
  actorRole: DriveRole,
  folderId?: string,
  includeDeleted: boolean = false
): Promise<RemoteDriveSnapshot> {
  if (!REMOTE_ENABLED) {
    throw new Error(
      '[pdGoogleDriveApi] VITE_DRIVE_API_URL não configurada, mas getRemoteEntityDocuments foi chamado.'
    )
  }

  let path = `/api/drive/${entityType}/${entityId}`
  const params = new URLSearchParams()

  if (folderId) {
    params.append('folder_id', folderId)
  }

  if (includeDeleted) {
    params.append('include_deleted', 'true')
  }

  const queryString = params.toString()
  if (queryString) {
    path += `?${queryString}`
  }

  const res = await fetchFromDriveApi(
    path,
    {
      method: 'GET',
    },
    actorId,
    actorRole
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `[pdGoogleDriveApi] Erro ao carregar documentos remotos (${res.status}): ${text}`
    )
  }

  const data: { files: RemoteFileItem[]; permission?: string; breadcrumbs?: { id: string | null; name: string }[] } = await res.json()

  const rootFolderId = `remote:${entityType}:${entityId}`
  const folders: DriveFolder[] = []
  const files: DriveFile[] = []

  for (const item of data.files || []) {
    const mime = item.mimeType || ''
    const isFolder = mime === 'application/vnd.google-apps.folder'

    if (isFolder) {
      const folder: DriveFolder = {
        id: item.id,
        name: item.name,
        parentId: folderId, // Agora suportamos navegação real
        entityId,
        entityType,
        type: 'custom',
        deleted: item.deleted || false,
      }
      folders.push(folder)
    } else {
      const file: DriveFile = {
        id: item.id,
        name: item.name,
        size: Number(item.size ?? 0),
        type: mime || 'application/octet-stream',
        url: item.webViewLink || '#',
        folderId: folderId,
        uploadedBy: 'remote',
        uploadedAt: item.createdTime || new Date().toISOString(),
        entityId,
        entityType,
        role: actorRole,
        rootFolderId,
        deleted: item.deleted || false,
      }
      files.push(file)
    }
  }

  return {
    rootFolderId,
    folders,
    files,
    permission: normalizePermission(data.permission),
    breadcrumbs: data.breadcrumbs || [],
  }
}

/**
 * Cria uma subpasta na pasta raiz ou especificada da entidade.
 * POST /drive/:entityType/:entityId/folder
 */
export async function createRemoteFolder(
  entityType: DriveEntityType,
  entityId: string,
  name: string,
  actorId: string,
  actorRole: DriveRole,
  parentId?: string
): Promise<void> {
  if (!REMOTE_ENABLED) {
    throw new Error(
      '[pdGoogleDriveApi] VITE_DRIVE_API_URL não configurada, mas createRemoteFolder foi chamado.'
    )
  }

  const body: any = { name }
  if (parentId) {
    body.parent_id = parentId
  }

  const res = await fetchFromDriveApi(
    `/api/drive/${entityType}/${entityId}/folder`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    actorId,
    actorRole
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `[pdGoogleDriveApi] Erro ao criar pasta remota (${res.status}): ${text}`
    )
  }
}

/**
 * Faz upload de um ou mais arquivos para a pasta raiz ou especificada da entidade.
 * POST /drive/:entityType/:entityId/upload
 */
export async function uploadRemoteFiles(
  entityType: DriveEntityType,
  entityId: string,
  files: File[],
  actorId: string,
  actorRole: DriveRole,
  parentId?: string
): Promise<void> {
  if (!REMOTE_ENABLED) {
    throw new Error(
      '[pdGoogleDriveApi] VITE_DRIVE_API_URL não configurada, mas uploadRemoteFiles foi chamado.'
    )
  }

  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    if (parentId) {
      formData.append('parent_id', parentId)
    }

    const res = await fetchFromDriveApi(
      `/api/drive/${entityType}/${entityId}/upload`,
      {
        method: 'POST',
        body: formData,
      },
      actorId,
      actorRole
    )

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(
        `[pdGoogleDriveApi] Erro ao fazer upload de arquivo "${file.name}" (${res.status}): ${text}`
      )
    }
  }
}

/**
 * Renomeia um arquivo ou pasta.
 * PUT /drive/{entity_type}/{entity_id}/files/{file_id}/rename
 */
export async function renameRemoteEntry(
  entityType: DriveEntityType,
  entityId: string,
  fileId: string,
  newName: string,
  actorId: string,
  actorRole: DriveRole
): Promise<void> {
  if (!REMOTE_ENABLED) {
    throw new Error(
      '[pdGoogleDriveApi] VITE_DRIVE_API_URL não configurada, mas renameRemoteEntry foi chamado.'
    )
  }

  const res = await fetchFromDriveApi(
    `/api/drive/${entityType}/${entityId}/files/${fileId}/rename`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    },
    actorId,
    actorRole
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `[pdGoogleDriveApi] Erro ao renomear item (${res.status}): ${text}`
    )
  }
}

/**
 * Deleta um arquivo ou pasta (soft delete).
 * DELETE /drive/{entity_type}/{entity_id}/files/{file_id}
 * DELETE /drive/{entity_type}/{entity_id}/folders/{folder_id}
 */
export async function deleteRemoteEntry(
  entityType: DriveEntityType,
  entityId: string,
  targetId: string,
  type: 'file' | 'folder',
  actorId: string,
  actorRole: DriveRole
): Promise<void> {
  if (!REMOTE_ENABLED) {
    throw new Error(
      '[pdGoogleDriveApi] VITE_DRIVE_API_URL não configurada, mas deleteRemoteEntry foi chamado.'
    )
  }

  const endpointType = type === 'folder' ? 'folders' : 'files'
  const path = `/api/drive/${entityType}/${entityId}/${endpointType}/${targetId}`

  const res = await fetchFromDriveApi(
    path,
    {
      method: 'DELETE',
    },
    actorId,
    actorRole
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `[pdGoogleDriveApi] Erro ao deletar ${type} remoto (${res.status}): ${text}`
    )
  }
}

/**
 * Restaura um arquivo ou pasta deletada.
 * POST /drive/{entity_type}/{entity_id}/files/{file_id}/restore
 * POST /drive/{entity_type}/{entity_id}/folders/{folder_id}/restore
 */
export async function restoreRemoteEntry(
  entityType: DriveEntityType,
  entityId: string,
  targetId: string,
  type: 'file' | 'folder',
  actorId: string,
  actorRole: DriveRole
): Promise<void> {
  if (!REMOTE_ENABLED) {
    throw new Error(
      '[pdGoogleDriveApi] VITE_DRIVE_API_URL não configurada, mas restoreRemoteEntry foi chamado.'
    )
  }

  const endpointType = type === 'folder' ? 'folders' : 'files'
  const path = `/api/drive/${entityType}/${entityId}/${endpointType}/${targetId}/restore`

  const res = await fetchFromDriveApi(
    path,
    {
      method: 'POST',
    },
    actorId,
    actorRole
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `[pdGoogleDriveApi] Erro ao restaurar ${type} remoto (${res.status}): ${text}`
    )
  }
}

/**
 * Solicita sincronização do nome da pasta remota com o nome da entidade no banco.
 * Fire-and-forget: não trava a UI em caso de erro.
 * POST /api/drive/sync-name
 */
export async function syncRemoteEntityName(
  entityType: 'deal' | 'lead' | 'company',
  entityId: string
): Promise<void> {
  try {
    if (!isRemoteDriveEnabled()) return

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id

    if (!userId) return

    // Chamada em background
    fetchFromDriveApi(
      '/api/drive/sync-name',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
        }),
      },
      userId,
      'writer'
    ).catch((err) => {
      console.warn('[pdGoogleDriveApi] Background sync name failed (ignoring):', err)
    })
  } catch (error) {
    console.warn('[pdGoogleDriveApi] Error dispatching sync:', error)
  }
}
