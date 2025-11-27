import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';

// ============================================================================
// Helpers
// ============================================================================

function mapUserFromDB(item: any): User {
    return {
        id: item.id,
        name: item.name || 'Usuário sem nome',
        email: item.email || '',
        role: (item.role as any) || 'client',
        avatar: item.avatar_url || undefined,
        clientEntity: item.client_entity || undefined,
        has_completed_onboarding: item.has_completed_onboarding,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        
        // Novos Campos Mapeados
        address: item.address || '',
        cellphone: item.cellphone || '', // Novo campo mapeado
        pixKeyPJ: item.pix_key_pj || '',
        pixKeyPF: item.pix_key_pf || '',
        rg: item.rg || '',
        cpf: item.cpf || '',
        secondaryEmail: item.secondary_email || '',
        docIdentityUrl: item.doc_identity_url || undefined,
        docSocialContractUrl: item.doc_social_contract_url || undefined,
        docServiceAgreementUrl: item.doc_service_agreement_url || undefined,
    };
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getUsers(): Promise<User[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

    if (error) throw error;

    return (data || []).map(mapUserFromDB);
}

export async function getUser(userId: string): Promise<User> {
    const { data, error } = await supabase
        .from('profiles')
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