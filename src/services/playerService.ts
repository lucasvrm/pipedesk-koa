import { supabase } from '@/lib/supabaseClient'
import { Player, PlayerContact } from '@/lib/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ============================================================================
// Helpers (Mappers)
// ============================================================================

function mapContactFromDB(item: any): PlayerContact {
  return {
    id: item.id,
    playerId: item.player_id,
    name: item.name,
    role: item.role || '',
    email: item.email || '',
    phone: item.phone || '',
    isPrimary: item.is_primary,
    createdAt: item.created_at,
    createdBy: item.created_by
  }
}

function mapPlayerFromDB(item: any): Player {
  const primaryContactData = item.primary_contact && item.primary_contact.length > 0 
    ? item.primary_contact[0] 
    : null;

  const primaryContact = primaryContactData ? mapContactFromDB(primaryContactData) : undefined;

  return {
    id: item.id,
    name: item.name,
    cnpj: item.cnpj || '',
    site: item.site || '',
    description: item.description || '',
    logoUrl: item.logo_url || '',
    
    type: item.type || 'other',
    gestoraTypes: item.gestora_types || [], 
    relationshipLevel: item.relationship_level || 'none',
    products: item.product_capabilities || { credit: [], equity: [], barter: [] },
    
    createdAt: item.created_at,
    createdBy: item.created_by,
    updatedAt: item.updated_at,
    updatedBy: item.updated_by,
    deletedAt: item.deleted_at,
    isSynthetic: item.is_synthetic,
    
    creator: item.creator,
    contacts: item.contacts ? item.contacts.map(mapContactFromDB) : [],
    primaryContact: primaryContact
  }
}

// ============================================================================
// API Functions
// ============================================================================

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      creator:profiles!players_created_by_fkey(name),
      editor:profiles!players_updated_by_fkey(name),
      primary_contact:player_contacts(id, name, phone, email, role, is_primary)
    `)
    .eq('primary_contact.is_primary', true)
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data.map(mapPlayerFromDB)
}

export async function getPlayer(id: string): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      creator:profiles!players_created_by_fkey(name),
      editor:profiles!players_updated_by_fkey(name),
      contacts:player_contacts(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return mapPlayerFromDB(data)
}

export async function createPlayer(player: Partial<Player>, userId: string): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({
      name: player.name,
      cnpj: player.cnpj,
      site: player.site,
      description: player.description,
      type: player.type,
      gestora_types: player.gestoraTypes,
      relationship_level: player.relationshipLevel,
      product_capabilities: player.products,
      created_by: userId,
      updated_by: userId
    })
    .select()
    .single()

  if (error) throw error
  return mapPlayerFromDB(data)
}

export async function updatePlayer(id: string, updates: Partial<Player>, userId: string): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .update({
      name: updates.name,
      cnpj: updates.cnpj,
      site: updates.site,
      description: updates.description,
      type: updates.type,
      gestora_types: updates.gestoraTypes,
      relationship_level: updates.relationshipLevel,
      product_capabilities: updates.products,
      updated_at: new Date().toISOString(),
      updated_by: userId
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapPlayerFromDB(data)
}

export async function deletePlayer(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: userId
    })
    .eq('id', id)

  if (error) throw error
}

// --- NOVA FUNÇÃO: Deleção em Massa ---
export async function deletePlayers(ids: string[], userId: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: userId
    })
    .in('id', ids)

  if (error) throw error
}

// ============================================================================
// React Query Hooks
// ============================================================================

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: getPlayers,
    staleTime: 1000 * 60 * 5 
  })
}

export function usePlayer(id: string | undefined) {
  return useQuery({
    queryKey: ['players', id],
    queryFn: () => getPlayer(id!),
    enabled: !!id && id !== 'new',
    staleTime: 0 
  })
}

export function useCreatePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ data, userId }: { data: Partial<Player>, userId: string }) => 
      createPlayer(data, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
    }
  })
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data, userId }: { id: string, data: Partial<Player>, userId: string }) => 
      updatePlayer(id, data, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
      queryClient.invalidateQueries({ queryKey: ['players', data.id] })
    }
  })
}

export function useDeletePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, userId }: { id: string, userId: string }) => 
      deletePlayer(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
    }
  })
}

// Hook para Deleção em Massa
export function useDeletePlayers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, userId }: { ids: string[], userId: string }) => 
      deletePlayers(ids, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
    }
  })
}