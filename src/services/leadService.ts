import { supabase } from '@/lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lead, LeadStatus, LeadMember, Contact, LeadPriorityBucket, OperationType } from '@/lib/types'
import { CompanyInput } from '@/services/companyService'
import { syncRemoteEntityName } from './pdGoogleDriveApi'
import { getSetting } from './systemSettingsService'
import type { Database } from '@/lib/databaseTypes'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Query Keys
// ============================================================================

/** Base key for all leads queries */
export const LEADS_KEY = ['leads'] as const

/** Key prefix for sales view leads queries (leadService implementation) */
export const LEADS_SALES_VIEW_KEY = ['leads', 'sales-view'] as const

/** Key prefix for sales view leads queries (leadsSalesViewService implementation) */
export const LEADS_SALES_VIEW_ALT_KEY = ['leads-sales-view'] as const

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
  nextAction?: string[];
}

export interface QualifyLeadInput {
  leadId: string;
  userId: string;
  // If selecting existing company
  companyId?: string;
  // If creating new company
  newCompanyData?: CompanyInput;
}

export interface ChangeLeadOwnerData {
  leadId: string;
  newOwnerId: string;
  addPreviousOwnerAsMember: boolean;
  currentUserId: string;
}

type SupabaseDB = SupabaseClient<Database>;
const supabaseClient = supabase as SupabaseDB;
type LeadRow = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdateRow = Database['public']['Tables']['leads']['Update'];
type LeadContactInsert = Database['public']['Tables']['lead_contacts']['Insert'];
type LeadMemberInsert = Database['public']['Tables']['lead_members']['Insert'];
type QualifyLeadReturn = Database['public']['Functions']['qualify_lead']['Returns'];
type LeadQueryResult = LeadRow & { lead_contacts?: any[]; lead_members?: any[]; owner?: any };

// ============================================================================
// Helpers
// ============================================================================

const VALID_OPERATION_TYPES: OperationType[] = [
  'ccb',
  'cri_land',
  'cri_construction',
  'cri_corporate',
  'debt_construction',
  'receivables_advance',
  'working_capital',
  'built_to_suit',
  'preferred_equity',
  'repurchase',
  'sale_and_lease_back',
  'inventory_purchase',
  'financial_swap',
  'physical_swap',
  'hybrid_swap'
];

const LEAD_MEMBER_ROLES: LeadMember['role'][] = ['owner', 'collaborator', 'watcher'];

const normalizeOperationType = (value: unknown): OperationType | undefined => {
  return typeof value === 'string' && VALID_OPERATION_TYPES.includes(value as OperationType)
    ? (value as OperationType)
    : undefined;
};

const normalizePriorityBucket = (value: unknown): LeadPriorityBucket | undefined => {
  return typeof value === 'string' && ['hot', 'warm', 'cold'].includes(value as LeadPriorityBucket)
    ? (value as LeadPriorityBucket)
    : undefined;
};

const asNumber = (value: unknown): number | undefined => (typeof value === 'number' ? value : undefined);

const mapContactFromLink = (link: any): Contact | null => {
  const contact = link?.contacts ?? link;
  if (!contact?.id || !contact?.name || !contact?.created_at || !contact?.created_by) {
    return null;
  }

  return {
    id: contact.id,
    companyId: contact.company_id ?? contact.companyId ?? null,
    name: contact.name,
    email: contact.email ?? undefined,
    phone: contact.phone ?? undefined,
    role: contact.role ?? undefined,
    department: contact.department ?? undefined,
    linkedin: contact.linkedin ?? undefined,
    notes: contact.notes ?? undefined,
    isPrimary: Boolean(link?.is_primary ?? contact.is_primary ?? link?.isPrimary ?? contact.isPrimary ?? false),
    buyingRole: contact.buying_role ?? contact.buyingRole ?? undefined,
    sentiment: contact.sentiment ?? undefined,
    createdAt: contact.created_at ?? contact.createdAt,
    updatedAt: contact.updated_at ?? contact.updatedAt ?? undefined,
    createdBy: contact.created_by ?? contact.createdBy,
    isSynthetic: contact.is_synthetic ?? contact.isSynthetic ?? undefined
  };
};

const mapMemberFromLink = (lm: any): LeadMember | null => {
  if (!lm?.lead_id || !lm?.user_id || !lm?.added_at) return null;
  const role = LEAD_MEMBER_ROLES.includes(lm.role as LeadMember['role'])
    ? (lm.role as LeadMember['role'])
    : 'collaborator';

  const profile = lm.profiles;

  return {
    leadId: lm.lead_id,
    userId: lm.user_id,
    role,
    addedAt: lm.added_at,
    user: profile
      ? {
          id: profile.id,
          name: profile.name ?? 'Usuário',
          email: profile.email ?? '',
          avatar: profile.avatar_url ?? undefined
        }
      : undefined
  };
};

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
    operationType: normalizeOperationType(item.operation_type),
    ownerUserId: item.owner_user_id,
    owner: item.owner,

    qualifiedAt: item.qualified_at,
    qualifiedCompanyId: item.qualified_company_id,
    qualifiedMasterDealId: item.qualified_master_deal_id,

    createdAt: item.created_at,
    updatedAt: item.updated_at,
    createdBy: item.created_by,

    contacts:
      item.lead_contacts
        ?.map(mapContactFromLink)
        .filter((contact): contact is Contact => Boolean(contact)) || [],

    members:
      item.lead_members
        ?.map(mapMemberFromLink)
        .filter((member): member is LeadMember => Boolean(member)) || [],

    priorityBucket: normalizePriorityBucket(item.priority_bucket ?? item.priorityBucket),
    priorityScore: asNumber(item.priority_score ?? item.priorityScore),
    priorityDescription: item.priority_description || item.priorityDescription,
    lastInteractionAt: item.last_interaction_at || item.lastInteractionAt,
    daysWithoutInteraction: asNumber(item.days_without_interaction ?? item.daysWithoutInteraction),
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
    operationType: normalizeOperationType(item.operation_type ?? item.operationType),
    ownerUserId: item.owner_user_id || item.ownerUserId,

    qualifiedAt: item.qualified_at || item.qualifiedAt,
    qualifiedCompanyId: item.qualified_company_id || item.qualifiedCompanyId,
    qualifiedMasterDealId: item.qualified_master_deal_id || item.qualifiedMasterDealId,

    createdAt: item.created_at || item.createdAt,
    updatedAt: item.updated_at || item.updatedAt,
    createdBy: item.created_by || item.createdBy,

    contacts:
      contacts
        ?.map(mapContactFromLink)
        .filter((contact): contact is Contact => Boolean(contact)) || [],
    members:
      item.lead_members
        ?.map(mapMemberFromLink)
        .filter((member): member is LeadMember => Boolean(member)) || [],
    isSynthetic: item.is_synthetic || item.isSynthetic,

    priorityBucket: normalizePriorityBucket(item.priority_bucket ?? item.priorityBucket),
    priorityScore: asNumber(item.priority_score ?? item.priorityScore),
    priorityDescription: item.priority_description || item.priorityDescription,
    lastInteractionAt: item.last_interaction_at || item.lastInteractionAt,
    daysWithoutInteraction: asNumber(item.days_without_interaction ?? item.daysWithoutInteraction),
    nextAction: item.next_action || item.nextAction,
    // Keep owner mapping when returned by API
    owner: item.owner
  };
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// Cache qualified status ID to avoid repeated lookups
let qualifiedStatusIdCache: string | null = null;
let qualifiedStatusIdLoaded = false;
let qualifiedStatusIdPromise: Promise<string | null> | null = null;

async function getQualifiedStatusId(): Promise<string | null> {
  if (qualifiedStatusIdLoaded) {
    return qualifiedStatusIdCache;
  }

  if (!qualifiedStatusIdPromise) {
    qualifiedStatusIdPromise = (async () => {
      const { data, error } = await supabaseClient
        .from('lead_statuses')
        .select('id')
        .eq('code', 'qualified')
        .maybeSingle();

      if (error) {
        throw error;
      }

      const qualifiedStatusId = data?.id;
      if (qualifiedStatusId && !UUID_REGEX.test(qualifiedStatusId)) {
        console.warn('[LeadService] Invalid qualified status id format returned from lead_statuses', { qualifiedStatusId });
        qualifiedStatusIdCache = null;
      } else {
        qualifiedStatusIdCache = qualifiedStatusId ?? null;
      }
      qualifiedStatusIdLoaded = true;
      return qualifiedStatusIdCache;
    })().finally(() => {
      qualifiedStatusIdPromise = null;
    });
  }

  return qualifiedStatusIdPromise;
}

// ============================================================================
// API Functions
// ============================================================================

export async function getLeads(filters?: LeadFilters, options?: { includeQualified?: boolean }): Promise<Lead[]> {
  const includeQualified = options?.includeQualified ?? false;
  let query = supabaseClient
    .from('leads')
    .select(`
      *,
      lead_contacts(is_primary, contacts(*)),
      lead_members(role, added_at, user_id, profiles!lead_members_user_id_fkey(id, name, email, avatar_url)),
      owner:profiles!leads_owner_user_id_fkey(id, name, email, avatar_url)
    `)
    .is('deleted_at', null);

  if (!includeQualified) {
    const qualifiedStatusId = await getQualifiedStatusId();

    if (qualifiedStatusId) {
      const qualifiedStatusFilter = `lead_status_id.is.null,lead_status_id.neq.${qualifiedStatusId}`;
      query = query.or(qualifiedStatusFilter).is('qualified_at', null);
    } else {
      // Fallback for environments without a configured "qualified" status: still hide leads with a qualified timestamp
      query = query.is('qualified_at', null);
    }
  }

  if (filters) {
    // Handle tag filtering first (if provided)
    if (filters.tags && filters.tags.length > 0) {
      const { data: matchingIds, error: matchError } = await supabaseClient
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
  const leads = (data as LeadQueryResult[] | null) ?? [];
  return leads.map(mapLeadFromDB);
}

export async function getLead(id: string): Promise<Lead> {
  const { data, error } = await supabaseClient
    .from('leads')
    .select(`
      *,
      lead_contacts(is_primary, contacts(*)),
      lead_members(role, added_at, user_id, profiles!lead_members_user_id_fkey(id, name, email, avatar_url)),
      owner:profiles!leads_owner_user_id_fkey(id, name, email, avatar_url)
    `)
    .eq('id', id)
    .single<LeadQueryResult>();

  if (error) throw error;
  return mapLeadFromDB(data);
}

export async function getSalesViewLeads(filters?: SalesViewFilters, options?: { includeQualified?: boolean }): Promise<Lead[]> {
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

  if (filters?.nextAction && filters.nextAction.length > 0) {
    params.set('next_action', filters.nextAction.join(','));
  }

  // Pass includeQualified to backend - it is now responsible for filtering
  if (options?.includeQualified) {
    params.set('includeQualified', 'true');
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

  const leadPayload: LeadInsert = {
    legal_name: lead.legalName,
    trade_name: lead.tradeName ?? null,
    cnpj: lead.cnpj ?? null,
    website: lead.website ?? null,
    segment: lead.segment ?? null,
    address_city: lead.addressCity ?? null,
    address_state: lead.addressState ?? null,
    description: lead.description ?? null,
    lead_origin_id: leadOriginId ?? null,
    operation_type: lead.operationType ?? null,
    owner_user_id: lead.ownerUserId || userId, // Default owner is creator
    created_by: userId
  };

  const { data, error } = await supabaseClient
    .from('leads')
    .insert(leadPayload)
    .select()
    .single<LeadRow>();

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
  const updateData: LeadUpdateRow & { updated_at: string } = { updated_at: new Date().toISOString() };

  if (updates.legalName !== undefined) updateData.legal_name = updates.legalName;
  if (updates.tradeName !== undefined) updateData.trade_name = updates.tradeName ?? null;
  if (updates.cnpj !== undefined) updateData.cnpj = updates.cnpj ?? null;
  if (updates.website !== undefined) updateData.website = updates.website ?? null;
  if (updates.segment !== undefined) updateData.segment = updates.segment ?? null;
  if (updates.addressCity !== undefined) updateData.address_city = updates.addressCity ?? null;
  if (updates.addressState !== undefined) updateData.address_state = updates.addressState ?? null;
  if (updates.description !== undefined) updateData.description = updates.description ?? null;
  if (updates.leadStatusId !== undefined) updateData.lead_status_id = updates.leadStatusId ?? null;
  if (updates.leadOriginId !== undefined) updateData.lead_origin_id = updates.leadOriginId ?? null;
  if (updates.operationType !== undefined) updateData.operation_type = updates.operationType ?? null;
  if (updates.ownerUserId !== undefined) updateData.owner_user_id = updates.ownerUserId ?? null;

  const { data, error } = await supabaseClient.from('leads').update(updateData).eq('id', id).select().single<LeadRow>();
  if (error) throw error;

  // --- GOOGLE DRIVE SYNC START ---
  if (updates.legalName) {
    syncRemoteEntityName('lead', id);
  }
  // --- GOOGLE DRIVE SYNC END ---

  return mapLeadFromDB(data);
}

export async function deleteLead(id: string) {
  const { error } = await supabaseClient.from('leads').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// --- Links ---

export async function addLeadContact(leadId: string, contactId: string, isPrimary: boolean = false) {
  // If setting primary, unset others first?
  if (isPrimary) {
    await supabaseClient.from('lead_contacts').update({ is_primary: false }).eq('lead_id', leadId);
  }
  const leadContactPayload: LeadContactInsert = { lead_id: leadId, contact_id: contactId, is_primary: isPrimary };
  const { error } = await supabaseClient.from('lead_contacts').insert(leadContactPayload);
  if (error) throw error;
}

export async function removeLeadContact(leadId: string, contactId: string) {
  const { error } = await supabaseClient.from('lead_contacts').delete().match({ lead_id: leadId, contact_id: contactId });
  if (error) throw error;
}

export async function addLeadMember(member: { leadId: string, userId: string, role?: string }) {
  // Get default role from system settings if not provided
  let memberRole = member.role;
  if (!memberRole) {
    const defaultRoleSetting = await getSetting('default_lead_member_role_code');
    memberRole = defaultRoleSetting?.value || 'collaborator'; // Fallback to 'collaborator' if no setting
  }

  const memberPayload: LeadMemberInsert = {
    lead_id: member.leadId,
    user_id: member.userId,
    role: memberRole
  };

  const { error } = await supabaseClient.from('lead_members').insert(memberPayload);
  if (error) {
    // Ignore duplicate key error?
    if (error.code !== '23505') throw error;
  }
}

export async function removeLeadMember(leadId: string, userId: string) {
  const { error } = await supabaseClient.from('lead_members').delete().match({ lead_id: leadId, user_id: userId });
  if (error) throw error;
}

// --- Qualification ---

export interface QualifyLeadResult {
  master_deal_id: string;
  company_id: string;
}

export async function qualifyLead(input: QualifyLeadInput): Promise<QualifyLeadResult> {
  const { data, error } = await supabaseClient.rpc('qualify_lead', {
    p_lead_id: input.leadId,
    p_company_id: input.companyId,
    p_new_company_data: input.newCompanyData,
    p_user_id: input.userId
  });

  if (error) throw error;
  return (data as QualifyLeadReturn) as QualifyLeadResult;
}

export async function changeLeadOwner(data: ChangeLeadOwnerData): Promise<void> {
  const response = await fetch(`/api/leads/${data.leadId}/change-owner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      newOwnerId: data.newOwnerId,
      addPreviousOwnerAsMember: data.addPreviousOwnerAsMember,
      currentUserId: data.currentUserId
    })
  });

  if (!response.ok) {
    throw new Error(`Falha ao alterar responsável do lead (status: ${response.status})`);
  }
}

// ============================================================================
// Hooks
// ============================================================================

export function useLeads(filters?: LeadFilters, options?: { includeQualified?: boolean }) {
  return useQuery({
    queryKey: ['leads', filters, options?.includeQualified],
    queryFn: () => getLeads(filters, { includeQualified: options?.includeQualified })
  });
}

export function useSalesViewLeads(filters?: SalesViewFilters, options?: { enabled?: boolean; includeQualified?: boolean }) {
  return useQuery({
    queryKey: ['leads', 'sales-view', filters, options?.includeQualified],
    queryFn: async () => {
      // Backend is now the source of truth for filtering qualified/deleted leads
      // The includeQualified param is passed to the backend via query string
      const leads = await getSalesViewLeads(filters, { includeQualified: options?.includeQualified });
      return leads;
    },
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
      queryClient.invalidateQueries({ queryKey: LEADS_KEY });
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_KEY });
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_ALT_KEY });
    }
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: LeadUpdate }) => updateLead(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: LEADS_KEY });
      queryClient.invalidateQueries({ queryKey: [...LEADS_KEY, data.id] });
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_KEY });
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_ALT_KEY });
    }
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_KEY });
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_KEY });
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_ALT_KEY });
    }
  });
}

export function useQualifyLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: qualifyLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_KEY });
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_KEY });
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_ALT_KEY });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...LEADS_KEY, leadId] })
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_KEY })
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_ALT_KEY })
    }
  });

  const removeMutation = useMutation({
    mutationFn: (contactId: string) => removeLeadContact(leadId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...LEADS_KEY, leadId] })
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_KEY })
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_ALT_KEY })
    }
  });

  return { addContact: addMutation.mutateAsync, removeContact: removeMutation.mutateAsync };
}

export function useChangeLeadOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changeLeadOwner,
    onSuccess: (_, variables) => {
      // Invalidate all leads queries
      queryClient.invalidateQueries({ queryKey: LEADS_KEY });
      // Invalidate sales view queries (both implementations)
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_KEY });
      queryClient.invalidateQueries({ queryKey: LEADS_SALES_VIEW_ALT_KEY });
      // Invalidate specific lead detail query to update owner badge immediately
      queryClient.invalidateQueries({ queryKey: [...LEADS_KEY, variables.leadId] });
    },
    onError: (error, variables) => {
      console.error('[useChangeLeadOwner] Failed to change owner', {
        leadId: variables.leadId,
        newOwnerId: variables.newOwnerId,
        error
      });
    }
  });
}
