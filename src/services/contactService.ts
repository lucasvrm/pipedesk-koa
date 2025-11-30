import { supabase } from '@/lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Contact } from '@/lib/types'

// ============================================================================
// Types
// ============================================================================

export interface ContactInput {
  companyId?: string | null;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  linkedin?: string;
  notes?: string;
  isPrimary?: boolean;
}

export interface ContactUpdate extends Partial<ContactInput> {}

export interface ContactWithCompany extends Contact {
  companyName?: string;
  companyType?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function mapContactFromDB(item: any): ContactWithCompany {
// ============================================================================
// Helpers
// ============================================================================

function mapContactFromDB(item: any): ContactWithCompany {
  return {
    id: item.id,
    companyId: item.company_id,
    name: item.name,
    email: item.email || '',
    phone: item.phone || '',
    role: item.role || '',
    department: item.department || '',
    linkedin: item.linkedin || '',
    notes: item.notes || '',
    isPrimary: item.is_primary || false,
    createdAt: item.created_at,
    createdBy: item.created_by,
    companyName: item.companies?.name,
    companyType: item.companies?.type
  }
}

// ============================================================================
// API Functions
// ============================================================================

export async function getContacts(companyId?: string): Promise<ContactWithCompany[]> {
  let query = supabase.from('contacts').select('*, companies(name, type)');

  if (companyId && companyId !== 'all') {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;


export async function getContacts(companyId?: string): Promise<Contact[]> {
  let query = supabase.from('contacts').select('*');

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query.order('name');
  if (error) throw error;

  return data.map(mapContactFromDB);
}

export async function getContact(id: string): Promise<Contact> {
  const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single();
  if (error) throw error;
  return mapContactFromDB(data);
}

export async function createContact(contact: ContactInput, userId: string): Promise<Contact> {
  // Logic: enforce 1 primary per company
  if (contact.isPrimary && contact.companyId) {
    await supabase.from('contacts').update({ is_primary: false }).eq('company_id', contact.companyId);
  }

  const { data, error } = await supabase.from('contacts').insert({
    company_id: contact.companyId,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    role: contact.role,
    department: contact.department,
    linkedin: contact.linkedin,
    notes: contact.notes,
    is_primary: contact.isPrimary,
    created_by: userId,
    updated_by: userId
  }).select().single();

  if (error) throw error;
  return mapContactFromDB(data);
}

export async function updateContact(id: string, updates: ContactUpdate) {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.role !== undefined) updateData.role = updates.role;
  if (updates.department !== undefined) updateData.department = updates.department;
  if (updates.linkedin !== undefined) updateData.linkedin = updates.linkedin;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.isPrimary !== undefined) updateData.is_primary = updates.isPrimary;

  // Logic: enforce 1 primary per company
  // Need to know current companyId if not updated, or new one
  if (updates.isPrimary) {
     const { data: current } = await supabase.from('contacts').select('company_id').eq('id', id).single();
     const targetCompanyId = updates.companyId !== undefined ? updates.companyId : current?.company_id;

     if (targetCompanyId) {
        await supabase.from('contacts').update({ is_primary: false }).eq('company_id', targetCompanyId);
     }
  }

  const { data, error } = await supabase.from('contacts').update(updateData).eq('id', id).select().single();
  if (error) throw error;
  return mapContactFromDB(data);
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// Hooks
// ============================================================================

export function useContacts(companyId?: string) {
  return useQuery({
    queryKey: ['contacts', companyId],
    queryFn: () => getContacts(companyId)
  });
}

export function useContact(id?: string) {
  return useQuery({

export function useContacts(companyId?: string) {
  return useQuery({
    queryKey: ['contacts', companyId],
    queryFn: () => getContacts(companyId)
  });
}

export function useContact(id?: string) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => getContact(id!),
    enabled: !!id
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, userId }: { data: ContactInput, userId: string }) => createContact(data, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      if (data.companyId) queryClient.invalidateQueries({ queryKey: ['companies', data.companyId] });
    }
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: ContactUpdate }) => updateContact(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', data.id] });
      if (data.companyId) queryClient.invalidateQueries({ queryKey: ['companies', data.companyId] });
    }
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }
  });
}
