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
  return {
    id: item.id,
    name: item.name,
    cnpj: item.cnpj || '',
    site: item.site || '',
    description: item.description || '',
    logoUrl: item.logo_url || '',
    
    type: item.type || 'other',
    // Mapeamento seguro de campos JSON/Arrays
    gestoraTypes: item.gestora_types || [], 
    relationshipLevel: item.relationship_level || 'none',
    products: item.product_capabilities || { credit: [], equity: [], barter: [] },
    
    createdAt: item.created_at,
    createdBy: item.created_by,
    updatedAt: item.updated_at,
    updatedBy: item.updated_by,
    deletedAt: item.deleted_at,
    isSynthetic: item.is_synthetic,
    
    // Joins
    creator: item.creator,
    contacts: item.contacts ? item.contacts.map(mapContactFromDB) : []
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Busca lista de players (sem trazer todos os contatos para não pesar a lista)
 */
export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      creator:profiles!players_created_by_fkey(name),
      editor:profiles!players_updated_by_fkey(name)
    `)
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data.map(mapPlayerFromDB)
}

/**
 * Busca um player específico com seus contatos
 */
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

/**
 * Cria um novo player
 */
export async function createPlayer(player: Partial<Player>, userId: string): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({
      name: player.name,
      cnpj: player.cnpj,
      site: player.site,
      description: player.description,
      type: player.type,
      gestora_types: player.gestoraTypes, // Salva array direto no JSONB
      relationship_level: player.relationshipLevel,
      product_capabilities: player.products, // Salva objeto direto no JSONB
      created_by: userId,
      updated_by: userId
    })
    .select()
    .single()

  if (error) throw error
  return mapPlayerFromDB(data)
}

/**
 * Atualiza um player existente
 */
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

/**
 * Soft delete de um player
 */
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

// ============================================================================
// React Query Hooks
// ============================================================================

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: getPlayers,
    staleTime: 1000 * 60 * 5 // 5 minutos de cache
  })
}

export function usePlayer(id: string | undefined) {
  return useQuery({
    queryKey: ['players', id],
    queryFn: () => getPlayer(id!),
    enabled: !!id && id !== 'new', // Não busca se for criação
    staleTime: 0 // Sempre busca dados frescos ao abrir o detalhe
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