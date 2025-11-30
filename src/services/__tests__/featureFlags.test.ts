import { describe, it, expect, vi } from 'vitest';

// Mocks
const mockGetSetting = vi.fn();

describe('Feature Flags Logic', () => {
  async function checkFeatureEnabled(module: 'deals' | 'tracks' | 'global') {
    const config = await mockGetSetting('tags_config');
    if (!config) return true;

    if (!config.global) return false;
    if (module === 'global') return true;
    return config.modules?.[module] !== false;
  }

  it('should return true if global is true and module is true', async () => {
    mockGetSetting.mockResolvedValue({ global: true, modules: { deals: true } });
    expect(await checkFeatureEnabled('deals')).toBe(true);
  });

  it('should return false if global is false', async () => {
    mockGetSetting.mockResolvedValue({ global: false, modules: { deals: true } });
    expect(await checkFeatureEnabled('deals')).toBe(false);
  });

  it('should return false if module is false', async () => {
    mockGetSetting.mockResolvedValue({ global: true, modules: { deals: false } });
    expect(await checkFeatureEnabled('deals')).toBe(false);
  });
});
