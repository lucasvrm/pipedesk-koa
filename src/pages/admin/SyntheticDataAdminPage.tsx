import { useState } from 'react'
import { PageContainer } from '@/components/PageContainer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabaseClient'
import {
  Database,
  Users,
  Buildings,
  Funnel,
  Kanban,
  Trash,
  Play,
  AddressBook,
  User
} from '@phosphor-icons/react'

// Página de administração para geração e limpeza de dados sintéticos.
// Utiliza a edge function "synthetic-data-admin" para criar usuários e
// gerar/limpar dados CRM, e as stored procedures v2 no banco.
export default function SyntheticDataAdminPage() {
  const [loading, setLoading] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])

  // Parâmetros de entrada
  const [userCount, setUserCount] = useState(3)
  const [companyCount, setCompanyCount] = useState(10)
  const [leadCount, setLeadCount] = useState(10)
  const [dealCount, setDealCount] = useState(5)
  const [contactCount, setContactCount] = useState(15)
  const [playerCount, setPlayerCount] = useState(5)

  // IDs de usuários gerados
  const [generatedUserIds, setGeneratedUserIds] = useState<string[]>([])

  const log = (msg: string) => {
    const ts = new Date().toLocaleTimeString()
    setConsoleLogs(prev => [`[${ts}] ${msg}`, ...prev])
  }

  // Criação de usuários sintéticos via edge function unificada
  const handleGenerateUsers = async () => {
    if (!confirm(`Gerar ${userCount} usuários?`)) return
    setLoading(true)
    log(`Iniciando geração de usuários (Quantidade: ${userCount})...`)
    try {
      const { data, error } = await supabase.functions.invoke('synthetic-data-admin', {
        body: { action: 'create_users', count: userCount, prefix: 'synth_user' }
      })
      if (error) throw error
      log(`✅ Sucesso! Criados: ${data.created_count}`)
      if (data.users && Array.isArray(data.users)) {
        const ids = data.users.map((u: any) => u.id)
        setGeneratedUserIds(ids)
        log(`IDs capturados para uso imediato: ${ids.length}`)
      }
      if (data.errors?.length) {
        log(`⚠️ Erros: ${JSON.stringify(data.errors)}`)
      }
      toast.success(`${data.created_count} usuários criados com sucesso`)
    } catch (err: any) {
      log(`❌ Erro: ${err.message}`)
      toast.error('Falha ao gerar usuários')
    } finally {
      setLoading(false)
    }
  }

  // Geração das entidades CRM via RPC v2
  const handleGenerateCRM = async () => {
    setLoading(true)
    log('Iniciando geração de Dados CRM...')
    log(`Entradas: Empresas=${companyCount}, Leads=${leadCount}, Deals=${dealCount}, Contatos=${contactCount}, Players=${playerCount}`)
    try {
      let userIds = generatedUserIds
      if (userIds.length === 0) {
        const { data: syntheticUsers } = await supabase.from('profiles').select('id').eq('is_synthetic', true)
        userIds = syntheticUsers?.map(u => u.id) || []
      }
      if (userIds.length > 0) {
        log(`Encontrados ${userIds.length} usuários sintéticos para atribuir como responsáveis.`)
      } else {
        log('Nenhum usuário sintético solicitado ou encontrado; pulando atribuição de responsáveis.')
      }
      const payload = {
        companies_count: companyCount,
        leads_count: leadCount,
        deals_count: dealCount,
        contacts_count: contactCount,
        players_count: playerCount,
        users_ids: userIds
      }
      const { data, error } = await supabase.rpc('generate_synthetic_data_v2', { payload })
      if (error) throw error
      if (companyCount > 0 && data.companies === 0) {
        log('❌ ERRO CRÍTICO: 0 empresas criadas. Verifique constraints do banco (relationship_level, etc).')
        toast.error('Falha crítica: Nenhuma empresa foi criada. Verifique logs.')
        return
      }
      log('✅ Geração Completa!')
      log(`Empresas criadas: ${data.companies}`)
      log(`Leads criados: ${data.leads}`)
      log(`Deals criados: ${data.deals}`)
      log(`Contatos criados: ${data.contacts}`)
      log(`Players criados: ${data.players}`)
      if (data.deals > 0) {
        const { count } = await supabase.from('master_deals').select('*', { count: 'exact', head: true }).eq('is_synthetic', true)
        if (!count || count === 0) {
          log('⚠️ ALERTA: Deals foram reportados como criados, mas não encontrados no banco!')
        } else {
          log(`🔍 Verificação: ${count} deals sintéticos encontrados no banco.`)
        }
      }
      toast.success('Dados CRM gerados com sucesso')
    } catch (err: any) {
      log(`❌ Erro: ${err.message}`)
      toast.error('Falha ao gerar dados CRM')
    } finally {
      setLoading(false)
    }
  }

  // Limpeza total via RPC v2 e edge function
  const handleClearAll = async () => {
    if (!confirm('PERIGO: Isso deletará TODOS os dados sintéticos do sistema. Continuar?')) return
    setLoading(true)
    log('Iniciando limpeza...')
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('clear_synthetic_data_v2')
      if (rpcError) throw rpcError
      const { data: efData, error: efError } = await supabase.functions.invoke('synthetic-data-admin', { method: 'DELETE' })
      if (efError) throw efError
      log('✅ Limpeza Completa!')
      log(`Usuários Deletados: ${efData.deleted_count || 0}`)
      log(`Empresas Deletadas: ${rpcData.companies}`)
      log(`Leads Deletados: ${rpcData.leads}`)
      log(`Deals Deletados: ${rpcData.deals}`)
      log(`Contatos Deletados: ${rpcData.contacts}`)
      log(`Players Deletados: ${rpcData.players}`)
      const rpcTotal = Object.values(rpcData).reduce((a: any, b: any) => a + b, 0)
      const total = rpcTotal + (efData.deleted_count || 0)
      if (total === 0) {
        log('ℹ️ Nenhum dado sintético encontrado para deletar.')
        toast.info('Nenhum dado sintético encontrado para deletar.')
      } else {
        toast.success(`Limpeza finalizada. Removidos ${total} registros.`)
      }
    } catch (err: any) {
      log(`❌ Erro: ${err.message}`)
      toast.error('Falha na limpeza')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="text-primary" />
            Admin de Dados Sintéticos
          </h1>
          <p className="text-muted-foreground mt-1">
            Geração server-side de dados de teste. Determinístico e seguro.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Usuários */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} /> Identidade (Usuários)
              </CardTitle>
              <CardDescription>Cria usuários de Autenticação via Edge Function.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" min={1} max={20} value={userCount} onChange={e => setUserCount(Number(e.target.value))} />
              </div>
              <Button onClick={handleGenerateUsers} disabled={loading} className="w-full">
                Gerar Usuários
              </Button>
            </CardContent>
          </Card>
          {/* CRM */}
          <Card className="border-l-4 border-l-green-500 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Buildings size={20} /> Entidades CRM
              </CardTitle>
              <CardDescription>Gera Empresas, Leads, Deals, Contatos e Players usando RPC de banco de dados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Buildings /> Empresas</Label>
                  <Input type="number" value={companyCount} onChange={e => setCompanyCount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Funnel /> Leads</Label>
                  <Input type="number" value={leadCount} onChange={e => setLeadCount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Kanban /> Deals</Label>
                  <Input type="number" value={dealCount} onChange={e => setDealCount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><AddressBook /> Contatos</Label>
                  <Input type="number" value={contactCount} onChange={e => setContactCount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><User /> Players</Label>
                  <Input type="number" value={playerCount} onChange={e => setPlayerCount(Number(e.target.value))} />
                </div>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={handleGenerateCRM} disabled={loading} className="flex-1 border-dashed">
                  <Play className="mr-2 h-4 w-4" />
                  Gerar Dados Sintéticos
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Log */}
          <Card className="bg-slate-950 text-slate-50 border-slate-800 lg:col-span-3">
            <CardHeader className="py-3 border-b border-slate-800">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Log de execução
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[300px] overflow-y-auto font-mono text-xs">
              {consoleLogs.length === 0 ? (
                <div className="p-4 text-slate-500 italic">Pronto...</div>
              ) : (
                <div className="flex flex-col">
                  {consoleLogs.map((item, i) => (
                    <div key={i} className="px-4 py-1 border-b border-slate-800/50 hover:bg-white/5">
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Danger zone */}
          <Card className="border-l-4 border-l-red-500 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash size={20} /> Danger zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleClearAll} disabled={loading} className="w-full sm:w-auto">
                Limpar Todos os Dados Sintéticos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}