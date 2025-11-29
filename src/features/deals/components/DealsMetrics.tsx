import { Card, CardContent } from '@/components/ui/card'
import { MasterDeal, PlayerTrack, PlayerStage } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import { TrendUp, Money, Handshake } from '@phosphor-icons/react'

interface DealsMetricsProps {
  deals: MasterDeal[]
  tracks: PlayerTrack[]
}

export function DealsMetrics({ deals, tracks }: DealsMetricsProps) {
  // Apenas deals ativos contam para o pipeline
  const activeDeals = deals.filter(d => d.status === 'active')
  
  // 1. Volume Total em Pipeline
  const totalVolume = activeDeals.reduce((acc, curr) => acc + (Number(curr.volume) || 0), 0)
  
  // 2. Ticket Médio
  const avgTicket = activeDeals.length > 0 ? totalVolume / activeDeals.length : 0
  
  // 3. Deals em Fechamento (Closing)
  // Lógica: Deal ativo E (pelo menos um track em 'closing' OU status do deal 'active')
  // Vamos ser mais específicos: Deals que têm pelo menos um player na fase 'closing'
  const closingDealsCount = activeDeals.filter(deal => {
    const dealTracks = tracks.filter(t => t.masterDealId === deal.id && t.status === 'active')
    return dealTracks.some(t => t.currentStage === 'closing' || t.currentStage === 'negotiation')
  }).length

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-6 flex items-center justify-between space-y-0">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Volume em Pipeline</p>
            <p className="text-2xl font-bold">{formatCurrency(totalVolume)}</p>
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Money size={32} weight="duotone" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-6 flex items-center justify-between space-y-0">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Em Negociação/Fechamento</p>
            <p className="text-2xl font-bold">{closingDealsCount}</p>
          </div>
          <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600">
            <Handshake size={32} weight="duotone" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-6 flex items-center justify-between space-y-0">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ticket Médio</p>
            <p className="text-2xl font-bold">{formatCurrency(avgTicket)}</p>
          </div>
          <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
            <TrendUp size={32} weight="duotone" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}