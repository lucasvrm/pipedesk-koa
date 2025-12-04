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

interface UseDriveDocumentsParams {
  entityId: string
  entityType: DriveEntityType
  actorId: string
  actorRole: DriveRole
  entityName?: string
}

export function useDriveDocuments({ entityId, entityType, actorId, actorRole, entityName }: UseDriveDocumentsParams) {
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [rootFolderId, setRootFolderId] = useState<string | null>(null)
  const [activities, setActivities] = useState<DriveActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const snapshot = await getEntityDocuments(entityType, entityId, entityName)
    setFolders(snapshot.folders)
    setFiles(snapshot.files)
    setRootFolderId(snapshot.rootFolderId)
    setActivities(snapshot.activity)
    setLoading(false)
  }, [entityId, entityType, entityName])

  useEffect(() => {
    load()
  }, [load])

  const createFolder = useCallback(
    async (name: string, parentId?: string) => {
      const folder = await createDriveFolder(entityType, entityId, name, parentId, actorId, entityName)
      await load()
      return folder
    },
    [actorId, entityId, entityName, entityType, load]
  )

  const uploadFiles = useCallback(
    async (selectedFiles: File[], parentId?: string) => {
      const uploaded = await uploadDriveFiles(entityType, entityId, selectedFiles, parentId, actorId, actorRole, entityName)
      await load()
      return uploaded
    },
    [actorId, actorRole, entityId, entityName, entityType, load]
  )

  const deleteItem = useCallback(
    async (targetId: string) => {
      await deleteEntry(entityType, entityId, targetId, actorId)
      await load()
    },
    [actorId, entityId, entityType, load]
  )

  const generateLink = useCallback(
    async (fileId: string, visibility: DriveLink['visibility'] = 'organization') => {
      const link = await generateDriveLink(entityType, entityId, fileId, visibility)
      await load()
      return link
    },
    [entityId, entityType, load]
  )

  const applyPermissions = useCallback(
    async (targetIds: string[]) => {
      await applyInheritedPermissions(entityType, entityId, actorRole, targetIds, actorId)
      await load()
    },
    [actorId, actorRole, entityId, entityType, load]
  )

  const refreshActivity = useCallback(async () => {
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
