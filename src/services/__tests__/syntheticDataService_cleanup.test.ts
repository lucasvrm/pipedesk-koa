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
      like: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('syntheticDataService Cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear orphan contacts', async () => {
    // We need a query builder mock that returns itself for chaining
    const queryBuilder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
    };

    // We need to support the specific return values for specific chains
    // Chain 1: contacts.select(id).eq(is_synthetic).is(company_id, null) -> returns orphans
    // Chain 2: lead_contacts.select(contact_id).in(contact_id, [ids]) -> returns linked
    // Chain 3: contacts.delete().in(id, [ids]) -> delete orphans

    // We can use mock implementation to differentiate based on table
    (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'contacts') {
            return queryBuilder;
        }
        if (table === 'lead_contacts') {
            return queryBuilder;
        }
        return queryBuilder;
    });

    // To differentiate the responses, we can mock the terminal methods to return a sequence of values
    // But since the chains are different (is vs in), we can use that too.

    // `is` is used for orphan query
    (queryBuilder.is as any).mockResolvedValue({ data: [{ id: 'c1' }, { id: 'c2' }] });

    // `in` is used for linked query AND delete query
    // This is tricky because one returns data, one deletes.
    // The service calls `await supabase...select()...in()` for linked
    // And `await supabase...delete().in()` for delete
    // But our mock object has both `select` and `delete` methods that return `this` (the same object).
    // So calling `in` works for both.
    // We need `in` to return different promises based on what happened before.

    // A simpler way: mock specific return values for specific calls if possible, or just sequence.
    (queryBuilder.in as any)
        .mockResolvedValueOnce({ data: [{ contact_id: 'c1' }] }) // linked query
        .mockResolvedValueOnce({ error: null }); // delete query

    const count = await syntheticDataService.clearOrphanSyntheticContacts();

    expect(count).toBe(1);
    expect(supabase.from).toHaveBeenCalledWith('contacts');
  });

  it('should clear synthetic leads and dependencies', async () => {
      const queryBuilder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
      };

      // Chaining support for .delete().eq().in() used in comments delete
      // Code: delete().eq().in()
      // `delete` returns `this`. `eq` returns `this`. `in` returns promise.

      // Setup mock return
      (queryBuilder.eq as any).mockImplementation(() => queryBuilder); // return self for chaining
      (queryBuilder.delete as any).mockImplementation(() => queryBuilder); // return self for chaining
      (queryBuilder.in as any).mockResolvedValue({ error: null }); // Terminal for deletes

      // Initial select for leads
      // Code: select('id').eq('is_synthetic', true)
      // Since eq returns self, we need `select` to return self too.
      // But `eq` is terminal in the first call (it is awaited directly? No, it returns a promise-like object in Supabase real client, here we mock resolved value on the last chain)
      // Actually `await supabase...eq(...)` calls `then` on the builder.
      // In our mock, we just return a Promise from the last chained method if it's supposed to be awaited.

      // Fix: Differentiate the initial select leads call
      const leadsQueryResponse = { data: [{ id: 'lead1' }] };

      (supabase.from as any).mockImplementation((table: string) => {
          if (table === 'leads') {
             // We need to return a builder that handles select().eq() -> leads
             // AND delete().eq() -> result
             const builder: any = {
                 select: vi.fn().mockReturnThis(),
                 delete: vi.fn().mockReturnThis(),
                 eq: vi.fn().mockImplementation((col, val) => {
                     if (col === 'is_synthetic') {
                         // If it was a select call (how do we know? simplified state)
                         // For simplicity, let's just return a promise-like object that resolves to leads
                         return Promise.resolve(leadsQueryResponse);
                     }
                     return builder;
                 }),
                 in: vi.fn().mockResolvedValue({})
             };
             return builder;
          }
          // For other tables (lead_contacts, comments)
          return queryBuilder;
      });

      await syntheticDataService.clearSyntheticLeads();

      expect(supabase.from).toHaveBeenCalledWith('lead_contacts');
      expect(supabase.from).toHaveBeenCalledWith('leads');
  });
});
