import { useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query'
import { Lead, LeadStatus, LEAD_STATUS_COLORS, LEAD_STATUS_PROGRESS } from '@/lib/types'
import { updateLead } from '@/services/leadService'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Kanban } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'

interface LeadsKanbanProps {
  leads: Lead[]
  isLoading?: boolean
}

const columns: { status: LeadStatus; color: string }[] = [
  { status: 'new', color: 'border-t-blue-500' },
  { status: 'contacted', color: 'border-t-amber-500' },
  { status: 'qualified', color: 'border-t-emerald-500' },
  { status: 'disqualified', color: 'border-t-rose-500' }
]

export function LeadsKanban({ leads, isLoading }: LeadsKanbanProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { getLeadStatusByCode, getLeadOriginByCode } = useSystemMetadata()

  type UpdateContext = { previous: { key: QueryKey; data: Lead[] | undefined }[] }

  const updateStatus = useMutation<Lead, unknown, { leadId: string; status: LeadStatus }, UpdateContext>({
    mutationFn: ({ leadId, status }: { leadId: string; status: LeadStatus }) => updateLead(leadId, { status }),
    onMutate: async ({ leadId, status }) => {
      const queries = queryClient.getQueriesData<Lead[]>({ queryKey: ['leads'] })
      const previous = queries.map(([key, data]) => ({ key, data }))

      queries.forEach(([key, data]) => {
        if (!data) return
        queryClient.setQueryData<Lead[]>(key, data.map(lead => lead.id === leadId ? { ...lead, status } : lead))
      })

      return { previous }
    },
    onError: (_error, _vars, context) => {
      context?.previous?.forEach(({ key, data }) => {
        queryClient.setQueryData(key, data)
      })
      toast.error('Não foi possível mover o lead')
    },
    onSuccess: (_data, { status }) => {
      const statusMeta = getLeadStatusByCode(status)
      toast.success(`Lead movido para ${statusMeta?.label || status}`)
    },
    onSettled: (_data, _error, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads', leadId] })
    },
  })

  const leadsByStatus = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.status] = leads.filter(lead => lead.status === column.status)
      return acc
    }, {} as Record<LeadStatus, Lead[]>)
  }, [leads])

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId) return

    const newStatus = destination.droppableId as LeadStatus
    updateStatus.mutate({ leadId: draggableId, status: newStatus })
  }

  const renderLeadCard = (lead: Lead, index: number) => {
    const owner = (lead as any).owner
    const statusMeta = getLeadStatusByCode(lead.status)
    const originMeta = getLeadOriginByCode(lead.origin)
    return (
      <Draggable draggableId={lead.id} index={index} key={lead.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              'transition-all',
              snapshot.isDragging ? 'rotate-1 shadow-lg scale-[1.01]' : ''
            )}
          >
            <Card
              className="border-l-4 hover:border-l-primary cursor-grab"
              onClick={() => navigate(`/leads/${lead.id}`)}
            >
              <CardContent className="p-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-semibold text-sm leading-tight truncate" title={lead.legalName}>{lead.legalName}</h4>
                    {lead.tradeName && (
                      <p className="text-xs text-muted-foreground truncate" title={lead.tradeName}>{lead.tradeName}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5 px-2">
                    {getLeadStatusByCode(lead.status)?.label || lead.status}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Progresso</span>
                    <span className="font-semibold text-foreground">{LEAD_STATUS_PROGRESS[lead.status]}%</span>
                  </div>
                  <Progress value={LEAD_STATUS_PROGRESS[lead.status]} indicatorClassName={LEAD_STATUS_COLORS[lead.status]} />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-medium">Origem</span>
                  <span className="capitalize">{getLeadOriginByCode(lead.origin)?.label || lead.origin}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-medium">Responsável</span>
                  {owner ? (
                    <div className="flex items-center gap-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={owner.avatar} />
                        <AvatarFallback className="text-[8px]">{owner.name?.substring(0, 2)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[100px] text-foreground">{owner.name}</span>
                    </div>
                  ) : <span>-</span>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Kanban className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium text-foreground">Kanban de Leads</p>
          <p className="text-xs">Arraste os cards para atualizar o status</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map(column => (
            <Droppable droppableId={column.status} key={column.status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'bg-muted/30 border border-border/60 rounded-lg flex-shrink-0 w-[280px] flex flex-col min-h-[400px]',
                    snapshot.isDraggingOver ? 'border-primary border-dashed bg-primary/10' : '',
                    column.color
                  )}
                >
                  <div className="p-3 border-b bg-card/60 rounded-t-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{getLeadStatusByCode(column.status)?.label || column.status}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5">{leadsByStatus[column.status]?.length || 0}</Badge>
                  </div>
                  <div className="p-3 space-y-2 flex-1">
                    {isLoading ? (
                      <div className="text-xs text-muted-foreground">Carregando...</div>
                    ) : leadsByStatus[column.status]?.length ? (
                      leadsByStatus[column.status].map((lead, index) => renderLeadCard(lead, index))
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-6">Nenhum lead</div>
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>
    </div>
  )
}
