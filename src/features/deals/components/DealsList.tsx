import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MasterDeal, STATUS_LABELS, OPERATION_LABELS } from '@/lib/types'
import { formatCurrency, formatDate, isOverdue, getDaysUntil } from '@/lib/helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { Eye, WarningCircle, Briefcase } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom' // Hook para navegação

interface DealsListProps {
  deals: MasterDeal[]
  compact?: boolean
  bulkMode?: boolean
}

export default function DealsList({ deals, compact = false, bulkMode = false }: DealsListProps) {
  const { profile: currentUser } = useAuth()
  const navigate = useNavigate() // Instancia o hook

  const handleDealClick = (deal: MasterDeal) => {
    if (!bulkMode) {
      // MUDANÇA: Navega para a página em vez de setar estado
      navigate(`/deals/${deal.id}`)
    }
  }

  if (deals.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase size={64} weight="duotone" />}
        title="Nenhum negócio encontrado"
        description="Não há negócios correspondentes aos seus critérios."
      />
    )
  }

  return (
    <div className="space-y-3">
      {deals.map((deal) => {
        const daysUntil = getDaysUntil(deal.deadline)
        const overdue = isOverdue(deal.deadline)

        return (
          <div
            key={deal.id}
            className={cn(
              "flex items-center gap-4 p-4 rounded-lg border border-border bg-card transition-colors",
              !bulkMode && "hover:bg-secondary/50 cursor-pointer",
              compact && "p-3"
            )}
            onClick={() => handleDealClick(deal)}
          >
            {/* ... (Mesmo conteúdo de renderização do card) ... */}
            <div className="flex-1 min-w-0 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn("font-semibold truncate", compact ? "text-sm" : "text-base")}>
                    {deal.clientName}
                  </h3>
                  <Badge variant="secondary" className={cn("text-xs", deal.status === 'active' ? 'status-active' : '')}>
                    {STATUS_LABELS[deal.status]}
                  </Badge>
                </div>
                <div className={cn("flex flex-wrap items-center gap-3 text-muted-foreground", compact ? "text-xs" : "text-sm")}>
                  <span className="font-medium text-foreground">{formatCurrency(deal.volume)}</span>
                  <span>{OPERATION_LABELS[deal.operationType]}</span>
                  <span className="flex items-center gap-1">
                    {formatDate(deal.deadline)}
                    {overdue && <WarningCircle className="text-destructive" weight="fill" />}
                  </span>
                </div>
              </div>
            </div>

            {!compact && !bulkMode && (
              <Button variant="ghost" size="icon" onClick={(e) => {
                e.stopPropagation()
                navigate(`/deals/${deal.id}`) // Navegação explícita no botão também
              }}>
                <Eye />
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}