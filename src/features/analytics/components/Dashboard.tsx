// src/features/analytics/components/Dashboard.tsx
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, PresentationIcon, Hand } from 'lucide-react'
import Overview from './Overview' // O arquivo que criamos no passo 1
import PlayerIntelligenceDashboard from './PlayerIntelligenceDashboard' // O componente criado anteriormente
import { PageContainer } from '@/components/PageContainer'

export default function Dashboard() {
  const { profile } = useAuth()

  return (
    <PageContainer className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Hand className="text-yellow-500" />
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
            <TrendingUp className="mr-2 h-4 w-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="intelligence">
            <PresentationIcon className="mr-2 h-4 w-4" /> Inteligência de Mercado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Overview />
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          <PlayerIntelligenceDashboard />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}