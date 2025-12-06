import { supabase } from './supabaseClient';
import { safeFetch } from './safeFetch';

// Custom error class for Drive API errors
export class DriveApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: string
  ) {
    super(message);
    this.name = 'DriveApiError';
  }
}

// Types for Drive API responses
export interface DriveItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  url?: string;
  permission?: 'read' | 'write' | 'admin';
}

export interface DriveFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
  permission?: 'read' | 'write' | 'admin';
}

export interface DriveFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  folderId?: string;
  createdAt: string;
  updatedAt?: string;
  permission?: 'read' | 'write' | 'admin';
}

export interface DriveListResponse {
  files: DriveItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  permission?: 'read' | 'write' | 'admin';
}

export interface ListDriveItemsResponse {
  items: DriveItem[];
  total: number;
}

export interface CreateDriveFolderResponse {
  folder: DriveFolder;
}

export interface UploadDriveFileResponse {
  file: DriveFile;
}

export interface DeleteResponse {
  success: boolean;
  message?: string;
}

// Helper function to get the Drive API base URL
const getDriveApiUrl = (): string => {
  const url = import.meta.env.VITE_DRIVE_API_URL;
  if (!url) {
    throw new Error('Drive API URL not configured. Please set VITE_DRIVE_API_URL environment variable.');
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// Helper function to get the current user's token from Supabase
const getAuthToken = async (): Promise<string> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('[DriveClient] Error getting session:', error);
    throw new Error(`Authentication error: ${error.message}`);
  }

  if (!session?.access_token) {
    throw new Error('No authentication token available. Please sign in.');
  }

  return session.access_token;
};

// Helper function to make authenticated requests to Drive API
const driveApiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const baseUrl = getDriveApiUrl();
  const token = await getAuthToken();

  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return safeFetch(url, {
    ...options,
    headers,
  });
};

/**
 * List items in a Drive folder
 * @param folderIdOrEntityType - Folder ID or entity type (e.g., "deal", "lead")
 * @param entityId - Entity ID when first parameter is entity type
 * @param page - Optional page number for pagination (default: 1)
 * @param limit - Optional items per page (default: 50)
 * @returns Promise with list of drive items
 * @throws {DriveApiError} If the API request fails
 */
export async function listDriveItems(
  folderIdOrEntityType?: string,
  entityId?: string | number,
  page: number = 1,
  limit: number = 50
): Promise<ListDriveItemsResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Check if this is an entity-based query (entityId is provided)
    const isEntityQuery = entityId !== undefined;
    
    if (isEntityQuery) {
      // Entity-based query: /api/drive/items?entityType=deal&entityId=123
      params.append('entityType', folderIdOrEntityType || '');
      params.append('entityId', entityId.toString());
    } else if (folderIdOrEntityType) {
      // Folder-based query: /api/drive/items?folderId=abc123
      params.append('folderId', folderIdOrEntityType);
    }

    const response = await driveApiFetch(`/api/drive/items?${params.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new DriveApiError(
        `Failed to list drive items: ${response.status} ${errorText}`,
        response.status,
        errorText
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[DriveClient] listDriveItems error:', error);
    throw error;
  }
}

/**
 * Create a new folder in Drive
 * @param name - Folder name
 * @param parentId - Optional parent folder ID
 * @returns Promise with created folder information
 * @throws {DriveApiError} If the API request fails
 */
export async function createDriveFolder(
  name: string,
  parentId?: string
): Promise<CreateDriveFolderResponse> {
  try {
    const response = await driveApiFetch('/api/drive/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        parentId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DriveApiError(
        `Failed to create folder: ${response.status} ${errorText}`,
        response.status,
        errorText
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[DriveClient] createDriveFolder error:', error);
    throw error;
  }
}

/**
 * Upload a file to Drive
 * @param file - File object to upload
 * @param folderId - Optional folder ID where the file should be uploaded
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Promise with uploaded file information
 * @throws {DriveApiError} If the API request fails
 */
export async function uploadDriveFile(
  file: File,
  folderId?: string,
  onProgress?: (progress: number) => void
): Promise<UploadDriveFileResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (folderId) {
      formData.append('folderId', folderId);
    }

    // Note: This implementation doesn't support real-time progress tracking.
    // For real progress tracking, consider implementing a custom fetch wrapper
    // that uses ReadableStream or XMLHttpRequest with progress events.
    const response = await driveApiFetch('/api/drive/files', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DriveApiError(
        `Failed to upload file: ${response.status} ${errorText}`,
        response.status,
        errorText
      );
    }

    const data = await response.json();
    
    // Call progress callback after completion if provided
    // Note: This only indicates completion (100%), not real-time progress
    if (onProgress) {
      onProgress(100);
    }
    
    return data;
  } catch (error) {
    console.error('[DriveClient] uploadDriveFile error:', error);
    throw error;
  }
}

/**
 * Delete a file from Drive
 * @param fileId - ID of the file to delete
 * @returns Promise with deletion result
 * @throws {DriveApiError} If the API request fails
 */
export async function deleteDriveFile(fileId: string): Promise<DeleteResponse> {
  try {
    const response = await driveApiFetch(`/api/drive/files/${fileId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DriveApiError(
        `Failed to delete file: ${response.status} ${errorText}`,
        response.status,
        errorText
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[DriveClient] deleteDriveFile error:', error);
    throw error;
  }
}

/**
 * Delete a folder from Drive
 * @param folderId - ID of the folder to delete
 * @param recursive - Whether to delete folder contents recursively (default: false)
 * @returns Promise with deletion result
 * @throws {DriveApiError} If the API request fails
 */
export async function deleteDriveFolder(
  folderId: string,
  recursive: boolean = false
): Promise<DeleteResponse> {
  try {
    const params = new URLSearchParams();
    if (recursive) {
      params.append('recursive', 'true');
    }

    const endpoint = `/api/drive/folders/${folderId}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await driveApiFetch(endpoint, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DriveApiError(
        `Failed to delete folder: ${response.status} ${errorText}`,
        response.status,
        errorText
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[DriveClient] deleteDriveFolder error:', error);
    throw error;
  }
}
