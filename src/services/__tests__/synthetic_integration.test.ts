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
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('Synthetic Data Integration Simulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully generate deals even if only real companies exist', async () => {
    // Setup Mock: Users exist
    const mockUsers = { data: [{ id: 'user1' }] };

    // Setup Mock: No synthetic companies, but real companies exist
    const mockSyntheticCompanies = { data: [] };
    const mockRealCompanies = { data: [{ id: 'real_comp_1', name: 'Real Corp' }] };

    // Setup Mock: Deals insert success
    const mockCreatedDeals = { data: [{ id: 'deal1' }, { id: 'deal2' }], error: null };

    // Create a robust query builder mock that handles chaining
    const queryBuilder: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    };

    (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
            // For users select
            // We need to make sure the chain returns the resolved value at the end
            // profiles.select('id') -> Promise
            const qb: any = { select: vi.fn().mockResolvedValue(mockUsers) };
            return qb;
        }
        if (table === 'companies') {
            // companies.select(...).eq(...).limit(...)
            // companies.select(...).limit(...)

            // We need to differentiate the calls or return sequence
            // Call 1: select -> eq -> limit -> Promise (empty)
            // Call 2: select -> limit -> Promise (real)

            const qb: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                limit: vi.fn()
                    .mockResolvedValueOnce(mockSyntheticCompanies)
                    .mockResolvedValueOnce(mockRealCompanies)
            };
            return qb;
        }
        if (table === 'master_deals') {
            // master_deals.insert(...).select() -> Promise
            const qb: any = {
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue(mockCreatedDeals)
            };
            return qb;
        }
        return queryBuilder;
    });

    const result = await syntheticDataService.generateDeals(2, false);

    expect(result.count).toBe(2);
    expect(result.ids).toContain('deal1');
    expect(supabase.from).toHaveBeenCalledWith('master_deals');
  });

  it('should return correct format from generateCompanies', async () => {
      const mockCreated = { data: [{ id: 'c1' }, { id: 'c2' }], error: null };

      const qb: any = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue(mockCreated)
      };
      (supabase.from as any).mockReturnValue(qb);

      const result = await syntheticDataService.generateCompanies(2, 'u1', false);

      expect(result.count).toBe(2);
      expect(result.ids).toEqual(['c1', 'c2']);
  });
});
