import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface SystemSetting {
  key: string;
  value: any;
  description?: string;
  updatedAt: string;
  updatedBy: string;
}

export async function getSettings(): Promise<SystemSetting[]> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('key');

  if (error) throw error;

  return data.map((item: any) => ({
    key: item.key,
    value: item.value,
    description: item.description,
    updatedAt: item.updated_at,
    updatedBy: item.updated_by
  }));
}

export async function getSetting(key: string): Promise<any> {
  try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle(); // Use maybeSingle instead of single to handle 0 rows gracefully without error

      if (error) {
          // Log but don't crash if it's a 406 or acceptable error
          if (error.code === 'PGRST116' || error.code === '406') {
             return null;
          }
          console.warn(`Error fetching setting ${key}:`, error);
          // Return null to allow default fallbacks in UI
          return null;
      }

      return data?.value || null;
  } catch (err) {
      console.warn(`Unexpected error fetching setting ${key}:`, err);
      return null;
  }
}

export async function updateSetting(key: string, value: any, description?: string) {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('system_settings')
    .upsert({
      key,
      value,
      description,
      updated_by: userData.user?.id,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- Hooks ---

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: ['settings', key],
    queryFn: () => getSetting(key),
    // Increase staleTime to avoid hammering if it fails
    staleTime: 1000 * 60 * 5
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { key: string; value: any; description?: string }) =>
      updateSetting(vars.key, vars.value, vars.description),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings', vars.key] });
    }
  });
}
