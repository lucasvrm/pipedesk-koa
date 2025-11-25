import { supabase } from '@/lib/supabaseClient'
import { PlayerContact } from '@/lib/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export async function createContact(contact: Partial<PlayerContact>, userId: string) {
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
  return data
}

export async function deleteContact(id: string) {
  const { error } = await supabase
    .from('player_contacts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Hooks
export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contact, userId }: { contact: Partial<PlayerContact>, userId: string }) => 
      createContact(contact, userId),
    onSuccess: (_, variables) => {
      // Invalida a query do player para recarregar os contatos
      queryClient.invalidateQueries({ queryKey: ['players', variables.contact.playerId] })
    }
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
    }
  })
}