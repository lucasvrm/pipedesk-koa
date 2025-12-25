import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, UserRole } from '@/lib/types';

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
        
        // Mapeamento dos novos campos
        address: item.address || '',
        cellphone: item.cellphone || '', 
        pixKeyPJ: item.pix_key_pj || '',
        pixKeyPF: item.pix_key_pf || '',
        rg: item.rg || '',
        cpf: item.cpf || '',
        secondaryEmail: item.secondary_email || '',
        docIdentityUrl: item.doc_identity_url || undefined,
        docSocialContractUrl: item.doc_social_contract_url || undefined,
        docServiceAgreementUrl: item.doc_service_agreement_url || undefined,
        
        // Campos adicionais para gerenciamento
        title: item.title || '',
        department: item.department || '',
        status: item.status || 'pending',
        lastLogin: item.last_login || undefined,
        
        // Avatar customization fields
        avatarBgColor: item.avatar_bg_color || undefined,
        avatarTextColor: item.avatar_text_color || undefined,
        avatarBorderColor: item.avatar_border_color || undefined,
        bannerStyle: item.banner_style || undefined,
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

// --- Tipagem estendida para suportar todos os campos no Edge Function ---

interface CreateUserInput {
    name: string;
    email: string;
    role: UserRole;
    clientEntity?: string;
    // Campos adicionais opcionais
    avatar?: string;
    cellphone?: string;
    cpf?: string;
    rg?: string;
    address?: string;
    pixKeyPJ?: string;
    pixKeyPF?: string;
    docIdentityUrl?: string;
    docSocialContractUrl?: string;
    docServiceAgreementUrl?: string;
    title?: string;
    department?: string;
    status?: 'active' | 'inactive' | 'pending';
    // Avatar customization fields
    avatarBgColor?: string;
    avatarTextColor?: string;
    avatarBorderColor?: string;
    bannerStyle?: string;
}

export async function createUser(userData: CreateUserInput) {
    const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
            action: 'create',
            userData
        }
    });

    if (error) throw error;
    return data;
}

export async function updateUser(userId: string, userData: Partial<CreateUserInput>) {
    // Map camelCase to snake_case for avatar customization fields
    const mappedData: any = { ...userData };
    
    if (userData.avatarBgColor !== undefined) {
        mappedData.avatar_bg_color = userData.avatarBgColor;
        delete mappedData.avatarBgColor;
    }
    if (userData.avatarTextColor !== undefined) {
        mappedData.avatar_text_color = userData.avatarTextColor;
        delete mappedData.avatarTextColor;
    }
    if (userData.avatarBorderColor !== undefined) {
        mappedData.avatar_border_color = userData.avatarBorderColor;
        delete mappedData.avatarBorderColor;
    }
    if (userData.bannerStyle !== undefined) {
        mappedData.banner_style = userData.bannerStyle;
        delete mappedData.bannerStyle;
    }

    const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
            action: 'update',
            userId,
            userData: mappedData
        }
    });

    if (error) throw error;
    return data;
}

export async function deleteUser(userId: string) {
    const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
            action: 'delete',
            userId
        }
    });

    if (error) throw error;
    return data;
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

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<CreateUserInput> }) => updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
}