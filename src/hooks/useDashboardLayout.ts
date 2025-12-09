import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSetting, useUpdateSetting } from '@/services/systemSettingsService';
import { getTemplateForRole } from '@/services/dashboardTemplateService';
import { WIDGET_REGISTRY } from '@/features/dashboard/registry';
import { DEFAULT_DASHBOARD_CONFIG } from '@/constants/dashboardDefaults';
import { supabase } from '@/lib/supabaseClient';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

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

  // Local state to handle optimistic updates or fallback reads
  const [localPreferences, setLocalPreferences] = useState<DashboardConfig | null>(null);

  // 1. Fetch Global Settings (Admin defined availability)
  const { data: globalSettings, isLoading: isLoadingGlobal } = useSetting(DASHBOARD_GLOBAL_KEY);

  // 2. Fetch Role-based Template from database
  const { data: roleTemplate, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['dashboard-template', profile?.role],
    queryFn: () => profile?.role ? getTemplateForRole(profile.role as UserRole) : null,
    enabled: !!profile?.role,
    staleTime: 1000 * 60 * 5 // 5 minutes cache
  });

  // 3. Resolve final global config
  const globalConfig: GlobalDashboardConfig = globalSettings || DEFAULT_GLOBAL_CONFIG;

  // 4. Resolve User Preferences
  // Priority: Local State (optimistic) -> Profile DB -> LocalStorage -> Role Template -> Global Template -> Code Fallback

  // Load from LocalStorage on mount if not in DB
  useEffect(() => {
    if (user && !profile?.preferences?.dashboard) {
        const stored = localStorage.getItem(`dashboard_pref_${user.id}`);
        if (stored) {
            try {
                setLocalPreferences(JSON.parse(stored));
            } catch (e) {
                console.error('Invalid JSON in local storage', e);
            }
        }
    }
  }, [user, profile]);

  const userPreferences = localPreferences || (profile?.preferences?.dashboard as DashboardConfig | undefined);
  
  // Updated priority order: User Preferences → Role Template → Global Default → Code Fallback
  const currentLayout: DashboardConfig = userPreferences || roleTemplate || globalConfig.defaultConfig || DEFAULT_DASHBOARD_CONFIG;

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

      // Update local state immediately (Optimistic UI)
      setLocalPreferences(newLayout);

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

        if (error) {
            // Throwing here will trigger the catch block below
            throw error;
        }

        return newPreferences;

      } catch (err) {
        console.warn('Failed to save to DB (likely schema missing), using LocalStorage fallback.', err);

        // Fallback: LocalStorage
        try {
            localStorage.setItem(`dashboard_pref_${user.id}`, JSON.stringify(newLayout));
            // We return success here because for the user, it worked (persisted locally)
            return { dashboard: newLayout };
        } catch (lsErr) {
            console.error('LocalStorage failed too', lsErr);
            throw lsErr; // Real failure
        }
      }
    },
    onSuccess: (newPreferences) => {
      // Logic: If we are here, either DB worked OR LocalStorage worked.
      // We don't need to invalidate queries if we rely on local state override,
      // but it's good practice to try reloading profile if it was a DB save.

      // If the profile query is stale, invalidate it
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast.success('Layout salvo com sucesso!');
    },
    onError: (err) => {
        toast.error('Não foi possível salvar suas preferências.');
        console.error(err);
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
    isLoading: isLoadingGlobal || isLoadingTemplate,
    saveUserLayout,
    saveGlobalConfig,
    isAdmin: profile?.role === 'admin'
  };
}
