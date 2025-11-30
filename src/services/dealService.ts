import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterDeal, OperationType, DealStatus, Company, User, Tag } from '@/lib/types';

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
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  company?: Company;
  responsibles?: User[];
  tags?: Tag[]; // Added tags to deal type
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

// ============================================================================
// Helpers
// ============================================================================

function mapDealFromDB(item: any): Deal {
  const profile = item.createdByUser;
  const company = item.company;

  const responsibles: User[] = item.deal_members?.map((dm: any) => ({
    id: dm.user?.id,
    name: dm.user?.name || 'Usuário',
    email: dm.user?.email,
    avatar: dm.user?.avatar_url,
    role: dm.user?.role || 'analyst'
  })) || [];

  if (responsibles.length === 0 && profile) {
    responsibles.push({
      id: profile.id,
      name: profile.name || 'Usuário',
      email: profile.email || '', 
      avatar: profile.avatar_url 
    } as User);
  }

  // Map tags from join
  const tags: Tag[] = item.entity_tags?.map((et: any) => et.tags) || [];

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
    dealProduct: item.deal_product,
    
    companyId: item.company_id || undefined,
    
    company: company ? {
        id: company.id,
        name: company.name,
        type: company.type,
        site: company.site,
    } as Company : undefined,

    createdByUser: profile ? {
      id: profile.id,
      name: profile.name || 'Usuário',
      email: profile.email || '', 
      avatar: profile.avatar_url 
    } : undefined,

    responsibles: responsibles,
    tags: tags // Added tags
  };
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getDeals(tagIds?: string[]): Promise<Deal[]> {
  try {
    let query = supabase
        .from('master_deals')
        .select(`
          *,
          createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url),
          company:companies(id, name, type, site),
          deal_members(
            user:profiles(*)
          ),
          entity_tags!left(
            tags(*)
          )
        `);

    query = withoutDeleted(query);

    // Filter by tags if provided
    if (tagIds && tagIds.length > 0) {
      // Logic: Deals that have ANY of the tags.
      // We use !inner join to filter. But Supabase syntax for filtering on joined table is:
      // .select(..., entity_tags!inner(...))
      // But we already selected entity_tags!left to show tags even if filter not applied.
      // If we apply filter, we need to ensure the deal HAS the tag.
      // Approach: Use a separate query or change !left to !inner conditionally?
      // Supabase JS allows modifiers in select string.
      // Or we can filter the main query based on existing relationship.

      // Simpler approach for "Match Any":
      // Use the 'in' filter on the foreign key if possible, but M2M is hard.
      // Best approach: Filter logic.
      // 'entity_tags' table links deal_id -> tag_id.
      // We want deals where id IN (select entity_id from entity_tags where tag_id in tags)

      // Since supabase-js doesn't support subqueries easily in .in(), we might use .or() or RPC.
      // Alternatively, we filter on the joined resource.
      // To filter "deals having specific tags", we need the join to be INNER and satisfy criteria.

      // However, we want to fetch ALL tags for the deal, not just the matching ones?
      // Standard filter: return deals that match. Then map.
      // Let's try to modify the query string dynamically.

      // If filtering, we change 'entity_tags!left' to 'entity_tags!inner' AND add filter?
      // But that would only return the matching tags in the response, hiding others.
      // We want: Filter Deals by Tag X, but show Tags X, Y, Z.
      // This usually requires two steps or a smart query.
      // Given the volume (CRM deals ~hundreds/thousands), client-side filtering might be okay if we fetch everything?
      // But requirement says "Backend: filtrar deals por tags".

      // Correct approach with Supabase:
      // Filter deals ID based on tag match.
      const { data: matchingIds, error: matchError } = await supabase
        .from('entity_tags')
        .select('entity_id')
        .eq('entity_type', 'deal')
        .in('tag_id', tagIds);

      if (matchError) throw matchError;

      const ids = matchingIds.map((r: any) => r.entity_id);
      if (ids.length > 0) {
        query = query.in('id', ids);
      } else {
        return []; // No deals match
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST301' || error.message.includes('deal_members')) {
        console.warn("Tabela deal_members não encontrada. Usando fallback.");
        return getDealsFallback();
      }
      throw error;
    }

    return (data || []).map((item: any) => mapDealFromDB(item));
  } catch (error) {
    console.error('Error fetching deals (with members):', error);
    return getDealsFallback();
  }
}

async function getDealsFallback(): Promise<Deal[]> {
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
}

// FIX: Adicionada função de Fallback para getDeal individual
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
  return mapDealFromDB(data);
}

export async function getDeal(dealId: string): Promise<Deal> {
  try {
    const { data, error } = await withoutDeleted(
      supabase
        .from('master_deals')
        .select(`
          *,
          createdByUser:profiles!master_deals_created_by_fkey(id, name, email, avatar_url),
          company:companies(id, name, type, site),
          deal_members(
            user:profiles(*)
          ),
          entity_tags!left(
            tags(*)
          )
        `)
        .eq('id', dealId)
    ).single();

    if (error) {
      if (error.code === 'PGRST301' || error.message.includes('deal_members')) {
         console.warn("Tabela deal_members não encontrada no getDeal. Usando fallback.");
         return getDealFallback(dealId);
      }
      throw error; 
    }

    return mapDealFromDB(data);
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
        deal_product: deal.dealProduct, // ADICIONADO
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
      if (memberError) console.warn("Could not add creator to deal_members (migration missing?)", memberError.message);
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

    return mapDealFromDB(masterDealData);
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
}

export async function updateDeal(dealId: string, updates: DealUpdate): Promise<Deal> {
  try {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
    if (updates.volume !== undefined) updateData.volume = updates.volume;
    if (updates.operationType !== undefined) updateData.operation_type = updates.operationType;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
    if (updates.observations !== undefined) updateData.observations = updates.observations;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.feePercentage !== undefined) updateData.fee_percentage = updates.feePercentage;
    if (updates.companyId !== undefined) updateData.company_id = updates.companyId;
    if (updates.dealProduct !== undefined) updateData.deal_product = updates.dealProduct; // ADICIONADO

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

// Hook with filter support
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
