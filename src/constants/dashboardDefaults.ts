/**
 * Dashboard Default Configuration
 * 
 * This file contains the hardcoded fallback configuration for the dashboard.
 * This is only used when:
 * 1. The database is unavailable
 * 2. No templates exist in the database
 * 3. As a safety fallback
 * 
 * The preferred source of dashboard layouts is the dashboard_templates table.
 */

import { DashboardConfig } from '@/hooks/useDashboardLayout';

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  widgets: [
    { id: 'notifications', size: 'small' },
    { id: 'quick-tasks', size: 'small' },
    { id: 'weighted-pipeline', size: 'small' },
    { id: 'active-deals', size: 'small' },
    { id: 'conversion-rate', size: 'small' },
    { id: 'total-deals', size: 'small' },
    { id: 'weighted-forecast', size: 'medium' },
    { id: 'portfolio-matrix', size: 'medium' },
    { id: 'my-deals', size: 'medium' }
  ]
};
