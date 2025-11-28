import { supabase } from '@/lib/supabaseClient'

export interface AuthSettings {
  enableMagicLinks: boolean
  restrictDomain: boolean
  allowedDomain: string
}

const DEFAULT_SETTINGS: AuthSettings = {
  enableMagicLinks: true,
  restrictDomain: false,
  allowedDomain: 'koacapital.com.br'
}

export async function getAuthSettings(): Promise<AuthSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'auth_policy')
    .single()

  if (error || !data) {
    // Se der erro ou não existir, retorna o padrão para não quebrar a app
    return DEFAULT_SETTINGS
  }

  return data.value as AuthSettings
}

export async function updateAuthSettings(settings: AuthSettings, userId: string): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ 
      key: 'auth_policy',
      value: settings,
      updated_by: userId,
      updated_at: new Date().toISOString()
    })

  if (error) throw error
}