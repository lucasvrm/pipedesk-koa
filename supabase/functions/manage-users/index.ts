import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cria cliente Supabase com permissão de ADMIN (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verifica token do usuário que chamou (segurança)
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !caller) throw new Error('Não autorizado')

    // Verifica se o chamador é ADMIN
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profile?.role !== 'admin') throw new Error('Acesso negado')

    const { action, userData, userId } = await req.json()
    let result

    switch (action) {
      case 'create':
        // 1. Cria usuário no Auth (Trigger do banco vai criar o profile básico)
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: 'Mudar123!', // Senha provisória
          email_confirm: true,
          user_metadata: { name: userData.name, role: userData.role }
        })
        if (createError) throw createError
        
        // 2. Atualiza Profile com dados extras (ex: clientEntity)
        if (newUser.user) {
            await supabaseAdmin.from('profiles').update({
                name: userData.name,
                role: userData.role,
                client_entity: userData.clientEntity
            }).eq('id', newUser.user.id)
        }
        result = newUser
        break

      case 'update':
        if (userData.email) {
            await supabaseAdmin.auth.admin.updateUserById(userId, { email: userData.email })
        }
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            name: userData.name,
            role: userData.role,
            client_entity: userData.clientEntity
          })
          .eq('id', userId)
          .select().single()
        
        if (updateError) throw updateError
        result = updatedProfile
        break

      case 'delete':
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteError) throw deleteError
        result = { success: true }
        break
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})