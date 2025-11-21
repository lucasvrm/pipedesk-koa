import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PipelineStage } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  createdAt: string;
  updatedAt: string;
}

export interface StageInput {
  pipelineId: string | null;
  name: string;
  color?: string;
  stageOrder: number;
  isDefault?: boolean;
}

export interface StageUpdate {
  name?: string;
  color?: string;
  stageOrder?: number;
  isDefault?: boolean;
}

// ============================================================================
// Service Functions - Pipeline Stages
// ============================================================================

/**
 * Fetch all stages for a pipeline (or global stages if pipelineId is null)
 */
export async function getStages(pipelineId: string | null = null): Promise<PipelineStage[]> {
  try {
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
      isDefault: item.is_default,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching stages:', error);
    throw error;
  }
}

/**
 * Get a single stage by ID
 */
export async function getStage(stageId: string): Promise<PipelineStage> {
  try {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('id', stageId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      pipelineId: data.pipeline_id,
      name: data.name,
      color: data.color,
      stageOrder: data.stage_order,
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error fetching stage:', error);
    throw error;
  }
}

/**
 * Create a new stage
 */
export async function createStage(stage: StageInput): Promise<PipelineStage> {
  try {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .insert({
        pipeline_id: stage.pipelineId,
        name: stage.name,
        color: stage.color || '#6366f1',
        stage_order: stage.stageOrder,
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
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error creating stage:', error);
    throw error;
  }
}

/**
 * Update an existing stage
 */
export async function updateStage(
  stageId: string,
  updates: StageUpdate
): Promise<PipelineStage> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.stageOrder !== undefined) updateData.stage_order = updates.stageOrder;
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
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error updating stage:', error);
    throw error;
  }
}

/**
 * Delete a stage
 */
export async function deleteStage(stageId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', stageId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting stage:', error);
    throw error;
  }
}

/**
 * Reorder stages (update their stageOrder)
 */
export async function reorderStages(
  stages: Array<{ id: string; stageOrder: number }>
): Promise<void> {
  try {
    // Update each stage's order
    const updates = stages.map((stage) =>
      supabase
        .from('pipeline_stages')
        .update({ stage_order: stage.stageOrder })
        .eq('id', stage.id)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      throw new Error('Failed to reorder some stages');
    }
  } catch (error) {
    console.error('Error reordering stages:', error);
    throw error;
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch stages for a pipeline
 */
export function useStages(pipelineId: string | null = null) {
  return useQuery({
    queryKey: ['stages', pipelineId],
    queryFn: () => getStages(pipelineId),
  });
}

/**
 * Hook to fetch a single stage
 */
export function useStage(stageId: string | null) {
  return useQuery({
    queryKey: ['stages', 'detail', stageId],
    queryFn: () => getStage(stageId!),
    enabled: !!stageId,
  });
}

/**
 * Hook to create a stage
 */
export function useCreateStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['stages', data.pipelineId] });
    },
  });
}

/**
 * Hook to update a stage
 */
export function useUpdateStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stageId, updates }: { stageId: string; updates: StageUpdate }) =>
      updateStage(stageId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['stages', data.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['stages', 'detail', data.id] });
    },
  });
}

/**
 * Hook to delete a stage
 */
export function useDeleteStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
    },
  });
}

/**
 * Hook to reorder stages
 */
export function useReorderStages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderStages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
    },
  });
}
