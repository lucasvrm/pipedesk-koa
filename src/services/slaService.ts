import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface SlaPolicy {
  id: string;
  stageId: string;
  maxHours: number;
  warningThresholdHours: number;
  createdAt: string;
  updatedAt: string;
}

export async function getSlaPolicies(): Promise<SlaPolicy[]> {
  const { data, error } = await supabase
    .from('sla_policies')
    .select('*');

  if (error) throw error;

  return data.map((item: any) => ({
    id: item.id,
    stageId: item.stage_id,
    maxHours: item.max_hours,
    warningThresholdHours: item.warning_threshold_hours,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

export async function updateSlaPolicy(stageId: string, maxHours: number, warningThresholdHours: number) {
  // Check if exists
  const { data: existing } = await supabase
    .from('sla_policies')
    .select('id')
    .eq('stage_id', stageId)
    .single();

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('sla_policies') as any)
      .update({
        max_hours: maxHours,
        warning_threshold_hours: warningThresholdHours,
        updated_at: new Date().toISOString()
      })
      .eq('stage_id', stageId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('sla_policies') as any)
      .insert({
        stage_id: stageId,
        max_hours: maxHours,
        warning_threshold_hours: warningThresholdHours
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// --- Hooks ---

export function useSlaPolicies() {
  return useQuery({
    queryKey: ['sla-policies'],
    queryFn: getSlaPolicies,
    staleTime: 1000 * 60 * 5
  });
}

export function useUpdateSlaPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { stageId: string; maxHours: number; warningThresholdHours: number }) =>
      updateSlaPolicy(vars.stageId, vars.maxHours, vars.warningThresholdHours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
    }
  });
}
