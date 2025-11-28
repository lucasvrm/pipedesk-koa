import { supabase } from '@/lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Company, CompanyType, PlayerContact, RelationshipLevel, MasterDeal } from '@/lib/types'

// ============================================================================
// Types
// ============================================================================

export interface CompanyInput {
  name: string
  cnpj?: string
  site?: string
  description?: string
  type: CompanyType
  relationshipLevel: RelationshipLevel
}

export interface CompanyUpdate extends Partial<CompanyInput> {}

// ============================================================================
// Helpers
// ============================================================================

function mapContactFromDB(item: any): PlayerContact {
  return {
    id: item.id,
    playerId: item.company_id, // Usamos 'playerId' na interface genérica para guardar o ID do pai (empresa)
    name: item.name,
    role: item.role || '',
    email: item.email || '',
    phone: item.phone || '',
    isPrimary: item.is_primary || false,
    createdAt: item.created_at,
    createdBy: item.created_by
  }
}

function mapCompanyFromDB(item: any): Company {
  // Processa os contatos para encontrar o principal
  const contacts = item.company_contacts ? item.company_contacts.map(mapContactFromDB) : [];
  const primaryContact = contacts.find((c: PlayerContact) => c.isPrimary) || contacts[0];

  return {
    id: item.id,
    name: item.name,
    cnpj: item.cnpj || '',
    site: item.site || '',
    description: item.description || '',
    type: item.type as CompanyType,
    relationshipLevel: (item.relationship_level as RelationshipLevel) || 'none',
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    createdBy: item.created_by,
    
    // Relacionamentos
    contacts: contacts,
    deals: item.master_deals || [],

    // Campos calculados para a listagem
    dealsCount: item.master_deals ? item.master_deals[0]?.count : 0,
    primaryContactName: primaryContact ? primaryContact.name : undefined
  }
}

// ============================================================================
// API Functions (Companies)
// ============================================================================

export async function getCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*, master_deals(count), company_contacts(*)') // Traz contagem de deals e todos os contatos
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
    .insert({ 
      name: company.name,
      cnpj: company.cnpj,
      site: company.site,
      description: company.description,
      type: company.type,
      relationship_level: company.relationshipLevel,
      created_by: userId 
    })
    .select()
    .single()

  if (error) throw error
  return mapCompanyFromDB(data)
}

export async function updateCompany(id: string, updates: CompanyUpdate) {
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.cnpj !== undefined) updateData.cnpj = updates.cnpj
  if (updates.site !== undefined) updateData.site = updates.site
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.type !== undefined) updateData.type = updates.type
  if (updates.relationshipLevel !== undefined) updateData.relationship_level = updates.relationshipLevel

  const { data, error } = await supabase
    .from('companies')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapCompanyFromDB(data)
}

export async function deleteCompany(id: string) {
  // Soft Delete
  const { error } = await supabase
    .from('companies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteCompanies(ids: string[]) {
  // Bulk Soft Delete
  const { error } = await supabase
    .from('companies')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', ids)

  if (error) throw error
}

// ============================================================================
// API Functions (Company Contacts)
// ============================================================================

export async function createCompanyContact(contact: Partial<PlayerContact>, userId: string) {
  // O frontend envia 'playerId', mas para empresas o campo no banco é 'company_id'
  const companyId = contact.playerId; 

  // Se for primário, remove o flag dos outros contatos desta empresa
  if (contact.isPrimary && companyId) {
    await supabase
      .from('company_contacts')
      .update({ is_primary: false })
      .eq('company_id', companyId)
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
  const { error } = await supabase
    .from('company_contacts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Busca um contato de empresa específico pelo ID (usado na nova rota de detalhes)
export async function getCompanyContact(contactId: string): Promise<PlayerContact & { companyName?: string }> {
  const { data, error } = await supabase
    .from('company_contacts')
    .select('*, companies(name)') // Faz join para pegar o nome da empresa
    .eq('id', contactId)
    .single()

  if (error) throw error
  
  const contact = mapContactFromDB(data)
  return {
    ...contact,
    companyName: data.companies?.name
  }
}

// ============================================================================
// API Functions (Active Deals Lookup)
// ============================================================================

// Busca apenas deals ativos de uma empresa específica para o modal
export async function getCompanyActiveDeals(companyId: string): Promise<MasterDeal[]> {
  const { data, error } = await supabase
    .from('master_deals')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active') // Filtra apenas ativos
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  // Mapeamento simples para garantir compatibilidade com a interface MasterDeal
  return data.map((item: any) => ({
    id: item.id,
    clientName: item.client_name,
    volume: item.volume,
    operationType: item.operation_type,
    dealProduct: item.deal_product,
    deadline: item.deadline,
    observations: item.observations,
    status: item.status,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    createdBy: item.created_by,
    feePercentage: item.fee_percentage,
    companyId: item.company_id
  })) as MasterDeal[]
}

// ============================================================================
// React Query Hooks
// ============================================================================

export function useCompanies() {
  return useQuery({ 
    queryKey: ['companies'], 
    queryFn: getCompanies 
  })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    }
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

export function useDeleteCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    }
  })
}

export function useDeleteCompanies() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCompanies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    }
  })
}

export function useCreateCompanyContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contact, userId }: { contact: Partial<PlayerContact>, userId: string }) => 
      createCompanyContact(contact, userId),
    onSuccess: (_, vars) => {
      // Invalida a query da empresa específica para atualizar a lista de contatos
      queryClient.invalidateQueries({ queryKey: ['companies', vars.contact.playerId] })
      // Invalida a lista geral também, pois o contato principal pode ter mudado
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    }
  })
}

export function useDeleteCompanyContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCompanyContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    }
  })
}

// Hook para buscar um contato específico
export function useCompanyContact(contactId?: string) {
  return useQuery({
    queryKey: ['company-contact', contactId],
    queryFn: () => getCompanyContact(contactId!),
    enabled: !!contactId
  })
}

// Hook para buscar deals ativos de uma empresa (para o modal)
export function useCompanyActiveDeals(companyId: string | null, isOpen: boolean) {
  return useQuery({
    queryKey: ['company-active-deals', companyId],
    queryFn: () => getCompanyActiveDeals(companyId!),
    enabled: !!companyId && isOpen // Só busca quando o modal abre e temos um ID
  })
}