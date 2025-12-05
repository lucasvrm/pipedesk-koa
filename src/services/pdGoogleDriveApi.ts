// src/services/pdGoogleDriveApi.ts

import {
  DriveEntityType,
  DriveFolder,
  DriveFile,
  DriveRole,
} from '@/services/googleDriveService'
import { supabase } from '@/lib/supabaseClient'

// A URL base agora aponta para a Edge Function do Supabase
// Ex: https://<project>.supabase.co/functions/v1/proxy-drive
// Isso é construído dinamicamente a partir da URL do Supabase
const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL
const FUNCTION_URL = SUPABASE_PROJECT_URL ? `${SUPABASE_PROJECT_URL}/functions/v1/proxy-drive` : ''

// Mantemos o check do VITE_PD_GOOGLE_BASE_URL apenas para saber se a integração está "ativa" conceitualmente,
// mas a URL real usada será a do Proxy.
const REMOTE_ENABLED = Boolean(import.meta.env.VITE_PD_GOOGLE_BASE_URL)

if (typeof window !== 'undefined') {
  console.log('[pdGoogleDriveApi] Configuration Loaded:', {
    SUPABASE_PROJECT_URL,
    FUNCTION_URL,
    REMOTE_ENABLED,
    PROXY_TARGET: 'Supabase Edge Function',
    ORIGINAL_ENV: import.meta.env.VITE_PD_GOOGLE_BASE_URL
  })

  if (!REMOTE_ENABLED) {
    console.info(
      '[pdGoogleDriveApi] VITE_PD_GOOGLE_BASE_URL não está definida. O modo remoto de Drive permanecerá desativado.'
    )
  }
}

export type DrivePermission = 'owner' | 'writer' | 'reader'

export interface RemoteDriveSnapshot {
  rootFolderId: string
  folders: DriveFolder[]
  files: DriveFile[]
  permission: DrivePermission
}

interface RemoteFileItem {
  id: string
  name: string
  mimeType?: string
  size?: number | string
  webViewLink?: string
  createdTime?: string
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

async function fetchWithProxy(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!FUNCTION_URL) throw new Error('[pdGoogleDriveApi] URL do Supabase não configurada.')

  // Usa a sessão do Supabase para autenticar a chamada à Edge Function
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(`${FUNCTION_URL}${path}`, {
    ...options,
    headers
  })
}

/**
 * Carrega documentos de uma entidade a partir do backend pd-google.
 * Mapeia a resposta para DriveFolder/DriveFile usados na UI.
 */
export async function getRemoteEntityDocuments(
  entityType: DriveEntityType,
  entityId: string,
  actorId: string,
  actorRole: DriveRole
): Promise<RemoteDriveSnapshot> {
  if (!REMOTE_ENABLED) {
    throw new Error(
      '[pdGoogleDriveApi] VITE_PD_GOOGLE_BASE_URL não configurada, mas getRemoteEntityDocuments foi chamado.'
    )
  }

  const res = await fetchWithProxy(`/drive/${entityType}/${entityId}`, {
    method: 'GET',
    headers: {
      'x-user-id': actorId,
      'x-user-role': actorRole,
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `[pdGoogleDriveApi] Erro ao carregar documentos remotos (${res.status}): ${text}`
    )
  }

  const data: { files: RemoteFileItem[]; permission?: string } = await res.json()

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
        // Por enquanto, tratamos tudo como estando na raiz (sem navegação por subpastas).
        parentId: undefined,
        entityId,
        entityType,
        type: 'custom',
      }
      folders.push(folder)
    } else {
      const file: DriveFile = {
        id: item.id,
        name: item.name,
        size: Number(item.size ?? 0),
        type: mime || 'application/octet-stream',
        url: item.webViewLink || '#',
        folderId: undefined, // tudo na raiz por enquanto
        uploadedBy: 'remote',
        uploadedAt: item.createdTime || new Date().toISOString(),
        entityId,
        entityType,
        role: actorRole,
        rootFolderId,
      }
      files.push(file)
    }
  }

  return {
    rootFolderId,
    folders,
    files,
    permission: normalizePermission(data.permission),
  }
}

/**
 * Cria uma subpasta na pasta raiz da entidade.
 * No backend atual, sempre cria direto na raiz da entidade.
 */
export async function createRemoteFolder(
  entityType: DriveEntityType,
  entityId: string,
  name: string,
  actorId: string,
  actorRole: DriveRole
): Promise<void> {
  if (!REMOTE_ENABLED) {
    throw new Error(
      '[pdGoogleDriveApi] VITE_PD_GOOGLE_BASE_URL não configurada, mas createRemoteFolder foi chamado.'
    )
  }

  const res = await fetchWithProxy(`/drive/${entityType}/${entityId}/folder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': actorId,
      'x-user-role': actorRole,
    },
    body: JSON.stringify({ name }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `[pdGoogleDriveApi] Erro ao criar pasta remota (${res.status}): ${text}`
    )
  }
}

/**
 * Faz upload de um ou mais arquivos para a pasta raiz da entidade.
 * O backend atual não suporta escolher subpastas, então sempre envia para a raiz.
 */
export async function uploadRemoteFiles(
  entityType: DriveEntityType,
  entityId: string,
  files: File[],
  actorId: string,
  actorRole: DriveRole
): Promise<void> {
  if (!REMOTE_ENABLED) {
    throw new Error(
      '[pdGoogleDriveApi] VITE_PD_GOOGLE_BASE_URL não configurada, mas uploadRemoteFiles foi chamado.'
    )
  }

  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetchWithProxy(`/drive/${entityType}/${entityId}/upload`, {
      method: 'POST',
      headers: {
        'x-user-id': actorId,
        'x-user-role': actorRole,
      },
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(
        `[pdGoogleDriveApi] Erro ao fazer upload de arquivo "${file.name}" (${res.status}): ${text}`
      )
    }
  }
}
