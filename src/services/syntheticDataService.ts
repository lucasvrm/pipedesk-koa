import { supabase } from '@/lib/supabaseClient'

export interface SyntheticGenerationResult {
  companies: number
  leads: number
  deals: number
  contacts: number
  strategy_used: string
}

export interface SyntheticCleanupResult {
  tasks: number
  tracks: number
  deals: number
  leads: number
  contacts: number
  companies: number
  players: number
  users: number // Profiles
}

export const syntheticDataService = {
  /**
   * Creates Auth Users via Edge Function
   */
  async createUsers(count: number, prefix: string = 'synth_user') {
    const { data, error } = await supabase.functions.invoke('admin-create-synthetic-users', {
      body: { count, prefix }
    })
    
    if (error) throw error
    return data
  },

  /**
   * Deletes Auth Users via Edge Function
   */
  async deleteAuthUsers() {
    const { data, error } = await supabase.functions.invoke('admin-create-synthetic-users', {
      method: 'DELETE'
    })

    if (error) throw error
    return data
  },

  /**
   * Generates CRM entities (Companies, Leads, Deals, etc.) via Database RPC
   */
  async generateCRM(payload: {
    companies_count: number
    leads_count: number
    deals_count: number
    contacts_count: number
    users_ids: string[]
    company_strategy: 'v1' | 'v2'
  }) {
    const { data, error } = await supabase.rpc('generate_synthetic_data', { payload })
    
    if (error) throw error
    return data as SyntheticGenerationResult
  },

  /**
   * Clears all synthetic CRM data via Database RPC
   */
  async clearCRM() {
    const { data, error } = await supabase.rpc('clear_synthetic_data')
    
    if (error) throw error
    return data as SyntheticCleanupResult
  },

  /**
   * Helper to fetch IDs of existing synthetic profiles
   */
  async getSyntheticUserIds(): Promise<string[]> {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_synthetic', true)

    return data?.map(u => u.id) || []
  }
}
