import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayerTrack, PlayerStage } from '@/lib/types';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface TrackInput {
    masterDealId: string;
    playerName: string;
    playerId: string; 
    trackVolume?: number;
    currentStage: PlayerStage;
    probability?: number;
    responsibles?: string[];
    status?: 'active' | 'concluded' | 'cancelled';
    notes?: string;
}

export interface TrackUpdate {
    masterDealId?: string;
    playerName?: string;
    trackVolume?: number;
    currentStage?: PlayerStage;
    probability?: number;
    responsibles?: string[];
    status?: 'active' | 'concluded' | 'cancelled';
    notes?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function mapTrackFromDB(item: any): PlayerTrack & { dealName?: string; dealProduct?: string } {
    return {
        id: item.id,
        masterDealId: item.master_deal_id,
        playerName: item.player_name,
        trackVolume: item.track_volume || 0,
        currentStage: (item.current_stage as PlayerStage) || 'nda',
        probability: item.probability || 0,
        responsibles: item.responsibles || [],
        status: (item.status as any) || 'active',
        notes: item.notes || '',
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        // Using stage_entered_at for SLA if available, otherwise fallback to updatedAt
        stageEnteredAt: item.stage_entered_at || item.updated_at,
        dealName: item.master_deal?.client_name,
        dealProduct: item.master_deal?.deal_product
    };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Fetch all tracks (Atualizado para trazer dados do Deal)
 */
export async function getTracks(): Promise<(PlayerTrack & { dealName?: string; dealProduct?: string })[]> {
    const { data, error } = await supabase
        .from('player_tracks')
        // JOIN ADICIONADO AQUI:
        .select('*, master_deal:master_deals(client_name, deal_product)') 
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapTrackFromDB);
}

export async function getTracksByDeal(dealId: string): Promise<PlayerTrack[]> {
    const { data, error } = await supabase
        .from('player_tracks')
        .select('*, master_deal:master_deals(client_name, deal_product)')
        .eq('master_deal_id', dealId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapTrackFromDB);
}

export async function getTracksByPlayer(playerId: string): Promise<(PlayerTrack & { dealName?: string; dealProduct?: string })[]> {
    const { data, error } = await supabase
        .from('player_tracks')
        .select('*, master_deal:master_deals(client_name, deal_product)') 
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapTrackFromDB);
}

export async function getTrack(trackId: string): Promise<PlayerTrack> {
    const { data, error } = await supabase
        .from('player_tracks')
        .select('*')
        .eq('id', trackId)
        .single();

    if (error) throw error;

    return mapTrackFromDB(data);
}

export async function createTrack(track: TrackInput): Promise<PlayerTrack> {
    const { data, error } = await supabase
        .from('player_tracks')
        .insert({
            master_deal_id: track.masterDealId,
            player_name: track.playerName,
            player_id: track.playerId, 
            track_volume: track.trackVolume,
            current_stage: track.currentStage,
            probability: track.probability || 0,
            responsibles: track.responsibles || [],
            status: track.status || 'active',
            notes: track.notes,
            stage_entered_at: new Date().toISOString() // Set initial entry time
        })
        .select()
        .single();

    if (error) throw error;

    return mapTrackFromDB(data);
}

export async function validateTransition(currentStage: string, nextStage: string): Promise<boolean> {
    if (currentStage === nextStage) return true;

    // Check if there are rules
    const { data: rules } = await supabase
        .from('phase_transition_rules')
        .select('*')
        .eq('from_stage', currentStage)
        .eq('to_stage', nextStage);

    // If explicit rules exist for this pair
    if (rules && rules.length > 0) {
        // If ANY rule is disabled, we block.
        // Logic: The existence of a disabled rule overrides any enabled rule?
        // Or usually uniqueness constraint ensures only one rule per pair.
        // Assuming one rule per pair.
        const blocked = rules.some(r => r.enabled === false);
        if (blocked) return false;
    }

    return true;
}

export async function updateTrack(trackId: string, updates: TrackUpdate): Promise<PlayerTrack> {
    // Phase Transition Validation
    if (updates.currentStage) {
        const current = await getTrack(trackId);
        const allowed = await validateTransition(current.currentStage, updates.currentStage);
        if (!allowed) {
            throw new Error(`Transição de ${current.currentStage} para ${updates.currentStage} não permitida.`);
        }
    }

    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.masterDealId !== undefined) updateData.master_deal_id = updates.masterDealId;
    if (updates.playerName !== undefined) updateData.player_name = updates.playerName;
    if (updates.trackVolume !== undefined) updateData.track_volume = updates.trackVolume;

    // SLA Logic: If stage changes, update entered_at
    if (updates.currentStage !== undefined) {
        updateData.current_stage = updates.currentStage;
        // Only update timestamp if stage actually changes (checked via logic or assumed from caller)
        // Since we fetch current above for validation, we can check.
        // But to be safe and simple, if caller passes stage, we treat as change.
        updateData.stage_entered_at = new Date().toISOString();
    }

    if (updates.probability !== undefined) updateData.probability = updates.probability;
    if (updates.responsibles !== undefined) updateData.responsibles = updates.responsibles;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
        .from('player_tracks')
        .update(updateData)
        .eq('id', trackId)
        .select()
        .single();

    if (error) throw error;

    return mapTrackFromDB(data);
}

export async function deleteTrack(trackId: string): Promise<void> {
    const { error } = await supabase
        .from('player_tracks')
        .delete()
        .eq('id', trackId);

    if (error) throw error;
}

// ============================================================================
// React Query Hooks
// ============================================================================

export function useTracks(dealId?: string) {
    return useQuery({
        queryKey: ['tracks', dealId],
        queryFn: () => (dealId ? getTracksByDeal(dealId) : getTracks()),
    });
}

export function usePlayerTracks(playerId: string | undefined) {
    return useQuery({
        queryKey: ['player-tracks', playerId],
        queryFn: () => getTracksByPlayer(playerId!),
        enabled: !!playerId,
    });
}

export function useTrack(trackId: string | null) {
    return useQuery({
        queryKey: ['tracks', 'detail', trackId],
        queryFn: () => getTrack(trackId!),
        enabled: !!trackId,
    });
}

export function useCreateTrack() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createTrack,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tracks'] });
            queryClient.invalidateQueries({ queryKey: ['tracks', data.masterDealId] });
            queryClient.invalidateQueries({ queryKey: ['player-tracks'] });
        },
    });
}

export function useUpdateTrack() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ trackId, updates }: { trackId: string; updates: TrackUpdate }) =>
            updateTrack(trackId, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tracks'] });
            queryClient.invalidateQueries({ queryKey: ['tracks', data.masterDealId] });
            queryClient.invalidateQueries({ queryKey: ['tracks', 'detail', data.id] });
            queryClient.invalidateQueries({ queryKey: ['player-tracks'] });
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao atualizar track.");
        }
    });
}

export function useDeleteTrack() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteTrack,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tracks'] });
            queryClient.invalidateQueries({ queryKey: ['player-tracks'] });
        },
    });
}
