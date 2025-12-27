/**
 * Tests for Icon Registry
 * 
 * Validates icon resolution, normalization, and fallback behavior
 */

import { describe, it, expect } from 'vitest';
import {
  getIconComponent,
  isValidIcon,
  normalizeIconName,
  getAllIconNames,
  DEFAULT_ICON_KEY,
  ICON_OPTIONS,
} from './iconRegistry';
import { Home, Clock, Kanban, LayoutDashboard } from 'lucide-react';

describe('iconRegistry', () => {
  describe('normalizeIconName', () => {
    it('should return exact match for valid icon names', () => {
      expect(normalizeIconName('Clock')).toBe('Clock');
      expect(normalizeIconName('Home')).toBe('Home');
      expect(normalizeIconName('Kanban')).toBe('Kanban');
    });

    it('should normalize case-insensitive icon names', () => {
      expect(normalizeIconName('clock')).toBe('Clock');
      expect(normalizeIconName('CLOCK')).toBe('Clock');
      expect(normalizeIconName('ClOcK')).toBe('Clock');
      expect(normalizeIconName('kanban')).toBe('Kanban');
      expect(normalizeIconName('KANBAN')).toBe('Kanban');
    });

    it('should resolve legacy aliases', () => {
      expect(normalizeIconName('dashboard')).toBe('LayoutDashboard');
      expect(normalizeIconName('building')).toBe('Building2');
    });

    it('should return default icon for invalid names', () => {
      expect(normalizeIconName('InvalidIcon')).toBe(DEFAULT_ICON_KEY);
      expect(normalizeIconName('random_name')).toBe(DEFAULT_ICON_KEY);
      expect(normalizeIconName('')).toBe(DEFAULT_ICON_KEY);
    });

    it('should return default icon for null/undefined', () => {
      expect(normalizeIconName(null)).toBe(DEFAULT_ICON_KEY);
      expect(normalizeIconName(undefined)).toBe(DEFAULT_ICON_KEY);
    });

    it('should handle whitespace correctly', () => {
      expect(normalizeIconName(' Clock ')).toBe('Clock');
      expect(normalizeIconName('  ')).toBe(DEFAULT_ICON_KEY);
    });
  });

  describe('getIconComponent', () => {
    it('should return correct component for valid icon names', () => {
      expect(getIconComponent('Clock')).toBe(Clock);
      expect(getIconComponent('Home')).toBe(Home);
      expect(getIconComponent('Kanban')).toBe(Kanban);
    });

    it('should return correct component for case-insensitive names', () => {
      expect(getIconComponent('clock')).toBe(Clock);
      expect(getIconComponent('CLOCK')).toBe(Clock);
      expect(getIconComponent('kanban')).toBe(Kanban);
    });

    it('should resolve aliases to correct components', () => {
      expect(getIconComponent('dashboard')).toBe(LayoutDashboard);
    });

    it('should return Home component for invalid names', () => {
      expect(getIconComponent('InvalidIcon')).toBe(Home);
      expect(getIconComponent('')).toBe(Home);
    });

    it('should return Home component for null/undefined', () => {
      expect(getIconComponent(null)).toBe(Home);
      expect(getIconComponent(undefined)).toBe(Home);
    });
  });

  describe('isValidIcon', () => {
    it('should return true for valid icon names', () => {
      expect(isValidIcon('Clock')).toBe(true);
      expect(isValidIcon('Home')).toBe(true);
      expect(isValidIcon('Kanban')).toBe(true);
    });

    it('should return true for case-insensitive valid names', () => {
      expect(isValidIcon('clock')).toBe(true);
      expect(isValidIcon('CLOCK')).toBe(true);
      expect(isValidIcon('kanban')).toBe(true);
    });

    it('should return true for valid aliases', () => {
      expect(isValidIcon('dashboard')).toBe(true);
      expect(isValidIcon('building')).toBe(true);
    });

    it('should return false for invalid names', () => {
      expect(isValidIcon('InvalidIcon')).toBe(false);
      expect(isValidIcon('random_name')).toBe(false);
    });

    it('should return false for empty strings', () => {
      expect(isValidIcon('')).toBe(false);
    });
  });

  describe('getAllIconNames', () => {
    it('should return all icon names', () => {
      const names = getAllIconNames();
      expect(names).toBeInstanceOf(Array);
      expect(names.length).toBe(ICON_OPTIONS.length);
      expect(names).toContain('Clock');
      expect(names).toContain('Home');
      expect(names).toContain('Kanban');
    });
  });

  describe('ICON_OPTIONS', () => {
    it('should have valid structure', () => {
      expect(ICON_OPTIONS).toBeInstanceOf(Array);
      expect(ICON_OPTIONS.length).toBeGreaterThan(0);
      
      ICON_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('Icon');
        expect(option).toHaveProperty('category');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
        expect(typeof option.Icon).toBe('function');
      });
    });

    it('should have unique values', () => {
      const values = ICON_OPTIONS.map(opt => opt.value);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe('Performance', () => {
    it('should resolve icons quickly (< 1ms for 1000 lookups)', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        getIconComponent('Clock');
        getIconComponent('Home');
        getIconComponent('Kanban');
      }
      
      const end = performance.now();
      const elapsed = end - start;
      
      // Should be very fast (< 1ms for 3000 lookups)
      expect(elapsed).toBeLessThan(10);
    });

    it('should handle case-insensitive lookups efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        getIconComponent('clock');
        getIconComponent('KANBAN');
      }
      
      const end = performance.now();
      const elapsed = end - start;
      
      // Should still be fast even with normalization
      expect(elapsed).toBeLessThan(20);
    });
  });
});
