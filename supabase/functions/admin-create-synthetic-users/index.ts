// Setup type definitions for Deno
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

console.log("Hello from admin-create-synthetic-users!")

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS' } })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Handle DELETE request (Cleanup Auth Users)
    if (req.method === 'DELETE') {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

        if (listError) throw listError

        // Filter users that are synthetic based on metadata
        const syntheticUsers = users.filter((u: any) => u.user_metadata?.is_synthetic === true)

        const deletedIds = []
        const errors = []

        for (const user of syntheticUsers) {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
            if (deleteError) {
                errors.push({ id: user.id, error: deleteError.message })
            } else {
                deletedIds.push(user.id)
            }
        }

        return new Response(
            JSON.stringify({
              success: true,
              deleted_count: deletedIds.length,
              deleted_ids: deletedIds,
              errors
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            },
        )
    }

    // Handle POST request (Create Users)
    const { count = 1, prefix = 'synth' } = await req.json()

    const createdUsers = []
    const errors = []

    for (let i = 0; i < count; i++) {
      const timestamp = new Date().getTime()
      const randomStr = Math.random().toString(36).substring(7)
      const email = `${prefix}_${timestamp}_${randomStr}@example.com`
      const password = `Password123!` // Default password for all synthetic users

      const { data: user, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: `Synthetic User ${randomStr}`,
          is_synthetic: true,
          role: 'analyst' // Default role
        }
      })

      if (error) {
        errors.push({ email, error: error.message })
      } else {
        createdUsers.push(user.user)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created_count: createdUsers.length,
        users: createdUsers.map(u => ({ id: u.id, email: u.email })),
        errors
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      },
    )
  }
})
