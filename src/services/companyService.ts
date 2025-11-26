import { supabase } from '@/lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Company, CompanyType, PlayerContact } from '@/lib/types'

// --- Tipos ---

export interface CompanyInput {
  name: string
  cnpj?: string
  site?: string
  description?: string
  type: CompanyType
}

export interface CompanyUpdate extends Partial<CompanyInput> {}

// --- Helpers ---

function mapCompanyFromDB(item: any): Company {
  return {
    id: item.id,
    name: item.name,
    cnpj: item.cnpj || '',
    site: item.site || '',
    description: item.description || '',
    type: item.type as CompanyType,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    createdBy: item.created_by,
    // Se vier do join
    contacts: item.company_contacts ? item.company_contacts.map(mapContactFromDB) : [],
    deals: item.master_deals || [] // Mapear se necessário
  }
}

function mapContactFromDB(item: any): PlayerContact {
  // Reutilizando a interface PlayerContact para simplificar, já que os campos são iguais
  return {
    id: item.id,
    playerId: item.company_id, // Hack: usando playerId para guardar o companyId no frontend
    name: item.name,
    role: item.role || '',
    email: item.email || '',
    phone: item.phone || '',
    isPrimary: item.is_primary || false,
    createdAt: item.created_at,
    createdBy: item.created_by
  }
}

// --- API Functions (Companies) ---

export async function getCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*, master_deals(count)') // Traz a contagem de deals
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data.map(mapCompanyFromDB)
}

export async function getCompany(id: string): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .select('*, company_contacts(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return mapCompanyFromDB(data)
}

export async function createCompany(company: CompanyInput, userId: string) {
  const { data, error } = await supabase
    .from('companies')
    .insert({ ...company, created_by: userId })
    .select()
    .single()

  if (error) throw error
  return mapCompanyFromDB(data)
}

export async function updateCompany(id: string, updates: CompanyUpdate) {
  const { data, error } = await supabase
    .from('companies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapCompanyFromDB(data)
}

// --- API Functions (Company Contacts) ---

export async function createCompanyContact(contact: Partial<PlayerContact>, userId: string) {
  // Hack: O frontend manda 'playerId', mas no banco é 'company_id'
  const companyId = contact.playerId; 

  if (contact.isPrimary && companyId) {
    await supabase.from('company_contacts').update({ is_primary: false }).eq('company_id', companyId)
  }

  const { data, error } = await supabase
    .from('company_contacts')
    .insert({
      company_id: companyId,
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      is_primary: contact.isPrimary,
      created_by: userId,
      updated_by: userId
    })
    .select()
    .single()

  if (error) throw error
  return mapContactFromDB(data)
}

export async function deleteCompanyContact(id: string) {
  const { error } = await supabase.from('company_contacts').delete().eq('id', id)
  if (error) throw error
}

// --- Hooks ---

export function useCompanies() {
  return useQuery({ queryKey: ['companies'], queryFn: getCompanies })
}

export function useCompany(id?: string) {
  return useQuery({ 
    queryKey: ['companies', id], 
    queryFn: () => getCompany(id!), 
    enabled: !!id 
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ data, userId }: { data: CompanyInput, userId: string }) => createCompany(data, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] })
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: CompanyUpdate }) => updateCompany(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['companies', data.id] })
    }
  })
}

export function useCreateCompanyContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contact, userId }: { contact: Partial<PlayerContact>, userId: string }) => 
      createCompanyContact(contact, userId),
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ['companies', vars.contact.playerId] })
  })
}

export function useDeleteCompanyContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCompanyContact,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] })
  })
}