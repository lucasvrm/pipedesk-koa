import { describe, it, expect } from 'vitest';
import {
  ICON_OPTIONS,
  getIconComponent,
  isValidIcon,
  getAllIconNames,
  DEFAULT_ICON_KEY,
} from '@/lib/iconRegistry';
import { Home, Clock, LayoutDashboard, Filter, Briefcase } from 'lucide-react';

describe('Icon Registry', () => {
  describe('ICON_OPTIONS', () => {
    it('should contain all 60 expected icons', () => {
      expect(ICON_OPTIONS).toHaveLength(60);
    });

    it('should have all required properties for each icon', () => {
      ICON_OPTIONS.forEach(icon => {
        expect(icon).toHaveProperty('value');
        expect(icon).toHaveProperty('label');
        expect(icon).toHaveProperty('Icon');
        expect(icon).toHaveProperty('category');
        
        expect(typeof icon.value).toBe('string');
        expect(typeof icon.label).toBe('string');
        expect(typeof icon.Icon).toBe('function');
        expect(typeof icon.category).toBe('string');
      });
    });

    it('should have valid categories', () => {
      const validCategories = ['navigation', 'business', 'documents', 'actions', 'misc', 'charts', 'tasks'];
      
      ICON_OPTIONS.forEach(icon => {
        expect(validCategories).toContain(icon.category);
      });
    });

    it('should have unique values', () => {
      const values = ICON_OPTIONS.map(icon => icon.value);
      const uniqueValues = new Set(values);
      
      expect(values.length).toBe(uniqueValues.size);
    });

    it('should include commonly used icons', () => {
      const iconValues = ICON_OPTIONS.map(icon => icon.value);
      
      // Icons mentioned in the problem statement
      expect(iconValues).toContain('Clock');
      expect(iconValues).toContain('LayoutDashboard');
      expect(iconValues).toContain('Home');
      
      // Other common icons
      expect(iconValues).toContain('Filter');
      expect(iconValues).toContain('Briefcase');
      expect(iconValues).toContain('Users');
      expect(iconValues).toContain('Settings');
    });

    it('should have correct category distribution', () => {
      const categoryCounts = ICON_OPTIONS.reduce((acc, icon) => {
        acc[icon.category] = (acc[icon.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Expected counts from the implementation
      expect(categoryCounts['navigation']).toBe(8);
      expect(categoryCounts['business']).toBe(12);
      expect(categoryCounts['documents']).toBe(10);
      expect(categoryCounts['actions']).toBe(10);
      expect(categoryCounts['misc']).toBe(10);
      expect(categoryCounts['charts']).toBe(5);
      expect(categoryCounts['tasks']).toBe(5);
    });
  });

  describe('DEFAULT_ICON_KEY', () => {
    it('should be "Home"', () => {
      expect(DEFAULT_ICON_KEY).toBe('Home');
    });

    it('should exist in ICON_OPTIONS', () => {
      const iconValues = ICON_OPTIONS.map(icon => icon.value);
      expect(iconValues).toContain(DEFAULT_ICON_KEY);
    });
  });

  describe('getIconComponent', () => {
    it('should return correct icon component for valid icon name', () => {
      const ClockIcon = getIconComponent('Clock');
      expect(ClockIcon).toBe(Clock);
    });

    it('should return LayoutDashboard for "LayoutDashboard"', () => {
      const DashboardIcon = getIconComponent('LayoutDashboard');
      expect(DashboardIcon).toBe(LayoutDashboard);
    });

    it('should return Filter for "Filter"', () => {
      const FilterIcon = getIconComponent('Filter');
      expect(FilterIcon).toBe(Filter);
    });

    it('should return Briefcase for "Briefcase"', () => {
      const BriefcaseIcon = getIconComponent('Briefcase');
      expect(BriefcaseIcon).toBe(Briefcase);
    });

    it('should return Home as fallback for invalid icon name', () => {
      const InvalidIcon = getIconComponent('InvalidIconName');
      expect(InvalidIcon).toBe(Home);
    });

    it('should return Home for null', () => {
      const NullIcon = getIconComponent(null);
      expect(NullIcon).toBe(Home);
    });

    it('should return Home for undefined', () => {
      const UndefinedIcon = getIconComponent(undefined);
      expect(UndefinedIcon).toBe(Home);
    });

    it('should return Home for empty string', () => {
      const EmptyIcon = getIconComponent('');
      expect(EmptyIcon).toBe(Home);
    });

    it('should handle all icons in ICON_OPTIONS correctly', () => {
      ICON_OPTIONS.forEach(icon => {
        const IconComponent = getIconComponent(icon.value);
        expect(IconComponent).toBe(icon.Icon);
        expect(IconComponent).not.toBe(undefined);
      });
    });

    it('should be case-sensitive', () => {
      const LowerCaseIcon = getIconComponent('clock'); // lowercase
      expect(LowerCaseIcon).toBe(Home); // fallback because 'clock' !== 'Clock'
    });
  });

  describe('isValidIcon', () => {
    it('should return true for valid icon names', () => {
      expect(isValidIcon('Clock')).toBe(true);
      expect(isValidIcon('LayoutDashboard')).toBe(true);
      expect(isValidIcon('Home')).toBe(true);
      expect(isValidIcon('Filter')).toBe(true);
    });

    it('should return false for invalid icon names', () => {
      expect(isValidIcon('InvalidIcon')).toBe(false);
      expect(isValidIcon('NotAnIcon')).toBe(false);
      expect(isValidIcon('')).toBe(false);
    });

    it('should return true for all icons in ICON_OPTIONS', () => {
      ICON_OPTIONS.forEach(icon => {
        expect(isValidIcon(icon.value)).toBe(true);
      });
    });

    it('should be case-sensitive', () => {
      expect(isValidIcon('clock')).toBe(false); // lowercase
      expect(isValidIcon('Clock')).toBe(true);  // correct case
    });
  });

  describe('getAllIconNames', () => {
    it('should return array of all icon names', () => {
      const iconNames = getAllIconNames();
      expect(iconNames).toHaveLength(60);
    });

    it('should return array containing all icon values', () => {
      const iconNames = getAllIconNames();
      
      expect(iconNames).toContain('Clock');
      expect(iconNames).toContain('LayoutDashboard');
      expect(iconNames).toContain('Home');
      expect(iconNames).toContain('Filter');
    });

    it('should match ICON_OPTIONS values exactly', () => {
      const iconNames = getAllIconNames();
      const expectedNames = ICON_OPTIONS.map(icon => icon.value);
      
      expect(iconNames).toEqual(expectedNames);
    });

    it('should return array without duplicates', () => {
      const iconNames = getAllIconNames();
      const uniqueNames = new Set(iconNames);
      
      expect(iconNames.length).toBe(uniqueNames.size);
    });
  });

  describe('Icon Registry - Integration Tests', () => {
    it('should resolve all commonly used icons without fallback', () => {
      const commonIcons = [
        'Home',
        'LayoutDashboard',
        'Clock',
        'Filter',
        'Briefcase',
        'Users',
        'Settings',
        'Calendar',
        'Bell',
        'FileText',
      ];

      commonIcons.forEach(iconName => {
        const IconComponent = getIconComponent(iconName);
        expect(IconComponent).not.toBe(Home); // Should not fallback
        expect(isValidIcon(iconName)).toBe(true);
      });
    });

    it('should handle edge cases gracefully', () => {
      const edgeCases = [null, undefined, '', '   ', 'NonExistentIcon'];
      
      edgeCases.forEach(iconName => {
        // Should not throw error
        expect(() => getIconComponent(iconName as any)).not.toThrow();
        
        // Should return Home as fallback
        const IconComponent = getIconComponent(iconName as any);
        expect(IconComponent).toBe(Home);
      });
    });

    it('should maintain consistency between getIconComponent and isValidIcon', () => {
      ICON_OPTIONS.forEach(icon => {
        const isValid = isValidIcon(icon.value);
        const IconComponent = getIconComponent(icon.value);
        
        // If isValidIcon returns true, getIconComponent should NOT return fallback
        if (isValid) {
          expect(IconComponent).toBe(icon.Icon);
        }
      });
    });

    it('should have O(1) lookup performance', () => {
      // This test ensures getIconComponent uses Map (O(1)) not array.find (O(n))
      const iterations = 1000;
      const iconName = 'Clock';
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        getIconComponent(iconName);
      }
      const end = performance.now();
      
      const avgTime = (end - start) / iterations;
      
      // Map lookup should be extremely fast (< 0.01ms per lookup on average)
      expect(avgTime).toBeLessThan(0.01);
    });
  });
});
