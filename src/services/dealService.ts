import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterDeal, OperationType, DealStatus } from '@/lib/types';

// ============================================================================
// Query Helpers
// ============================================================================

function withoutDeleted(query: any) {
  return query.is('deleted_at', null);
}

// ============================================================================
// Types
// ============================================================================

export interface Deal extends MasterDeal {
  // Extended with joins
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
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
  // NOVOS CAMPOS PARA INTEGRAÇÃO COM PLAYER
  playerId?: string;
  initialStage?: string; 
  // NOVO CAMPO PRODUTO
  dealProduct?: string;
}

export interface DealUpdate {
  clientName?: string;
  volume?: number;
  operationType?: OperationType;
  deadline?: string;
  observations?: string;
  status?: DealStatus;
  feePercentage?: number;
  // NOVO CAMPO PRODUTO
  dealProduct?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function mapDealFromDB(item: any): Deal {
  const profile = item.createdByUser;

  return {
    id: item.id,
    clientName: item.client_name,
    volume: item.volume || 0,
    operationType: (item.operation_type as OperationType) || 'acquisition',
    // Mapeamento do novo campo deal_product
    dealProduct: item.deal_product || undefined,
    deadline: item.deadline || '',
    observations: item.observations || '',
    status: (item.status as DealStatus) || 'active',
    feePercentage: item.fee_percentage || 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    createdBy: item.created_by,
    deletedAt: item.deleted_at || undefined,
    createdByUser: profile ? {
      id: profile.id,
      name: profile.name || 'Usuário',
      email: profile.email || '', 
      avatar: profile.avatar_url 
    } : undefined,
  };
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getDeals(): Promise<Deal[]> {
  try {
    const { data, error } = await withoutDeleted(
      supabase
        .from('master_deals')
        .select(`
          *,
          createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url)
        `)
    ).order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => mapDealFromDB(item));
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
}

export async function getDeal(dealId: string): Promise<Deal> {
  try {
    const { data, error } = await withoutDeleted(
      supabase
        .from('master_deals')
        .select(`
          *,
          createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url)
        `)
        .eq('id', dealId)
    ).single();

    if (error) throw error;

    return mapDealFromDB(data);
  } catch (error) {
    console.error('Error fetching deal:', error);
    throw error;
  }
}

export async function createDeal(deal: DealInput): Promise<Deal> {
  try {
    const { data: masterDealData, error: dealError } = await supabase
      .from('master_deals')
      .insert({
        client_name: deal.clientName,
        volume: deal.volume,
        operation_type: deal.operationType,
        // Inserção do deal_product
        deal_product: deal.dealProduct,
        deadline: deal.deadline,
        observations: deal.observations,
        status: deal.status || 'active',
        fee_percentage: deal.feePercentage,
        created_by: deal.createdBy,
      })
      .select(`
        *,
        createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url)
      `)
      .single();

    if (dealError) throw dealError;

    if (deal.playerId) {
      try {
        const { data: player } = await supabase
          .from("players")
          .select("name")
          .eq("id", deal.playerId)
          .single();

        if (player) {
          await supabase.from("player_tracks").insert({
            master_deal_id: masterDealData.id,
            player_id: deal.playerId,
            player_name: player.name,
            track_volume: deal.volume,
            current_stage: deal.initialStage || 'nda',
            status: 'active',
            probability: 10,
            responsibles: [deal.createdBy]
          });
        }
      } catch (trackError) {
        console.error("Master Deal criado, mas erro ao criar Track:", trackError);
      }
    }

    return mapDealFromDB(masterDealData);
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
}

export async function updateDeal(
  dealId: string,
  updates: DealUpdate
): Promise<Deal> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
    if (updates.volume !== undefined) updateData.volume = updates.volume;
    if (updates.operationType !== undefined) updateData.operation_type = updates.operationType;
    // Atualização do deal_product
    if (updates.dealProduct !== undefined) updateData.deal_product = updates.dealProduct;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
    if (updates.observations !== undefined) updateData.observations = updates.observations;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.feePercentage !== undefined) updateData.fee_percentage = updates.feePercentage;

    const { data, error } = await supabase
      .from('master_deals')
      .update(updateData)
      .eq('id', dealId)
      .select(`
        *,
        createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url)
      `)
      .single();

    if (error) throw error;

    return mapDealFromDB(data);
  } catch (error) {
    console.error('Error updating deal:', error);
    throw error;
  }
}

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

export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: getDeals,
  });
}

export function useDeal(dealId: string | null) {
  return useQuery({
    queryKey: ['deals', dealId],
    queryFn: () => getDeal(dealId!),
    enabled: !!dealId,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['player-tracks'] }); 
    },
  });
}

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

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

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