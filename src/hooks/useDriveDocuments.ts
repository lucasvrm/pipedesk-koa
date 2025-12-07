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
} from '@/services/pdGoogleDriveApi'

interface UseDriveDocumentsParams {
  entityId: string
  entityType: DriveEntityType
  actorId: string
  actorRole: DriveRole
  entityName?: string
}

// Use the same env variable as pdGoogleDriveApi for consistency
const USE_REMOTE_DRIVE = Boolean(import.meta.env.VITE_DRIVE_API_URL)

export function useDriveDocuments({
  entityId,
  entityType,
  actorId,
  actorRole,
  entityName,
}: UseDriveDocumentsParams) {
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [rootFolderId, setRootFolderId] = useState<string | null>(null)
  const [activities, setActivities] = useState<DriveActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Diagnostic logging to confirm backend URL and decision
    console.log('[useDriveDocuments] Remote drive:', {
      enabled: USE_REMOTE_DRIVE,
      baseUrl: import.meta.env.VITE_DRIVE_API_URL,
      entityType,
    })

    if (USE_REMOTE_DRIVE) {
      // 🔗 Usa backend pd-google
      try {
        const snapshot = await getRemoteEntityDocuments(entityType, entityId, actorId, actorRole)
        setFolders(snapshot.folders)
        setFiles(snapshot.files)
        setRootFolderId(snapshot.rootFolderId)
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
      setLoading(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[useDriveDocuments] Error loading local documents:', error)
      setError(error)
      setLoading(false)
      throw error
    }
  }, [actorId, actorRole, entityId, entityType, entityName])

  useEffect(() => {
    // Silently catch errors that are already logged and handled in load()
    load().catch(() => {
      // Error is already logged in load() and set in error state
    })
  }, [load])

  const createFolder = useCallback(
    async (name: string, parentId?: string) => {
      if (USE_REMOTE_DRIVE) {
        await createRemoteFolder(entityType, entityId, name, actorId, actorRole)
        await load()
        return
      }

      const folder = await createDriveFolder(entityType, entityId, name, parentId, actorId, entityName)
      await load()
      return folder
    },
    [actorId, actorRole, entityId, entityName, entityType, load]
  )

  const uploadFiles = useCallback(
    async (selectedFiles: File[], parentId?: string) => {
      if (USE_REMOTE_DRIVE) {
        await uploadRemoteFiles(entityType, entityId, selectedFiles, actorId, actorRole)
        await load()
        return
      }

      const uploaded = await uploadDriveFiles(entityType, entityId, selectedFiles, parentId, actorId, actorRole, entityName)
      await load()
      return uploaded
    },
    [actorId, actorRole, entityId, entityName, entityType, load]
  )

  const deleteItem = useCallback(
    async (targetId: string, type: 'file' | 'folder') => {
      if (USE_REMOTE_DRIVE) {
        await deleteRemoteEntry(entityType, entityId, targetId, type, actorId, actorRole)
        await load()
        return
      }

      // O serviço local (googleDriveService) gerencia exclusão recursiva e não precisa do type
      await deleteEntry(entityType, entityId, targetId, actorId)
      await load()
    },
    [actorId, actorRole, entityId, entityType, load]
  )

  const generateLink = useCallback(
    async (fileId: string, visibility: DriveLink['visibility'] = 'organization') => {
      if (USE_REMOTE_DRIVE) {
        console.warn('[useDriveDocuments] generateLink remoto ainda não implementado, retornando null')
        return null
      }

      const link = await generateDriveLink(entityType, entityId, fileId, visibility)
      await load()
      return link
    },
    [entityId, entityType, load]
  )

  const applyPermissions = useCallback(
    async (targetIds: string[]) => {
      if (USE_REMOTE_DRIVE) {
        console.warn('[useDriveDocuments] applyPermissions remoto ainda não implementado')
        return
      }

      await applyInheritedPermissions(entityType, entityId, actorRole, targetIds, actorId)
      await load()
    },
    [actorId, actorRole, entityId, entityType, load]
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
    activities,
    loading,
    error,
    createFolder,
    uploadFiles,
    deleteItem,
    generateLink,
    applyPermissions,
    refreshActivity,
    reload: load,
  }
}
