import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MagicLink } from '@/lib/types';
import { MagicLinkDB } from '@/lib/databaseTypes';

// ============================================================================
// Helpers
// ============================================================================

function mapMagicLinkFromDB(item: MagicLinkDB): MagicLink {
    return {
        id: item.id,
        userId: item.user_id,
        token: item.token,
        expiresAt: item.expires_at,
        createdAt: item.created_at,
        usedAt: item.used_at || undefined,
        revokedAt: item.revoked_at || undefined,
    };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Fetch magic links for a user
 */
export async function getMagicLinks(userId: string): Promise<MagicLink[]> {
    const { data, error } = await supabase
        .from('magic_links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapMagicLinkFromDB);
}

/**
 * Create a magic link
 */
export async function createMagicLink(userId: string): Promise<MagicLink> {
    // Generate token (in production, this should be more secure)
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    const { data, error } = await supabase
        .from('magic_links')
        .insert({
            user_id: userId,
            token,
            expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

    if (error) throw error;

    return mapMagicLinkFromDB(data);
}

/**
 * Revoke a magic link
 */
export async function revokeMagicLink(linkId: string): Promise<void> {
    const { error } = await supabase
        .from('magic_links')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', linkId);

    if (error) throw error;
}

/**
 * Verify and use a magic link
 */
export async function useMagicLink(token: string): Promise<MagicLink | null> {
    const { data, error } = await supabase
        .from('magic_links')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .is('revoked_at', null)
        .single();

    if (error) return null;

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
        return null;
    }

    // Mark as used
    const { data: updated, error: updateError } = await supabase
        .from('magic_links')
        .update({ used_at: new Date().toISOString() })
        .eq('id', data.id)
        .select()
        .single();

    if (updateError) throw updateError;

    return mapMagicLinkFromDB(updated);
}

// ============================================================================
// React Query Hooks
// ============================================================================

export function useMagicLinks(userId: string | null) {
    return useQuery({
        queryKey: ['magicLinks', userId],
        queryFn: () => getMagicLinks(userId!),
        enabled: !!userId,
    });
}

export function useCreateMagicLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createMagicLink,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['magicLinks', data.userId] });
        },
    });
}

export function useRevokeMagicLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: revokeMagicLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['magicLinks'] });
        },
    });
}
