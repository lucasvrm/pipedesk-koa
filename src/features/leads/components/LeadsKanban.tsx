import { useMemo } from 'react'
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors, DragEndEvent, closestCorners } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import { cn, safeString, safeStringOptional } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

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
      const statusLabel = safeStringOptional(statusMeta?.label) || status
      toast.success(`Lead movido para ${statusLabel}`)
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

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return

    const sourceStatus = active.data.current?.status as LeadStatus | undefined
    const destinationStatus = over.data.current?.status as LeadStatus | undefined

    if (!sourceStatus || !destinationStatus || sourceStatus === destinationStatus) return

    updateStatus.mutate({ leadId: active.id as string, status: destinationStatus })
  }

  const LeadCard = ({ lead, columnStatus }: { lead: Lead; columnStatus: LeadStatus }) => {
    const owner = (lead as any).owner
    const statusMeta = getLeadStatusByCode(lead.status)
    const originMeta = getLeadOriginByCode(lead.origin)
    const legalName = safeStringOptional(lead.legalName) || 'Lead sem nome'
    const tradeName = safeStringOptional(lead.tradeName)
    const statusLabel = safeStringOptional(statusMeta?.label) || safeString(lead.status)
    const originLabel = safeStringOptional(originMeta?.label) || safeStringOptional(lead.origin) || '—'
    const ownerName = safeStringOptional(owner?.name) || '—'
    const ownerAvatar = safeStringOptional(owner?.avatar)
    const ownerInitials = ownerName.substring(0, 2).toUpperCase()
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: lead.id,
      data: { status: columnStatus },
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          'transition-all',
          isDragging ? 'rotate-1 shadow-lg scale-[1.01]' : ''
        )}
        onClick={() => navigate(`/leads/${lead.id}`)}
      >
        <Card className="border-l-4 hover:border-l-primary cursor-grab">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <h4 className="font-semibold text-sm leading-tight truncate" title={legalName}>{legalName}</h4>
                {tradeName && (
                  <p className="text-xs text-muted-foreground truncate" title={tradeName}>{tradeName}</p>
                )}
              </div>
              <Badge variant="secondary" className="text-[10px] h-5 px-2">
                {statusLabel}
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
              <span className="capitalize">{originLabel}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-medium">Responsável</span>
              {owner ? (
                <div className="flex items-center gap-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={ownerAvatar} />
                    <AvatarFallback className="text-[8px]">{ownerInitials}</AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[100px] text-foreground">{ownerName}</span>
                </div>
              ) : <span>—</span>}
            </div>
          </CardContent>
        </Card>
      </div>
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
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          {columns.map(column => (
            <SortableContext
              key={column.status}
              id={column.status}
              items={leadsByStatus[column.status]?.map(lead => lead.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn
                column={column}
                label={safeStringOptional(getLeadStatusByCode(column.status)?.label) || column.status}
                count={leadsByStatus[column.status]?.length || 0}
                isLoading={isLoading}
              >
                {leadsByStatus[column.status]?.length
                  ? leadsByStatus[column.status].map(lead => (
                      <LeadCard key={lead.id} lead={lead} columnStatus={column.status} />
                    ))
                  : <div className="text-xs text-muted-foreground text-center py-6">Nenhum lead</div>}
              </DroppableColumn>
            </SortableContext>
          ))}
        </DndContext>
      </div>
    </div>
  )
}

function DroppableColumn({
  column,
  label,
  count,
  isLoading,
  children,
}: {
  column: { status: LeadStatus; color: string }
  label: string
  count: number
  isLoading?: boolean
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
    data: { status: column.status },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-muted/30 border border-border/60 rounded-lg flex-shrink-0 w-[280px] flex flex-col min-h-[400px]',
        isOver ? 'border-primary border-dashed bg-primary/10' : '',
        column.color
      )}
    >
      <div className="p-3 border-b bg-card/60 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <Badge variant="secondary" className="text-[10px] h-5">{count}</Badge>
      </div>
      <div className="p-3 space-y-2 flex-1">
        {isLoading ? (
          <div className="text-xs text-muted-foreground">Carregando...</div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
