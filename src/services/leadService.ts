import { supabase } from '@/lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lead, LeadStatus, LeadMember, Contact, CompanyInput, LeadPriorityBucket } from '@/lib/types'
import { syncRemoteEntityName } from './pdGoogleDriveApi'
import { getSetting } from './systemSettingsService'

// ============================================================================
// Types
// ============================================================================

interface EntityTagRow {
  entity_id: string;
}

export interface LeadInput {
  legalName: string;
  tradeName?: string;
  cnpj?: string;
  website?: string;
  segment?: string;
  addressCity?: string;
  addressState?: string;
  description?: string;
  leadOriginId?: string;
  operationType?: string;
  ownerUserId?: string;
}

export interface LeadUpdate extends Partial<LeadInput> {
  leadStatusId?: string;
}

export interface LeadFilters {
  status?: string[];
  origin?: string[];
  responsibleId?: string;
  search?: string;
  tags?: string[];
}

export interface SalesViewFilters {
  owner?: 'me' | 'all';
  ownerIds?: string[];
  priority?: LeadPriorityBucket[];
  status?: string[];
  origin?: string[];
  daysWithoutInteraction?: number;
  orderBy?: 'priority' | 'last_interaction' | 'created_at' | 'status' | 'next_action' | 'owner';
  search?: string;
  tags?: string[];
}

export interface QualifyLeadInput {
  leadId: string;
  userId: string;
  // If selecting existing company
  companyId?: string;
  // If creating new company
  newCompanyData?: CompanyInput;
}

// ============================================================================
// Helpers
// ============================================================================

function mapLeadFromDB(item: any): Lead {
  return {
    id: item.id,
    legalName: item.legal_name,
    tradeName: item.trade_name,
    cnpj: item.cnpj,
    website: item.website,
    segment: item.segment,
    addressCity: item.address_city,
    addressState: item.address_state,
    description: item.description,
    leadStatusId: item.lead_status_id,
    leadOriginId: item.lead_origin_id,
    operationType: item.operation_type,
    ownerUserId: item.owner_user_id,
    owner: item.owner,

    qualifiedAt: item.qualified_at,
    qualifiedCompanyId: item.qualified_company_id,
    qualifiedMasterDealId: item.qualified_master_deal_id,

    createdAt: item.created_at,
    updatedAt: item.updated_at,
    createdBy: item.created_by,

    // Mapped via joins
    contacts: item.lead_contacts?.map((lc: any) => ({
      ...lc.contacts, // spread generic contact fields
      isPrimary: lc.is_primary, // override with link-specific
      // Rename snake to camel
      companyId: lc.contacts.company_id,
      createdAt: lc.contacts.created_at,
      createdBy: lc.contacts.created_by
    })) || [],

    members: item.lead_members?.map((lm: any) => ({
      leadId: lm.lead_id,
      userId: lm.user_id,
      role: lm.role,
      addedAt: lm.added_at,
      user: lm.profiles ? {
        id: lm.profiles.id,
        name: lm.profiles.name,
        email: lm.profiles.email,
        avatar: lm.profiles.avatar_url
      } : undefined
    })) || [],

    priorityBucket: item.priority_bucket || item.priorityBucket,
    priorityScore: item.priority_score || item.priorityScore,
    priorityDescription: item.priority_description || item.priorityDescription,
    lastInteractionAt: item.last_interaction_at || item.lastInteractionAt,
    daysWithoutInteraction: item.days_without_interaction || item.daysWithoutInteraction,
    nextAction: item.next_action || item.nextAction
  };
}

function mapLeadFromSalesView(item: any): Lead {
  const contacts = item.contacts || item.lead_contacts;

  return {
    id: item.id,
    legalName: item.legal_name || item.legalName,
    tradeName: item.trade_name || item.tradeName,
    cnpj: item.cnpj,
    website: item.website,
    segment: item.segment,
    addressCity: item.address_city || item.addressCity,
    addressState: item.address_state || item.addressState,
    description: item.description,
    leadStatusId: item.lead_status_id || item.leadStatusId || item.status,
    leadOriginId: item.lead_origin_id || item.leadOriginId || item.origin,
    operationType: item.operation_type || item.operationType,
    ownerUserId: item.owner_user_id || item.ownerUserId,

    qualifiedAt: item.qualified_at || item.qualifiedAt,
    qualifiedCompanyId: item.qualified_company_id || item.qualifiedCompanyId,
    qualifiedMasterDealId: item.qualified_master_deal_id || item.qualifiedMasterDealId,

    createdAt: item.created_at || item.createdAt,
    updatedAt: item.updated_at || item.updatedAt,
    createdBy: item.created_by || item.createdBy,

    contacts: contacts?.map((lc: any) => ({
      ...lc.contacts ? lc.contacts : lc,
      isPrimary: lc.is_primary ?? lc.isPrimary,
      companyId: lc.contacts?.company_id || lc.contacts?.companyId || lc.company_id || lc.companyId,
      createdAt: lc.contacts?.created_at || lc.contacts?.createdAt,
      createdBy: lc.contacts?.created_by || lc.contacts?.createdBy
    })) || [],
    members: item.lead_members?.map((lm: any) => ({
      leadId: lm.lead_id,
      userId: lm.user_id,
      role: lm.role,
      addedAt: lm.added_at,
      user: lm.profiles ? {
        id: lm.profiles.id,
        name: lm.profiles.name,
        email: lm.profiles.email,
        avatar: lm.profiles.avatar_url
      } : undefined
    })) || [],
    isSynthetic: item.is_synthetic || item.isSynthetic,

    priorityBucket: item.priority_bucket || item.priorityBucket,
    priorityScore: item.priority_score || item.priorityScore,
    priorityDescription: item.priority_description || item.priorityDescription,
    lastInteractionAt: item.last_interaction_at || item.lastInteractionAt,
    daysWithoutInteraction: item.days_without_interaction || item.daysWithoutInteraction,
    nextAction: item.next_action || item.nextAction,
    // Keep owner mapping when returned by API
    owner: item.owner
  };
}

// ============================================================================
// API Functions
// ============================================================================

export async function getLeads(filters?: LeadFilters): Promise<Lead[]> {
  let query = supabase
    .from('leads')
    .select(`
      *,
      lead_contacts(is_primary, contacts(*)),
      lead_members(role, added_at, user_id, profiles!lead_members_user_id_fkey(id, name, email, avatar_url)),
      owner:profiles!leads_owner_user_id_fkey(id, name, email, avatar_url)
    `)
    .is('deleted_at', null);

  if (filters) {
    // Handle tag filtering first (if provided)
    if (filters.tags && filters.tags.length > 0) {
      const { data: matchingIds, error: matchError } = await supabase
        .from('entity_tags')
        .select('entity_id')
        .eq('entity_type', 'lead')
        .in('tag_id', filters.tags);

      if (matchError) throw matchError;

      const ids = (matchingIds as EntityTagRow[])?.map((r) => r.entity_id) || [];
      if (ids.length > 0) {
        query = query.in('id', ids);
      } else {
        return []; // No leads match the tag filter
      }
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('lead_status_id', filters.status);
    }
    if (filters.origin && filters.origin.length > 0) {
      query = query.in('lead_origin_id', filters.origin);
    }
    if (filters.responsibleId) {
      query = query.eq('owner_user_id', filters.responsibleId);
    }
    if (filters.search) {
      // NOTE: Supabase OR with related tables or multiple fields is complex.
      // Basic search on name/cnpj:
      query = query.or(`legal_name.ilike.%${filters.search}%,cnpj.ilike.%${filters.search}%`);
    }
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapLeadFromDB);
}

export async function getLead(id: string): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      lead_contacts(is_primary, contacts(*)),
      lead_members(role, added_at, user_id, profiles!lead_members_user_id_fkey(id, name, email, avatar_url))
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapLeadFromDB(data);
}

export async function getSalesViewLeads(filters?: SalesViewFilters): Promise<Lead[]> {
  const params = new URLSearchParams();

  if (filters?.owner === 'me') {
    params.set('owner', 'me');
  }

  if (filters?.ownerIds && filters.ownerIds.length > 0) {
    params.set('owners', filters.ownerIds.join(','));
  }

  if (filters?.priority && filters.priority.length > 0) {
    params.set('priority', filters.priority.join(','));
  }

  if (filters?.status && filters.status.length > 0) {
    params.set('status', filters.status.join(','));
  }

  if (filters?.origin && filters.origin.length > 0) {
    params.set('origin', filters.origin.join(','));
  }

  if (filters?.daysWithoutInteraction) {
    params.set('days_without_interaction', String(filters.daysWithoutInteraction));
  }

  if (filters?.orderBy) {
    params.set('order_by', filters.orderBy);
  }

  const query = params.toString();
  const response = await fetch(`/api/leads/sales-view${query ? `?${query}` : ''}`);

  if (!response.ok) {
    console.error('[SalesViewLeads] API request failed', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });
    throw new Error('Falha ao carregar leads da Sales View');
  }

  // Validate content-type before parsing JSON
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    console.error('[SalesViewLeads] Expected JSON but received unexpected content-type', {
      contentType,
      url: response.url
    });
    throw new Error(
      `sales-view expected JSON but received: ${contentType ?? 'unknown'}`
    );
  }

  const data = await response.json();
  return (data as any[]).map(mapLeadFromSalesView);
}

export async function createLead(lead: LeadInput, userId: string): Promise<Lead> {
  // Get default origin from system settings if not provided
  let leadOriginId = lead.leadOriginId;
  // TODO: Fix fallback to use ID instead of code, or rely on UI to provide valid ID
  // if (!leadOriginId) {
  //   const defaultOriginSetting = await getSetting('default_lead_origin_code');
  //   leadOriginId = defaultOriginSetting?.value || 'outbound';
  // }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      legal_name: lead.legalName,
      trade_name: lead.tradeName,
      cnpj: lead.cnpj,
      website: lead.website,
      segment: lead.segment,
      address_city: lead.addressCity,
      address_state: lead.addressState,
      description: lead.description,
      lead_origin_id: leadOriginId,
      operation_type: lead.operationType,
      owner_user_id: lead.ownerUserId || userId, // Default owner is creator
      created_by: userId
    })
    .select()
    .single();

  if (error) throw error;

  // Get default lead member role from system settings
  const defaultRoleSetting = await getSetting('default_lead_member_role_code');
  const defaultRole = defaultRoleSetting?.value || 'owner'; // Fallback to 'owner' if no setting

  // Also add creator as owner member
  await addLeadMember({
    leadId: data.id,
    userId: lead.ownerUserId || userId,
    role: defaultRole
  });

  return mapLeadFromDB(data);
}

export async function updateLead(id: string, updates: LeadUpdate) {
  const updateData: any = { updated_at: new Date().toISOString() };

  if (updates.legalName !== undefined) updateData.legal_name = updates.legalName;
  if (updates.tradeName !== undefined) updateData.trade_name = updates.tradeName;
  if (updates.cnpj !== undefined) updateData.cnpj = updates.cnpj;
  if (updates.website !== undefined) updateData.website = updates.website;
  if (updates.segment !== undefined) updateData.segment = updates.segment;
  if (updates.addressCity !== undefined) updateData.address_city = updates.addressCity;
  if (updates.addressState !== undefined) updateData.address_state = updates.addressState;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.leadStatusId !== undefined) updateData.lead_status_id = updates.leadStatusId;
  if (updates.leadOriginId !== undefined) updateData.lead_origin_id = updates.leadOriginId;
  if (updates.operationType !== undefined) updateData.operation_type = updates.operationType;
  if (updates.ownerUserId !== undefined) updateData.owner_user_id = updates.ownerUserId;

  const { data, error } = await supabase.from('leads').update(updateData).eq('id', id).select().single();
  if (error) throw error;

  // --- GOOGLE DRIVE SYNC START ---
  if (updates.legalName) {
    syncRemoteEntityName('lead', id);
  }
  // --- GOOGLE DRIVE SYNC END ---

  return mapLeadFromDB(data);
}

export async function deleteLead(id: string) {
  const { error } = await supabase.from('leads').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// --- Links ---

export async function addLeadContact(leadId: string, contactId: string, isPrimary: boolean = false) {
  // If setting primary, unset others first?
  if (isPrimary) {
    await supabase.from('lead_contacts').update({ is_primary: false }).eq('lead_id', leadId);
  }
  const { error } = await supabase.from('lead_contacts').insert({ lead_id: leadId, contact_id: contactId, is_primary: isPrimary });
  if (error) throw error;
}

export async function removeLeadContact(leadId: string, contactId: string) {
  const { error } = await supabase.from('lead_contacts').delete().match({ lead_id: leadId, contact_id: contactId });
  if (error) throw error;
}

export async function addLeadMember(member: { leadId: string, userId: string, role?: string }) {
  // Get default role from system settings if not provided
  let memberRole = member.role;
  if (!memberRole) {
    const defaultRoleSetting = await getSetting('default_lead_member_role_code');
    memberRole = defaultRoleSetting?.value || 'collaborator'; // Fallback to 'collaborator' if no setting
  }

  const { error } = await supabase.from('lead_members').insert({
    lead_id: member.leadId,
    user_id: member.userId,
    role: memberRole
  });
  if (error) {
    // Ignore duplicate key error?
    if (error.code !== '23505') throw error;
  }
}

export async function removeLeadMember(leadId: string, userId: string) {
  const { error } = await supabase.from('lead_members').delete().match({ lead_id: leadId, user_id: userId });
  if (error) throw error;
}

// --- Qualification ---

export async function qualifyLead(input: QualifyLeadInput) {
  const { data, error } = await supabase.rpc('qualify_lead', {
    p_lead_id: input.leadId,
    p_company_id: input.companyId,
    p_new_company_data: input.newCompanyData,
    p_user_id: input.userId
  });

  if (error) throw error;
  return data;
}

// ============================================================================
// Hooks
// ============================================================================

export function useLeads(filters?: LeadFilters, options?: { includeQualified?: boolean }) {
  return useQuery({
    queryKey: ['leads', filters, options?.includeQualified],
    queryFn: async () => {
      const leads = await getLeads(filters);
      // Filter out qualified leads by default (soft delete behavior for qualified status)
      if (!options?.includeQualified) {
        return leads.filter(lead => {
          // Check if lead has qualified status by checking qualifiedAt timestamp
          return !lead.qualifiedAt;
        });
      }
      return leads;
    }
  });
}

export function useSalesViewLeads(filters?: SalesViewFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['leads', 'sales-view', filters],
    queryFn: () => getSalesViewLeads(filters),
    enabled: options?.enabled ?? true
  });
}

export function useLead(id: string) {
  return useQuery({ queryKey: ['leads', id], queryFn: () => getLead(id), enabled: !!id });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, userId }: { data: LeadInput, userId: string }) => createLead(data, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-sales-view'] });
    }
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: LeadUpdate }) => updateLead(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', data.id] });
      queryClient.invalidateQueries({ queryKey: ['leads-sales-view'] });
    }
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-sales-view'] });
    }
  });
}

export function useQualifyLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: qualifyLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-sales-view'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    }
  });
}

export function useLeadContacts(leadId: string) {
  // Usually implicitly fetched with lead, but helper methods for mutations exist
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (vars: { contactId: string, isPrimary?: boolean }) => addLeadContact(leadId, vars.contactId, vars.isPrimary),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads', leadId] })
  });

  const removeMutation = useMutation({
    mutationFn: (contactId: string) => removeLeadContact(leadId, contactId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads', leadId] })
  });

  return { addContact: addMutation.mutateAsync, removeContact: removeMutation.mutateAsync };
}