import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/PageContainer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { syntheticDataService } from '@/services/syntheticDataService'
import { useAuth } from '@/contexts/AuthContext'
import {
  Database,
  Users,
  Buildings,
  Funnel,
  Kanban,
  Trash,
  Play,
  RefreshCw,
  Warning
} from '@phosphor-icons/react'

interface SyntheticCounts {
  users: number
  companies: number
  leads: number
  deals: number
  contacts: number
}

export default function SyntheticDataAdminPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [counts, setCounts] = useState<SyntheticCounts>({
    users: 0,
    companies: 0,
    leads: 0,
    deals: 0,
    contacts: 0
  })

  // Form states
  const [userCount, setUserCount] = useState(5)
  const [companyCount, setCompanyCount] = useState(10)
  const [leadCount, setLeadCount] = useState(10)
  const [dealCount, setDealCount] = useState(5)

  const fetchCounts = async () => {
    try {
      const data = await syntheticDataService.fetchRealCounts()
      setCounts({
        users: data.users,
        companies: data.companies,
        leads: data.leads,
        deals: data.deals,
        contacts: data.contacts
      })
    } catch (error) {
      console.error('Error fetching counts:', error)
      toast.error('Erro ao carregar contagens')
    }
  }

  useEffect(() => {
    fetchCounts()
  }, [])

  const handleGenerateUsers = async () => {
    if (!confirm(`Gerar ${userCount} usuários? Isso pode levar alguns segundos.`)) return

    setLoading(true)
    try {
      const { count, logs } = await syntheticDataService.generateUsers(userCount)
      toast.success(`${count} usuários gerados com sucesso!`)
      console.log('Logs:', logs)
      await fetchCounts()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao gerar usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCompanies = async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { count } = await syntheticDataService.generateCompanies(companyCount, profile.id, true)
      toast.success(`${count} empresas geradas com sucesso!`)
      await fetchCounts()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao gerar empresas')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateLeads = async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { count } = await syntheticDataService.generateLeads(leadCount, profile.id, true)
      toast.success(`${count} leads gerados com sucesso!`)
      await fetchCounts()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao gerar leads')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDeals = async () => {
    setLoading(true)
    try {
      const { count } = await syntheticDataService.generateDeals(dealCount, true)
      toast.success(`${count} deals gerados com sucesso!`)
      await fetchCounts()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao gerar deals. Verifique se existem usuários e empresas.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('ATENÇÃO: Isso apagará TODOS os dados marcados como sintéticos do sistema. Deseja continuar?')) return

    setLoading(true)
    try {
      const result = await syntheticDataService.clearAllSyntheticData()
      if (result.success) {
        toast.success('Dados sintéticos removidos com sucesso!')
        await fetchCounts()
      } else {
        toast.error('Erro ao limpar dados: ' + result.error)
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro crítico ao limpar dados')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="text-primary" />
            Dados Sintéticos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gere dados de teste para validar funcionalidades e layouts.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={fetchCounts} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar Contagem
            </Button>
            <Button variant="destructive" onClick={handleClearAll} disabled={loading}>
                <Trash className="mr-2 h-4 w-4" />
                Limpar Tudo
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Usuários (Auth + Profile)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{counts.users}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Empresas</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{counts.companies}</div>
                <p className="text-xs text-muted-foreground">+ {counts.contacts} contatos</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Leads</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{counts.leads}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Deals (Master)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{counts.deals}</div>
            </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Play size={20} />
        Geradores
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        {/* USERS */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users size={20} /> Usuários
                </CardTitle>
                <CardDescription>Cria usuários na tabela auth.users e profiles.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-end gap-4">
                    <div className="space-y-2 flex-1">
                        <Label>Quantidade</Label>
                        <Input
                            type="number"
                            min={1}
                            max={50}
                            value={userCount}
                            onChange={(e) => setUserCount(Number(e.target.value))}
                        />
                    </div>
                    <Button onClick={handleGenerateUsers} disabled={loading}>
                        Gerar
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* COMPANIES */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Buildings size={20} /> Empresas
                </CardTitle>
                <CardDescription>Cria empresas e contatos vinculados.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-end gap-4">
                    <div className="space-y-2 flex-1">
                        <Label>Quantidade</Label>
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={companyCount}
                            onChange={(e) => setCompanyCount(Number(e.target.value))}
                        />
                    </div>
                    <Button onClick={handleGenerateCompanies} disabled={loading}>
                        Gerar
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* LEADS */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Funnel size={20} /> Leads
                </CardTitle>
                <CardDescription>Cria leads com origem e status variados.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-end gap-4">
                    <div className="space-y-2 flex-1">
                        <Label>Quantidade</Label>
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={leadCount}
                            onChange={(e) => setLeadCount(Number(e.target.value))}
                        />
                    </div>
                    <Button onClick={handleGenerateLeads} disabled={loading}>
                        Gerar
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* DEALS */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Kanban size={20} /> Deals
                </CardTitle>
                <CardDescription>Cria deals associados a usuários e empresas existentes.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-end gap-4">
                    <div className="space-y-2 flex-1">
                        <Label>Quantidade</Label>
                        <Input
                            type="number"
                            min={1}
                            max={50}
                            value={dealCount}
                            onChange={(e) => setDealCount(Number(e.target.value))}
                        />
                    </div>
                    <Button onClick={handleGenerateDeals} disabled={loading}>
                        Gerar
                    </Button>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs rounded border border-yellow-200 dark:border-yellow-900 flex items-start gap-2">
                    <Warning className="shrink-0 mt-0.5" />
                    <p>Requer usuários e empresas já criados no banco para vincular.</p>
                </div>
            </CardContent>
        </Card>

      </div>
    </PageContainer>
  )
}
