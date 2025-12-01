// supabase/functions/generate-synthetic-users/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { fakerPT_BR as faker } from "https://esm.sh/@faker-js/faker@8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request (OPTIONS)
  if (req.method === 'OPTIONS') {
    // Usar 204 No Content é o padrão para respostas de preflight bem-sucedidas.
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    const { action = 'create', count = 5, password = "password123" } = await req.json()

    // Usar a SERVICE_ROLE_KEY para ter permissão de admin no Auth
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // --- LÓGICA DE EXCLUSÃO ---
    if (action === 'delete') {
      // 1. Buscar todos os IDs de perfis sintéticos
      const { data: profiles, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('is_synthetic', true)

      if (fetchError) throw fetchError

      let deletedCount = 0
      const errors = []

      // 2. Deletar usuários do Auth (Isso apaga o profile via CASCADE no banco)
      for (const p of profiles || []) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(p.id)
        if (deleteError) {
          console.error(`Erro ao deletar usuário ${p.id}:`, deleteError)
          errors.push({ id: p.id, error: deleteError.message })
        } else {
          deletedCount++
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          deleted: deletedCount, 
          totalFound: profiles?.length || 0,
          errors 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // --- LÓGICA DE CRIAÇÃO (Padrão) ---
    const createdUsers = []
    const errors = []

    for (let i = 0; i < count; i++) {
      const email = faker.internet.email().toLowerCase() // Emails únicos
      const name = faker.person.fullName()
      const role = faker.helpers.arrayElement(['client', 'analyst', 'newbusiness'])
      
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Já confirma o email para poder logar direto
        user_metadata: {
          name: name, // CORREÇÃO: trigger usa 'name', não 'full_name'
          role: role,
          is_synthetic: true // Passamos no metadata também
        }
      })

      if (authError) {
        errors.push({ email, error: authError.message })
        continue
      }

      if (authData.user) {
        // 2. Garantir flag is_synthetic no profile (Best Effort)
        // O trigger deve criar o perfil, mas fazemos um update para garantir o campo is_synthetic
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            is_synthetic: true,
            name: name,
            role: role,
            avatar_url: faker.image.avatar()
          })
          .eq('id', authData.user.id)

        if (!profileError) {
          createdUsers.push({ id: authData.user.id, email, name, role })
        } else {
           console.warn(`Profile update failed for ${authData.user.id}, likely handled by trigger.`)
           // Mesmo se falhar o update (ex: trigger lento), consideramos criado pois o Auth user existe
           createdUsers.push({ id: authData.user.id, email, name, role })
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        created: createdUsers.length, 
        users: createdUsers,
        errors 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})