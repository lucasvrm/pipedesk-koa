import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Folder, EntityLocation } from '@/lib/types';
import { FolderDB, EntityLocationDB } from '@/lib/databaseTypes';

// ============================================================================
// Types
// ============================================================================

export interface FolderInput {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string;
    type: 'project' | 'team' | 'sprint' | 'category' | 'custom';
    createdBy: string;
    position?: number;
}

export interface FolderUpdate {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string;
    position?: number;
}

export interface EntityLocationInput {
    entityId: string;
    entityType: 'deal' | 'track' | 'task';
    folderId: string;
    isPrimary?: boolean;
    addedBy: string;
}

// ============================================================================
// Helpers
// ============================================================================

function mapFolderFromDB(item: FolderDB): Folder {
    return {
        id: item.id,
        name: item.name,
        description: item.description || undefined,
        color: item.color || undefined,
        icon: item.icon || undefined,
        parentId: item.parent_id || undefined,
        type: item.type as 'project' | 'team' | 'sprint' | 'category' | 'custom',
        position: item.position,
        createdAt: item.created_at,
        createdBy: item.created_by,
    };
}

function mapEntityLocationFromDB(item: EntityLocationDB): EntityLocation {
    return {
        id: item.id,
        entityId: item.entity_id,
        entityType: item.entity_type as 'deal' | 'track' | 'task',
        folderId: item.folder_id,
        isPrimary: item.is_primary,
        addedAt: item.added_at,
        addedBy: item.added_by,
    };
}

// ============================================================================
// Service Functions - Folders
// ============================================================================

/**
 * Fetch all folders
 */
export async function getFolders(): Promise<Folder[]> {
    const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('position', { ascending: true });

    if (error) throw error;

    return (data || []).map(mapFolderFromDB);
}

/**
 * Create a folder
 */
export async function createFolder(folder: FolderInput): Promise<Folder> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
        .from('folders') as any)
        .insert({
            name: folder.name,
            description: folder.description,
            color: folder.color,
            icon: folder.icon,
            parent_id: folder.parentId,
            type: folder.type,
            position: folder.position || 0,
            created_by: folder.createdBy,
        })
        .select()
        .single();

    if (error) throw error;

    return mapFolderFromDB(data);
}

/**
 * Update a folder
 */
export async function updateFolder(folderId: string, updates: FolderUpdate): Promise<Folder> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;
    if (updates.position !== undefined) updateData.position = updates.position;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
        .from('folders') as any)
        .update(updateData)
        .eq('id', folderId)
        .select()
        .single();

    if (error) throw error;

    return mapFolderFromDB(data);
}

/**
 * Delete a folder
 */
export async function deleteFolder(folderId: string): Promise<void> {
    const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

    if (error) throw error;
}

// ============================================================================
// Service Functions - Entity Locations
// ============================================================================

/**
 * Get entity locations for an entity
 */
export async function getEntityLocations(
    entityId: string,
    entityType: 'deal' | 'track' | 'task'
): Promise<EntityLocation[]> {
    const { data, error } = await supabase
        .from('entity_locations')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType);

    if (error) throw error;

    return (data || []).map(mapEntityLocationFromDB);
}

/**
 * Add entity to folder
 */
export async function addEntityToFolder(location: EntityLocationInput): Promise<EntityLocation> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
        .from('entity_locations') as any)
        .insert({
            entity_id: location.entityId,
            entity_type: location.entityType,
            folder_id: location.folderId,
            is_primary: location.isPrimary || false,
            added_by: location.addedBy,
        })
        .select()
        .single();

    if (error) throw error;

    return mapEntityLocationFromDB(data);
}

/**
 * Remove entity from folder
 */
export async function removeEntityFromFolder(locationId: string): Promise<void> {
    const { error } = await supabase
        .from('entity_locations')
        .delete()
        .eq('id', locationId);

    if (error) throw error;
}

// ============================================================================
// React Query Hooks
// ============================================================================

export function useFolders() {
    return useQuery({
        queryKey: ['folders'],
        queryFn: getFolders,
    });
}

export function useCreateFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createFolder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        },
    });
}

export function useUpdateFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ folderId, updates }: { folderId: string; updates: FolderUpdate }) =>
            updateFolder(folderId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        },
    });
}

export function useDeleteFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteFolder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        },
    });
}

export function useEntityLocations(entityId: string, entityType: 'deal' | 'track' | 'task') {
    return useQuery({
        queryKey: ['entityLocations', entityType, entityId],
        queryFn: () => getEntityLocations(entityId, entityType),
        enabled: !!entityId,
    });
}

export function useAddEntityToFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addEntityToFolder,
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['entityLocations', data.entityType, data.entityId]
            });
        },
    });
}

export function useRemoveEntityFromFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: removeEntityFromFolder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entityLocations'] });
        },
    });
}
