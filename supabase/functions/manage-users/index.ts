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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !caller) throw new Error('Não autorizado')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profile?.role !== 'admin') throw new Error('Acesso negado')

    const { action, userData, userId } = await req.json()
    let result

    // Helper para montar objeto de profile
    const buildProfileData = (data: any) => ({
      name: data.name,
      role: data.role,
      client_entity: data.clientEntity,
      avatar_url: data.avatar,
      cellphone: data.cellphone,
      cpf: data.cpf,
      rg: data.rg,
      address: data.address,
      pix_key_pj: data.pixKeyPJ,
      pix_key_pf: data.pixKeyPF,
      doc_identity_url: data.docIdentityUrl,
      doc_social_contract_url: data.docSocialContractUrl,
      doc_service_agreement_url: data.docServiceAgreementUrl
    })

    switch (action) {
      case 'create':
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: 'Mudar123!',
          email_confirm: true,
          user_metadata: { name: userData.name, role: userData.role }
        })
        if (createError) throw createError
        
        if (newUser.user) {
            // Update completo com todos os campos
            await supabaseAdmin.from('profiles').update(buildProfileData(userData)).eq('id', newUser.user.id)
        }
        result = newUser
        break

      case 'update':
        if (userData.email) {
            await supabaseAdmin.auth.admin.updateUserById(userId, { email: userData.email })
        }
        
        // Update completo
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update(buildProfileData(userData))
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