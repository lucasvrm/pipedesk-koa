import { updateSetting, getSetting } from '@/services/systemSettingsService'

export type DriveEntityType = 'deal' | 'track' | 'task' | 'lead' | 'company' | 'user'

export interface DriveFolder {
  id: string
  name: string
  parentId?: string
  entityId?: string
  entityType?: DriveEntityType
}

export interface DriveFile {
  id: string
  name: string
  size: number
  mimeType: string
  folderId: string
  uploadedBy: string
  uploadedAt: string
  entityId: string
  entityType: DriveEntityType
  downloadUrl?: string
  webViewLink?: string
}

export interface DriveHierarchy {
  root: DriveFolder
  collection: DriveFolder
  entityFolder: DriveFolder
}

export interface DrivePermissionRule {
  role: string
  access: 'full' | 'read'
  appliesTo: DriveEntityType[]
  ownership?: 'all' | 'own'
}

export interface DrivePermissionConfig {
  rules: DrivePermissionRule[]
  updatedAt: string
  updatedBy?: string
}

const DEFAULT_ROOT_NAME = import.meta.env.VITE_DRIVE_ROOT_NAME || 'Pipedesk Drive'
const COLLECTION_LABELS: Record<DriveEntityType, string> = {
  deal: 'Deals',
  lead: 'Leads',
  company: 'Empresas',
  user: 'Usuarios',
  track: 'Tracks',
  task: 'Tasks'
}

interface DriveAdapter {
  ensureHierarchy(entityId: string, entityType: DriveEntityType, entityName?: string): Promise<DriveHierarchy>
  listEntityFiles(entityId: string): Promise<DriveFile[]>
  listEntityFolders(entityId: string): Promise<DriveFolder[]>
  createFolder(name: string, parentId: string, entityId: string, entityType: DriveEntityType): Promise<DriveFolder>
  deleteFolder(folderId: string): Promise<void>
  uploadFiles(
    files: File[],
    folderId: string,
    entityId: string,
    entityType: DriveEntityType,
    uploadedBy: string
  ): Promise<DriveFile[]>
  deleteFile(fileId: string): Promise<void>
  getFileLink(fileId: string): Promise<string | null>
}

interface MockDriveState {
  folders: DriveFolder[]
  files: (DriveFile & { dataUrl?: string })[]
}

const memoryState: MockDriveState = {
  folders: [],
  files: []
}

class LocalMockAdapter implements DriveAdapter {
  private storageKey = 'pipedesk-drive-mock'

  private loadState(): MockDriveState {
    if (typeof window === 'undefined') {
      if (memoryState.folders.length === 0) {
        memoryState.folders.push({ id: 'root', name: DEFAULT_ROOT_NAME })
      }
      return memoryState
    }

    const saved = window.localStorage.getItem(this.storageKey)
    if (!saved) {
      const initial: MockDriveState = {
        folders: [{ id: 'root', name: DEFAULT_ROOT_NAME }],
        files: []
      }
      window.localStorage.setItem(this.storageKey, JSON.stringify(initial))
      return initial
    }
    return JSON.parse(saved)
  }

  private persist(state: MockDriveState) {
    if (typeof window === 'undefined') {
      memoryState.folders = state.folders
      memoryState.files = state.files
      return
    }
    window.localStorage.setItem(this.storageKey, JSON.stringify(state))
  }

  private generateId(prefix = 'id'): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `${prefix}-${Math.random().toString(36).slice(2)}`
  }

  private sanitizeName(name?: string) {
    return name?.replace(/[\\/]/g, ' ').trim() || 'Sem título'
  }

  async ensureHierarchy(entityId: string, entityType: DriveEntityType, entityName?: string): Promise<DriveHierarchy> {
    const state = this.loadState()
    const root = state.folders.find(f => f.parentId === undefined && f.name === DEFAULT_ROOT_NAME) || state.folders[0]
    const collectionName = COLLECTION_LABELS[entityType]

    let collection = state.folders.find(f => f.parentId === root.id && f.name === collectionName)
    if (!collection) {
      collection = { id: this.generateId('collection'), name: collectionName, parentId: root.id }
      state.folders.push(collection)
    }

    const normalizedName = this.sanitizeName(entityName || entityId)
    const entityFolderName = `${collectionName} - ${entityId} - ${normalizedName}`

    let entityFolder = state.folders.find(f => f.parentId === collection!.id && f.entityId === entityId)
    if (!entityFolder) {
      entityFolder = {
        id: this.generateId('folder'),
        name: entityFolderName,
        parentId: collection!.id,
        entityId,
        entityType
      }
      state.folders.push(entityFolder)

      const uploadsFolder: DriveFolder = {
        id: this.generateId('folder'),
        name: 'Uploads',
        parentId: entityFolder.id,
        entityId,
        entityType
      }
      state.folders.push(uploadsFolder)
    }

    this.persist(state)

    return {
      root,
      collection: collection!,
      entityFolder: entityFolder!
    }
  }

  async listEntityFiles(entityId: string): Promise<DriveFile[]> {
    const state = this.loadState()
    return state.files.filter(f => f.entityId === entityId)
  }

  async listEntityFolders(entityId: string): Promise<DriveFolder[]> {
    const state = this.loadState()
    return state.folders.filter(f => f.entityId === entityId || f.parentId === undefined)
  }

  async createFolder(name: string, parentId: string, entityId: string, entityType: DriveEntityType): Promise<DriveFolder> {
    const state = this.loadState()
    const folder: DriveFolder = {
      id: this.generateId('folder'),
      name: this.sanitizeName(name),
      parentId,
      entityId,
      entityType
    }
    state.folders.push(folder)
    this.persist(state)
    return folder
  }

  async deleteFolder(folderId: string): Promise<void> {
    const state = this.loadState()
    const collectChildren = (id: string): string[] => {
      const children = state.folders.filter(f => f.parentId === id).map(f => f.id)
      return children.reduce<string[]>((acc, child) => [...acc, child, ...collectChildren(child)], [])
    }

    const toRemove = new Set([folderId, ...collectChildren(folderId)])
    state.folders = state.folders.filter(f => !toRemove.has(f.id))
    state.files = state.files.filter(f => !toRemove.has(f.folderId))
    this.persist(state)
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  async uploadFiles(
    files: File[],
    folderId: string,
    entityId: string,
    entityType: DriveEntityType,
    uploadedBy: string
  ): Promise<DriveFile[]> {
    const state = this.loadState()
    const uploads = await Promise.all(
      files.map(async file => {
        const id = this.generateId('file')
        const dataUrl = await this.fileToDataUrl(file)
        const record: DriveFile & { dataUrl: string } = {
          id,
          name: this.sanitizeName(file.name),
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          folderId,
          uploadedBy,
          uploadedAt: new Date().toISOString(),
          entityId,
          entityType,
          downloadUrl: dataUrl,
          webViewLink: dataUrl,
          dataUrl
        }
        state.files.push(record)
        return record
      })
    )

    this.persist(state)
    return uploads
  }

  async deleteFile(fileId: string): Promise<void> {
    const state = this.loadState()
    state.files = state.files.filter(f => f.id !== fileId)
    this.persist(state)
  }

  async getFileLink(fileId: string): Promise<string | null> {
    const state = this.loadState()
    const file = state.files.find(f => f.id === fileId)
    return file?.downloadUrl || null
  }
}

const adapter: DriveAdapter = new LocalMockAdapter()

function normalizeFolders(hierarchy: DriveHierarchy, folders: DriveFolder[]) {
  return folders.map(folder => {
    if (folder.id === hierarchy.entityFolder.id) {
      return { ...folder, parentId: undefined }
    }
    if (folder.parentId === hierarchy.collection.id) {
      return { ...folder, parentId: hierarchy.entityFolder.id }
    }
    return folder
  })
}

async function seedDefaultPermissions(): Promise<DrivePermissionConfig> {
  const now = new Date().toISOString()
  const defaultConfig: DrivePermissionConfig = {
    updatedAt: now,
    rules: [
      { role: 'admin', access: 'full', appliesTo: ['deal', 'lead', 'company', 'user', 'track', 'task'], ownership: 'all' },
      { role: 'analista', access: 'full', appliesTo: ['deal', 'lead', 'company', 'user', 'track', 'task'], ownership: 'all' },
      { role: 'novos_negocios', access: 'full', appliesTo: ['deal', 'lead'], ownership: 'own' },
      { role: 'cliente', access: 'read', appliesTo: ['deal'], ownership: 'own' }
    ]
  }
  await updateSetting('drive.permissions', defaultConfig, 'Configuração padrão de permissões do Drive')
  return defaultConfig
}

export const googleDriveService = {
  async listEntityDocuments(entityId: string, entityType: DriveEntityType, entityName?: string) {
    const hierarchy = await adapter.ensureHierarchy(entityId, entityType, entityName)
    const folders = await adapter.listEntityFolders(entityId)
    const files = await adapter.listEntityFiles(entityId)

    const normalizedFolders = normalizeFolders(hierarchy, folders)

    return {
      hierarchy,
      folders: normalizedFolders,
      files
    }
  },

  async createFolder(name: string, parentId: string, entityId: string, entityType: DriveEntityType) {
    return adapter.createFolder(name, parentId, entityId, entityType)
  },

  async deleteFolder(folderId: string) {
    return adapter.deleteFolder(folderId)
  },

  async uploadFiles(options: {
    files: File[]
    folderId: string
    entityId: string
    entityType: DriveEntityType
    uploadedBy: string
  }) {
    const { files, folderId, entityId, entityType, uploadedBy } = options
    return adapter.uploadFiles(files, folderId, entityId, entityType, uploadedBy)
  },

  async deleteFile(fileId: string) {
    return adapter.deleteFile(fileId)
  },

  async getFileLink(fileId: string) {
    return adapter.getFileLink(fileId)
  },

  async getPermissionsConfig(): Promise<DrivePermissionConfig> {
    const saved = await getSetting('drive.permissions')
    if (!saved) {
      return seedDefaultPermissions()
    }
    return saved as DrivePermissionConfig
  },

  async updatePermissionsConfig(config: DrivePermissionConfig) {
    await updateSetting('drive.permissions', config, 'Permissões do Drive atualizadas')
    return config
  }
}

