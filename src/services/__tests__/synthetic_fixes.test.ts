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
    rpc: vi.fn(),
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('Synthetic Data Service - Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use RPC for clearAllSyntheticData', async () => {
    const mockRPCResponse = { data: { deals: 5, companies: 2 }, error: null };
    (supabase.rpc as any).mockResolvedValue(mockRPCResponse);
    // Mock Auth cleanup call
    (supabase.functions.invoke as any).mockResolvedValue({ data: {}, error: null });

    const result = await syntheticDataService.clearAllSyntheticData();

    expect(supabase.rpc).toHaveBeenCalledWith('clear_synthetic_data');
    expect(result).toEqual(mockRPCResponse.data);
  });

  it('should handle edge function array response for users safely', async () => {
    // Case 1: Valid Array
    (supabase.functions.invoke as any).mockResolvedValueOnce({
        data: { created: [{ id: 'u1' }, { id: 'u2' }] },
        error: null
    });

    // Mock profile update
    (supabase.from as any).mockImplementation(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
    }));

    const result1 = await syntheticDataService.generateUsers(2, false);
    expect(result1.count).toBe(2);

    // Case 2: Invalid (null) created
    (supabase.functions.invoke as any).mockResolvedValueOnce({
        data: { created: null },
        error: null
    });

    const result2 = await syntheticDataService.generateUsers(2, false);
    expect(result2.count).toBe(0);
    expect(result2.ids).toEqual([]);
  });
});
