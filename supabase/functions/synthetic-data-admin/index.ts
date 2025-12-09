// Supabase Edge Function: synthetic-data-admin
// This unified function handles synthetic user creation, CRM data generation,
// and cleanup of synthetic data. It exposes three operations:
//  - POST with { action: 'create_users', count, prefix }: creates synthetic users via admin API
//    (reads configuration from system_settings: password, role, email_domain, name_prefix)
//  - POST with { action: 'generate_crm', companies_count, leads_count, deals_count, contacts_count, players_count, users_ids }: generates CRM entities by invoking the v2 RPC
//  - DELETE: deletes all synthetic users via admin API and calls the v2 cleanup RPC

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2'

// Helper to build a Supabase client with service role to call admin endpoints
function getServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Type for system setting value structures
type SystemSettingValue = 
  | string 
  | number 
  | boolean 
  | { value: string | number | boolean }
  | { code: string }
  | { id: string }

/**
 * Extract the actual value from a system setting's value field
 * System settings can have different structures: { value: X }, { code: Y }, { id: Z }, or plain value
 */
function extractSettingValue<T>(settingValue: any, defaultValue: T): T {
  if (settingValue === null || settingValue === undefined) {
    return defaultValue
  }
  
  // If it's a plain value (string, number, boolean), return it
  if (typeof settingValue !== 'object') {
    return settingValue as T
  }
  
  // Handle object structures
  if ('value' in settingValue) return (settingValue.value ?? defaultValue) as T
  if ('code' in settingValue) return (settingValue.code ?? defaultValue) as T
  if ('id' in settingValue) return (settingValue.id ?? defaultValue) as T
  
  // If none of the expected properties exist, return the object itself or default
  return (settingValue ?? defaultValue) as T
}

// Helper to get a system setting value
async function getSystemSetting<T>(
  supabase: SupabaseClient, 
  key: string, 
  defaultValue: T
): Promise<T> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    
    if (error || !data) {
      return defaultValue
    }
    
    return extractSettingValue(data.value, defaultValue)
  } catch (err) {
    console.warn(`Failed to get setting ${key}:`, err)
    return defaultValue
  }
}

async function handleCreateUsers(supabase: SupabaseClient, payload: any) {
  // Get configuration from system_settings with fallback defaults
  const defaultPassword = await getSystemSetting(supabase, 'synthetic_default_password', 'Password123!')
  const defaultRole = await getSystemSetting(supabase, 'synthetic_default_role_code', 'analyst')
  const emailDomain = await getSystemSetting(supabase, 'synthetic_email_domain', '@example.com')
  const namePrefix = await getSystemSetting(supabase, 'synthetic_name_prefix', 'Synthetic User ')
  
  const { count = 1, prefix = 'synth' } = payload || {}
  const createdUsers: { id: string; email: string }[] = []
  const errors: { email: string; error: string }[] = []
  
  for (let i = 0; i < count; i++) {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const email = `${prefix}_${timestamp}_${randomStr}${emailDomain}`
    const password = defaultPassword
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${namePrefix}${randomStr}`,
        is_synthetic: true,
        role: defaultRole,
      },
    })
    if (error) {
      errors.push({ email, error: error.message })
    } else {
      createdUsers.push({ id: user!.user!.id, email: user!.user!.email! })
    }
  }
  return {
    success: errors.length === 0,
    created_count: createdUsers.length,
    users: createdUsers,
    errors,
  }
}

async function handleGenerateCRM(supabase: SupabaseClient, payload: any) {
  // Extract counts and optional users_ids from payload
  const companies_count = Number(payload?.companies_count) || 0
  const leads_count = Number(payload?.leads_count) || 0
  const deals_count = Number(payload?.deals_count) || 0
  const contacts_count = Number(payload?.contacts_count) || 0
  const players_count = Number(payload?.players_count) || 0
  const users_ids: string[] = Array.isArray(payload?.users_ids) ? payload.users_ids : []
  // Build RPC payload and invoke database function
  const rpcPayload = {
    companies_count,
    leads_count,
    deals_count,
    contacts_count,
    players_count,
    users_ids,
  }
  const { data, error } = await supabase.rpc('generate_synthetic_data_v2', { payload: rpcPayload })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function handleDelete(supabase: SupabaseClient) {
  // Delete synthetic auth users first
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw new Error(listError.message)
  const syntheticUsers = users.filter((u: any) => u.user_metadata?.is_synthetic === true)
  const deletedIds: string[] = []
  const errors: { id: string; error: string }[] = []
  for (const user of syntheticUsers) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    if (deleteError) {
      errors.push({ id: user.id, error: deleteError.message })
    } else {
      deletedIds.push(user.id)
    }
  }
  // Now clean up database objects via RPC
  const { data: cleanupData, error: cleanupError } = await supabase.rpc('clear_synthetic_data_v2')
  if (cleanupError) {
    throw new Error(cleanupError.message)
  }
  return {
    success: errors.length === 0,
    deleted_count: deletedIds.length,
    deleted_ids: deletedIds,
    cleanup: cleanupData,
    errors,
  }
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      },
    })
  }
  const supabase = getServiceClient()
  try {
    if (req.method === 'DELETE') {
      const result = await handleDelete(supabase)
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    // Parse JSON body for POST
    const payload = await req.json()
    const action = payload?.action || 'generate_crm'
    if (action === 'create_users') {
      const result = await handleCreateUsers(supabase, payload)
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    if (action === 'generate_crm') {
      const result = await handleGenerateCRM(supabase, payload)
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    // Unknown action
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  }
})