// src/features/analytics/components/Dashboard.tsx
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartLineUp, PresentationChart, HandWaving } from '@phosphor-icons/react'
import Overview from './Overview' // O arquivo que criamos no passo 1
import PlayerIntelligenceDashboard from './PlayerIntelligenceDashboard' // O componente criado anteriormente
import { PageContainer } from '@/components/PageContainer'

interface DashboardProps {
  withContainer?: boolean
}

export default function Dashboard({ withContainer = true }: DashboardProps) {
  const { profile } = useAuth()

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <HandWaving className="text-yellow-500" />
          Olá, {profile?.name?.split(' ')[0]}
        </h2>
        <p className="text-muted-foreground">Aqui está o panorama geral da sua operação hoje.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <ChartLineUp className="mr-2" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="intelligence">
            <PresentationChart className="mr-2" /> Inteligência de Mercado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Overview />
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          <PlayerIntelligenceDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )

  if (withContainer) {
    return <PageContainer className="space-y-6">{content}</PageContainer>
  }

  return content
}
