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
    // 1. Criar cliente Supabase com Service Role (Admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 2. Verificar quem está chamando (Auth User)
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !caller) {
      throw new Error('Não autorizado')
    }

    // 3. Verificar se quem chama é ADMIN
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Apenas administradores podem gerenciar usuários')
    }

    // 4. Processar a requisição
    const { action, userData, userId } = await req.json()

    let result

    switch (action) {
      case 'create':
        // Cria usuário no Auth (sem enviar email de confirmação para criação manual)
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          email_confirm: true, // Já confirma o email
          user_metadata: {
            name: userData.name,
            role: userData.role,
            client_entity: userData.clientEntity
          }
        })
        if (createError) throw createError
        
        // O trigger do banco cria o profile, mas vamos garantir o update dos dados extras
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
        // Atualiza Auth (se tiver email/senha)
        if (userData.email || userData.password) {
            const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { email: userData.email, password: userData.password }
            )
            if (updateAuthError) throw updateAuthError
        }

        // Atualiza Profile (metadados)
        const { data: updatedProfile, error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({
            name: userData.name,
            role: userData.role,
            client_entity: userData.clientEntity
          })
          .eq('id', userId)
          .select()
          .single()

        if (updateProfileError) throw updateProfileError
        result = updatedProfile
        break

      case 'delete':
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteError) throw deleteError
        result = { success: true }
        break

      default:
        throw new Error('Ação inválida')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})