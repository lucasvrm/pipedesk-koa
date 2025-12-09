import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/PageContainer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabaseClient'
import { getSystemSetting } from '@/services/settingsService'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from '@phosphor-icons/react'
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
// 
// CONFIGURAÇÃO: Todos os parâmetros de dados sintéticos (senha padrão, role, domínio de e-mail, etc.)
// são configurados em /admin/settings → Sistema → "Configurações de Dados Sintéticos".
// 
// EXECUÇÃO: Esta página permite executar a geração e limpeza de dados sintéticos usando
// a edge function "synthetic-data-admin" (para usuários) e as stored procedures v2 (para entidades CRM).
export default function SyntheticDataAdminPage() {
  const [loading, setLoading] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])

  // Parâmetros de entrada - valores padrão serão carregados de system_settings
  const [userCount, setUserCount] = useState(3)
  const [companyCount, setCompanyCount] = useState(10)
  const [leadCount, setLeadCount] = useState(10)
  const [dealCount, setDealCount] = useState(5)
  const [contactCount, setContactCount] = useState(15)
  const [playerCount, setPlayerCount] = useState(5)

  // IDs de usuários gerados
  const [generatedUserIds, setGeneratedUserIds] = useState<string[]>([])

  // Contagem atual de entidades sintéticas
  const [entityCounts, setEntityCounts] = useState({
    users: 0,
    companies: 0,
    leads: 0,
    deals: 0,
    contacts: 0,
    players: 0
  })

  const log = (msg: string) => {
    const ts = new Date().toLocaleTimeString()
    setConsoleLogs(prev => [`[${ts}] ${msg}`, ...prev])
  }

  // Load default values from system_settings on mount
  useEffect(() => {
    loadDefaultSettings()
  }, [])

  const loadDefaultSettings = async () => {
    try {
      // Load synthetic_total_users as default for userCount if configured
      const totalUsers = await getSystemSetting('synthetic_total_users')
      if (totalUsers.data !== null) {
        const value = typeof totalUsers.data === 'object' && 'value' in totalUsers.data 
          ? totalUsers.data.value 
          : totalUsers.data
        if (typeof value === 'number' && value > 0) {
          setUserCount(value)
        }
      }
      
      log('✅ Configurações carregadas de system_settings')
    } catch (err: any) {
      log(`⚠️ Não foi possível carregar configurações: ${err.message}`)
    }
  }

  // Atualiza contagem de entidades sintéticas no banco
  const handleRefreshCounts = async () => {
    setLoading(true)
    log('Atualizando contagem de entidades sintéticas...')
    try {
      const [
        { count: cUsers },
        { count: cCompanies },
        { count: cLeads },
        { count: cDeals },
        { count: cContacts },
        { count: cPlayers }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_synthetic', true),
        supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_synthetic', true),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('is_synthetic', true),
        supabase.from('master_deals').select('*', { count: 'exact', head: true }).eq('is_synthetic', true),
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('is_synthetic', true),
        supabase.from('players').select('*', { count: 'exact', head: true }).eq('is_synthetic', true)
      ])
      const counts = {
        users: cUsers || 0,
        companies: cCompanies || 0,
        leads: cLeads || 0,
        deals: cDeals || 0,
        contacts: cContacts || 0,
        players: cPlayers || 0
      }
      setEntityCounts(counts)
      log(
        `📊 Contagem atual: Usuários=${counts.users}, Empresas=${counts.companies}, Leads=${counts.leads}, Deals=${counts.deals}, Contatos=${counts.contacts}, Players=${counts.players}`
      )
      toast.success('Contagem atualizada')
    } catch (err: any) {
      log(`❌ Erro ao atualizar contagem: ${err.message}`)
      toast.error('Falha ao atualizar contagem')
    } finally {
      setLoading(false)
    }
  }

  // Estado e utilitário para modal de confirmação
  const [confirmState, setConfirmState] = useState<{
    visible: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ visible: false, title: '', message: '', onConfirm: () => {} })

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ visible: true, title, message, onConfirm })
  }

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, visible: false }))
  }

  // Ações de geração confirmadas
  const generateUsersAction = async () => {
    // Lógica original de geração de usuários
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
      closeConfirm()
    }
  }

  const generateCRMAction = async () => {
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
      closeConfirm()
    }
  }

  const clearAllAction = async () => {
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
      closeConfirm()
    }
  }

  // Handlers que exibem modal de confirmação antes de executar
  const handleGenerateUsers = () => {
    openConfirm('Gerar Usuários', `Gerar ${userCount} usuário(s) sintético(s)?`, generateUsersAction)
  }

  const handleGenerateCRM = () => {
    openConfirm(
      'Gerar Dados Sintéticos',
      `Deseja gerar Empresas=${companyCount}, Leads=${leadCount}, Deals=${dealCount}, Contatos=${contactCount}, Players=${playerCount}?`,
      generateCRMAction
    )
  }

  const handleClearAll = () => {
    openConfirm('Limpar Dados Sintéticos', 'PERIGO: Isso deletará TODOS os dados sintéticos do sistema. Continuar?', clearAllAction)
  }

  return (
    <PageContainer>
      {/* Removemos max-width para permitir largura total conforme PageContainer */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="text-primary" />
            Admin de Dados Sintéticos
          </h1>
          <p className="text-muted-foreground mt-1">
            Geração server-side de dados de teste. Determinístico e seguro.
          </p>
        </div>

        {/* Informational Alert about Settings Location */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Configuração:</strong> Parâmetros de dados sintéticos (senha padrão, role, domínio de e-mail, etc.) 
            são configurados em <strong>/admin/settings → Sistema → Configurações de Dados Sintéticos</strong>.
            <br />
            <strong>Execução:</strong> Use esta página apenas para executar a geração e limpeza de dados.
          </AlertDescription>
        </Alert>

        {/* Row 1: Usuários, CRM, Contagem */}
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
              <Button
                variant="secondary"
                onClick={handleGenerateUsers}
                disabled={loading}
                className="w-full"
              >
                Gerar Usuários
              </Button>
            </CardContent>
          </Card>
          {/* CRM */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Buildings size={20} /> Entidades CRM
              </CardTitle>
              <CardDescription>Gera Empresas, Leads, Deals, Contatos e Players usando RPC de banco de dados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Leads */}
                <div className="space-y-2">
                  <Label>Leads</Label>
                  <Input type="number" value={leadCount} onChange={e => setLeadCount(Number(e.target.value))} />
                </div>
                {/* Contatos */}
                <div className="space-y-2">
                  <Label>Contatos</Label>
                  <Input type="number" value={contactCount} onChange={e => setContactCount(Number(e.target.value))} />
                </div>
                {/* Empresas */}
                <div className="space-y-2">
                  <Label>Empresas</Label>
                  <Input type="number" value={companyCount} onChange={e => setCompanyCount(Number(e.target.value))} />
                </div>
                {/* Deals */}
                <div className="space-y-2">
                  <Label>Deals</Label>
                  <Input type="number" value={dealCount} onChange={e => setDealCount(Number(e.target.value))} />
                </div>
                {/* Players */}
                <div className="space-y-2">
                  <Label>Players</Label>
                  <Input type="number" value={playerCount} onChange={e => setPlayerCount(Number(e.target.value))} />
                </div>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="secondary"
                  onClick={handleGenerateCRM}
                  disabled={loading}
                  className="flex-1"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Gerar Dados Sintéticos
                </Button>
                {/* Botão de atualização movido para o card de contagem sintética */}
              </div>
            </CardContent>
          </Card>
          {/* Contagem Atual */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📈 Contagem Sintética
              </CardTitle>
              <CardDescription>Visão geral das entidades sintéticas atuais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Users size={16} /> Usuários</span>
                <span className="font-mono">{entityCounts.users}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Buildings size={16} /> Empresas</span>
                <span className="font-mono">{entityCounts.companies}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Funnel size={16} /> Leads</span>
                <span className="font-mono">{entityCounts.leads}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Kanban size={16} /> Deals</span>
                <span className="font-mono">{entityCounts.deals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><AddressBook size={16} /> Contatos</span>
                <span className="font-mono">{entityCounts.contacts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><User size={16} /> Players</span>
                <span className="font-mono">{entityCounts.players}</span>
              </div>
            {/* Botão para atualizar contagem colocado no card de contagem */}
            <div className="pt-3">
              <Button
                variant="secondary"
                onClick={handleRefreshCounts}
                disabled={loading}
                className="w-full"
              >
                Atualizar Contagem
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
        {/* Log e Danger zone empilhados */}
        <div className="flex flex-col gap-6">
          {/* Log */}
          <Card className="bg-slate-950 text-slate-50 border-slate-800">
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
          <Card className="border-l-4 border-l-red-500">
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
      {/* Modal de confirmação */}
      {confirmState.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-md shadow-md w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">{confirmState.title}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{confirmState.message}</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeConfirm} disabled={loading}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmState.onConfirm} disabled={loading}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}