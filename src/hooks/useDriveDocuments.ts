import { useCallback, useEffect, useState } from 'react'
import {
  DriveActivityEntry,
  DriveEntityType,
  DriveFile,
  DriveFolder,
  DriveLink,
  DriveRole,
  applyInheritedPermissions,
  createFolder as createDriveFolder,
  deleteEntry,
  generateLink as generateDriveLink,
  getEntityDocuments,
  listActivity,
  uploadFiles as uploadDriveFiles,
} from '@/services/googleDriveService'

// 🚨 NOVO: cliente remoto pd-google (precisa ser criado em src/services/pdGoogleDriveApi.ts)
import {
  getRemoteEntityDocuments,
  createRemoteFolder,
  uploadRemoteFiles,
  deleteRemoteEntry,
  renameRemoteEntry,
  Breadcrumb,
} from '@/services/pdGoogleDriveApi'

interface UseDriveDocumentsParams {
  entityId: string
  entityType: DriveEntityType
  actorId: string
  actorRole: DriveRole
  entityName?: string
  initialFolderId?: string
}

// Use the same env variable as pdGoogleDriveApi for consistency
const USE_REMOTE_DRIVE = Boolean(import.meta.env.VITE_DRIVE_API_URL)

export function useDriveDocuments({
  entityId,
  entityType,
  actorId,
  actorRole,
  entityName,
  initialFolderId,
}: UseDriveDocumentsParams) {
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [rootFolderId, setRootFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])
  const [activities, setActivities] = useState<DriveActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(initialFolderId)

  const load = useCallback(async (folderId: string | undefined = currentFolderId) => {
    setLoading(true)
    setError(null)

    // Diagnostic logging to confirm backend URL and decision
    console.log('[useDriveDocuments] Remote drive:', {
      enabled: USE_REMOTE_DRIVE,
      baseUrl: import.meta.env.VITE_DRIVE_API_URL,
      entityType,
      folderId,
    })

    if (USE_REMOTE_DRIVE) {
      // 🔗 Usa backend pd-google
      try {
        const snapshot = await getRemoteEntityDocuments(entityType, entityId, actorId, actorRole, folderId)
        setFolders(snapshot.folders)
        setFiles(snapshot.files)
        setRootFolderId(snapshot.rootFolderId)
        setBreadcrumbs(snapshot.breadcrumbs)
        // activity ainda é local-only, por isso fica vazio aqui
        setActivities([])
        setLoading(false)
      } catch (err) {
        // Log the full error for debugging
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('[useDriveDocuments] Error loading remote documents:', error)
        setError(error)
        setLoading(false)
        // Re-throw to allow components to handle the error
        throw error
      }
      return
    }

    // 🧪 Mock local padrão (completo)
    try {
      const snapshot = await getEntityDocuments(entityType, entityId, entityName)
      setFolders(snapshot.folders)
      setFiles(snapshot.files)
      setRootFolderId(snapshot.rootFolderId)
      setActivities(snapshot.activity)
      // Mock breadcrumbs for local dev
      setBreadcrumbs([{ id: null, name: 'Raiz' }])
      setLoading(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[useDriveDocuments] Error loading local documents:', error)
      setError(error)
      setLoading(false)
      throw error
    }
  }, [actorId, actorRole, entityId, entityType, entityName, currentFolderId])

  useEffect(() => {
    // Silently catch errors that are already logged and handled in load()
    load(currentFolderId).catch(() => {
      // Error is already logged in load() and set in error state
    })
  }, [load, currentFolderId])

  const navigateToFolder = (folderId: string | undefined) => {
    setCurrentFolderId(folderId)
  }

  const createFolder = useCallback(
    async (name: string, parentId?: string) => {
      if (USE_REMOTE_DRIVE) {
        await createRemoteFolder(entityType, entityId, name, actorId, actorRole, parentId)
        await load(currentFolderId)
        return
      }

      const folder = await createDriveFolder(entityType, entityId, name, parentId, actorId, entityName)
      await load(currentFolderId)
      return folder
    },
    [actorId, actorRole, entityId, entityName, entityType, load, currentFolderId]
  )

  const uploadFiles = useCallback(
    async (selectedFiles: File[], parentId?: string) => {
      if (USE_REMOTE_DRIVE) {
        await uploadRemoteFiles(entityType, entityId, selectedFiles, actorId, actorRole, parentId)
        await load(currentFolderId)
        return
      }

      const uploaded = await uploadDriveFiles(entityType, entityId, selectedFiles, parentId, actorId, actorRole, entityName)
      await load(currentFolderId)
      return uploaded
    },
    [actorId, actorRole, entityId, entityName, entityType, load, currentFolderId]
  )

  const renameItem = useCallback(
    async (fileId: string, newName: string) => {
      if (USE_REMOTE_DRIVE) {
        await renameRemoteEntry(entityType, entityId, fileId, newName, actorId, actorRole)
        await load(currentFolderId)
        return
      }
      // Local rename not implemented in mock service as per code inspection, but assuming it exists for interface parity or simple no-op
      console.warn('Renaming is only supported in Remote Drive mode')
    },
    [actorId, actorRole, entityId, entityType, load, currentFolderId]
  )

  const deleteItem = useCallback(
    async (targetId: string, type: 'file' | 'folder') => {
      if (USE_REMOTE_DRIVE) {
        await deleteRemoteEntry(entityType, entityId, targetId, type, actorId, actorRole)
        await load(currentFolderId)
        return
      }

      // O serviço local (googleDriveService) gerencia exclusão recursiva e não precisa do type
      await deleteEntry(entityType, entityId, targetId, actorId)
      await load(currentFolderId)
    },
    [actorId, actorRole, entityId, entityType, load, currentFolderId]
  )

  const generateLink = useCallback(
    async (fileId: string, visibility: DriveLink['visibility'] = 'organization') => {
      if (USE_REMOTE_DRIVE) {
        console.warn('[useDriveDocuments] generateLink remoto ainda não implementado, retornando null')
        return null
      }

      const link = await generateDriveLink(entityType, entityId, fileId, visibility)
      await load(currentFolderId)
      return link
    },
    [entityId, entityType, load, currentFolderId]
  )

  const applyPermissions = useCallback(
    async (targetIds: string[]) => {
      if (USE_REMOTE_DRIVE) {
        console.warn('[useDriveDocuments] applyPermissions remoto ainda não implementado')
        return
      }

      await applyInheritedPermissions(entityType, entityId, actorRole, targetIds, actorId)
      await load(currentFolderId)
    },
    [actorId, actorRole, entityId, entityType, load, currentFolderId]
  )

  const refreshActivity = useCallback(async () => {
    if (USE_REMOTE_DRIVE) {
      // Activity ainda só existe localmente
      setActivities([])
      return
    }

    const activity = await listActivity(entityType, entityId)
    setActivities(activity)
  }, [entityId, entityType])

  return {
    folders,
    files,
    rootFolderId,
    breadcrumbs,
    activities,
    loading,
    error,
    currentFolderId,
    navigateToFolder,
    createFolder,
    uploadFiles,
    renameItem,
    deleteItem,
    generateLink,
    applyPermissions,
    refreshActivity,
    reload: () => load(currentFolderId),
  }
}
