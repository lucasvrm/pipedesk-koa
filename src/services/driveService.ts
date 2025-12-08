import { driveApiFetch } from '@/lib/driveClient';
import type { DriveItem } from '@/lib/driveClient';

/**
 * Unified Drive Service for PipeDesk
 * 
 * This service provides a unified interface to integrate the frontend with
 * Drive backend endpoints (FastAPI/pd-google) for entities: lead, deal, and company.
 */

// ============================================================================
// Types
// ============================================================================

export type EntityType = 'lead' | 'deal' | 'company';

export interface GetDriveItemsOptions {
  page?: number;
  limit?: number;
  folderId?: string;
}

export interface GetDriveItemsResponse {
  items: DriveItem[];
  total: number;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

export interface UploadFileOptions {
  parentId?: string;
}

// Re-export DriveItem for convenience
export type { DriveItem };

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get drive items for an entity
 * 
 * @param entityType - Type of entity (lead, deal, or company)
 * @param entityId - ID of the entity
 * @param options - Optional pagination and folder filtering options
 * @returns Promise with items and total count
 * 
 * @example
 * const { items, total } = await getDriveItems('deal', 'deal-123', { page: 1, limit: 50 });
 */
export async function getDriveItems(
  entityType: EntityType,
  entityId: string,
  options?: GetDriveItemsOptions
): Promise<GetDriveItemsResponse> {
  try {
    const params = new URLSearchParams({
      entityType,
      entityId,
    });

    if (options?.page) {
      params.append('page', options.page.toString());
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options?.folderId) {
      params.append('folderId', options.folderId);
    }

    const response = await driveApiFetch(`/api/drive/items?${params.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get drive items for ${entityType} ${entityId}: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();
    return {
      items: data.items || [],
      total: data.total || 0,
    };
  } catch (error) {
    console.error('[DriveService] getDriveItems error:', error);
    throw error;
  }
}

/**
 * Create a folder for an entity
 * 
 * @param entityType - Type of entity (lead, deal, or company)
 * @param entityId - ID of the entity
 * @param request - Folder creation request with name and optional parentId
 * @returns Promise that resolves when folder is created
 * 
 * @example
 * await createFolder('deal', 'deal-123', { name: 'Documents', parentId: 'parent-folder-id' });
 */
export async function createFolder(
  entityType: EntityType,
  entityId: string,
  request: CreateFolderRequest
): Promise<void> {
  try {
    const body: { name: string; parent_id?: string } = { name: request.name };
    if (request.parentId) {
      body.parent_id = request.parentId;
    }

    const response = await driveApiFetch(
      `/api/drive/${entityType}/${entityId}/folder`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create folder for ${entityType} ${entityId}: ${response.status} ${errorText}`
      );
    }
  } catch (error) {
    console.error('[DriveService] createFolder error:', error);
    throw error;
  }
}

/**
 * Upload a file for an entity
 * 
 * @param entityType - Type of entity (lead, deal, or company)
 * @param entityId - ID of the entity
 * @param file - File to upload
 * @param options - Optional upload options (parentId for folder)
 * @returns Promise that resolves when upload is complete
 * 
 * @example
 * const file = new File(['content'], 'document.pdf');
 * await uploadFile('deal', 'deal-123', file, { parentId: 'folder-id' });
 */
export async function uploadFile(
  entityType: EntityType,
  entityId: string,
  file: File,
  options?: UploadFileOptions
): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.parentId) {
      formData.append('parent_id', options.parentId);
    }

    const response = await driveApiFetch(
      `/api/drive/${entityType}/${entityId}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to upload file for ${entityType} ${entityId}: ${response.status} ${errorText}`
      );
    }
  } catch (error) {
    console.error('[DriveService] uploadFile error:', error);
    throw error;
  }
}

/**
 * Delete a file from an entity
 * 
 * @param entityType - Type of entity (lead, deal, or company)
 * @param entityId - ID of the entity
 * @param fileId - ID of the file to delete
 * @returns Promise that resolves when file is deleted
 * 
 * @example
 * await deleteFile('deal', 'deal-123', 'file-id-456');
 */
export async function deleteFile(
  entityType: EntityType,
  entityId: string,
  fileId: string
): Promise<void> {
  try {
    const response = await driveApiFetch(
      `/api/drive/${entityType}/${entityId}/files/${fileId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete file for ${entityType} ${entityId}: ${response.status} ${errorText}`
      );
    }
  } catch (error) {
    console.error('[DriveService] deleteFile error:', error);
    throw error;
  }
}

/**
 * Delete a folder from an entity
 * 
 * @param entityType - Type of entity (lead, deal, or company)
 * @param entityId - ID of the entity
 * @param folderId - ID of the folder to delete
 * @returns Promise that resolves when folder is deleted
 * 
 * @example
 * await deleteFolder('deal', 'deal-123', 'folder-id-789');
 */
export async function deleteFolder(
  entityType: EntityType,
  entityId: string,
  folderId: string
): Promise<void> {
  try {
    const response = await driveApiFetch(
      `/api/drive/${entityType}/${entityId}/folders/${folderId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete folder for ${entityType} ${entityId}: ${response.status} ${errorText}`
      );
    }
  } catch (error) {
    console.error('[DriveService] deleteFolder error:', error);
    throw error;
  }
}

/**
 * Repair the Drive structure for an entity
 * 
 * @param entityType - Type of entity (lead, deal, or company)
 * @param entityId - ID of the entity
 * @returns Promise that resolves when structure is repaired
 * 
 * @example
 * await repairStructure('deal', 'deal-123');
 */
export async function repairStructure(
  entityType: EntityType,
  entityId: string
): Promise<void> {
  try {
    const response = await driveApiFetch(
      `/api/drive/${entityType}/${entityId}/repair`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to repair structure for ${entityType} ${entityId}: ${response.status} ${errorText}`
      );
    }
  } catch (error) {
    console.error('[DriveService] repairStructure error:', error);
    throw error;
  }
}

/**
 * Sync entity name with Drive folder name
 * 
 * @param entityType - Type of entity (lead, deal, or company)
 * @param entityId - ID of the entity
 * @returns Promise that resolves when name is synced
 * 
 * @example
 * await syncName('deal', 'deal-123');
 */
export async function syncName(
  entityType: EntityType,
  entityId: string
): Promise<void> {
  try {
    const response = await driveApiFetch(
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
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to sync name for ${entityType} ${entityId}: ${response.status} ${errorText}`
      );
    }
  } catch (error) {
    console.error('[DriveService] syncName error:', error);
    throw error;
  }
}
