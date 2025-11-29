import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  HandWaving, 
  ChartLineUp, 
  PresentationChart, 
  Plus, 
  CheckSquare, 
  Bell, 
  Briefcase 
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

// Imports dos componentes internos
import AnalyticsDashboard from '@/features/analytics/components/AnalyticsDashboard'
import PlayerIntelligenceDashboard from '@/features/analytics/components/PlayerIntelligenceDashboard'
import { InboxPanel } from '@/features/inbox/components/InboxPanel' // Sugestão: trazer o Inbox para a home
import { hasPermission } from '@/lib/permissions'

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  // Verificação de permissão para exibir abas sensíveis
  const canViewAnalytics = hasPermission(profile?.role, 'VIEW_ANALYTICS')

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50/50 dark:bg-background min-h-screen">
      
      {/* --- HEADER COM AÇÕES RÁPIDAS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <HandWaving className="text-yellow-500 animate-pulse" weight="fill" />
            Olá, {profile?.name?.split(' ')[0]}
          </h2>
          <p className="text-muted-foreground mt-1">
            Aqui está o panorama da sua operação hoje, {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/deals')} variant="outline" className="hidden md:flex">
            <Briefcase className="mr-2 h-4 w-4" />
            Ver Deals
          </Button>
          <Button onClick={() => navigate('/tasks')} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* --- CARDS DE RESUMO RÁPIDO (OPERACIONAL) --- */}
      {/* Estes cards aparecem sempre, independentemente da aba, para dar contexto imediato */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/10 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/inbox')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div> {/* Ligar ao hook de notificações */}
            <p className="text-xs text-muted-foreground">3 não lidas</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/tasks')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minhas Tarefas</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div> {/* Ligar ao hook de tasks */}
            <p className="text-xs text-muted-foreground">2 vencem hoje</p>
          </CardContent>
        </Card>

        {/* Adicionar mais cards conforme necessário */}
      </div>

      {/* --- ÁREA PRINCIPAL COM ABAS --- */}
      <Tabs defaultValue={canViewAnalytics ? "analytics" : "my-work"} className="space-y-4">
        <TabsList className="bg-background border">
          {canViewAnalytics && (
            <TabsTrigger value="analytics" className="data-[state=active]:bg-muted">
              <ChartLineUp className="mr-2 h-4 w-4" /> 
              Visão Executiva
            </TabsTrigger>
          )}
          
          <TabsTrigger value="intelligence" className="data-[state=active]:bg-muted">
            <PresentationChart className="mr-2 h-4 w-4" /> 
            Inteligência de Mercado
          </TabsTrigger>

           {/* Sugestão: Uma aba focada apenas no trabalho do utilizador */}
          <TabsTrigger value="my-work" className="data-[state=active]:bg-muted">
             <CheckSquare className="mr-2 h-4 w-4" />
             Minha Mesa
          </TabsTrigger>
        </TabsList>

        {/* CONTEÚDO: ANALYTICS (Incorpora o componente complexo existente) */}
        {canViewAnalytics && (
          <TabsContent value="analytics" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
             {/* Note que o AnalyticsDashboard já tem suas próprias abas internas. 
                 Isso é aceitável aqui porque isolamos na aba "Visão Executiva" */}
             {profile && <AnalyticsDashboard currentUser={profile} />}
          </TabsContent>
        )}

        {/* CONTEÚDO: INTELIGÊNCIA */}
        <TabsContent value="intelligence" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
            <PlayerIntelligenceDashboard />
        </TabsContent>

        {/* CONTEÚDO: MINHA MESA (Sugestão de UX para operacional) */}
        <TabsContent value="my-work" className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aqui você pode renderizar versões "mini" das listas de tarefas e inbox */}
              <Card className="h-[400px]">
                <CardHeader><CardTitle>Últimas Atualizações</CardTitle></CardHeader>
                <CardContent>
                  <InboxPanel /> {/* Reutilizando o componente existente */}
                </CardContent>
              </Card>
              
              <Card className="h-[400px] flex items-center justify-center border-dashed">
                <p className="text-muted-foreground">Widget de Tarefas Rápidas (To-Do)</p>
              </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}