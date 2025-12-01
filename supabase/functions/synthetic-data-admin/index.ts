// Supabase Edge Function: synthetic-data-admin
// This unified function handles synthetic user creation, CRM data generation,
// and cleanup of synthetic data. It exposes three operations:
//  - POST with { action: 'create_users', count, prefix }: creates synthetic users via admin API
//  - POST with { action: 'generate_crm', companies_count, leads_count, deals_count, contacts_count, players_count, users_ids }: generates CRM entities by invoking the v2 RPC
//  - DELETE: deletes all synthetic users via admin API and calls the v2 cleanup RPC

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Helper to build a Supabase client with service role to call admin endpoints
function getServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function handleCreateUsers(supabase: any, payload: any) {
  const { count = 1, prefix = 'synth' } = payload || {}
  const createdUsers: { id: string; email: string }[] = []
  const errors: { email: string; error: string }[] = []
  for (let i = 0; i < count; i++) {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const email = `${prefix}_${timestamp}_${randomStr}@example.com`
    const password = 'Password123!'
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `Synthetic User ${randomStr}`,
        is_synthetic: true,
        role: 'analyst',
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

async function handleGenerateCRM(supabase: any, payload: any) {
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

async function handleDelete(supabase: any) {
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