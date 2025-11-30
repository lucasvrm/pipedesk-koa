import { supabase } from '@/lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lead, LeadStatus, LeadMember, Contact, CompanyInput } from '@/lib/types'

// ============================================================================
// Types
// ============================================================================

export interface LeadInput {
  legalName: string;
  tradeName?: string;
  cnpj?: string;
  website?: string;
  segment?: string;
  addressCity?: string;
  addressState?: string;
  description?: string;
  origin?: string;
  ownerUserId?: string;
}

export interface LeadUpdate extends Partial<LeadInput> {
  status?: LeadStatus;
}

export interface LeadFilters {
  status?: string[];
  origin?: string[];
  responsibleId?: string;
  search?: string;
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
    status: item.status,
    origin: item.origin,
    ownerUserId: item.owner_user_id,

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
    })) || []
  };
}

// ============================================================================
// API Functions
// ============================================================================

export async function getLeads(filters?: LeadFilters): Promise<Lead[]> {
  let query = supabase
export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      lead_contacts(is_primary, contacts(*)),
      lead_members(role, added_at, user_id, profiles!lead_members_user_id_fkey(id, name, email, avatar_url))
    `)
    .is('deleted_at', null);

  if (filters) {
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    if (filters.origin && filters.origin.length > 0) {
      query = query.in('origin', filters.origin);
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
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

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

export async function createLead(lead: LeadInput, userId: string): Promise<Lead> {
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
      origin: lead.origin || 'outbound',
      owner_user_id: lead.ownerUserId || userId, // Default owner is creator
      created_by: userId
    })
    .select()
    .single();

  if (error) throw error;

  // Also add creator as owner member
  await addLeadMember({
    leadId: data.id,
    userId: lead.ownerUserId || userId,
    role: 'owner'
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
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.origin !== undefined) updateData.origin = updates.origin;
  if (updates.ownerUserId !== undefined) updateData.owner_user_id = updates.ownerUserId;

  const { data, error } = await supabase.from('leads').update(updateData).eq('id', id).select().single();
  if (error) throw error;
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
  const { error } = await supabase.from('lead_members').insert({
    lead_id: member.leadId,
    user_id: member.userId,
    role: member.role || 'collaborator'
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

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => getLeads(filters)
  });
export function useLeads() {
  return useQuery({ queryKey: ['leads'], queryFn: getLeads });
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
    }
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  });
}

export function useQualifyLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: qualifyLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
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
