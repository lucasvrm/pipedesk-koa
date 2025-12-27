import { supabase } from '@/lib/supabaseClient';
import { Tag } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSetting } from './systemSettingsService';
import { LEADS_KEY, LEADS_SALES_VIEW_KEY, LEADS_SALES_VIEW_ALT_KEY } from './leadService';

// Cores profissionais para tags
export const TAG_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#64748b', // Slate
];

type TagEntityType = 'deal' | 'track' | 'lead';

// Helper to check feature flag
async function checkFeatureEnabled(module: 'deals' | 'tracks' | 'leads' | 'global') {
  const config = await getSetting('tags_config');
  if (!config) return true;

  if (!config.global) return false;
  if (module === 'global') return true;
  return config.modules?.[module] !== false;
}

// --- API Functions ---

export async function getTags(entityType?: 'deal' | 'track' | 'lead' | 'global'): Promise<Tag[]> {
  let query = supabase.from('tags').select('*').order('name');

  if (entityType) {
    // Se solicitou 'global', traz só global (que agora é null)
    if (entityType === 'global') {
      query = query.is('entity_type', null);
    } else {
      // Se solicitou um tipo específico, traz esse tipo E globais (null)
      // Usamos .or() para combinar as condições
      query = query.or(`entity_type.eq.${entityType},entity_type.is.null`);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as Tag[];
}

export async function createTag(tag: Omit<Tag, 'id' | 'createdAt' | 'createdBy'>) {
  const enabled = await checkFeatureEnabled('global');
  if (!enabled) throw new Error('FEATURE_DISABLED');

  const { data: userData } = await supabase.auth.getUser();

  const payload: any = {
    name: tag.name,
    color: tag.color,
    created_by: userData.user?.id,
    entity_type: tag.entity_type === 'global' ? null : (tag.entity_type || null)
  };

  const { data, error } = await supabase
    .from('tags')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Tag;
}

export async function updateTag(id: string, updates: Partial<Tag>) {
  const enabled = await checkFeatureEnabled('global');
  if (!enabled) throw new Error('FEATURE_DISABLED');

  const updatePayload = { ...updates } as any;

  // Ensure entity_type is passed if present, otherwise it might remain unchanged
  if (updates.entity_type) {
    updatePayload.entity_type = updates.entity_type === 'global' ? null : updates.entity_type;
  }

  const { data, error } = await supabase
    .from('tags')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Tag;
}

export async function deleteTag(id: string) {
  const enabled = await checkFeatureEnabled('global');
  if (!enabled) throw new Error('FEATURE_DISABLED');

  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw error;
}

// Associa Tag a Entidade
export async function assignTagToEntity(tagId: string, entityId: string, entityType: TagEntityType) {
  const moduleName = entityType === 'deal' ? 'deals' : entityType === 'track' ? 'tracks' : 'leads';
  const enabled = await checkFeatureEnabled(moduleName);
  if (!enabled) throw new Error('FEATURE_DISABLED');

  // Use maybeSingle() instead of single() to avoid 406 error when no record exists
  const { data: existing } = await supabase
    .from('entity_tags')
    .select('*')
    .match({ tag_id: tagId, entity_id: entityId, entity_type: entityType })
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('entity_tags')
    .insert({ tag_id: tagId, entity_id: entityId, entity_type: entityType })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Desassocia Tag
export async function removeTagFromEntity(tagId: string, entityId: string, entityType: TagEntityType) {
  const moduleName = entityType === 'deal' ? 'deals' : entityType === 'track' ? 'tracks' : 'leads';
  const enabled = await checkFeatureEnabled(moduleName);
  if (!enabled) throw new Error('FEATURE_DISABLED');

  const { error } = await supabase
    .from('entity_tags')
    .delete()
    .match({ tag_id: tagId, entity_id: entityId, entity_type: entityType });

  if (error) throw error;
}

// Buscar tags de uma entidade específica
export async function getEntityTags(entityId: string, entityType?: TagEntityType): Promise<Tag[]> {
  let query = supabase
    .from('entity_tags')
    .select(`
      tag_id,
      entity_type,
      tags:tags(*)
    `)
    .eq('entity_id', entityId);

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map((item: any) => item.tags) as Tag[];
}


// --- Hooks React Query ---

export function useTags(entityType?: 'deal' | 'track' | 'lead' | 'global') {
  return useQuery({
    queryKey: ['tags', entityType],
    queryFn: () => getTags(entityType),
    staleTime: 1000 * 60 * 5 // 5 minutos
  });
}

export function useEntityTags(entityId: string, entityType: TagEntityType) {
  return useQuery({
    queryKey: ['tags', 'entity', entityType, entityId],
    queryFn: () => getEntityTags(entityId, entityType),
    enabled: !!entityId
  });
}

export function useTagOperations() {
  const queryClient = useQueryClient();

  // Invalida cache inteligente
  const invalidate = (entityType?: TagEntityType | 'global', entityId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['tags'] }); // Atualiza lista de tags
    if (entityType === 'deal') {
      queryClient.invalidateQueries({ queryKey: ['deals'] }); // Atualiza lista de deals
      if (entityId) {
        queryClient.invalidateQueries({ queryKey: ['deals', entityId] }); // Atualiza detalhe
        queryClient.invalidateQueries({ queryKey: ['tags', 'entity', 'deal', entityId] });
      }
    } else if (entityType === 'track') {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      if (entityId) {
        queryClient.invalidateQueries({ queryKey: ['tracks', 'detail', entityId] });
        queryClient.invalidateQueries({ queryKey: ['tags', 'entity', 'track', entityId] });
      }
    } else if (entityType === 'lead') {
      queryClient.invalidateQueries({ queryKey: LEADS_KEY });
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_KEY });
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_ALT_KEY });
      if (entityId) {
        queryClient.invalidateQueries({ queryKey: [...LEADS_KEY, entityId] });
        queryClient.invalidateQueries({ queryKey: ['tags', 'entity', 'lead', entityId] });
      }
    }
  };

  const create = useMutation({
    mutationFn: createTag,
    onSuccess: (_, vars) => invalidate(vars.entity_type)
  });

  const update = useMutation({
    mutationFn: ({ id, ...rest }: Partial<Tag> & { id: string }) => updateTag(id, rest),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] })
  });

  const remove = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] })
  });

  const assign = useMutation({
    mutationFn: (vars: { tagId: string, entityId: string, entityType: TagEntityType }) =>
      assignTagToEntity(vars.tagId, vars.entityId, vars.entityType),
    onSuccess: (_, vars) => invalidate(vars.entityType, vars.entityId)
  });

  const unassign = useMutation({
    mutationFn: (vars: { tagId: string, entityId: string, entityType: TagEntityType }) =>
      removeTagFromEntity(vars.tagId, vars.entityId, vars.entityType),
    onSuccess: (_, vars) => invalidate(vars.entityType, vars.entityId)
  });

  return { create, update, remove, assign, unassign };
}

export function useAssignTag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      entityId, 
      entityType, 
      tagId 
    }: { 
      entityId: string
      entityType: string
      tagId: string 
    }) => {
      const { error } = await supabase
        .from('entity_tags')
        .insert({ 
          entity_id: entityId, 
          entity_type: entityType, 
          tag_id: tagId 
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })
}

export function useUnassignTag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      entityId, 
      entityType, 
      tagId 
    }: { 
      entityId: string
      entityType: string
      tagId: string 
    }) => {
      const { error } = await supabase
        .from('entity_tags')
        .delete()
        .match({ 
          entity_id: entityId, 
          entity_type: entityType, 
          tag_id: tagId 
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })
}
