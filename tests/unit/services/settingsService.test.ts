import { describe, it, expect, vi, beforeEach } from 'vitest'
import { settingsService, getSystemSetting, updateSystemSetting } from '@/services/settingsService'
import { supabase } from '@/lib/supabaseClient'

// Mock supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}))

describe('settingsService', () => {
  const createMockResponse = (data: any) => ({
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK'
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should list all items from deal_statuses table', async () => {
      const mockData = [
        {
          id: 'status-1',
          code: 'active',
          label: 'Ativo',
          color: '#3b82f6',
          description: 'Deal is active',
          is_active: true,
          sort_order: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => Promise.resolve(createMockResponse(mockData)))
      }))

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await settingsService.list('deal_statuses')

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0]).toHaveProperty('code', 'active')
      expect(result.data![0]).toHaveProperty('label', 'Ativo')
      expect(result.data![0]).toHaveProperty('color', '#3b82f6')
    })

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database error')
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
      }))

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await settingsService.list('lead_statuses')

      expect(result.error).toBe(mockError)
      expect(result.data).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a new lead_status', async () => {
      const payload = {
        code: 'new',
        label: 'Novo',
        description: 'New lead',
        isActive: true,
        sortOrder: 1
      }

      const mockData = {
        id: 'status-new',
        code: 'new',
        label: 'Novo',
        description: 'New lead',
        is_active: true,
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockSelect = vi.fn(() => ({
        single: vi.fn(() => Promise.resolve(createMockResponse(mockData)))
      }))

      const mockInsert = vi.fn(() => ({ select: mockSelect }))

      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const result = await settingsService.create('lead_statuses', payload)

      expect(result.error).toBeNull()
      expect(result.data).toHaveProperty('code', 'new')
      expect(result.data).toHaveProperty('label', 'Novo')
    })

    it('should validate code is not empty', async () => {
      const payload = {
        code: '   ', // whitespace only
        label: 'Test',
        isActive: true,
        sortOrder: 1
      }

      const result = await settingsService.create('lead_statuses', payload)

      expect(result.error).not.toBeNull()
      expect(result.error?.message).toBe('Code cannot be empty')
      expect(result.data).toBeNull()
    })
  })

  describe('update', () => {
    it('should update an existing item', async () => {
      const payload = {
        label: 'Updated Label',
        description: 'Updated description'
      }

      const mockData = {
        id: 'status-1',
        code: 'active',
        label: 'Updated Label',
        description: 'Updated description',
        is_active: true,
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockSelect = vi.fn(() => ({
        single: vi.fn(() => Promise.resolve(createMockResponse(mockData)))
      }))

      const mockEq = vi.fn(() => ({ select: mockSelect }))
      const mockUpdate = vi.fn(() => ({ eq: mockEq }))

      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

      const result = await settingsService.update('deal_statuses', 'status-1', payload)

      expect(result.error).toBeNull()
      expect(result.data).toHaveProperty('label', 'Updated Label')
    })

    it('should validate ID is not empty', async () => {
      const result = await settingsService.update('deal_statuses', '', { label: 'Test' })

      expect(result.error).not.toBeNull()
      expect(result.error?.message).toBe('ID cannot be empty')
      expect(result.data).toBeNull()
    })
  })

  describe('remove', () => {
    it('should delete an item', async () => {
      const mockEq = vi.fn(() => Promise.resolve({ error: null }))
      const mockDelete = vi.fn(() => ({ eq: mockEq }))

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any)

      const result = await settingsService.remove('lead_origins', 'origin-1')

      expect(result.error).toBeNull()
    })

    it('should validate ID is not empty', async () => {
      const result = await settingsService.remove('lead_origins', '')

      expect(result.error).not.toBeNull()
      expect(result.error?.message).toBe('ID cannot be empty')
    })
  })

  describe('getSystemSetting', () => {
    it('should get a system setting by key', async () => {
      const mockData = { value: { enabled: true } }

      const mockMaybeSingle = vi.fn(() => Promise.resolve(createMockResponse(mockData)))
      const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
      const mockSelect = vi.fn(() => ({ eq: mockEq }))

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await getSystemSetting('test_key')

      expect(result.error).toBeNull()
      expect(result.data).toEqual({ enabled: true })
    })

    it('should return null for non-existent key', async () => {
      const mockMaybeSingle = vi.fn(() => Promise.resolve(createMockResponse(null)))
      const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
      const mockSelect = vi.fn(() => ({ eq: mockEq }))

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await getSystemSetting('non_existent')

      expect(result.error).toBeNull()
      expect(result.data).toBeNull()
    })
  })

  describe('updateSystemSetting', () => {
    it('should update a system setting', async () => {
      const mockUser = { data: { user: { id: 'user-1' } }, error: null }
      vi.mocked(supabase.auth.getUser).mockResolvedValue(mockUser as any)

      const mockData = {
        key: 'test_key',
        value: { enabled: false },
        description: 'Test setting',
        updated_by: 'user-1',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockSingle = vi.fn(() => Promise.resolve(createMockResponse(mockData)))
      const mockSelect = vi.fn(() => ({ single: mockSingle }))
      const mockUpsert = vi.fn(() => ({ select: mockSelect }))

      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as any)

      const result = await updateSystemSetting('test_key', { enabled: false })

      expect(result.error).toBeNull()
      expect(result.data).toHaveProperty('key', 'test_key')
    })

    it('should validate key is not empty', async () => {
      const result = await updateSystemSetting('', { enabled: true })

      expect(result.error).not.toBeNull()
      expect(result.error?.message).toBe('Key cannot be empty')
      expect(result.data).toBeNull()
    })

    it('should delete a system setting when value is null', async () => {
      const mockEq = vi.fn(() => Promise.resolve({ error: null }))
      const mockDelete = vi.fn(() => ({ eq: mockEq }))

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any)

      const result = await updateSystemSetting('test_key', null)

      expect(result.error).toBeNull()
      expect(result.data).toBeNull()
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('key', 'test_key')
    })

    it('should delete a system setting when value is undefined', async () => {
      const mockEq = vi.fn(() => Promise.resolve({ error: null }))
      const mockDelete = vi.fn(() => ({ eq: mockEq }))

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any)

      const result = await updateSystemSetting('test_key', undefined)

      expect(result.error).toBeNull()
      expect(result.data).toBeNull()
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('key', 'test_key')
    })

    it('should return error when delete fails', async () => {
      const mockError = new Error('Delete failed')
      const mockEq = vi.fn(() => Promise.resolve({ error: mockError }))
      const mockDelete = vi.fn(() => ({ eq: mockEq }))

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any)

      const result = await updateSystemSetting('test_key', null)

      expect(result.error).toBe(mockError)
      expect(result.data).toBeNull()
    })
  })

  describe('user_role_metadata CRUD', () => {
    it('should list user role metadata with badgeVariant', async () => {
      const mockData = [
        {
          id: 'role-1',
          code: 'admin',
          label: 'Administrador',
          description: 'Admin role',
          badge_variant: 'default',
          permissions: ['manage_users', 'manage_settings'],
          is_active: true,
          sort_order: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => Promise.resolve(createMockResponse(mockData)))
      }))

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await settingsService.list('user_role_metadata')

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0]).toHaveProperty('code', 'admin')
      expect(result.data![0]).toHaveProperty('badgeVariant', 'default')
      expect(result.data![0]).toHaveProperty('permissions')
      expect(result.data![0].permissions).toEqual(['manage_users', 'manage_settings'])
    })

    it('should create user role metadata with permissions array', async () => {
      const payload = {
        code: 'viewer',
        label: 'Viewer',
        description: 'Read-only access',
        badgeVariant: 'outline',
        permissions: ['view_deals', 'view_reports'],
        isActive: true,
        sortOrder: 5
      }

      const mockData = {
        id: 'role-new',
        code: 'viewer',
        label: 'Viewer',
        description: 'Read-only access',
        badge_variant: 'outline',
        permissions: ['view_deals', 'view_reports'],
        is_active: true,
        sort_order: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockSelect = vi.fn(() => ({
        single: vi.fn(() => Promise.resolve(createMockResponse(mockData)))
      }))

      const mockInsert = vi.fn(() => ({ select: mockSelect }))

      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const result = await settingsService.create('user_role_metadata', payload)

      expect(result.error).toBeNull()
      expect(result.data).toHaveProperty('code', 'viewer')
      expect(result.data).toHaveProperty('badgeVariant', 'outline')
      expect(result.data?.permissions).toEqual(['view_deals', 'view_reports'])
    })

    it('should update user role metadata with new badgeVariant', async () => {
      const payload = {
        label: 'Super Admin',
        badgeVariant: 'destructive',
        permissions: ['manage_all']
      }

      const mockData = {
        id: 'role-1',
        code: 'admin',
        label: 'Super Admin',
        description: 'Admin role',
        badge_variant: 'destructive',
        permissions: ['manage_all'],
        is_active: true,
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }

      const mockSelect = vi.fn(() => ({
        single: vi.fn(() => Promise.resolve(createMockResponse(mockData)))
      }))

      const mockEq = vi.fn(() => ({ select: mockSelect }))
      const mockUpdate = vi.fn(() => ({ eq: mockEq }))

      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

      const result = await settingsService.update('user_role_metadata', 'role-1', payload)

      expect(result.error).toBeNull()
      expect(result.data).toHaveProperty('label', 'Super Admin')
      expect(result.data).toHaveProperty('badgeVariant', 'destructive')
      expect(result.data?.permissions).toEqual(['manage_all'])
    })

    it('should handle empty permissions array', async () => {
      const mockData = [
        {
          id: 'role-2',
          code: 'guest',
          label: 'Guest',
          description: 'Guest role',
          badge_variant: 'outline',
          permissions: null, // null permissions in database
          is_active: true,
          sort_order: 10,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => Promise.resolve(createMockResponse(mockData)))
      }))

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await settingsService.list('user_role_metadata')

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0].permissions).toEqual([]) // Should default to empty array
    })
  })
})
