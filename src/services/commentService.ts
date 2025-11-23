import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Comment } from '@/lib/types';
import { CommentDB } from '@/lib/databaseTypes';

// ============================================================================
// Types
// ============================================================================

export interface CommentInput {
    entityId: string;
    entityType: 'deal' | 'track' | 'task';
    authorId: string;
    content: string;
    mentions?: string[];
}

// ============================================================================
// Helpers
// ============================================================================

function mapCommentFromDB(item: CommentDB): Comment {
    return {
        id: item.id,
        entityId: item.entity_id,
        entityType: item.entity_type as 'deal' | 'track' | 'task',
        authorId: item.author_id,
        content: item.content,
        mentions: item.mentions || [],
        createdAt: item.created_at,
    };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Fetch comments for a specific entity
 */
export async function getComments(
    entityId: string,
    entityType: 'deal' | 'track' | 'task'
): Promise<Comment[]> {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(mapCommentFromDB);
}

/**
 * Create a new comment
 */
export async function createComment(comment: CommentInput): Promise<Comment> {
    const { data, error } = await supabase
        .from('comments')
        .insert({
            entity_id: comment.entityId,
            entity_type: comment.entityType,
            author_id: comment.authorId,
            content: comment.content,
            mentions: comment.mentions || [],
        })
        .select()
        .single();

    if (error) throw error;

    return mapCommentFromDB(data);
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

    if (error) throw error;
}

// ============================================================================
// React Query Hooks
// ============================================================================

export function useComments(entityId: string, entityType: 'deal' | 'track' | 'task') {
    return useQuery({
        queryKey: ['comments', entityType, entityId],
        queryFn: () => getComments(entityId, entityType),
        enabled: !!entityId,
    });
}

export function useCreateComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createComment,
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['comments', data.entityType, data.entityId]
            });
        },
    });
}

export function useDeleteComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments'] });
        },
    });
}
