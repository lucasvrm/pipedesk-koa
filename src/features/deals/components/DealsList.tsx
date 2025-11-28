import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MasterDeal, STATUS_LABELS, OPERATION_LABELS, PlayerStage, STAGE_LABELS } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { Eye, PencilSimple, Trash, Users } from '@phosphor-icons/react'
import { usePlayerTracks } from '@/features/deals/hooks/usePlayerTracks' // Hook necessário

interface DealsListProps {
  deals: MasterDeal[]
  onEdit: (deal: MasterDeal) => void
  onDelete: (dealId: string) => void
  onView: (dealId: string) => void
  canEdit: boolean
  canDelete: boolean
}

// Mapa de peso dos estágios para ordenação
const STAGE_WEIGHTS: Record<PlayerStage, number> = {
  closing: 5,
  negotiation: 4,
  proposal: 3,
  analysis: 2,
  nda: 1
}

export default function DealsList({ 
  deals, 
  onEdit, 
  onDelete, 
  onView,
  canEdit, 
  canDelete 
}: DealsListProps) {
  // Buscamos todos os tracks para calcular o status mais avançado
  // (Em produção com muitos dados, isso deveria vir calculado do backend/view sql)
  const { data: allTracks } = usePlayerTracks()

  const getBestTrackStatus = (dealId: string) => {
    if (!allTracks) return null

    // 1. Filtra tracks deste deal (apenas ativos)
    const dealTracks = allTracks.filter(t => t.masterDealId === dealId && t.status !== 'cancelled')

    if (dealTracks.length === 0) return null

    // 2. Ordena pelo estágio mais avançado (peso maior primeiro)
    dealTracks.sort((a, b) => {
      const weightA = STAGE_WEIGHTS[a.currentStage] || 0
      const weightB = STAGE_WEIGHTS[b.currentStage] || 0
      return weightB - weightA // Decrescente
    })

    const bestTrack = dealTracks[0]
    const bestStage = bestTrack.currentStage
    
    // 3. Conta quantos estão nesse mesmo estágio "topo"
    const countAtBestStage = dealTracks.filter(t => t.currentStage === bestStage).length

    return {
      stage: bestStage,
      playerName: bestTrack.playerName,
      count: countAtBestStage,
      totalActive: dealTracks.length
    }
  }

  const getStageColorBadge = (stage: PlayerStage) => {
    switch (stage) {
      case 'nda': return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'analysis': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'proposal': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'negotiation': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'closing': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      default: return 'outline'
    }
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Nenhum negócio encontrado.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Operação</TableHead>
            <TableHead>Track Status</TableHead> {/* NOVA COLUNA */}
            <TableHead>Volume</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => {
            const bestTrack = getBestTrackStatus(deal.id)

            return (
              <TableRow key={deal.id}>
                <TableCell className="font-medium">
                  <div>
                    {deal.clientName}
                    {deal.company && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {deal.company.name}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal text-xs">
                    {OPERATION_LABELS[deal.operationType]}
                  </Badge>
                </TableCell>
                
                {/* CÉLULA: TRACK STATUS */}
                <TableCell>
                  {bestTrack ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] px-1.5 h-5 ${getStageColorBadge(bestTrack.stage)}`}>
                          {STAGE_LABELS[bestTrack.stage]}
                        </Badge>
                        {bestTrack.count > 1 && (
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1 rounded" title={`${bestTrack.count} players nesta fase`}>
                            +{bestTrack.count - 1}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[140px]" title={bestTrack.playerName}>
                        {bestTrack.playerName}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">-</span>
                  )}
                </TableCell>

                <TableCell>{formatCurrency(deal.volume)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(deal.deadline)}
                </TableCell>
                <TableCell>
                  <Badge variant={deal.status === 'active' ? 'default' : 'secondary'}>
                    {STATUS_LABELS[deal.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onView(deal.id)}>
                      <Eye size={16} />
                    </Button>
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => onEdit(deal)}>
                        <PencilSimple size={16} />
                      </Button>
                    )}
                    {canDelete && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => onDelete(deal.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}