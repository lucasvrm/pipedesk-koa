import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as tagService from '@/services/tagService';
import * as systemSettingsService from '@/services/systemSettingsService';

// Mock DB calls in tagService to avoid real network requests
// We want to test the FEATURE FLAG check logic which happens BEFORE DB calls.
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: {}, error: null }) })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: {}, error: null }) })) })) })),
      delete: vi.fn(() => ({ eq: vi.fn() })),
      select: vi.fn(() => ({ match: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })) }))
    }))
  }
}));

describe('Tag Service - Feature Flags', () => {
  const getSettingSpy = vi.spyOn(systemSettingsService, 'getSetting');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createTag should throw FEATURE_DISABLED if global flags are off', async () => {
    getSettingSpy.mockResolvedValue({ global: false });

    await expect(tagService.createTag({ name: 'Test', color: 'red' }))
      .rejects.toThrow('FEATURE_DISABLED');
  });

  it('assignTagToEntity should throw if module deals is disabled', async () => {
    getSettingSpy.mockResolvedValue({
      global: true,
      modules: { deals: false, tracks: true }
    });

    await expect(tagService.assignTagToEntity('t1', 'd1', 'deal'))
      .rejects.toThrow('FEATURE_DISABLED');
  });

  it('assignTagToEntity should pass if module deals is enabled', async () => {
    getSettingSpy.mockResolvedValue({
      global: true,
      modules: { deals: true }
    });

    // Should not throw FEATURE_DISABLED
    await expect(tagService.assignTagToEntity('t1', 'd1', 'deal')).resolves.not.toThrow();
  });
});
