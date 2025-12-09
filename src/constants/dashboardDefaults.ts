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
  topWidgets: [
    'notifications',
    'quick-tasks',
    'weighted-pipeline',
    'active-deals',
    'conversion-rate',
    'total-deals'
  ],
  mainWidgets: ['weighted-forecast', 'portfolio-matrix', 'my-deals']
};
