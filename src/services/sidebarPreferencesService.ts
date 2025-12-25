import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface SidebarSectionConfig {
  id: string;
  enabled: boolean;
  order: number;
  color: string;
  icon: string;
}

export interface SidebarPreferences {
  id: string;
  user_id: string;
  config: { sections: SidebarSectionConfig[] };
  created_at: string;
  updated_at: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const SIDEBAR_PREFERENCES_KEY = ['sidebarPreferences'] as const;

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

export const DEFAULT_SIDEBAR_CONFIG: SidebarSectionConfig[] = [
  { id: 'dashboard', enabled: true, order: 0, color: '#3b82f6', icon: 'Home' },
  { id: 'leads', enabled: true, order: 1, color: '#10b981', icon: 'Filter' },
  { id: 'deals', enabled: true, order: 2, color: '#f59e0b', icon: 'Briefcase' },
  { id: 'kanban', enabled: true, order: 3, color: '#f97316', icon: 'Kanban' },
  { id: 'companies', enabled: true, order: 4, color: '#8b5cf6', icon: 'Building2' },
  { id: 'contacts', enabled: true, order: 5, color: '#ec4899', icon: 'User' },
  { id: 'players', enabled: true, order: 6, color: '#06b6d4', icon: 'Users' },
  { id: 'tasks', enabled: true, order: 7, color: '#14b8a6', icon: 'CheckSquare' },
  { id: 'profile', enabled: true, order: 8, color: '#6366f1', icon: 'User' },
  { id: 'management', enabled: true, order: 9, color: '#3b82f6', icon: 'BarChart3' },
  { id: 'settings', enabled: true, order: 10, color: '#64748b', icon: 'Settings' },
];

// ============================================================================
// CRUD FUNCTIONS
// ============================================================================

/**
 * Fetch sidebar preferences for a user
 */
export async function getSidebarPreferences(userId: string | null): Promise<SidebarPreferences | null> {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('user_sidebar_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    // PGRST116 = Row not found
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar preferências: ${error.message}`);
  }
  
  return data as SidebarPreferences;
}

/**
 * Create or update sidebar preferences
 */
export async function upsertSidebarPreferences(
  userId: string,
  config: { sections: SidebarSectionConfig[] }
): Promise<SidebarPreferences> {
  const { data, error } = await supabase
    .from('user_sidebar_preferences')
    .upsert(
      { user_id: userId, config, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single();
  
  if (error) throw new Error(`Erro ao salvar preferências: ${error.message}`);
  
  return data as SidebarPreferences;
}

/**
 * Reset sidebar preferences to default
 */
export async function resetSidebarPreferences(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_sidebar_preferences')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw new Error(`Erro ao resetar preferências: ${error.message}`);
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch sidebar preferences
 */
export function useSidebarPreferences(userId: string | null) {
  return useQuery({
    queryKey: [...SIDEBAR_PREFERENCES_KEY, userId],
    queryFn: () => getSidebarPreferences(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update sidebar preferences
 */
export function useUpdateSidebarPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, config }: { userId: string; config: { sections: SidebarSectionConfig[] } }) =>
      upsertSidebarPreferences(userId, config),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...SIDEBAR_PREFERENCES_KEY, variables.userId] });
      toast.success('Preferências salvas!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

/**
 * Hook to reset sidebar preferences
 */
export function useResetSidebarPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => resetSidebarPreferences(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: [...SIDEBAR_PREFERENCES_KEY, userId] });
      toast.success('Preferências resetadas!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
