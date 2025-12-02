import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteStage } from '@/services/pipelineService';
import { supabase } from '@/lib/supabaseClient';

// Mock Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
      delete: vi.fn(() => ({ eq: vi.fn() }))
    }))
  }
}));

describe('Pipeline Service - Delete Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error if stage has existing tracks', async () => {
    // Mock count query returning 5 tracks
    const selectMock = vi.fn().mockResolvedValue({ count: 5, error: null });

    // We need to mock the chain: from('player_tracks').select(..., { count... }).eq(...)
    const eqMock = vi.fn().mockReturnValue(Promise.resolve({ count: 5, error: null }));
    const selectChain = vi.fn(() => ({ eq: eqMock }));

    // @ts-ignore
    supabase.from.mockImplementation((table: string) => {
        if (table === 'player_tracks') {
            return { select: selectChain };
        }
        return { delete: vi.fn() };
    });

    await expect(deleteStage('stage-123'))
      .rejects.toThrow(/existem 5 tracks/);
  });

  it('should proceed if stage is empty', async () => {
    // Mock count query returning 0
    const eqMock = vi.fn().mockReturnValue(Promise.resolve({ count: 0, error: null }));
    const selectChain = vi.fn(() => ({ eq: eqMock }));
    const deleteEqMock = vi.fn().mockResolvedValue({ error: null });

    // @ts-ignore
    supabase.from.mockImplementation((table: string) => {
        if (table === 'player_tracks') return { select: selectChain };
        if (table === 'pipeline_stages') return { delete: vi.fn(() => ({ eq: deleteEqMock })) };
    });

    await expect(deleteStage('stage-empty')).resolves.not.toThrow();
  });
});
