import { supabase } from '@/lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Comment } from '@/lib/types'
import { createNotification } from '@/services/notificationService' 

export async function getComments(entityId: string, entityType: string): Promise<Comment[]> {
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
    author: item.author,
    content: item.content,
    createdAt: item.created_at,
    mentions: item.mentions || [],
    parentId: item.parent_id || null
  }))
}

export async function createComment(data: {
  entityId: string
  entityType: string
  content: string
  authorId: string
  mentions: string[]
  parentId?: string | null
}) {
  // 1. Criar o Comentário
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      entity_id: data.entityId,
      entity_type: data.entityType,
      content: data.content,
      author_id: data.authorId,
      mentions: data.mentions,
      parent_id: data.parentId || null
    })
    .select('*, author:profiles!comments_author_id_fkey(name, avatar_url)')
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

// Função para atualizar comentário
export async function updateComment(commentId: string, content: string) {
  const { data, error } = await supabase
    .from('comments')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .select('*, author: profiles!comments_author_id_fkey(name, avatar_url)')
    .single()

  if (error) throw error
  return data
}

// --- Hooks ---

export function useComments(entityId: string | undefined, entityType: 'deal' | 'track' | 'task' | 'lead' | 'company') {
  return useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: () => getComments(entityId!, entityType),
    enabled: !!entityId // Só busca se houver ID, evita erros e loops
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.entityType, variables.entityId] })
    }
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId }: { commentId: string; entityId?: string; entityType?: string }) => deleteComment(commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      if (variables?.entityType && variables?.entityId) {
        queryClient.invalidateQueries({ queryKey: ['comments', variables.entityType, variables.entityId] })
      }
    }
  })
}

// Hook para atualizar comentário
export function useUpdateComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string; entityId?: string; entityType?: string }) => 
      updateComment(commentId, content),
    onSuccess: (_, variables) => {
      // Invalidar queries de timeline e comentários
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      if (variables?.entityType && variables?.entityId) {
        queryClient.invalidateQueries({ queryKey: ['comments', variables.entityType, variables.entityId] })
      }
    }
  })
}