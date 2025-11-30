import { Draggable } from 'react-beautiful-dnd'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, WarningCircle, User } from '@phosphor-icons/react'
import { MasterDeal } from '@/lib/types' // Corrigido de Deal para MasterDeal
import { formatCurrency } from '@/lib/helpers' // Corrigido import
import { cn } from '@/lib/utils'

interface DealKanbanCardProps {
  deal: MasterDeal // Atualizado
  index: number
  onClick: (deal: MasterDeal) => void
}

export function DealKanbanCard({ deal, index, onClick }: DealKanbanCardProps) {
  // Lógica de "Rotting": Se não for atualizado há mais de 7 dias
  const updateDate = deal.updatedAt || new Date().toISOString();
  const daysSinceUpdate = Math.floor((Date.now() - new Date(updateDate).getTime()) / (1000 * 60 * 60 * 24))
  const isRotting = daysSinceUpdate > 7

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
          onClick={() => onClick(deal)}
        >
          <Card 
            className={cn(
                "cursor-pointer hover:shadow-md transition-all border-l-4",
                snapshot.isDragging ? "shadow-lg rotate-2" : "",
                // Borda muda de cor baseada na saúde do deal
                isRotting ? "border-l-red-400" : "border-l-transparent hover:border-l-primary"
            )}
          >
            <CardContent className="p-3 space-y-3">
              {/* Título e Labels */}
              <div className="flex justify-between items-start gap-2">
                <span className="font-medium text-sm line-clamp-2 leading-tight">
                    {deal.clientName}
                </span>
                {isRotting && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <WarningCircle className="text-red-400 animate-pulse" size={16} />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Sem atividade há {daysSinceUpdate} dias</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
              </div>

              {/* Empresa */}
              <div className="text-xs text-muted-foreground truncate">
                {deal.company?.name || 'Sem empresa vinculada'}
              </div>

              {/* Footer do Card: Valor e Avatar */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                <span className="font-semibold text-sm text-emerald-600">
                    {formatCurrency(deal.volume)}
                </span>
                
                <div className="flex items-center gap-2">
                    {/* Data curta */}
                    <span className={cn("text-[10px]", isRotting ? "text-red-400 font-medium" : "text-muted-foreground")}>
                        {new Date(updateDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                    
                    {/* Avatar do Dono (se existir) */}
                    {deal.createdByUser && (
                      <Avatar className="h-6 w-6 border-2 border-background" title={deal.createdByUser.name}>
                          <AvatarImage src={deal.createdByUser.avatar} />
                          <AvatarFallback className="text-[9px]">{deal.createdByUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  )
}
