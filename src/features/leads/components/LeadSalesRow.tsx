import { formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DotsThreeVertical, EnvelopeSimple, CalendarBlank, FireSimple } from '@phosphor-icons/react'
import { MessageCircle, Phone, Video, Calendar, Mail, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TableRow, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { QuickAction, QuickActionsMenu } from '@/components/QuickActionsMenu'
import { LeadSalesViewItem, LeadPriorityBucket } from '@/services/leadsSalesViewService'
import { safeString, safeStringOptional } from '@/lib/utils'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { useUpdateLead } from '@/services/leadService'
import { toast } from 'sonner'

interface LeadSalesRowProps extends LeadSalesViewItem {
  selected?: boolean
  onSelectChange?: (selected: boolean) => void
  onClick?: () => void
  onMenuClick?: () => void
  actions?: QuickAction[]
}

const PRIORITY_COLORS: Record<LeadPriorityBucket, string> = {
  hot: 'bg-destructive/20 text-destructive',
  warm: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100',
  cold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100'
}

const PRIORITY_LABELS: Record<LeadPriorityBucket, string> = {
  hot: 'Prioridade Alta',
  warm: 'Prioridade Média',
  cold: 'Prioridade Baixa'
}

function getInitials(name?: string) {
  if (!name) return 'NA'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function LeadSalesRow({
  id,
  leadId,
  lead_id,
  selected,
  onSelectChange,
  onClick,
  onMenuClick,
  priorityBucket,
  priorityScore,
  priorityDescription,
  legalName,
  tradeName,
  primaryContact,
  lastInteractionAt,
  lastInteractionType,
  nextAction,
  owner,
  tags,
  actions,
  status
}: LeadSalesRowProps) {
  const { getLeadStatusById, leadStatuses } = useSystemMetadata()
  const updateLeadMutation = useUpdateLead()
  const safeTags = tags ?? []
  const safeNextAction = typeof nextAction?.label === 'string' ? nextAction : undefined

  // Get the actual lead ID from various possible fields
  const actualLeadId = id ?? leadId ?? lead_id

  // Get current status information
  const currentStatus = status ? getLeadStatusById(status) : null
  const statusLabel = currentStatus?.label ?? 'Sem status'
  const statusColor = currentStatus?.code ?? 'default'

  // Handler for status change
  const handleStatusChange = async (newStatusId: string) => {
    if (!actualLeadId) {
      toast.error('Não foi possível atualizar o status', {
        description: 'ID do lead não encontrado'
      })
      return
    }

    // Get the new status label for user feedback
    const newStatus = getLeadStatusById(newStatusId)
    const newStatusLabel = newStatus?.label ?? 'Novo status'

    try {
      await updateLeadMutation.mutateAsync({
        id: actualLeadId,
        data: { leadStatusId: newStatusId }
      })
      
      toast.success('Status atualizado com sucesso', {
        description: `Status alterado para: ${newStatusLabel}`
      })
    } catch (error) {
      toast.error('Erro ao atualizar status', {
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde'
      })
    }
  }

  // Quick Action Handlers
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    const phone = primaryContact?.phone
    if (!phone) {
      toast.error('Telefone não disponível', {
        description: 'O contato principal não possui telefone cadastrado'
      })
      return
    }
    
    // Remove all non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone) {
      toast.error('Telefone inválido', {
        description: 'O número de telefone não contém dígitos válidos'
      })
      return
    }
    
    // Open WhatsApp in a new tab
    window.open(`https://wa.me/${cleanPhone}`, '_blank', 'noopener,noreferrer')
  }

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation()
    const email = primaryContact?.email
    if (!email) {
      toast.error('E-mail não disponível', {
        description: 'O contato principal não possui e-mail cadastrado'
      })
      return
    }
    
    // Open default email client
    window.location.href = `mailto:${email}`
  }

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!actualLeadId) {
      toast.error('ID não disponível', {
        description: 'Não foi possível copiar o ID do lead'
      })
      return
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(actualLeadId)
      .then(() => {
        toast.success('ID copiado!', {
          description: 'O ID do lead foi copiado para a área de transferência'
        })
      })
      .catch(() => {
        toast.error('Erro ao copiar', {
          description: 'Não foi possível copiar o ID para a área de transferência'
        })
      })
  }

  // Map status codes to badge variants
  const getStatusVariant = (code: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (code.toLowerCase()) {
      case 'new':
        return 'default'
      case 'contacted':
        return 'secondary'
      case 'qualified':
        return 'default'
      case 'proposal':
        return 'default'
      case 'won':
        return 'default'
      case 'lost':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const safeLegalName = safeString(legalName, 'Lead sem nome')
  const safeTradeName = safeStringOptional(tradeName)
  const safePriorityDescription = safeStringOptional(priorityDescription)
  const safePrimaryContactName = safeString(primaryContact?.name, 'Contato não informado')
  const safePrimaryContactRole = safeStringOptional(primaryContact?.role)
  const safeNextActionLabel = safeNextAction ? safeString(safeNextAction.label, '—') : null
  const safeNextActionReason = safeNextAction ? safeStringOptional(safeNextAction.reason) : undefined
  const safeOwnerName = owner ? safeString(owner.name, 'Responsável não informado') : null

  const parsedLastInteractionDate = lastInteractionAt
    ? (() => {
        const parsedDate = typeof lastInteractionAt === 'string'
          ? parseISO(lastInteractionAt)
          : new Date(lastInteractionAt)

        return isValid(parsedDate) ? parsedDate : null
      })()
    : null

  const interactionType = lastInteractionType === 'email' || lastInteractionType === 'event'
    ? lastInteractionType
    : null

  return (
    <TableRow className="group cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
      <TableCell className="w-[40px]" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={(value) => onSelectChange?.(Boolean(value))} />
      </TableCell>

      <TableCell className="w-[22%]">
        <TooltipProvider delayDuration={200}>
          <div className="flex items-start gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold ${PRIORITY_COLORS[priorityBucket]}`}
                >
                  <FireSimple size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left space-y-1">
                <div className="font-semibold text-primary-foreground">{PRIORITY_LABELS[priorityBucket]}</div>
                {priorityScore !== undefined && priorityScore !== null && (
                  <div className="text-primary-foreground/80">Score: {priorityScore}</div>
                )}
                {safePriorityDescription && (
                  <div className="text-primary-foreground/80 text-xs leading-relaxed">{safePriorityDescription}</div>
                )}
              </TooltipContent>
            </Tooltip>
            <div className="space-y-1">
              <div className="font-semibold leading-tight text-foreground">{safeLegalName}</div>
              {safeTradeName ? (
                <div className="text-xs text-muted-foreground">{safeTradeName}</div>
              ) : (
                tradeName && <div className="text-xs text-muted-foreground">—</div>
              )}
              {priorityScore !== undefined && priorityScore !== null && (
                <div className="text-[11px] text-muted-foreground">Score: {priorityScore}</div>
              )}
            </div>
          </div>
        </TooltipProvider>
      </TableCell>

      <TableCell className="w-[18%]">
        {primaryContact ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={primaryContact.avatar || undefined} alt={safePrimaryContactName} />
              <AvatarFallback>{getInitials(safePrimaryContactName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="font-medium text-sm leading-tight">{safePrimaryContactName}</div>
              {safePrimaryContactRole && <div className="text-xs text-muted-foreground">{safePrimaryContactRole}</div>}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell className="w-[18%]">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Última interação</div>
          {parsedLastInteractionDate ? (
            <div className="flex items-center gap-2 text-sm text-foreground">
              {interactionType === 'email' && <EnvelopeSimple size={16} />}
              {interactionType === 'event' && <CalendarBlank size={16} />}
              <span>
                {formatDistanceToNow(parsedLastInteractionDate, { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Nenhuma interação</div>
          )}
        </div>
      </TableCell>

      <TableCell className="w-[18%]">
        {safeNextAction ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="flex flex-col items-start gap-0.5 py-2 px-3 text-left">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Próxima ação</span>
                  <span className="text-sm font-semibold text-foreground">{safeNextActionLabel}</span>
                  {safeNextActionReason && (
                    <span className="text-[11px] text-muted-foreground line-clamp-1">{safeNextActionReason}</span>
                  )}
                </Badge>
              </TooltipTrigger>
              {safeNextActionReason && (
                <TooltipContent className="max-w-xs text-left">
                  <div className="text-primary-foreground text-sm font-semibold">Motivo</div>
                  <div className="text-primary-foreground/80 text-xs leading-relaxed">{safeNextActionReason}</div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-sm text-muted-foreground">Sem próxima ação</span>
        )}
      </TableCell>

      <TableCell className="w-[12%]">
        <div className="space-y-2">
          {safeTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {safeTags.slice(0, 3).map((tag) => {
                const safeColor = safeStringOptional(tag.color)
                return (
                  <Badge
                    key={tag.id ?? tag.name}
                    variant="outline"
                    className="text-[10px] px-2 py-0 h-5 border-muted-foreground/40"
                    style={safeColor ? { backgroundColor: `${safeColor}20`, color: safeColor } : undefined}
                  >
                    {safeString(tag.name, '—')}
                  </Badge>
                )
              })}
              {safeTags.length > 3 && (
                <span className="text-[11px] text-muted-foreground">+{safeTags.length - 3}</span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      </TableCell>

      <TableCell className="w-[10%]" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge
              variant={getStatusVariant(statusColor)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              {statusLabel}
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {leadStatuses
              .filter((s) => s.isActive)
              .map((statusOption) => (
                <DropdownMenuItem
                  key={statusOption.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusChange(statusOption.id)
                  }}
                  className={status === statusOption.id ? 'bg-accent' : ''}
                >
                  {statusOption.label}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      <TableCell className="w-[10%]">
        {owner ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={owner.avatar || undefined} alt={safeOwnerName ?? undefined} />
              <AvatarFallback>{getInitials(safeOwnerName ?? undefined)}</AvatarFallback>
            </Avatar>
            <div className="text-sm font-medium leading-tight">{safeOwnerName}</div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Sem responsável</span>
        )}
      </TableCell>

      <TableCell className="w-[120px]" onClick={(e) => e.stopPropagation()}>
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>WhatsApp</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleEmail}
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enviar E-mail</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleCopyId}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copiar ID</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </TableCell>

      <TableCell className="w-[40px] text-right" onClick={(e) => e.stopPropagation()}>
        {actions && actions.length > 0 ? (
          <QuickActionsMenu
            actions={actions}
            triggerIcon={<DotsThreeVertical size={18} />}
            triggerVariant="ghost"
            triggerSize="icon"
          />
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMenuClick}>
            <DotsThreeVertical size={18} />
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

export function LeadSalesRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="w-[40px]"><Skeleton className="h-4 w-4" /></TableCell>
      <TableCell className="w-[22%]"><Skeleton className="h-12 w-full" /></TableCell>
      <TableCell className="w-[18%]"><Skeleton className="h-10 w-full" /></TableCell>
      <TableCell className="w-[18%]"><Skeleton className="h-10 w-full" /></TableCell>
      <TableCell className="w-[18%]"><Skeleton className="h-12 w-full" /></TableCell>
      <TableCell className="w-[12%]"><Skeleton className="h-8 w-full" /></TableCell>
      <TableCell className="w-[10%]"><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell className="w-[10%]"><Skeleton className="h-8 w-full" /></TableCell>
      <TableCell className="w-[120px]"><Skeleton className="h-8 w-full" /></TableCell>
      <TableCell className="w-[40px]"><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  )
}
