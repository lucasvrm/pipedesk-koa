import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterDeal, OperationType, DealStatus } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

export interface Deal extends MasterDeal {
  // Extended with joins
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DealInput {
  clientName: string;
  volume?: number;
  operationType?: OperationType;
  deadline?: string;
  observations?: string;
  status?: DealStatus;
  feePercentage?: number;
  createdBy: string;
}

export interface DealUpdate {
  clientName?: string;
  volume?: number;
  operationType?: OperationType;
  deadline?: string;
  observations?: string;
  status?: DealStatus;
  feePercentage?: number;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Fetch all deals (non-deleted)
 */
export async function getDeals(): Promise<Deal[]> {
  try {
    const { data, error } = await supabase
      .from('master_deals')
      .select(`
        *,
        createdByUser:users!master_deals_created_by_fkey(id, name, email)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      clientName: item.client_name,
      volume: item.volume,
      operationType: item.operation_type,
      deadline: item.deadline,
      observations: item.observations || '',
      status: item.status,
      feePercentage: item.fee_percentage,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      createdBy: item.created_by,
      deletedAt: item.deleted_at,
      createdByUser: item.createdByUser,
    }));
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
}

/**
 * Get a single deal by ID
 */
export async function getDeal(dealId: string): Promise<Deal> {
  try {
    const { data, error } = await supabase
      .from('master_deals')
      .select(`
        *,
        createdByUser:users!master_deals_created_by_fkey(id, name, email)
      `)
      .eq('id', dealId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      clientName: data.client_name,
      volume: data.volume,
      operationType: data.operation_type,
      deadline: data.deadline,
      observations: data.observations || '',
      status: data.status,
      feePercentage: data.fee_percentage,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      deletedAt: data.deleted_at,
      createdByUser: data.createdByUser,
    };
  } catch (error) {
    console.error('Error fetching deal:', error);
    throw error;
  }
}

/**
 * Create a new deal
 */
export async function createDeal(deal: DealInput): Promise<Deal> {
  try {
    const { data, error } = await supabase
      .from('master_deals')
      .insert({
        client_name: deal.clientName,
        volume: deal.volume,
        operation_type: deal.operationType,
        deadline: deal.deadline,
        observations: deal.observations,
        status: deal.status || 'active',
        fee_percentage: deal.feePercentage,
        created_by: deal.createdBy,
      })
      .select(`
        *,
        createdByUser:users!master_deals_created_by_fkey(id, name, email)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      clientName: data.client_name,
      volume: data.volume,
      operationType: data.operation_type,
      deadline: data.deadline,
      observations: data.observations || '',
      status: data.status,
      feePercentage: data.fee_percentage,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      deletedAt: data.deleted_at,
      createdByUser: data.createdByUser,
    };
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
}

/**
 * Update an existing deal
 */
export async function updateDeal(
  dealId: string,
  updates: DealUpdate
): Promise<Deal> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.clientName !== undefined)
      updateData.client_name = updates.clientName;
    if (updates.volume !== undefined) updateData.volume = updates.volume;
    if (updates.operationType !== undefined)
      updateData.operation_type = updates.operationType;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
    if (updates.observations !== undefined)
      updateData.observations = updates.observations;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.feePercentage !== undefined)
      updateData.fee_percentage = updates.feePercentage;

    const { data, error } = await supabase
      .from('master_deals')
      .update(updateData)
      .eq('id', dealId)
      .select(`
        *,
        createdByUser:users!master_deals_created_by_fkey(id, name, email)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      clientName: data.client_name,
      volume: data.volume,
      operationType: data.operation_type,
      deadline: data.deadline,
      observations: data.observations || '',
      status: data.status,
      feePercentage: data.fee_percentage,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      deletedAt: data.deleted_at,
      createdByUser: data.createdByUser,
    };
  } catch (error) {
    console.error('Error updating deal:', error);
    throw error;
  }
}

/**
 * Soft delete a deal (set deleted_at timestamp)
 */
export async function deleteDeal(dealId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('master_deals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', dealId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting deal:', error);
    throw error;
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch all deals
 */
export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: getDeals,
  });
}

/**
 * Hook to fetch a single deal
 */
export function useDeal(dealId: string | null) {
  return useQuery({
    queryKey: ['deals', dealId],
    queryFn: () => getDeal(dealId!),
    enabled: !!dealId,
  });
}

/**
 * Hook to create a deal
 */
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

/**
 * Hook to update a deal
 */
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, updates }: { dealId: string; updates: DealUpdate }) =>
      updateDeal(dealId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', data.id] });
    },
  });
}

/**
 * Hook to delete a deal
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

/**
 * Hook to move a deal (update status)
 * This is a convenience wrapper around useUpdateDeal for kanban-style moves
 */
export function useMoveDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, status }: { dealId: string; status: DealStatus }) =>
      updateDeal(dealId, { status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', data.id] });
    },
  });
}
