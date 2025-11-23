import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { UserDB } from '@/lib/databaseTypes';

// ============================================================================
// Helpers
// ============================================================================

function mapUserFromDB(item: UserDB): User {
    return {
        id: item.id,
        name: item.name,
        email: item.email,
        role: (item.role as any) || 'client',
        avatar: item.avatar || undefined,
        clientEntity: item.client_entity || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
    };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Fetch all users
 */
export async function getUsers(): Promise<User[]> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

    if (error) throw error;

    return (data || []).map(mapUserFromDB);
}

/**
 * Get a single user
 */
export async function getUser(userId: string): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;

    return mapUserFromDB(data);
}

// ============================================================================
// React Query Hooks
// ============================================================================

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
    });
}

export function useUser(userId: string | null) {
    return useQuery({
        queryKey: ['users', userId],
        queryFn: () => getUser(userId!),
        enabled: !!userId,
    });
}
