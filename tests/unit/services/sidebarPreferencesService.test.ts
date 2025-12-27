import { describe, it, expect } from 'vitest';
import { isItemFixed, FIXED_ITEMS } from '@/services/sidebarPreferencesService';

describe('sidebarPreferencesService', () => {
  describe('isItemFixed', () => {
    it('should return true for profile section fixed items', () => {
      expect(isItemFixed('profile', 'personal')).toBe(true);
      expect(isItemFixed('profile', 'preferences')).toBe(true);
      expect(isItemFixed('profile', 'security')).toBe(true);
    });

    it('should return false for non-fixed items in profile section', () => {
      expect(isItemFixed('profile', 'customize')).toBe(false);
      expect(isItemFixed('profile', 'activity')).toBe(false);
    });

    it('should return true for all items in settings section (wildcard)', () => {
      expect(isItemFixed('settings', 'any-item')).toBe(true);
      expect(isItemFixed('settings', 'another-item')).toBe(true);
    });

    it('should return false for sections not in FIXED_ITEMS', () => {
      expect(isItemFixed('dashboard', 'overview')).toBe(false);
      expect(isItemFixed('leads', 'list')).toBe(false);
      expect(isItemFixed('custom', 'item')).toBe(false);
    });

    it('should return false for non-existent items', () => {
      expect(isItemFixed('profile', 'non-existent')).toBe(false);
      expect(isItemFixed('non-existent', 'item')).toBe(false);
    });
  });

  describe('FIXED_ITEMS configuration', () => {
    it('should have profile section with specific fixed items', () => {
      expect(FIXED_ITEMS.profile).toEqual(['personal', 'preferences', 'security']);
    });

    it('should have settings section with wildcard', () => {
      expect(FIXED_ITEMS.settings).toEqual(['*']);
    });
  });
});
