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
} from '@/services/pdGoogleDriveApi'

interface UseDriveDocumentsParams {
  entityId: string
  entityType: DriveEntityType
  actorId: string
  actorRole: DriveRole
  entityName?: string
}

const PD_GOOGLE_BASE_URL = import.meta.env.VITE_PD_GOOGLE_BASE_URL
const USE_REMOTE_DRIVE = Boolean(PD_GOOGLE_BASE_URL)

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

  const load = useCallback(async () => {
    setLoading(true)

    if (USE_REMOTE_DRIVE) {
      // 🔗 Usa backend pd-google
      const snapshot = await getRemoteEntityDocuments(entityType, entityId, actorId, actorRole)
      setFolders(snapshot.folders)
      setFiles(snapshot.files)
      setRootFolderId(snapshot.rootFolderId)
      // activity ainda é local-only, por isso fica vazio aqui
      setActivities([])
      setLoading(false)
      return
    }

    // 🧪 Mock local padrão (completo)
    const snapshot = await getEntityDocuments(entityType, entityId, entityName)
    setFolders(snapshot.folders)
    setFiles(snapshot.files)
    setRootFolderId(snapshot.rootFolderId)
    setActivities(snapshot.activity)
    setLoading(false)
  }, [actorId, actorRole, entityId, entityType, entityName])

  useEffect(() => {
    load()
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
    async (targetId: string) => {
      if (USE_REMOTE_DRIVE) {
        // Ainda não temos delete no backend – por enquanto mantemos comportamento local somente
        console.warn('[useDriveDocuments] deleteItem remoto ainda não implementado no backend')
        return
      }

      await deleteEntry(entityType, entityId, targetId, actorId)
      await load()
    },
    [actorId, entityId, entityType, load]
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
    createFolder,
    uploadFiles,
    deleteItem,
    generateLink,
    applyPermissions,
    refreshActivity,
    reload: load,
  }
}
