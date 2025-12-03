import { supabase } from '@/lib/supabaseClient'

export interface OperationTypeSetting {
  id: string
  name: string
  code?: string
  description?: string
  isActive: boolean
  createdAt?: string
}

function mapFromDb(item: any): OperationTypeSetting {
  return {
    id: item.id,
    name: item.name,
    code: item.code || item.key,
    description: item.description,
    isActive: item.is_active ?? true,
    createdAt: item.created_at,
  }
}

function mapToDb(item: Partial<OperationTypeSetting>) {
  return {
    name: item.name,
    code: item.code,
    description: item.description,
    is_active: item.isActive,
  }
}

async function getOperationTypes(): Promise<OperationTypeSetting[]> {
  const { data, error } = await supabase
    .from('operation_types')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapFromDb)
}

async function createOperationType(data: Partial<OperationTypeSetting>): Promise<OperationTypeSetting> {
  const payload = mapToDb({ ...data, isActive: data.isActive ?? true })
  const { data: created, error } = await supabase
    .from('operation_types')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return mapFromDb(created)
}

async function updateOperationType(id: string, data: Partial<OperationTypeSetting>): Promise<OperationTypeSetting> {
  const payload = mapToDb(data)
  const { data: updated, error } = await supabase
    .from('operation_types')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapFromDb(updated)
}

async function deleteOperationType(id: string): Promise<void> {
  const { error } = await supabase.from('operation_types').delete().eq('id', id)
  if (error) throw error
}

async function toggleOperationType(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('operation_types')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error
}

export const operationTypeService = {
  list: getOperationTypes,
  create: createOperationType,
  update: updateOperationType,
  remove: deleteOperationType,
  toggleActive: toggleOperationType,
}

export type OperationTypeService = typeof operationTypeService
