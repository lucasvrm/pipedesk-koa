import { supabase } from '@/lib/supabaseClient'
import { PlayerContact } from '@/lib/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// --- Helpers ---

function mapContactFromDB(item: any): PlayerContact {
  return {
    id: item.id,
    playerId: item.player_id,
    name: item.name,
    role: item.role || '',
    email: item.email || '',
    phone: item.phone || '',
    isPrimary: item.is_primary || false,
    createdAt: item.created_at,
    createdBy: item.created_by
  }
}

// --- API Functions ---

export async function getContactsByPlayer(playerId: string): Promise<PlayerContact[]> {
  const { data, error } = await supabase
    .from('player_contacts')
    .select('*')
    .eq('player_id', playerId)
    .order('is_primary', { ascending: false }) // Primários primeiro
    .order('name', { ascending: true })

  if (error) throw error
  return data.map(mapContactFromDB)
}

export async function createContact(contact: Partial<PlayerContact>, userId: string) {
  // Se este for marcado como primário, desmarcar outros do mesmo player (opcional, mas boa prática)
  if (contact.isPrimary && contact.playerId) {
    await supabase
      .from('player_contacts')
      .update({ is_primary: false })
      .eq('player_id', contact.playerId)
  }

  const { data, error } = await supabase
    .from('player_contacts')
    .insert({
      player_id: contact.playerId,
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      is_primary: contact.isPrimary || false,
      created_by: userId,
      updated_by: userId
    })
    .select()
    .single()

  if (error) throw error
  return mapContactFromDB(data)
}

export async function updateContact(id: string, updates: Partial<PlayerContact>, userId: string) {
  if (updates.isPrimary && updates.playerId) {
    await supabase
      .from('player_contacts')
      .update({ is_primary: false })
      .eq('player_id', updates.playerId)
  }

  const { data, error } = await supabase
    .from('player_contacts')
    .update({
      name: updates.name,
      role: updates.role,
      email: updates.email,
      phone: updates.phone,
      is_primary: updates.isPrimary,
      updated_at: new Date().toISOString(),
      updated_by: userId
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapContactFromDB(data)
}

export async function deleteContact(id: string) {
  const { error } = await supabase
    .from('player_contacts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// --- Hooks ---

export function useContacts(playerId: string) {
  return useQuery({
    queryKey: ['contacts', playerId],
    queryFn: () => getContactsByPlayer(playerId),
    enabled: !!playerId
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contact, userId }: { contact: Partial<PlayerContact>, userId: string }) => 
      createContact(contact, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.contact.playerId] })
      queryClient.invalidateQueries({ queryKey: ['players', variables.contact.playerId] }) // Atualiza o player pai também
    }
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates, userId }: { id: string, updates: Partial<PlayerContact>, userId: string }) => 
      updateContact(id, updates, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', data.playerId] })
      queryClient.invalidateQueries({ queryKey: ['players', data.playerId] })
    }
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      // A estratégia de invalidação aqui é um pouco mais genérica pois não temos o playerId no retorno do delete
      // Poderíamos invalidar tudo de 'players' ou passar o playerId como argumento extra
      queryClient.invalidateQueries({ queryKey: ['contacts'] }) 
      queryClient.invalidateQueries({ queryKey: ['players'] })
    }
  })
}