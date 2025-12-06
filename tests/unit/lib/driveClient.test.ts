import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  listDriveItems,
  createDriveFolder,
  uploadDriveFile,
  deleteDriveFile,
  deleteDriveFolder,
} from '@/lib/driveClient';
import * as supabaseClient from '@/lib/supabaseClient';
import * as safeFetchModule from '@/lib/safeFetch';

// Mock the modules
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/safeFetch', () => ({
  safeFetch: vi.fn(),
}));

describe('DriveClient', () => {
  const mockToken = 'mock-auth-token';
  const mockBaseUrl = 'https://test-drive-api.com';

  beforeEach(() => {
    // Mock environment variable
    import.meta.env.VITE_DRIVE_API_URL = mockBaseUrl;

    // Mock successful auth session
    vi.mocked(supabaseClient.supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: mockToken,
          refresh_token: 'refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: {} as any,
        },
      },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('listDriveItems', () => {
    it('should list drive items successfully', async () => {
      const mockResponse = {
        items: [
          {
            id: '1',
            name: 'Test File',
            type: 'file',
            size: 1024,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
      };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await listDriveItems();

      expect(result).toEqual(mockResponse);
      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/drive/items'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should list items with folder ID', async () => {
      const mockResponse = { items: [], total: 0 };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await listDriveItems('folder-123');

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.stringContaining('folderId=folder-123'),
        expect.any(Object)
      );
    });

    it('should handle pagination parameters', async () => {
      const mockResponse = { items: [], total: 0 };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await listDriveItems(undefined, 2, 25);

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=25'),
        expect.any(Object)
      );
    });

    it('should throw error on failed request', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      } as Response);

      await expect(listDriveItems()).rejects.toThrow('Failed to list drive items');
    });
  });

  describe('createDriveFolder', () => {
    it('should create a folder successfully', async () => {
      const mockResponse = {
        folder: {
          id: 'folder-1',
          name: 'New Folder',
          createdAt: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await createDriveFolder('New Folder');

      expect(result).toEqual(mockResponse);
      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/drive/folders`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            name: 'New Folder',
            parentId: undefined,
          }),
        })
      );
    });

    it('should create folder with parent ID', async () => {
      const mockResponse = { folder: { id: 'folder-1', name: 'Sub Folder', createdAt: '2024-01-01' } };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await createDriveFolder('Sub Folder', 'parent-folder-id');

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            name: 'Sub Folder',
            parentId: 'parent-folder-id',
          }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      } as Response);

      await expect(createDriveFolder('Test')).rejects.toThrow('Failed to create folder');
    });
  });

  describe('uploadDriveFile', () => {
    it('should upload a file successfully', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const mockResponse = {
        file: {
          id: 'file-1',
          name: 'test.txt',
          size: 7,
          mimeType: 'text/plain',
          url: 'https://example.com/file-1',
          createdAt: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await uploadDriveFile(mockFile);

      expect(result).toEqual(mockResponse);
      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/drive/files`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should upload file with folder ID', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const mockResponse = { file: { id: 'file-1', name: 'test.txt', size: 7, mimeType: 'text/plain', url: '', createdAt: '2024-01-01' } };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await uploadDriveFile(mockFile, 'folder-123');

      expect(safeFetchModule.safeFetch).toHaveBeenCalled();
    });

    it('should call progress callback on completion', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const mockResponse = { file: { id: 'file-1', name: 'test.txt', size: 7, mimeType: 'text/plain', url: '', createdAt: '2024-01-01' } };
      const onProgress = vi.fn();

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await uploadDriveFile(mockFile, undefined, onProgress);

      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it('should throw error on failed upload', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: false,
        status: 413,
        text: async () => 'File too large',
      } as Response);

      await expect(uploadDriveFile(mockFile)).rejects.toThrow('Failed to upload file');
    });
  });

  describe('deleteDriveFile', () => {
    it('should delete a file successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'File deleted successfully',
      };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await deleteDriveFile('file-123');

      expect(result).toEqual(mockResponse);
      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/drive/files/file-123`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should throw error on failed deletion', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'File not found',
      } as Response);

      await expect(deleteDriveFile('file-123')).rejects.toThrow('Failed to delete file');
    });
  });

  describe('deleteDriveFolder', () => {
    it('should delete a folder successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Folder deleted successfully',
      };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await deleteDriveFolder('folder-123');

      expect(result).toEqual(mockResponse);
      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/drive/folders/folder-123`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should delete folder recursively when specified', async () => {
      const mockResponse = { success: true };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await deleteDriveFolder('folder-123', true);

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.stringContaining('recursive=true'),
        expect.any(Object)
      );
    });

    it('should throw error on failed deletion', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: false,
        status: 409,
        text: async () => 'Folder not empty',
      } as Response);

      await expect(deleteDriveFolder('folder-123')).rejects.toThrow('Failed to delete folder');
    });
  });

  describe('Error handling', () => {
    it('should throw error when Drive API URL is not configured', async () => {
      import.meta.env.VITE_DRIVE_API_URL = '';

      await expect(listDriveItems()).rejects.toThrow('Drive API URL not configured');
    });

    it('should throw error when no auth token is available', async () => {
      import.meta.env.VITE_DRIVE_API_URL = mockBaseUrl;
      
      vi.mocked(supabaseClient.supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(listDriveItems()).rejects.toThrow('No authentication token available');
    });

    it('should handle auth session errors', async () => {
      import.meta.env.VITE_DRIVE_API_URL = mockBaseUrl;
      
      vi.mocked(supabaseClient.supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Auth error', name: 'AuthError' } as any,
      });

      await expect(listDriveItems()).rejects.toThrow();
    });
  });
});
