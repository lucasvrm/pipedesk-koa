import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface TransitionRule {
  id: string;
  fromStage: string;
  toStage: string;
  enabled: boolean;
}

export async function getTransitionRules(): Promise<TransitionRule[]> {
  const { data, error } = await supabase
    .from('phase_transition_rules')
    .select('*');

  if (error) throw error;

  return data.map((item: any) => ({
    id: item.id,
    fromStage: item.from_stage,
    toStage: item.to_stage,
    enabled: item.enabled
  }));
}

export async function toggleTransitionRule(fromStage: string, toStage: string, enabled: boolean) {
  // Check if exists
  const { data: existing } = await supabase
    .from('phase_transition_rules')
    .select('id')
    .match({ from_stage: fromStage, to_stage: toStage })
    .single();

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('phase_transition_rules') as any)
      .update({ enabled })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // Create new
    const { data: userData } = await supabase.auth.getUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('phase_transition_rules') as any)
      .insert({
        from_stage: fromStage,
        to_stage: toStage,
        enabled,
        created_by: userData.user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// --- Hooks ---

export function useTransitionRules() {
  return useQuery({
    queryKey: ['transition-rules'],
    queryFn: getTransitionRules
  });
}

export function useToggleTransitionRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { fromStage: string, toStage: string, enabled: boolean }) =>
      toggleTransitionRule(vars.fromStage, vars.toStage, vars.enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transition-rules'] });
    }
  });
}
