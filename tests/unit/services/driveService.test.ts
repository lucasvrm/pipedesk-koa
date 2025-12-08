import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDriveItems,
  createFolder,
  uploadFile,
  deleteFile,
  deleteFolder,
  repairStructure,
  syncName,
} from '@/services/driveService';
import * as supabaseClient from '@/lib/supabaseClient';
import * as safeFetchModule from '@/lib/safeFetch';

// Mock the modules
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/safeFetch', () => ({
  safeFetch: vi.fn(),
}));

describe('DriveService', () => {
  const mockToken = 'mock-auth-token';
  const mockBaseUrl = 'https://test-drive-api.com';
  const mockUserId = 'user-123';
  const mockUserRole = 'admin';

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
          user: { id: mockUserId },
        },
      },
      error: null,
    });

    // Mock profile fetch
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { role: mockUserRole },
            error: null,
          }),
        })),
      })),
    }));
    vi.mocked(supabaseClient.supabase.from).mockImplementation(mockFrom);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getDriveItems', () => {
    it('should get drive items for an entity', async () => {
      const mockResponse = {
        items: [
          {
            id: 'file-1',
            name: 'Document.pdf',
            type: 'file',
            size: 1024,
          },
          {
            id: 'folder-1',
            name: 'Folder',
            type: 'folder',
          },
        ],
        total: 2,
      };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await getDriveItems('deal', 'deal-123');

      expect(result).toEqual({
        items: mockResponse.items,
        total: mockResponse.total,
      });
      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/drive/items'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'x-user-id': mockUserId,
            'x-user-role': mockUserRole,
          }),
        })
      );
      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.stringContaining('entityType=deal'),
        expect.any(Object)
      );
      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.stringContaining('entityId=deal-123'),
        expect.any(Object)
      );
    });

    it('should support pagination options', async () => {
      const mockResponse = { items: [], total: 0 };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await getDriveItems('lead', 'lead-456', { page: 2, limit: 25 });

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=25'),
        expect.any(Object)
      );
    });

    it('should support folderId option', async () => {
      const mockResponse = { items: [], total: 0 };

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await getDriveItems('company', 'company-789', { folderId: 'folder-abc' });

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.stringContaining('folderId=folder-abc'),
        expect.any(Object)
      );
    });

    it('should throw error on failed request', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      } as Response);

      await expect(getDriveItems('deal', 'deal-123')).rejects.toThrow(
        'Failed to get drive items for deal deal-123'
      );
    });
  });

  describe('createFolder', () => {
    it('should create a folder for an entity', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await createFolder('deal', 'deal-123', { name: 'Documents' });

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/drive/deal/deal-123/folder`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ name: 'Documents' }),
        })
      );
    });

    it('should create folder with parentId', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await createFolder('lead', 'lead-456', {
        name: 'Subfolder',
        parentId: 'parent-folder-id',
      });

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            name: 'Subfolder',
            parent_id: 'parent-folder-id',
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

      await expect(
        createFolder('deal', 'deal-123', { name: 'Test' })
      ).rejects.toThrow('Failed to create folder for deal deal-123');
    });
  });

  describe('uploadFile', () => {
    it('should upload a file for an entity', async () => {
      const mockFile = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      });

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await uploadFile('deal', 'deal-123', mockFile);

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/drive/deal/deal-123/upload`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should upload file with parentId option', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await uploadFile('lead', 'lead-456', mockFile, {
        parentId: 'folder-123',
      });

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/drive/lead/lead-456/upload`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should throw error on failed upload', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: false,
        status: 413,
        text: async () => 'File too large',
      } as Response);

      await expect(uploadFile('deal', 'deal-123', mockFile)).rejects.toThrow(
        'Failed to upload file for deal deal-123'
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete a file from an entity', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await deleteFile('deal', 'deal-123', 'file-456');

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/drive/deal/deal-123/files/file-456`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should throw error on failed deletion', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'File not found',
      } as Response);

      await expect(deleteFile('lead', 'lead-456', 'file-789')).rejects.toThrow(
        'Failed to delete file for lead lead-456'
      );
    });
  });

  describe('deleteFolder', () => {
    it('should delete a folder from an entity', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await deleteFolder('company', 'company-789', 'folder-abc');

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/drive/company/company-789/folders/folder-abc`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should throw error on failed deletion', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: false,
        status: 409,
        text: async () => 'Folder not empty',
      } as Response);

      await expect(
        deleteFolder('deal', 'deal-123', 'folder-456')
      ).rejects.toThrow('Failed to delete folder for deal deal-123');
    });
  });

  describe('repairStructure', () => {
    it('should repair Drive structure for an entity', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await repairStructure('deal', 'deal-123');

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/drive/deal/deal-123/repair`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error on failed repair', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Repair failed',
      } as Response);

      await expect(repairStructure('lead', 'lead-456')).rejects.toThrow(
        'Failed to repair structure for lead lead-456'
      );
    });
  });

  describe('syncName', () => {
    it('should sync entity name with Drive folder', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await syncName('deal', 'deal-123');

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/drive/sync-name`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            entity_type: 'deal',
            entity_id: 'deal-123',
          }),
        })
      );
    });

    it('should sync name for lead entity', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await syncName('lead', 'lead-456');

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            entity_type: 'lead',
            entity_id: 'lead-456',
          }),
        })
      );
    });

    it('should sync name for company entity', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await syncName('company', 'company-789');

      expect(safeFetchModule.safeFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            entity_type: 'company',
            entity_id: 'company-789',
          }),
        })
      );
    });

    it('should throw error on failed sync', async () => {
      vi.mocked(safeFetchModule.safeFetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Sync failed',
      } as Response);

      await expect(syncName('deal', 'deal-123')).rejects.toThrow(
        'Failed to sync name for deal deal-123'
      );
    });
  });

  describe('Error handling', () => {
    it('should throw error when Drive API URL is not configured', async () => {
      import.meta.env.VITE_DRIVE_API_URL = '';

      await expect(getDriveItems('deal', 'deal-123')).rejects.toThrow(
        'Drive API URL not configured'
      );
    });

    it('should throw error when no auth token is available', async () => {
      import.meta.env.VITE_DRIVE_API_URL = mockBaseUrl;

      vi.mocked(supabaseClient.supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(getDriveItems('deal', 'deal-123')).rejects.toThrow(
        'No authentication token available'
      );
    });

    it('should handle auth session errors', async () => {
      import.meta.env.VITE_DRIVE_API_URL = mockBaseUrl;

      vi.mocked(supabaseClient.supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Auth error', name: 'AuthError' },
      });

      await expect(getDriveItems('deal', 'deal-123')).rejects.toThrow(
        'Authentication error: Auth error'
      );
    });
  });
});
