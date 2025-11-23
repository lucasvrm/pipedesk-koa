import { supabase } from '@/lib/supabaseClient'
import { MasterDeal } from '@/lib/types'

export const dealService = {
  async getDeals() {
    const { data, error } = await supabase
      .from('master_deals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as MasterDeal[]
  },

  async getDealById(id: string) {
    const { data, error } = await supabase
      .from('master_deals')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as MasterDeal
  },

  async createDeal(deal: Omit<MasterDeal, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const { data, error } = await supabase
      .from('master_deals')
      .insert({
        ...deal,
        client_name: deal.clientName,
        operation_type: deal.operationType,
        fee_percentage: deal.feePercentage,
        created_by: userData.user.id
      })
      .select()
      .single()

    if (error) throw error
    return data as MasterDeal
  },

  async updateDeal(id: string, updates: Partial<MasterDeal>) {
    // Map camelCase to snake_case
    const dbUpdates: any = { ...updates }
    if (updates.clientName) dbUpdates.client_name = updates.clientName
    if (updates.operationType) dbUpdates.operation_type = updates.operationType
    if (updates.feePercentage) dbUpdates.fee_percentage = updates.feePercentage

    // Remove camelCase keys
    delete dbUpdates.clientName
    delete dbUpdates.operationType
    delete dbUpdates.feePercentage
    delete dbUpdates.createdAt
    delete dbUpdates.updatedAt
    delete dbUpdates.createdBy

    const { data, error } = await supabase
      .from('master_deals')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as MasterDeal
  },

  async deleteDeal(id: string) {
    // Soft delete
    const { error } = await supabase
      .from('master_deals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }
}
