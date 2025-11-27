import { supabase } from '@/lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Comment } from '@/lib/types'
import { createNotification } from '@/services/notificationService' 

export async function getComments(entityId: string, entityType: string): Promise<Comment[]> {
  // Ajuste na query para garantir o JOIN correto com profiles
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles!comments_author_id_fkey(id, name, avatar_url)
    `)
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .order('created_at', { ascending: true })

  if (error) throw error
  
  return data.map((item: any) => ({
    id: item.id,
    entityId: item.entity_id,
    entityType: item.entity_type,
    authorId: item.author_id,
    author: item.author, // O objeto author deve vir preenchido aqui
    content: item.content,
    createdAt: item.created_at,
    mentions: item.mentions || []
  }))
}

export async function createComment(data: {
  entityId: string
  entityType: string
  content: string
  authorId: string
  mentions: string[] 
}) {
  // 1. Criar o Comentário
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      entity_id: data.entityId,
      entity_type: data.entityType,
      content: data.content,
      author_id: data.authorId,
      mentions: data.mentions
    })
    .select('*, author:profiles!comments_author_id_fkey(name, avatar_url)') // JOIN imediato para retorno
    .single()

  if (error) throw error

  // 2. Disparar Notificações
  if (data.mentions && data.mentions.length > 0) {
    const authorName = comment.author?.name || 'Alguém'
    const link = data.entityType === 'deal' ? `/deals/${data.entityId}?tab=comments` : `/dashboard`

    await Promise.all(data.mentions.map(userId => {
      if (userId !== data.authorId) {
        return createNotification({
          userId,
          type: 'mention',
          title: 'Você foi mencionado',
          message: `${authorName} mencionou você em um comentário.`,
          link
        })
      }
    }))
  }

  return comment
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) throw error
}

// Hooks
export function useComments(entityId: string, entityType: 'deal' | 'track' | 'task') {
  return useQuery({
    queryKey: ['comments', entityId],
    queryFn: () => getComments(entityId, entityType)
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.entityId] })
    }
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
    }
  })
}