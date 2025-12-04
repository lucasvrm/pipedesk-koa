import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { googleDriveService, DriveEntityType, DriveFile, DriveFolder } from '@/services/googleDriveService'

interface UseDriveDocumentsParams {
  entityId: string
  entityType: DriveEntityType
  entityName?: string
  currentUserId: string
}

export function useDriveDocuments({ entityId, entityType, entityName, currentUserId }: UseDriveDocumentsParams) {
  const queryClient = useQueryClient()
  const [rootFolderId, setRootFolderId] = useState<string | undefined>(undefined)

  const driveQuery = useQuery({
    queryKey: ['drive', entityType, entityId],
    queryFn: () => googleDriveService.listEntityDocuments(entityId, entityType, entityName),
    enabled: Boolean(entityId)
  })

  useEffect(() => {
    if (driveQuery.data?.hierarchy.entityFolder.id) {
      setRootFolderId(driveQuery.data.hierarchy.entityFolder.id)
    }
  }, [driveQuery.data?.hierarchy.entityFolder.id])

  const foldersIndex = useMemo(() => {
    const index = new Map<string, DriveFolder>()
    driveQuery.data?.folders.forEach(folder => index.set(folder.id, folder))
    return index
  }, [driveQuery.data?.folders])

  const files = driveQuery.data?.files || []
  const folders = driveQuery.data?.folders || []

  const createFolder = useMutation({
    mutationFn: (vars: { name: string; parentId: string }) =>
      googleDriveService.createFolder(vars.name, vars.parentId, entityId, entityType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drive', entityType, entityId] })
  })

  const uploadFiles = useMutation({
    mutationFn: (vars: { files: File[]; folderId: string }) =>
      googleDriveService.uploadFiles({
        files: vars.files,
        folderId: vars.folderId,
        entityId,
        entityType,
        uploadedBy: currentUserId
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drive', entityType, entityId] })
  })

  const deleteFile = useMutation({
    mutationFn: (fileId: string) => googleDriveService.deleteFile(fileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drive', entityType, entityId] })
  })

  const deleteFolder = useMutation({
    mutationFn: (folderId: string) => googleDriveService.deleteFolder(folderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drive', entityType, entityId] })
  })

  return {
    ...driveQuery,
    folders,
    files,
    foldersIndex,
    rootFolderId,
    createFolder,
    uploadFiles,
    deleteFile,
    deleteFolder
  }
}

export type { DriveFile, DriveFolder } from '@/services/googleDriveService'
