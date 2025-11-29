import { supabase } from '@/lib/supabaseClient';
import { Tag } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- API ---

// Buscar tags (filtrando por tipo de entidade opcionalmente)
export async function getTags(entityType?: 'deal' | 'track'): Promise<Tag[]> {
  let query = supabase.from('tags').select('*').order('name');
  
  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return data.map((t: any) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    entityType: t.entity_type,
    createdAt: t.created_at,
    createdBy: t.created_by
  }));
}

export async function createTag(name: string, color: string, entityType: 'deal' | 'track', userId: string) {
  const { data, error } = await supabase
    .from('tags')
    .insert({ name, color, entity_type: entityType, created_by: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTag(id: string, updates: Partial<Tag>) {
  const { data, error } = await supabase
    .from('tags')
    .update({ 
      name: updates.name, 
      color: updates.color 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTag(id: string) {
  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw error;
}

// Associar Tag a Entidade
export async function assignTag(tagId: string, entityId: string, entityType: 'deal' | 'track') {
  const { error } = await supabase.from('entity_tags').insert({
    tag_id: tagId,
    entity_id: entityId,
    entity_type: entityType
  });
  if (error) throw error;
}

// Remover Tag de Entidade
export async function removeTag(tagId: string, entityId: string) {
  const { error } = await supabase
    .from('entity_tags')
    .delete()
    .match({ tag_id: tagId, entity_id: entityId });
  if (error) throw error;
}

// --- Hooks ---

export function useTags(entityType?: 'deal' | 'track') {
  return useQuery({ 
    queryKey: ['tags', entityType], 
    queryFn: () => getTags(entityType) 
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { name: string, color: string, entityType: 'deal' | 'track', userId: string }) => 
      createTag(vars.name, vars.color, vars.entityType, vars.userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] })
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string, updates: Partial<Tag> }) => 
      updateTag(vars.id, vars.updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] })
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] })
  });
}

export function useAssignTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { tagId: string, entityId: string, entityType: 'deal' | 'track' }) => 
      assignTag(vars.tagId, vars.entityId, vars.entityType),
    onSuccess: (_, vars) => {
      // Invalida a entidade para atualizar a lista de tags exibida
      queryClient.invalidateQueries({ queryKey: [vars.entityType === 'deal' ? 'deals' : 'tracks'] });
    }
  });
}

export function useRemoveTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { tagId: string, entityId: string, entityType: 'deal' | 'track' }) => 
      removeTag(vars.tagId, vars.entityId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [vars.entityType === 'deal' ? 'deals' : 'tracks'] });
    }
  });
}