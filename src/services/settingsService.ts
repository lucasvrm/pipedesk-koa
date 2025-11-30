import { supabase } from '@/lib/supabaseClient'
import {
  LossReason,
  Product,
  DealSource,
  PlayerCategory,
  Holiday,
  CommunicationTemplate
} from '@/lib/types'

// Mapeamento de tipos para tabelas
const TABLE_MAP = {
  loss_reasons: 'loss_reasons',
  products: 'products',
  deal_sources: 'deal_sources',
  player_categories: 'player_categories',
  holidays: 'holidays',
  communication_templates: 'communication_templates',
  app_settings: 'app_settings'
}

type SettingType = keyof typeof TABLE_MAP

// Tipo para configurações de Auth
export interface AuthSettings {
  enableMagicLinks: boolean
  restrictDomain: boolean
  allowedDomain?: string
}

export const settingsService = {

  // --- LEITURA ---
  async getSettings<T>(type: SettingType): Promise<T[]> {
    const table = TABLE_MAP[type]
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(item => mapFromDb(item, type)) as T[]
  },

  // --- CRIAÇÃO ---
  async createSetting<T>(type: SettingType, data: any): Promise<T> {
    const table = TABLE_MAP[type]
    const dbData = mapToDb(data, type)

    const { data: created, error } = await supabase
      .from(table)
      .insert(dbData)
      .select()
      .single()

    if (error) throw error
    return mapFromDb(created, type) as T
  },

  // --- ATUALIZAÇÃO ---
  async updateSetting<T>(type: SettingType, id: string, data: any): Promise<T> {
    const table = TABLE_MAP[type]
    const dbData = mapToDb(data, type)

    // Remove campos que não devem ser atualizados
    delete dbData.id
    delete dbData.created_at

    const { data: updated, error } = await supabase
      .from(table)
      .update(dbData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapFromDb(updated, type) as T
  },

  // --- EXCLUSÃO ---
  async deleteSetting(type: SettingType, id: string): Promise<void> {
    const table = TABLE_MAP[type]
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // --- TOGGLE STATUS (Soft Delete / Disable) ---
  async toggleActive(type: SettingType, id: string, isActive: boolean): Promise<void> {
    const table = TABLE_MAP[type]
    // Holidays não tem is_active, mas os outros têm
    if (type === 'holidays') return

    const { error } = await supabase
      .from(table)
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) throw error
  }
}

// --- FUNÇÕES DE AUTH SETTINGS (LEGADO/ESPECÍFICO) ---

export async function getAuthSettings(): Promise<AuthSettings> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'auth_config')
      .single()

    if (error) {
      console.warn('Configurações de Auth não encontradas, usando padrão.')
      return { enableMagicLinks: true, restrictDomain: false }
    }

    return data.value as AuthSettings
  } catch (err) {
    console.error('Erro ao buscar settings de auth:', err)
    return { enableMagicLinks: true, restrictDomain: false }
  }
}

export async function updateAuthSettings(settings: AuthSettings): Promise<void> {
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key: 'auth_config',
        value: settings,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
  } catch (err) {
    console.error('Erro ao atualizar settings de auth:', err)
    throw err
  }
}

// --- HELPERS DE MAPEAMENTO (Snake <-> Camel) ---

function mapFromDb(item: any, type: SettingType): any {
  const base = {
    id: item.id,
    name: item.name,
    description: item.description,
    createdAt: item.created_at,
    isActive: item.is_active,
  }

  switch (type) {
    case 'products':
      return {
        ...base,
        acronym: item.acronym,
        defaultFeePercentage: item.default_fee_percentage,
        defaultSlaDays: item.default_sla_days,
      }
    case 'deal_sources':
      return {
        ...base,
        type: item.type,
      }
    case 'holidays':
      return {
        id: item.id,
        name: item.name,
        date: item.date,
        type: item.type,
        createdAt: item.created_at,
      }
    case 'communication_templates':
      return {
        id: item.id,
        title: item.title,
        subject: item.subject,
        content: item.content,
        type: item.type,
        category: item.category,
        variables: item.variables || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        createdBy: item.created_by
      }
    default:
      return base
  }
}

function mapToDb(item: any, type: SettingType): any {
  const base: any = {
    name: item.name,
    description: item.description,
    is_active: item.isActive
  }

  switch (type) {
    case 'products':
      return {
        ...base,
        acronym: item.acronym,
        default_fee_percentage: item.defaultFeePercentage,
        default_sla_days: item.defaultSlaDays,
      }
    case 'deal_sources':
      return {
        ...base,
        type: item.type,
      }
    case 'holidays':
      return {
        name: item.name,
        date: item.date,
        type: item.type,
      }
    case 'communication_templates':
      return {
        title: item.title,
        subject: item.subject,
        content: item.content,
        type: item.type,
        category: item.category,
        variables: item.variables,
      }
    default:
      return base
  }
}
