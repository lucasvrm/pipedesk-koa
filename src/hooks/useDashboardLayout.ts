import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSetting, useUpdateSetting } from '@/services/systemSettingsService';
import { DEFAULT_DASHBOARD_CONFIG, WIDGET_REGISTRY } from '@/features/dashboard/registry';
import { supabase } from '@/lib/supabaseClient';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';

const DASHBOARD_GLOBAL_KEY = 'dashboard_global_config';

export interface DashboardConfig {
  topWidgets: string[];
  mainWidgets: string[];
}

export interface GlobalDashboardConfig {
  availableWidgets: string[]; // List of IDs allowed by Admin
  defaultConfig: DashboardConfig;
}

// Default global config (if none in DB)
const DEFAULT_GLOBAL_CONFIG: GlobalDashboardConfig = {
  availableWidgets: Object.keys(WIDGET_REGISTRY),
  defaultConfig: DEFAULT_DASHBOARD_CONFIG
};

export function useDashboardLayout() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch Global Settings (Admin defined availability)
  const { data: globalSettings, isLoading: isLoadingGlobal } = useSetting(DASHBOARD_GLOBAL_KEY);

  // 2. Resolve final global config
  const globalConfig: GlobalDashboardConfig = globalSettings || DEFAULT_GLOBAL_CONFIG;

  // 3. Resolve User Preferences
  // We prioritize: Profile DB -> LocalStorage -> Global Default
  const userPreferences = profile?.preferences?.dashboard as DashboardConfig | undefined;

  const currentLayout: DashboardConfig = userPreferences || globalConfig.defaultConfig;

  // Filter out widgets that are not available globally or not permitted for the user
  const visibleWidgets = (widgetIds: string[]) => {
    return widgetIds.filter(id => {
      const def = WIDGET_REGISTRY[id];
      if (!def) return false;

      // Check if globally enabled (unless admin, maybe?)
      if (!globalConfig.availableWidgets.includes(id)) return false;

      // Check RBAC
      if (def.requiredRoles && !def.requiredRoles.includes(profile?.role as UserRole)) return false;
      // TODO: Check permissions if we had the permission list loaded in context
      return true;
    });
  };

  const finalLayout: DashboardConfig = {
    topWidgets: visibleWidgets(currentLayout.topWidgets),
    mainWidgets: visibleWidgets(currentLayout.mainWidgets)
  };

  // --- Mutation: Update User Preferences ---
  const saveUserLayout = useMutation({
    mutationFn: async (newLayout: DashboardConfig) => {
      if (!user) throw new Error('User not logged in');

      // 1. Try to update DB
      try {
        const newPreferences = {
            ...profile?.preferences,
            dashboard: newLayout
        };

        const { error } = await supabase
            .from('profiles')
            .update({ preferences: newPreferences })
            .eq('id', user.id);

        if (error) throw error;

        // Optimistic update of profile in context would be ideal,
        // but for now we rely on invalidation or local state if strictly needed.
        // We will return the newLayout to update local cache.
        return newPreferences;

      } catch (err) {
        console.warn('Failed to save to DB, falling back to LocalStorage', err);
        // Fallback: LocalStorage
        localStorage.setItem(`dashboard_pref_${user.id}`, JSON.stringify(newLayout));
        throw err; // Re-throw to show toast if needed, or handle silently?
      }
    },
    onSuccess: (newPreferences) => {
      toast.success('Layout salvo com sucesso!');
      // Invalidate profile to refetch preferences
      // Note: AuthContext might not auto-refetch unless we trigger it.
      // For now, we rely on the fact that next load will get it.
    },
    onError: () => {
        toast.error('Erro ao salvar layout. Tentando salvar localmente...');
    }
  });

  // --- Mutation: Update Global Settings (Admin) ---
  const { mutateAsync: updateGlobalSetting } = useUpdateSetting();

  const saveGlobalConfig = async (config: GlobalDashboardConfig) => {
    await updateGlobalSetting({
        key: DASHBOARD_GLOBAL_KEY,
        value: config,
        description: 'Global Dashboard Configuration (Available Widgets)'
    });
  };

  return {
    layout: finalLayout,
    availableWidgets: globalConfig.availableWidgets, // What is allowed by the system
    allWidgets: Object.values(WIDGET_REGISTRY), // The entire registry
    isLoading: isLoadingGlobal,
    saveUserLayout,
    saveGlobalConfig,
    isAdmin: profile?.role === 'admin'
  };
}
