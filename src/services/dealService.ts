import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterDeal, OperationType, DealStatus, Company } from '@/lib/types';

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Helper to apply soft delete filter (exclude deleted records)
 */
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
  // Join com a Empresa (Cliente)
  company?: Company;
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
  // NOVO CAMPO PARA INTEGRAÇÃO COM EMPRESA (CLIENTE)
  companyId?: string;
}

export interface DealUpdate {
  clientName?: string;
  volume?: number;
  operationType?: OperationType;
  deadline?: string;
  observations?: string;
  status?: DealStatus;
  feePercentage?: number;
  // Atualização da Empresa
  companyId?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function mapDealFromDB(item: any): Deal {
  // Extrai o usuário da relação com profiles
  const profile = item.createdByUser;
  const company = item.company;

  return {
    id: item.id,
    clientName: item.client_name,
    volume: item.volume || 0,
    operationType: (item.operation_type as OperationType) || 'acquisition',
    deadline: item.deadline || '',
    observations: item.observations || '',
    status: (item.status as DealStatus) || 'active',
    feePercentage: item.fee_percentage || 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    createdBy: item.created_by,
    deletedAt: item.deleted_at || undefined,
    
    // Mapeamento do ID da Empresa (Foreign Key)
    companyId: item.company_id || undefined,
    
    // Mapeamento do Objeto Empresa (Join)
    company: company ? {
        id: company.id,
        name: company.name,
        type: company.type,
        site: company.site,
        // outros campos se necessário
    } as Company : undefined,

    // Mapeamento para usar a estrutura da tabela profiles
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

/**
 * Fetch all deals (non-deleted)
 */
export async function getDeals(): Promise<Deal[]> {
  try {
    const { data, error } = await withoutDeleted(
      supabase
        .from('master_deals')
        .select(`
          *,
          createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url),
          company:companies(id, name, type, site)
        `)
    ).order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => mapDealFromDB(item));
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
    const { data, error } = await withoutDeleted(
      supabase
        .from('master_deals')
        .select(`
          *,
          createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url),
          company:companies(id, name, type, site)
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

/**
 * Create a new deal (and optionally a Player Track)
 */
export async function createDeal(deal: DealInput): Promise<Deal> {
  try {
    // 1. Cria o Master Deal
    const { data: masterDealData, error: dealError } = await supabase
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
        company_id: deal.companyId, // Vínculo com Empresa
      })
      .select(`
        *,
        createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url),
        company:companies(id, name, type, site)
      `)
      .single();

    if (dealError) throw dealError;

    // 2. LÓGICA NOVA: Se houver um Player selecionado, cria o Track
    if (deal.playerId) {
      try {
        // Busca info do player para garantir integridade (nome)
        const { data: player } = await supabase
          .from("players")
          .select("name")
          .eq("id", deal.playerId)
          .single();

        if (player) {
          await supabase.from("player_tracks").insert({
            master_deal_id: masterDealData.id,
            player_id: deal.playerId,
            player_name: player.name, // Fallback legado
            track_volume: deal.volume, // Assume mesmo volume inicial
            current_stage: deal.initialStage || 'nda', // Usa a fase passada ou NDA
            status: 'active',
            probability: 10,
            responsibles: [deal.createdBy]
          });
        }
      } catch (trackError) {
        console.error("Master Deal criado, mas erro ao criar Track:", trackError);
        // Não lançamos erro aqui para não invalidar o Deal já criado
      }
    }

    return mapDealFromDB(masterDealData);
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
    if (updates.companyId !== undefined)
      updateData.company_id = updates.companyId;

    const { data, error } = await supabase
      .from('master_deals')
      .update(updateData)
      .eq('id', dealId)
      .select(`
        *,
        createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url),
        company:companies(id, name, type, site)
      `)
      .single();

    if (error) throw error;

    return mapDealFromDB(data);
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
      // Invalida também os tracks para atualizar listas que dependam disso
      queryClient.invalidateQueries({ queryKey: ['player-tracks'] }); 
      // Se houver lista de empresas que mostra deals, invalida também
      queryClient.invalidateQueries({ queryKey: ['companies'] });
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
      if (data.companyId) {
        queryClient.invalidateQueries({ queryKey: ['companies', data.companyId] });
      }
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