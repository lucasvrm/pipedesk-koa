import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTemplateForRole, saveTemplate, getAllTemplates, deleteTemplate } from '@/services/dashboardTemplateService';
import { supabase } from '@/lib/supabaseClient';

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('dashboardTemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTemplateForRole', () => {
    it('should return role-specific template when it exists', async () => {
      const mockConfig = {
        topWidgets: ['widget1', 'widget2'],
        mainWidgets: ['widget3']
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { config: mockConfig },
              error: null
            })
          })
        })
      });

      (supabase.from as any) = mockFrom;

      const result = await getTemplateForRole('admin');

      expect(result).toEqual(mockConfig);
      expect(mockFrom).toHaveBeenCalledWith('dashboard_templates');
    });

    it('should return global template when role-specific does not exist', async () => {
      const mockGlobalConfig = {
        topWidgets: ['global1', 'global2'],
        mainWidgets: ['global3']
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,  // Role-specific template not found
              error: null
            })
          }),
          is: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { config: mockGlobalConfig },  // Global template found
              error: null
            })
          })
        })
      });

      (supabase.from as any) = mockFrom;

      const result = await getTemplateForRole('analyst');

      expect(result).toEqual(mockGlobalConfig);
    });

    it('should return null when no templates exist', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          }),
          is: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      });

      (supabase.from as any) = mockFrom;

      const result = await getTemplateForRole('client');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      (supabase.from as any) = mockFrom;

      const result = await getTemplateForRole('admin');

      expect(result).toBeNull();
    });
  });

  describe('saveTemplate', () => {
    it('should save a template successfully', async () => {
      const mockConfig = {
        topWidgets: ['widget1'],
        mainWidgets: ['widget2']
      };

      const mockSavedData = {
        id: 'test-id',
        role: 'admin',
        config: mockConfig,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockFrom = vi.fn().mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSavedData,
              error: null
            })
          })
        })
      });

      (supabase.from as any) = mockFrom;

      const result = await saveTemplate('admin', mockConfig);

      expect(result).toEqual({
        id: 'test-id',
        role: 'admin',
        config: mockConfig,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      });
    });

    it('should throw error when save fails', async () => {
      const mockConfig = {
        topWidgets: ['widget1'],
        mainWidgets: ['widget2']
      };

      const mockFrom = vi.fn().mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Permission denied' }
            })
          })
        })
      });

      (supabase.from as any) = mockFrom;

      await expect(saveTemplate('admin', mockConfig)).rejects.toThrow('Failed to save dashboard template');
    });
  });

  describe('getAllTemplates', () => {
    it('should return all templates', async () => {
      const mockTemplates = [
        {
          id: '1',
          role: null,
          config: { topWidgets: ['w1'], mainWidgets: ['w2'] },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          role: 'admin',
          config: { topWidgets: ['w3'], mainWidgets: ['w4'] },
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockTemplates,
            error: null
          })
        })
      });

      (supabase.from as any) = mockFrom;

      const result = await getAllTemplates();

      expect(result).toHaveLength(2);
      expect(result[0].role).toBeNull();
      expect(result[1].role).toBe('admin');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a role-specific template', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      });

      (supabase.from as any) = mockFrom;

      const result = await deleteTemplate('admin');

      expect(result).toBe(true);
    });

    it('should delete global template (null role) using is() method', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({
            error: null
          })
        })
      });

      (supabase.from as any) = mockFrom;

      const result = await deleteTemplate(null);

      expect(result).toBe(true);
    });

    it('should throw error when delete fails', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Permission denied' }
          })
        })
      });

      (supabase.from as any) = mockFrom;

      await expect(deleteTemplate('admin')).rejects.toThrow('Failed to delete dashboard template');
    });
  });
});
