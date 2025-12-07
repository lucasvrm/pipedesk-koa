import { PostgrestFilterBuilder } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterDealDB, CompanyDB, ProfileDB } from '@/lib/databaseTypes';
import { MasterDeal, OperationType, DealStatus, Company, User, Tag, UserRole } from '@/lib/types';
import { syncRemoteEntityName } from './pdGoogleDriveApi';

// ============================================================================
// Query Helpers
// ============================================================================

type PostgrestQuery = PostgrestFilterBuilder<any, any, any>;

function withoutDeleted(query: PostgrestQuery) {
  return query.is('deleted_at', null);
}

// ============================================================================
// Types
// ============================================================================

export interface Deal extends MasterDeal {
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  company?: Company;
  responsibles?: User[];
  tags?: Tag[];
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
  playerId?: string;
  initialStage?: string; 
  companyId?: string;
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
  companyId?: string;
  dealProduct?: string;
}

interface DealMemberRow {
  user?: ProfileDB | null;
}

interface DealQueryResult extends MasterDealDB {
  deal_product: string | null;
  company?: CompanyDB | null;
  createdByUser?: ProfileDB | null;
  deal_members?: DealMemberRow[] | null;
}

interface EntityTagRow {
  entity_id: string;
}

const normalizeUserRole = (role?: string | null): UserRole => {
  return role === 'admin' || role === 'analyst' || role === 'client' || role === 'newbusiness'
    ? role
    : 'analyst';
};

function mapProfileToUser(profile?: ProfileDB | null): User | undefined {
  if (!profile) return undefined;

  return {
    id: profile.id,
    name: profile.name || 'Usuário',
    email: profile.email || '',
    avatar: profile.avatar_url || undefined,
    role: normalizeUserRole(profile.role)
  };
}

// ============================================================================
// Helpers
// ============================================================================

function mapDealFromDB(item: DealQueryResult): Deal {
  const profile = mapProfileToUser(item.createdByUser);
  const company = item.company
    ? {
        id: item.company.id,
        name: item.company.name,
        type: item.company.type || undefined,
        site: item.company.site || undefined,
      }
    : undefined;

  const responsibles: User[] = (item.deal_members ?? [])
    .map((dm) => mapProfileToUser(dm.user))
    .filter((member): member is User => Boolean(member));

  if (responsibles.length === 0 && profile) {
    responsibles.push(profile);
  }

  // Tags removidas temporariamente para evitar erro 400
  const tags: Tag[] = [];

  return {
    id: item.id,
    clientName: item.client_name,
    volume: item.volume || 0,
    operationType: (item.operation_type as OperationType) || 'ccb',
    deadline: item.deadline || '',
    observations: item.observations || '',
    status: (item.status as DealStatus) || 'active',
    feePercentage: item.fee_percentage || 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    createdBy: item.created_by,
    deletedAt: item.deleted_at || undefined,
    dealProduct: item.deal_product || undefined,

    companyId: item.company_id || undefined,

    company,
    createdByUser: profile,
    responsibles,
    tags
  };
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getDeals(tagIds?: string[]): Promise<Deal[]> {
  try {
    // CORREÇÃO: Removido 'entity_tags!left(...)' que causava erro 400
    // O Supabase não consegue fazer join sem FK explícita.
    let query = supabase
        .from('master_deals')
        .select(`
          *,
          createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url),
          company:companies(id, name, type, site)
        `);

    query = withoutDeleted(query);

    // Lógica de filtro por tags mantida apenas se houver ids, 
    // mas a busca de tags no select principal foi removida.
    if (tagIds && tagIds.length > 0) {
      const { data: matchingIds, error: matchError } = await supabase
        .from('entity_tags')
        .select('entity_id')
        .eq('entity_type', 'deal')
        .in('tag_id', tagIds);

      if (matchError) throw matchError;

      const ids = (matchingIds as EntityTagRow[]).map((r) => r.entity_id);
      if (ids.length > 0) {
        query = query.in('id', ids);
      } else {
        return []; 
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error in getDeals query:', error);
      throw error;
    }

    const deals = (data as DealQueryResult[] | null) ?? [];

    return deals.map(mapDealFromDB);
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
}

// Helper de fallback mantido caso precise
async function getDealFallback(dealId: string): Promise<Deal> {
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
  return mapDealFromDB(data as DealQueryResult);
}

export async function getDeal(dealId: string): Promise<Deal> {
  try {
    // CORREÇÃO: Removido entity_tags daqui também
    const { data, error } = await withoutDeleted(
      supabase
        .from('master_deals')
        .select(`
          *,
          createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url),
          company:companies(id, name, type, site),
          deal_members(
            user:profiles(*)
          )
        `)
        .eq('id', dealId)
    ).single();

    if (error) {
      // Se falhar por causa de deal_members (ainda não migrado), usa fallback
      if (error.code === 'PGRST301' || error.message.includes('deal_members')) {
         console.warn("Tabela deal_members não encontrada ou erro de join. Usando fallback.");
         return getDealFallback(dealId);
      }
      throw error; 
    }

    return mapDealFromDB(data as DealQueryResult);
  } catch (error) {
    console.error('Error fetching deal:', error);
    return getDealFallback(dealId);
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
        deadline: deal.deadline,
        observations: deal.observations,
        status: deal.status || 'active',
        fee_percentage: deal.feePercentage,
        created_by: deal.createdBy,
        company_id: deal.companyId,
        deal_product: deal.dealProduct,
      })
      .select(`
        *,
        createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url),
        company:companies(id, name, type, site)
      `)
      .single();

    if (dealError) throw dealError;

    if (deal.createdBy) {
      const { error: memberError } = await supabase
        .from('deal_members')
        .insert({
          deal_id: masterDealData.id,
          user_id: deal.createdBy
        });
      if (memberError) console.warn("Could not add creator to deal_members:", memberError.message);
    }

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
        console.error("Master Deal created but track creation failed:", trackError);
      }
    }

    return mapDealFromDB(masterDealData as DealQueryResult);
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
}

export async function updateDeal(dealId: string, updates: DealUpdate): Promise<Deal> {
  try {
    const updateData: Partial<MasterDealDB> & { updated_at: string } = { updated_at: new Date().toISOString() };

    if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
    if (updates.volume !== undefined) updateData.volume = updates.volume;
    if (updates.operationType !== undefined) updateData.operation_type = updates.operationType;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
    if (updates.observations !== undefined) updateData.observations = updates.observations;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.feePercentage !== undefined) updateData.fee_percentage = updates.feePercentage;
    if (updates.companyId !== undefined) updateData.company_id = updates.companyId;
    if (updates.dealProduct !== undefined) updateData.deal_product = updates.dealProduct;

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

    // --- GOOGLE DRIVE SYNC START ---
    if (updates.clientName) {
      syncRemoteEntityName('deal', dealId);
    }
    // --- GOOGLE DRIVE SYNC END ---

    return mapDealFromDB(data as DealQueryResult);
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

export async function deleteDeals(ids: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('master_deals')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting deals:', error);
    throw error;
  }
}

// Hook exportado do service (duplicado, mas mantido para compatibilidade)
export function useDeals(tagIds?: string[]) {
  return useQuery({
    queryKey: ['deals', tagIds],
    queryFn: () => getDeals(tagIds)
  });
}

export function useDeal(dealId: string | null) {
  return useQuery({ queryKey: ['deals', dealId], queryFn: () => getDeal(dealId!), enabled: !!dealId });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['player-tracks'] }); 
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, updates }: { dealId: string; updates: DealUpdate }) => updateDeal(dealId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', data.id] });
      if (data.companyId) queryClient.invalidateQueries({ queryKey: ['companies', data.companyId] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals'] }),
  });
}

export function useDeleteDeals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeals,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals'] }),
  });
}

export function useMoveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, status }: { dealId: string; status: DealStatus }) => updateDeal(dealId, { status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', data.id] });
    },
  });
}