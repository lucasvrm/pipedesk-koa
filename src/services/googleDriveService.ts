import { v4 as uuid } from 'uuid'

export type DriveEntityType = 'lead' | 'deal' | 'company' | 'user' | 'track' | 'task' | 'contact'

export type DriveRole = 'admin' | 'analyst' | 'new_business' | 'client'

export interface DriveFolder {
  id: string
  name: string
  parentId?: string
  entityId: string
  entityType: DriveEntityType
  type: 'root' | 'uploads' | 'custom'
}

export interface DriveFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  folderId?: string
  uploadedBy: string
  uploadedAt: string
  entityId: string
  entityType: DriveEntityType
  role: DriveRole
  rootFolderId: string
}

export interface DriveLink {
  url: string
  visibility: 'private' | 'organization' | 'anyone'
}

export interface DriveActivityEntry {
  id: string
  entityId: string
  entityType: DriveEntityType
  action: 'create' | 'upload' | 'delete' | 'share'
  actor: string
  targetId: string
  targetName: string
  timestamp: string
  extra?: Record<string, string | number | boolean>
}

interface DriveEntitySnapshot {
  rootFolderId: string
  folders: DriveFolder[]
  files: DriveFile[]
  activity: DriveActivityEntry[]
}

interface DriveState {
  entities: Record<string, DriveEntitySnapshot>
}

const STORAGE_KEY = 'google-drive-state'

const defaultState: DriveState = { entities: {} }

function getState(): DriveState {
  if (typeof window === 'undefined') return { ...defaultState }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...defaultState }

  try {
    const parsed = JSON.parse(raw)
    return {
      entities: parsed.entities || {},
    }
  } catch (error) {
    console.warn('[googleDriveService] Erro ao ler cache, redefinindo estado', error)
    return { ...defaultState }
  }
}

function persistState(state: DriveState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function entityKey(entityType: DriveEntityType, entityId: string) {
  return `${entityType}:${entityId}`
}

function ensureEntitySnapshot(
  state: DriveState,
  entityType: DriveEntityType,
  entityId: string,
  entityName?: string
): DriveEntitySnapshot {
  const key = entityKey(entityType, entityId)
  const existing = state.entities[key]
  if (existing) return existing

  const rootFolderId = uuid()
  const uploadsFolderId = uuid()
  const now = new Date().toISOString()

  const snapshot: DriveEntitySnapshot = {
    rootFolderId,
    folders: [
      {
        id: rootFolderId,
        name: entityName || 'Pasta da entidade',
        type: 'root',
        entityId,
        entityType,
      },
      {
        id: uploadsFolderId,
        name: 'Uploads',
        parentId: rootFolderId,
        type: 'uploads',
        entityId,
        entityType,
      },
    ],
    files: [],
    activity: [
      {
        id: uuid(),
        entityId,
        entityType,
        action: 'create',
        actor: 'system',
        targetId: rootFolderId,
        targetName: entityName || 'Pasta da entidade',
        timestamp: now,
        extra: { uploadsFolderId },
      },
    ],
  }

  state.entities[key] = snapshot
  return snapshot
}

function registerActivity(snapshot: DriveEntitySnapshot, entry: Omit<DriveActivityEntry, 'id' | 'timestamp'>) {
  snapshot.activity.unshift({ ...entry, id: uuid(), timestamp: new Date().toISOString() })
  snapshot.activity = snapshot.activity.slice(0, 50)
}

export async function getEntityDocuments(entityType: DriveEntityType, entityId: string, entityName?: string) {
  const state = getState()
  const snapshot = ensureEntitySnapshot(state, entityType, entityId, entityName)
  persistState(state)
  return snapshot
}

export async function createFolder(
  entityType: DriveEntityType,
  entityId: string,
  name: string,
  parentId: string | undefined,
  actor: string,
  entityName?: string
) {
  const state = getState()
  const snapshot = ensureEntitySnapshot(state, entityType, entityId, entityName)
  const folder: DriveFolder = {
    id: uuid(),
    name,
    parentId,
    entityId,
    entityType,
    type: 'custom',
  }
  snapshot.folders.push(folder)
  registerActivity(snapshot, { actor, entityId, entityType, action: 'create', targetId: folder.id, targetName: folder.name })
  persistState(state)
  return folder
}

export async function deleteEntry(
  entityType: DriveEntityType,
  entityId: string,
  targetId: string,
  actor: string
) {
  const state = getState()
  const snapshot = ensureEntitySnapshot(state, entityType, entityId)

  snapshot.files = snapshot.files.filter((file) => file.id !== targetId)
  const removedFolders = new Set<string>()
  const removeFolderTree = (folderId: string) => {
    removedFolders.add(folderId)
    snapshot.folders
      .filter((folder) => folder.parentId === folderId)
      .forEach((child) => removeFolderTree(child.id))
  }
  removeFolderTree(targetId)
  snapshot.folders = snapshot.folders.filter((folder) => !removedFolders.has(folder.id))
  snapshot.files = snapshot.files.filter((file) => !removedFolders.has(file.folderId || ''))

  registerActivity(snapshot, { actor, entityId, entityType, action: 'delete', targetId, targetName: 'entry' })
  persistState(state)
  return true
}

export async function uploadFiles(
  entityType: DriveEntityType,
  entityId: string,
  files: File[],
  folderId: string | undefined,
  actor: string,
  role: DriveRole,
  entityName?: string
) {
  const state = getState()
  const snapshot = ensureEntitySnapshot(state, entityType, entityId, entityName)
  const uploads: DriveFile[] = files.map((file) => ({
    id: uuid(),
    name: file.name,
    size: file.size,
    type: file.type,
    url: URL.createObjectURL(file),
    folderId,
    uploadedBy: actor,
    uploadedAt: new Date().toISOString(),
    entityId,
    entityType,
    role,
    rootFolderId: snapshot.rootFolderId,
  }))

  snapshot.files.push(...uploads)
  registerActivity(snapshot, {
    actor,
    entityId,
    entityType,
    action: 'upload',
    targetId: folderId || snapshot.rootFolderId,
    targetName: 'Arquivos',
    extra: { count: uploads.length },
  })
  persistState(state)
  return uploads
}

export async function generateLink(entityType: DriveEntityType, entityId: string, fileId: string, visibility: DriveLink['visibility']) {
  const state = getState()
  const snapshot = ensureEntitySnapshot(state, entityType, entityId)
  const file = snapshot.files.find((item) => item.id === fileId)
  if (!file) return null

  const link: DriveLink = {
    url: `https://drive.google.com/file/d/${file.id}/view`,
    visibility,
  }
  registerActivity(snapshot, { actor: 'system', entityId, entityType, action: 'share', targetId: file.id, targetName: file.name, extra: { visibility } })
  persistState(state)
  return link
}

export async function applyInheritedPermissions(
  entityType: DriveEntityType,
  entityId: string,
  role: DriveRole,
  targetIds: string[],
  actor: string
) {
  const state = getState()
  const snapshot = ensureEntitySnapshot(state, entityType, entityId)
  registerActivity(snapshot, {
    actor,
    entityId,
    entityType,
    action: 'share',
    targetId: targetIds.join(','),
    targetName: 'permissoes',
    extra: { role },
  })
  persistState(state)
  return true
}

export async function listActivity(entityType: DriveEntityType, entityId: string) {
  const state = getState()
  const snapshot = ensureEntitySnapshot(state, entityType, entityId)
  return snapshot.activity
}
