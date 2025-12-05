// src/services/pdGoogleDriveApi.ts

import {
  DriveEntityType,
  DriveFolder,
  DriveFile,
  DriveRole,
} from '@/services/googleDriveService'

const BASE_URL = import.meta.env.VITE_PD_GOOGLE_BASE_URL as string | undefined

if (typeof window !== 'undefined') {
  if (!BASE_URL) {
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
  return Boolean(BASE_URL)
}

/**
 * Carrega documentos de uma entidade a partir do backend pd-google.
 * Mapeia a resposta para DriveFolder/DriveFile usados na UI.
 */
export async function getRemoteEntityDocuments(
  entityType: DriveEntityType,
  entityId: string,
  actorId: string,
  actorRole: DriveRole,
  _entityName?: string
): Promise<RemoteDriveSnapshot> {
  if (!BASE_URL) {
    throw new Error(
      '[pdGoogleDriveApi] VITE_PD_GOOGLE_BASE_URL não configurada, mas getRemoteEntityDocuments foi chamado.'
    )
  }

  const res = await fetch(`${BASE_URL}/drive/${entityType}/${entityId}`, {
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

  const data: { files: any[]; permission?: string } = await res.json()

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
  if (!BASE_URL) {
    throw new Error(
      '[pdGoogleDriveApi] VITE_PD_GOOGLE_BASE_URL não configurada, mas createRemoteFolder foi chamado.'
    )
  }

  const res = await fetch(`${BASE_URL}/drive/${entityType}/${entityId}/folder`, {
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
  if (!BASE_URL) {
    throw new Error(
      '[pdGoogleDriveApi] VITE_PD_GOOGLE_BASE_URL não configurada, mas uploadRemoteFiles foi chamado.'
    )
  }

  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${BASE_URL}/drive/${entityType}/${entityId}/upload`, {
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
