import { supabase } from '@/lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import { OperationTypeRecord } from '@/lib/types'

export interface OperationTypeInput {
  name: string
  description?: string
  isActive?: boolean
}

function mapFromDb(item: any): OperationTypeRecord {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }
}

function mapToDb(data: OperationTypeInput) {
  return {
    name: data.name,
    description: data.description,
    is_active: data.isActive ?? true
  }
}

export const operationTypeService = {
  async getOperationTypes(): Promise<OperationTypeRecord[]> {
    const { data, error } = await supabase
      .from('operation_types')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapFromDb)
  },

  async createOperationType(payload: OperationTypeInput): Promise<OperationTypeRecord> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('operation_types') as any)
      .insert(mapToDb(payload))
      .select()
      .single()

    if (error) throw error
    return mapFromDb(data)
  },

  async updateOperationType(id: string, payload: OperationTypeInput): Promise<OperationTypeRecord> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('operation_types') as any)
      .update(mapToDb(payload))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapFromDb(data)
  },

  async deleteOperationType(id: string): Promise<void> {
    const { error } = await supabase
      .from('operation_types')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async toggleOperationType(id: string, isActive: boolean): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('operation_types') as any)
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) throw error
  }
}

export function useOperationTypes() {
  return useQuery({
    queryKey: ['operation_types'],
    queryFn: () => operationTypeService.getOperationTypes(),
    staleTime: 1000 * 60 * 10
  })
}
