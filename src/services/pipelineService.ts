import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PipelineStage } from '@/lib/types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface StageInput {
  pipelineId: string | null;
  name: string;
  color?: string;
  stageOrder: number;
  probability: number;
  isDefault?: boolean;
}

export interface StageUpdate {
  name?: string;
  color?: string;
  stageOrder?: number;
  probability?: number;
  isDefault?: boolean;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Busca todos os estágios ordenados pela ordem definida
 */
export async function getStages(pipelineId: string | null = null): Promise<PipelineStage[]> {
  let query = supabase
    .from('pipeline_stages')
    .select('*')
    .order('stage_order', { ascending: true });

  if (pipelineId) {
    query = query.eq('pipeline_id', pipelineId);
  } else {
    query = query.is('pipeline_id', null);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((item) => ({
    id: item.id,
    pipelineId: item.pipeline_id,
    name: item.name,
    color: item.color,
    stageOrder: item.stage_order,
    probability: item.probability || 0,
    isDefault: item.is_default,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

/**
 * Cria um novo estágio
 */
export async function createStage(stage: StageInput): Promise<PipelineStage> {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .insert({
      pipeline_id: stage.pipelineId,
      name: stage.name,
      color: stage.color || '#64748b',
      stage_order: stage.stageOrder,
      probability: stage.probability,
      is_default: stage.isDefault || false,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    pipelineId: data.pipeline_id,
    name: data.name,
    color: data.color,
    stageOrder: data.stage_order,
    probability: data.probability || 0,
    isDefault: data.is_default,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Atualiza um estágio existente
 */
export async function updateStage({ stageId, updates }: { stageId: string; updates: StageUpdate }): Promise<PipelineStage> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.color !== undefined) updateData.color = updates.color;
  if (updates.stageOrder !== undefined) updateData.stage_order = updates.stageOrder;
  if (updates.probability !== undefined) updateData.probability = updates.probability;
  if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;

  const { data, error } = await supabase
    .from('pipeline_stages')
    .update(updateData)
    .eq('id', stageId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    pipelineId: data.pipeline_id,
    name: data.name,
    color: data.color,
    stageOrder: data.stage_order,
    probability: data.probability || 0,
    isDefault: data.is_default,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Exclui um estágio
 */
export async function deleteStage(stageId: string): Promise<void> {
  const { error } = await supabase
    .from('pipeline_stages')
    .delete()
    .eq('id', stageId);

  if (error) throw error;
}

/**
 * Reordena múltiplos estágios
 */
export async function reorderStages(stages: Array<{ id: string; stageOrder: number }>): Promise<void> {
  const updates = stages.map((stage) =>
    supabase
      .from('pipeline_stages')
      .update({ stage_order: stage.stageOrder })
      .eq('id', stage.id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);
  
  if (errors.length > 0) throw new Error('Falha ao reordenar alguns estágios');
}

// ============================================================================
// React Query Hooks
// ============================================================================

export function useStages(pipelineId: string | null = null) {
  return useQuery({
    queryKey: ['stages', pipelineId],
    queryFn: () => getStages(pipelineId),
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  });
}

export function useCreateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });
}

export function useUpdateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });
}

export function useDeleteStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });
}

export function useReorderStages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderStages,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });
}