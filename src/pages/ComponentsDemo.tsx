import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MetricCard } from '@/components/ui/MetricCard'
import { UpdatedTodayBadge, NewBadge, renderUpdatedTodayBadge, renderNewBadge } from '@/components/ui/ActivityBadges'
import { Users, Building, DollarSign, TrendingUp, Clock, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

/**
 * Demo page showcasing all Phase 1 UI/UX components
 * This is for demonstration purposes only
 */
export default function ComponentsDemo() {
  const today = new Date().toISOString()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Phase 1 UI/UX Components Demo</h1>
        <p className="text-muted-foreground">
          Demonstração dos componentes reutilizáveis implementados
        </p>
      </div>

      {/* EmptyState Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. EmptyState Component</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Com Primary Action</CardTitle>
            <CardDescription>Estado vazio com uma ação principal</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Nenhum contato mapeado"
              description="Adicione contatos para mapear o comitê de compra"
              primaryAction={{
                label: "Adicionar Primeiro Contato",
                onClick: () => alert('Primary action clicked!')
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Com Primary e Secondary Actions</CardTitle>
            <CardDescription>Estado vazio com duas ações</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Building className="h-12 w-12" />}
              title="Nenhum player vinculado"
              description="Vincule players para começar as apresentações"
              primaryAction={{
                label: "Vincular Player",
                onClick: () => alert('Primary action!')
              }}
              secondaryAction={{
                label: "Importar de CSV",
                onClick: () => alert('Secondary action!')
              }}
            />
          </CardContent>
        </Card>
      </section>

      {/* StatusBadge Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. StatusBadge Component</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Semantic Status Colors</CardTitle>
            <CardDescription>Badges com cores semânticas padronizadas</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <StatusBadge semanticStatus="success" label="Aprovado" />
            <StatusBadge semanticStatus="warning" label="Aguardando" />
            <StatusBadge semanticStatus="error" label="Cancelado" />
            <StatusBadge semanticStatus="info" label="Concluído" />
            <StatusBadge semanticStatus="neutral" label="Rascunho" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Com Ícones</CardTitle>
            <CardDescription>Badges com ícones para maior contexto</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <StatusBadge 
              semanticStatus="success" 
              label="Aprovado" 
              icon={<CheckCircle className="h-3 w-3" />} 
            />
            <StatusBadge 
              semanticStatus="warning" 
              label="Atenção" 
              icon={<AlertTriangle className="h-3 w-3" />} 
            />
            <StatusBadge 
              semanticStatus="error" 
              label="Erro" 
              icon={<XCircle className="h-3 w-3" />} 
            />
            <StatusBadge 
              semanticStatus="info" 
              label="Informação" 
              icon={<Info className="h-3 w-3" />} 
            />
          </CardContent>
        </Card>
      </section>

      {/* MetricCard Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. MetricCard Component</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Entity Colors</CardTitle>
            <CardDescription>Métricas com cores por tipo de entidade</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              icon={<Users className="h-3.5 w-3.5" />}
              label="Leads Ativos"
              value="42"
              color="lead"
            />
            <MetricCard
              icon={<DollarSign className="h-3.5 w-3.5" />}
              label="Volume Total"
              value="R$ 1.500.000"
              color="deal"
            />
            <MetricCard
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label="Tracks em Andamento"
              value="15"
              color="track"
            />
            <MetricCard
              icon={<Users className="h-3.5 w-3.5" />}
              label="Contatos Mapeados"
              value="128"
              color="contact"
            />
            <MetricCard
              icon={<Building className="h-3.5 w-3.5" />}
              label="Empresas Ativas"
              value="37"
              color="company"
            />
            <MetricCard
              icon={<Building className="h-3.5 w-3.5" />}
              label="Players Cadastrados"
              value="24"
              color="player"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complex Values</CardTitle>
            <CardDescription>MetricCard suporta ReactNode como valor</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              icon={<DollarSign className="h-3.5 w-3.5" />}
              label="MRR"
              value={
                <div>
                  <span>R$ 50.000</span>
                  <span className="text-sm text-muted-foreground"> / mês</span>
                </div>
              }
              color="deal"
            />
            <MetricCard
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label="Taxa de Conversão"
              value={
                <div className="flex items-baseline gap-2">
                  <span>34%</span>
                  <span className="text-sm text-green-600">↑ 5%</span>
                </div>
              }
              color="neutral"
            />
          </CardContent>
        </Card>
      </section>

      {/* ActivityBadges Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. Activity Badges</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Activity Indicators</CardTitle>
            <CardDescription>Badges para indicar atividade recente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Item atualizado hoje:</span>
              {renderUpdatedTodayBadge(today)}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">Item de ontem:</span>
              {renderUpdatedTodayBadge(yesterday) || <span className="text-muted-foreground">Sem badge</span>}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Item novo (criado agora):</span>
              {renderNewBadge(today)}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Item antigo:</span>
              {renderNewBadge(yesterday) || <span className="text-muted-foreground">Sem badge</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Com Ícones</CardTitle>
            <CardDescription>Activity badges com ícones customizados</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <UpdatedTodayBadge icon={<Clock className="h-3 w-3" />} />
            <NewBadge icon={<TrendingUp className="h-3 w-3" />} />
          </CardContent>
        </Card>
      </section>

      {/* Combined Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">5. Exemplo Combinado</h2>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>Acme Corporation</CardTitle>
                {renderNewBadge(today)}
                {renderUpdatedTodayBadge(today)}
              </div>
              <CardDescription>Empresa criada e atualizada hoje</CardDescription>
            </div>
            <StatusBadge 
              semanticStatus="success" 
              label="Ativo" 
              icon={<CheckCircle className="h-3 w-3" />}
            />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                icon={<DollarSign className="h-3.5 w-3.5" />}
                label="Volume de Deals"
                value="R$ 2.000.000"
                color="deal"
              />
              <MetricCard
                icon={<Users className="h-3.5 w-3.5" />}
                label="Contatos"
                value="12"
                color="contact"
              />
              <MetricCard
                icon={<Building className="h-3.5 w-3.5" />}
                label="Deals Ativos"
                value="5"
                color="company"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-8">
        <p>Componentes implementados como parte da Fase 1 - UI/UX Component Infrastructure</p>
        <p>Ver documentação completa em: docs/ROADMAP_PHASE1_COMPONENTS.md</p>
      </div>
    </div>
  )
}
