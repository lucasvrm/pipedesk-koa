// supabase/functions/generate-synthetic-users/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { fakerPT_BR as faker } from "https://esm.sh/@faker-js/faker@8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { count = 5, password = "password123" } = await req.json()

    // Usar a SERVICE_ROLE_KEY para ter permissão de admin no Auth
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const createdUsers = []
    const errors = []

    for (let i = 0; i < count; i++) {
      const email = faker.internet.email().toLowerCase() // Emails únicos
      const name = faker.person.fullName()
      
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Já confirma o email para poder logar direto
        user_metadata: {
          full_name: name,
          is_synthetic: true // Passamos no metadata também
        }
      })

      if (authError) {
        errors.push({ email, error: authError.message })
        continue
      }

      if (authData.user) {
        // 2. O Trigger handle_new_user vai criar o perfil automaticamente.
        // Precisamos apenas garantir que o perfil seja marcado como is_synthetic
        // e que os dados batam (caso o trigger não use o metadata corretamente)
        
        // Pequeno delay para garantir que o trigger rodou (opcional, mas recomendado em testes massivos)
        // await new Promise(r => setTimeout(r, 100))

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            is_synthetic: true,
            name: name,
            avatar_url: faker.image.avatar()
          })
          .eq('id', authData.user.id)

        if (!profileError) {
          createdUsers.push({ id: authData.user.id, email, name })
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