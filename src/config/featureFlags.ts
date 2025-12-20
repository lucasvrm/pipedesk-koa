/**
 * Feature Flags Configuration
 * 
 * Centralized feature flags for gradual rollout of new features.
 * Use environment variables (VITE_*) to control feature availability.
 */
export const FEATURE_FLAGS = {
  /**
   * Enables the new filters sidebar V2 with compact design (280px width).
   * Set VITE_USE_NEW_FILTERS=true in .env to enable.
   */
  USE_NEW_FILTERS_SIDEBAR: import.meta.env.VITE_USE_NEW_FILTERS === 'true',
} as const
