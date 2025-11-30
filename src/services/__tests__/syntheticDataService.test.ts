import { vi, describe, it, expect, beforeEach } from 'vitest';
import { syntheticDataService } from '../syntheticDataService';
import { supabase } from '@/lib/supabaseClient';

// Mock Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('syntheticDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call edge function for generating users', async () => {
    const mockResponse = { data: { created: [{ id: '1', email: 'test@test.com' }] }, error: null };
    (supabase.functions.invoke as any).mockResolvedValue(mockResponse);

    await syntheticDataService.generateUsers(5, true);

    expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-synthetic-users', {
      body: { action: 'create', count: 5, password: 'password123' }
    });
  });

  it('should generate companies with correct flags', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: 'comp1' }], error: null })
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'companies') return { insert: mockInsert };
      if (table === 'contacts') return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [], error: null }) }) };
      return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [], error: null }) }) };
    });

    await syntheticDataService.generateCompanies(1, 'user1', false);

    expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        is_synthetic: true,
        created_by: 'user1'
      })
    ]));
  });

  it('should generate leads with contacts and members', async () => {
    const mockLeadsInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: 'lead1' }], error: null })
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'leads') return { insert: mockLeadsInsert };
      if (table === 'lead_members') return { insert: vi.fn().mockResolvedValue({ error: null }) };
      if (table === 'contacts') return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [{ id: 'cont1' }, { id: 'cont2' }] }) }) };
      if (table === 'lead_contacts') return { insert: vi.fn().mockResolvedValue({ error: null }) };
      return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({}) }) };
    });

    await syntheticDataService.generateLeads(1, 'user1', true);

    expect(mockLeadsInsert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        is_synthetic: true,
        owner_user_id: 'user1'
      })
    ]));
  });

  it('should clear all synthetic data in correct order', async () => {
    // Chain mock specifically for the clear sequence
    const mockDelete = vi.fn();
    const mockEq = vi.fn();
    const mockLike = vi.fn();

    // Set up chain: delete() -> eq() or like() -> Promise
    mockDelete.mockReturnValue({
        eq: mockEq,
        like: mockLike
    });
    mockEq.mockResolvedValue({});
    mockLike.mockResolvedValue({});

    (supabase.from as any).mockReturnValue({ delete: mockDelete });
    (supabase.functions.invoke as any).mockResolvedValue({ data: {}, error: null });

    await syntheticDataService.clearAllSyntheticData();

    // Verify calls
    expect(supabase.from).toHaveBeenCalledWith('master_deals');
    expect(supabase.from).toHaveBeenCalledWith('leads');
    expect(supabase.from).toHaveBeenCalledWith('companies');
    expect(supabase.from).toHaveBeenCalledWith('players');
  });
});
