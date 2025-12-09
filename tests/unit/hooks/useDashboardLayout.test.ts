import { describe, it, expect } from 'vitest';

// Legacy format (for backward compatibility)
interface LegacyDashboardConfig {
  topWidgets: string[];
  mainWidgets: string[];
}

// New unified format
interface DashboardConfig {
  widgets: Array<{
    id: string;
    size: 'small' | 'medium' | 'large' | 'full';
  }>;
}

// Migration helper function extracted for testing
function migrateLegacyConfig(config: LegacyDashboardConfig | DashboardConfig | any): DashboardConfig {
  // If already in new format, return as-is
  if (config.widgets && Array.isArray(config.widgets)) {
    return config as DashboardConfig;
  }
  
  // Convert legacy format
  if (config.topWidgets || config.mainWidgets) {
    const widgets: Array<{ id: string; size: 'small' | 'medium' | 'large' | 'full' }> = [];
    
    // Map topWidgets to small size
    if (config.topWidgets) {
      config.topWidgets.forEach((id: string) => {
        widgets.push({ id, size: 'small' });
      });
    }
    
    // Map mainWidgets to medium size
    if (config.mainWidgets) {
      config.mainWidgets.forEach((id: string) => {
        widgets.push({ id, size: 'medium' });
      });
    }
    
    return { widgets };
  }
  
  // Fallback to empty config
  return { widgets: [] };
}

describe('Dashboard Migration', () => {
  it('should convert legacy format to new format', () => {
    const legacyConfig = {
      topWidgets: ['widget1', 'widget2'],
      mainWidgets: ['widget3', 'widget4']
    };

    const result = migrateLegacyConfig(legacyConfig);

    expect(result.widgets).toHaveLength(4);
    expect(result.widgets[0]).toEqual({ id: 'widget1', size: 'small' });
    expect(result.widgets[1]).toEqual({ id: 'widget2', size: 'small' });
    expect(result.widgets[2]).toEqual({ id: 'widget3', size: 'medium' });
    expect(result.widgets[3]).toEqual({ id: 'widget4', size: 'medium' });
  });

  it('should handle legacy config with only topWidgets', () => {
    const legacyConfig = {
      topWidgets: ['widget1', 'widget2']
    };

    const result = migrateLegacyConfig(legacyConfig);

    expect(result.widgets).toHaveLength(2);
    expect(result.widgets[0]).toEqual({ id: 'widget1', size: 'small' });
    expect(result.widgets[1]).toEqual({ id: 'widget2', size: 'small' });
  });

  it('should handle legacy config with only mainWidgets', () => {
    const legacyConfig = {
      mainWidgets: ['widget3', 'widget4']
    };

    const result = migrateLegacyConfig(legacyConfig);

    expect(result.widgets).toHaveLength(2);
    expect(result.widgets[0]).toEqual({ id: 'widget3', size: 'medium' });
    expect(result.widgets[1]).toEqual({ id: 'widget4', size: 'medium' });
  });

  it('should return new format as-is', () => {
    const newConfig = {
      widgets: [
        { id: 'widget1', size: 'small' as const },
        { id: 'widget2', size: 'large' as const }
      ]
    };

    const result = migrateLegacyConfig(newConfig);

    expect(result).toEqual(newConfig);
  });

  it('should return empty config for invalid input', () => {
    const invalidConfig = { someOtherKey: 'value' };

    const result = migrateLegacyConfig(invalidConfig);

    expect(result).toEqual({ widgets: [] });
  });

  it('should handle empty legacy config', () => {
    const emptyLegacyConfig = {
      topWidgets: [],
      mainWidgets: []
    };

    const result = migrateLegacyConfig(emptyLegacyConfig);

    expect(result).toEqual({ widgets: [] });
  });
});
