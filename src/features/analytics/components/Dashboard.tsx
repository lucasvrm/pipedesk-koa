// src/features/analytics/components/Dashboard.tsx
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartLineUp, PresentationChart, HandWaving } from '@phosphor-icons/react'
import Overview from './Overview' // O arquivo que criamos no passo 1
import PlayerIntelligenceDashboard from './PlayerIntelligenceDashboard' // O componente criado anteriormente

export default function Dashboard() {
  const { profile } = useAuth()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <HandWaving className="text-yellow-500" />
            Olá, {profile?.name?.split(' ')[0]}
          </h2>
          <p className="text-muted-foreground">
            Aqui está o panorama geral da sua operação hoje.
          </p>
        </div>
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
}