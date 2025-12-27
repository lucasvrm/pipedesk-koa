import { supabase } from '@/lib/supabaseClient'
import {
  LossReason,
  Product,
  DealSource,
  PlayerCategory,
  Holiday,
  CommunicationTemplate
} from '@/lib/types'
import {
  DealStatusMeta,
  RelationshipLevelMeta,
  CompanyTypeMeta,
  LeadStatusMeta,
  LeadOriginMeta,
  LeadMemberRoleMeta,
  UserRoleMetadata
} from '@/types/metadata'

// Mapeamento de tipos para tabelas
const TABLE_MAP = {
  loss_reasons: 'loss_reasons',
  products: 'products',
  deal_sources: 'deal_sources',
  player_categories: 'player_categories',
  holidays: 'holidays',
  communication_templates: 'communication_templates',
  deal_statuses: 'deal_statuses',
  relationship_levels: 'company_relationship_levels',
  company_types: 'company_types',
  lead_statuses: 'lead_statuses',
  lead_origins: 'lead_origins',
  lead_member_roles: 'lead_member_roles',
  user_role_metadata: 'user_role_metadata'
}

type SettingType = keyof typeof TABLE_MAP

// Tipo para configurações de Auth
export interface AuthSettings {
  enableMagicLinks: boolean
  restrictDomain: boolean
  allowedDomain?: string
}

export const settingsService = {

  // --- GENERIC CRUD HELPERS ---

  /**
   * List all items from a metadata table
   */
  async list<T>(tableName: SettingType): Promise<{ data: T[] | null; error: Error | null }> {
    try {
      const table = TABLE_MAP[tableName]
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) return { data: null, error }

      const mapped = data.map(item => mapFromDb(item, tableName)) as T[]
      return { data: mapped, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error('Unknown error') }
    }
  },

  /**
   * Create a new item in a metadata table
   */
  async create<T>(tableName: SettingType, payload: any): Promise<{ data: T | null; error: Error | null }> {
    try {
      // Basic validation
      if (payload.code && !payload.code.trim()) {
        return { data: null, error: new Error('Code cannot be empty') }
      }
      if (payload.label && !payload.label.trim()) {
        return { data: null, error: new Error('Label cannot be empty') }
      }

      const table = TABLE_MAP[tableName]
      const dbData = mapToDb(payload, tableName)

      const { data, error } = await supabase
        .from(table)
        .insert(dbData)
        .select()
        .single()

      if (error) return { data: null, error }

      const mapped = mapFromDb(data, tableName) as T
      return { data: mapped, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error('Unknown error') }
    }
  },

  /**
   * Update an existing item in a metadata table
   */
  async update<T>(tableName: SettingType, id: string, payload: any): Promise<{ data: T | null; error: Error | null }> {
    try {
      // Basic validation
      if (!id || !id.trim()) {
        return { data: null, error: new Error('ID cannot be empty') }
      }

      const table = TABLE_MAP[tableName]
      const dbData = mapToDb(payload, tableName)

      // Remove fields that should not be updated
      delete dbData.id
      delete dbData.created_at

      const { data, error } = await supabase
        .from(table)
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (error) return { data: null, error }

      const mapped = mapFromDb(data, tableName) as T
      return { data: mapped, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error('Unknown error') }
    }
  },

  /**
   * Delete an item from a metadata table
   */
  async remove(tableName: SettingType, id: string): Promise<{ data: null; error: Error | null }> {
    try {
      if (!id || !id.trim()) {
        return { data: null, error: new Error('ID cannot be empty') }
      }

      const table = TABLE_MAP[tableName]
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) return { data: null, error }
      return { data: null, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error('Unknown error') }
    }
  },

  // --- LEGACY METHODS (kept for backward compatibility) ---

  /**
   * @deprecated Use list() instead
   */
  async getSettings<T>(type: SettingType): Promise<T[]> {
    const table = TABLE_MAP[type]
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(item => mapFromDb(item, type)) as T[]
  },

  /**
   * @deprecated Use create() instead
   */
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

  /**
   * @deprecated Use update() instead
   */
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

  /**
   * @deprecated Use remove() instead
   */
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

// --- SPECIFIC HELPERS FOR SYSTEM_SETTINGS ---

/**
 * Extract the actual value from a system setting's value field
 * System settings can have different structures: { value: X }, { code: Y }, { id: Z }, or plain value
 * 
 * Note: This utility is duplicated in the edge function (supabase/functions/synthetic-data-admin/index.ts)
 * because edge functions run in Deno runtime and cannot import from src/. Keep both implementations in sync.
 */
export function extractSystemSettingValue(settingValue: any, defaultValue: any = null): any {
  if (settingValue === null || settingValue === undefined) {
    return defaultValue
  }
  
  // If it's a plain value (string, number, boolean), return it
  if (typeof settingValue !== 'object') {
    return settingValue
  }
  
  // Handle object structures
  if ('value' in settingValue) return settingValue.value ?? defaultValue
  if ('code' in settingValue) return settingValue.code ?? defaultValue
  if ('id' in settingValue) return settingValue.id ?? defaultValue
  
  // If none of the expected properties exist, return the object itself or default
  return settingValue ?? defaultValue
}

/**
 * Get a system setting by key
 */
export async function getSystemSetting(key: string): Promise<{ data: any | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116' || error.code === '406') {
        return { data: null, error: null }
      }
      return { data: null, error }
    }

    return { data: data?.value || null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') }
  }
}

/**
 * Update a system setting by key
 * If value is null or undefined, deletes the setting row instead of upserting
 */
export async function updateSystemSetting(
  key: string,
  value: any,
  description?: string
): Promise<{ data: any | null; error: Error | null }> {
  try {
    if (!key || !key.trim()) {
      return { data: null, error: new Error('Key cannot be empty') }
    }

    // If value is null or undefined, delete the row instead of upserting
    if (value === null || value === undefined) {
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .eq('key', key)

      if (error) return { data: null, error }
      return { data: null, error: null }
    }

    const { data: userData } = await supabase.auth.getUser()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('system_settings') as any)
      .upsert({
        key,
        value,
        description,
        updated_by: userData.user?.id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) return { data: null, error }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') }
  }
}

// --- FUNÇÕES DE AUTH SETTINGS (MIGRADO PARA SYSTEM_SETTINGS) ---

export async function getAuthSettings(): Promise<AuthSettings> {
  try {
    const { data, error } = await supabase
      .from('system_settings') // FIX: Changed from app_settings
      .select('value')
      .eq('key', 'auth_config')
      .single()

    if (error) {
      console.warn('Configurações de Auth não encontradas em system_settings, usando padrão.')
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
    const { data: userData } = await supabase.auth.getUser();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('system_settings') as any) // FIX: Changed from app_settings
      .upsert({
        key: 'auth_config',
        value: settings,
        description: 'Authentication settings',
        updated_at: new Date().toISOString(),
        updated_by: userData.user?.id
      })

    if (error) throw error
  } catch (err) {
    console.error('Erro ao atualizar settings de auth:', err)
    throw err
  }
}

// --- HELPERS DE MAPEAMENTO (Snake <-> Camel) ---

function mapFromDb(item: any, type: SettingType): any {
  // Base structure for most metadata tables
  const base = {
    id: item.id,
    name: item.name,
    description: item.description,
    createdAt: item.created_at,
    isActive: item.is_active,
  }

  // Metadata tables with code, label, sort_order structure
  const metadataBase = {
    id: item.id,
    code: item.code,
    label: item.label,
    description: item.description,
    isActive: item.is_active,
    sortOrder: item.sort_order,
    createdAt: item.created_at,
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
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        createdBy: item.created_by
      }
    case 'deal_statuses':
      return {
        ...metadataBase,
        color: item.color,
      }
    case 'lead_statuses':
      return {
        ...metadataBase,
        color: item.color,
        priorityWeight: item.priority_weight ?? 0,
      }
    case 'relationship_levels':
    case 'company_types':
      return metadataBase
    case 'lead_origins':
      return {
        ...metadataBase,
        priorityWeight: item.priority_weight ?? 0,
      }
    case 'lead_member_roles':
      return metadataBase
    case 'user_role_metadata':
      return {
        ...metadataBase,
        badgeVariant: item.badge_variant,
        permissions: item.permissions || [],
        updatedAt: item.updated_at,
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

  // Metadata base structure
  const metadataBase: any = {
    code: item.code,
    label: item.label,
    description: item.description,
    is_active: item.isActive,
    sort_order: item.sortOrder
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
        is_active: item.isActive,
      }
    case 'deal_statuses':
      return {
        ...metadataBase,
        color: item.color,
      }
    case 'lead_statuses':
      return {
        ...metadataBase,
        color: item.color,
        priority_weight: item.priorityWeight ?? 0,
      }
    case 'relationship_levels':
    case 'company_types':
      return metadataBase
    case 'lead_origins':
      return {
        ...metadataBase,
        priority_weight: item.priorityWeight ?? 0,
      }
    case 'lead_member_roles':
      return metadataBase
    case 'user_role_metadata':
      return {
        ...metadataBase,
        badge_variant: item.badgeVariant,
        permissions: item.permissions || [],
      }
    default:
      return base
  }
}
