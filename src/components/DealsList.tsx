import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { MasterDeal, User, STATUS_LABELS, OPERATION_LABELS } from '@/lib/types'
import { formatCurrency, formatDate, isOverdue, getDaysUntil } from '@/lib/helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Eye, 
  PencilSimple, 
  Trash,
  WarningCircle,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import DealDetailDialog from './DealDetailDialog'

interface DealsListProps {
  deals: MasterDeal[]
  compact?: boolean
}

export default function DealsList({ deals, compact = false }: DealsListProps) {
  const [selectedDeal, setSelectedDeal] = useState<MasterDeal | null>(null)
  const [currentUser] = useKV<User>('currentUser', {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    role: 'admin',
  })

  if (deals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum negócio encontrado</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {deals.map((deal) => {
          const daysUntil = getDaysUntil(deal.deadline)
          const overdue = isOverdue(deal.deadline)
          
          return (
            <div
              key={deal.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer",
                compact && "p-3"
              )}
              onClick={() => setSelectedDeal(deal)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn(
                    "font-semibold truncate",
                    compact ? "text-sm" : "text-base"
                  )}>
                    {deal.clientName}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={cn(
                      deal.status === 'active' && 'status-active',
                      deal.status === 'cancelled' && 'status-cancelled',
                      deal.status === 'concluded' && 'status-concluded',
                      "text-xs"
                    )}
                  >
                    {STATUS_LABELS[deal.status]}
                  </Badge>
                </div>
                
                <div className={cn(
                  "flex flex-wrap items-center gap-3 text-muted-foreground",
                  compact ? "text-xs" : "text-sm"
                )}>
                  <span className="font-medium text-foreground">
                    {formatCurrency(deal.volume)}
                  </span>
                  <span>{OPERATION_LABELS[deal.operationType]}</span>
                  <span className="flex items-center gap-1">
                    {overdue && <WarningCircle className="text-destructive" weight="fill" />}
                    {formatDate(deal.deadline)}
                    {deal.status === 'active' && (
                      <span className={cn(
                        "ml-1",
                        overdue ? "text-destructive" : daysUntil <= 7 ? "text-accent" : ""
                      )}>
                        ({overdue ? `${Math.abs(daysUntil)}d atrasado` : `${daysUntil}d restantes`})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {!compact && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedDeal(deal)
                    }}
                  >
                    <Eye />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedDeal && (
        <DealDetailDialog
          deal={selectedDeal}
          open={!!selectedDeal}
          onOpenChange={(open) => !open && setSelectedDeal(null)}
          currentUser={currentUser}
        />
      )}
    </>
  )
}
