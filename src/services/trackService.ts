import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayerTrack, PlayerStage } from '@/lib/types';
import { PlayerTrackDB } from '@/lib/databaseTypes';

// ============================================================================
// Types
// ============================================================================

export interface TrackInput {
    masterDealId: string;
    playerName: string;
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

function mapTrackFromDB(item: any): PlayerTrack & { dealName?: string } {
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
        // Mapeia o nome do deal se vier do join
        dealName: item.master_deal?.client_name
    };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Fetch all tracks
 */
export async function getTracks(): Promise<PlayerTrack[]> {
    const { data, error } = await supabase
        .from('player_tracks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapTrackFromDB);
}

/**
 * Fetch tracks by master deal ID
 */
export async function getTracksByDeal(dealId: string): Promise<PlayerTrack[]> {
    const { data, error } = await supabase
        .from('player_tracks')
        .select('*')
        .eq('master_deal_id', dealId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapTrackFromDB);
}

/**
 * NOVA FUNÇÃO: Fetch tracks by PLAYER ID (incluindo nome do Deal)
 */
// ... (imports)

// Atualize a tipagem do retorno para incluir dealProduct
function mapTrackFromDB(item: any): PlayerTrack & { dealName?: string; dealProduct?: string } {
    return {
        // ... (outros campos iguais)
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
        // JOIN: Mapeia nome e produto
        dealName: item.master_deal?.client_name,
        dealProduct: item.master_deal?.deal_product
    };
}

export async function getTracksByPlayer(playerId: string): Promise<(PlayerTrack & { dealName?: string; dealProduct?: string })[]> {
    const { data, error } = await supabase
        .from('player_tracks')
        .select('*, master_deal:master_deals(client_name, deal_product)') // <--- Adicionado deal_product aqui
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

/**
 * Create a new track
 */
export async function createTrack(track: TrackInput): Promise<PlayerTrack> {
    const { data, error } = await supabase
        .from('player_tracks')
        .insert({
            master_deal_id: track.masterDealId,
            player_name: track.playerName,
            track_volume: track.trackVolume,
            current_stage: track.currentStage,
            probability: track.probability || 0,
            responsibles: track.responsibles || [],
            status: track.status || 'active',
            notes: track.notes,
        })
        .select()
        .single();

    if (error) throw error;

    return mapTrackFromDB(data);
}

/**
 * Update a track
 */
export async function updateTrack(trackId: string, updates: TrackUpdate): Promise<PlayerTrack> {
    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.masterDealId !== undefined) updateData.master_deal_id = updates.masterDealId;
    if (updates.playerName !== undefined) updateData.player_name = updates.playerName;
    if (updates.trackVolume !== undefined) updateData.track_volume = updates.trackVolume;
    if (updates.currentStage !== undefined) updateData.current_stage = updates.currentStage;
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

/**
 * Delete a track
 */
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

// NOVO HOOK: Busca tracks pelo Player ID
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
            // Invalida também a lista de tracks do player
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