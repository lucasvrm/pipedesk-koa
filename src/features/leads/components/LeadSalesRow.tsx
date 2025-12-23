import { useMemo, useState } from 'react'
import { formatDistanceToNow, isValid, parseISO, differenceInDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle, Mail, Copy, Calendar, Phone, HardDrive, Loader2, MoreVertical, CalendarDays, Check, Plus, ListTodo } from 'lucide-react'
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { QuickAction } from '@/components/QuickActionsMenu'
import { LeadSalesViewItem } from '@/services/leadsSalesViewService'
import { Lead } from '@/lib/types'
import { safeString, safeStringOptional } from '@/lib/utils'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { useUpdateLead } from '@/services/leadService'
import { toast } from 'sonner'
import { getGmailComposeUrl, cleanPhoneNumber, getWhatsAppWebUrl } from '@/utils/googleLinks'
import { getRootFolderUrl } from '@/services/driveService'
import { DriveApiError } from '@/lib/driveClient'
import { TagsCellCompact } from './TagsCellCompact'
import { LeadContactsModal } from './LeadContactsModal'
import { OwnerActionMenu } from './OwnerActionMenu'
import { LeadPriorityBadge } from './LeadPriorityBadge'
import { calculateLeadPriority } from '../utils/calculateLeadPriority'
import { useEntityTags } from '@/services/tagService'
import { useLead } from '@/services/leadService'
import { LeadTasksModal } from './LeadTasksModal'

interface LeadSalesRowProps extends LeadSalesViewItem {
  selected?: boolean
  onSelectChange?: (selected: boolean) => void
  onClick?: () => void
  onMenuClick?: () => void
  actions?: QuickAction[]
  onScheduleClick?: (lead: Lead) => void
  columnWidths?: Record<string, number>
}

function getInitials(name?: string) {
  if (!name) return 'NA'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/**
 * Urgency levels for next action cards based on due date
 */
export type UrgencyLevel = 'urgent' | 'important' | 'normal' | 'none'

/**
 * Calculates the urgency level based on the due date
 * @param dueAt - ISO date string of when the action is due
 * @returns UrgencyLevel - urgent (overdue/today), important (1-3 days), normal (4+ days), none (no date)
 */
export function getUrgencyLevel(dueAt?: string | null): UrgencyLevel {
  if (!dueAt) return 'none'
  
  const parsedDate = parseISO(dueAt)
  if (!isValid(parsedDate)) return 'none'
  
  const today = startOfDay(new Date())
  const dueDate = startOfDay(parsedDate)
  const daysUntilDue = differenceInDays(dueDate, today)
  
  if (daysUntilDue <= 0) return 'urgent'     // Overdue or due today
  if (daysUntilDue <= 3) return 'important'  // Due in 1-3 days
  return 'normal'                             // Due in 4+ days
}

/**
 * Urgency styles configuration - WCAG 2.1 AA compliant colors
 * Each style includes border, background, and text colors for light and dark modes
 */
const URGENCY_STYLES: Record<UrgencyLevel, { border: string; bg: string; textColor: string }> = {
  urgent: {
    border: 'border-l-4 border-l-red-600',
    bg: 'bg-red-50 dark:bg-red-950/50',
    textColor: 'text-red-600 dark:text-red-400'
  },
  important: {
    border: 'border-l-4 border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    textColor: 'text-amber-600 dark:text-amber-400'
  },
  normal: {
    border: 'border-l-4 border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    textColor: 'text-blue-600 dark:text-blue-400'
  },
  none: {
    border: 'border-l-4 border-l-gray-300 dark:border-l-gray-600',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    textColor: 'text-foreground'
  }
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
  actions: _actions, // Kept for backward compatibility but actions are now handled internally
  status,
  origin,
  createdAt,
  created_at,
  onScheduleClick,
  columnWidths
}: LeadSalesRowProps) {
  // Get the actual lead ID from various possible fields
  const actualLeadId = id ?? leadId ?? lead_id

  // 1. Hooks de dados (sempre no topo)
  const { getLeadStatusById, leadStatuses } = useSystemMetadata()
  const updateLeadMutation = useUpdateLead()
  const { data: leadTags = [] } = useEntityTags(actualLeadId || '', 'lead')
  const { data: fullLead } = useLead(actualLeadId || '')

  // 2. useState
  const [isDriveLoading, setIsDriveLoading] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [tasksModalOpen, setTasksModalOpen] = useState(false)
  
  const safeNextAction = typeof nextAction?.label === 'string' ? nextAction : undefined

  // Get current status information
  const currentStatus = status ? getLeadStatusById(status) : null
  const statusLabel = currentStatus?.label ?? 'Sem status'

  // Helper to get status color with fallback
  const getStatusColor = (statusMeta: typeof currentStatus): string => {
    if (statusMeta?.color) return statusMeta.color
    
    // Fallback colors based on status code
    switch (statusMeta?.code?.toLowerCase()) {
      case 'new':
      case 'novo':
        return '#3b82f6' // blue-500
      case 'contacted':
      case 'contatado':
        return '#8b5cf6' // violet-500
      case 'qualified':
      case 'qualificado':
        return '#10b981' // green-500
      case 'proposal':
      case 'proposta':
        return '#f59e0b' // amber-500
      case 'won':
      case 'ganho':
        return '#22c55e' // green-500
      case 'lost':
      case 'perdido':
        return '#ef4444' // red-500
      default:
        return '#6b7280' // gray-500
    }
  }

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
    try {
      const phone = primaryContact?.phone
      if (!phone) {
        toast.error('Telefone não disponível', {
          description: 'O contato principal não possui telefone cadastrado'
        })
        return
      }
      
      const { cleanPhone, isValid } = cleanPhoneNumber(phone)
      if (!isValid) {
        toast.error('Telefone inválido', {
          description: 'O número de telefone não contém dígitos válidos'
        })
        return
      }
      
      // Open WhatsApp Web in a new tab
      const whatsappUrl = getWhatsAppWebUrl(cleanPhone)
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('[LeadSalesRow] Error opening WhatsApp:', error)
      toast.error('Erro ao abrir WhatsApp', {
        description: 'Não foi possível abrir o WhatsApp. Tente novamente.'
      })
    }
  }

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const email = primaryContact?.email
      if (!email) {
        toast.error('E-mail não disponível', {
          description: 'O contato principal não possui e-mail cadastrado'
        })
        return
      }
      
      // Open Gmail compose in a new tab with email as subject (as per requirement)
      const subject = email
      const gmailUrl = getGmailComposeUrl(email, subject)
      window.open(gmailUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('[LeadSalesRow] Error opening Gmail:', error)
      toast.error('Erro ao abrir e-mail', {
        description: 'Não foi possível abrir o e-mail. Tente novamente.'
      })
    }
  }

  const handlePhone = (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const phone = primaryContact?.phone
      if (!phone) {
        toast.error('Telefone não disponível', {
          description: 'O contato principal não possui telefone cadastrado'
        })
        return
      }
      
      const { cleanPhone, isValid } = cleanPhoneNumber(phone)
      if (!isValid) {
        toast.error('Telefone inválido', {
          description: 'O número de telefone não contém dígitos válidos'
        })
        return
      }
      
      // Use tel: protocol to trigger system dialer / Google Voice
      window.open(`tel:${cleanPhone}`)
    } catch (error) {
      console.error('[LeadSalesRow] Error opening phone dialer:', error)
      toast.error('Erro ao ligar', {
        description: 'Não foi possível iniciar a ligação. Tente novamente.'
      })
    }
  }

  const handleOpenDriveFolder = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!actualLeadId) {
      toast.error('ID do lead não encontrado', {
        description: 'Não foi possível abrir a pasta do Drive'
      })
      return
    }

    setIsDriveLoading(true)
    try {
      // Get root folder URL - this will create the folder hierarchy if it doesn't exist
      const response = await getRootFolderUrl('lead', actualLeadId)
      
      if (response.url) {
        // Open the root folder directly in a new tab
        window.open(response.url, '_blank', 'noopener,noreferrer')
        
        // Notify user if folder was just created
        if (response.created) {
          toast.success('Pasta criada com sucesso', {
            description: 'A estrutura de pastas do lead foi criada no Drive.'
          })
        }
      } else {
        toast.error('URL da pasta não encontrada', {
          description: 'Não foi possível obter a URL da pasta do Drive.'
        })
      }
    } catch (error) {
      console.error('[LeadSalesRow] Error opening Drive folder:', error)
      
      // Categorize error for user-friendly message
      // Check for DriveApiError with specific status codes first (most reliable)
      const isDriveApiError = error instanceof DriveApiError
      const isServiceUnavailable = isDriveApiError && error.statusCode && error.statusCode >= 500
      const isAuthError = isDriveApiError && (error.statusCode === 401 || error.statusCode === 403)
      
      // Fallback to network error detection for non-API errors (browser-level failures)
      const isNetworkError = error instanceof TypeError && 
        (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('CORS'))
      
      if (isNetworkError || isServiceUnavailable) {
        toast.error('Integração Google indisponível', {
          description: 'Não foi possível conectar ao Google Drive. Verifique sua conexão ou tente novamente mais tarde.'
        })
      } else if (isAuthError) {
        toast.error('Acesso negado ao Drive', {
          description: 'Verifique se sua conta Google está conectada corretamente.'
        })
      } else {
        toast.error('Erro ao acessar pasta do Drive', {
          description: 'Não foi possível abrir a pasta. Tente novamente.'
        })
      }
    } finally {
      setIsDriveLoading(false)
    }
  }

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!actualLeadId) {
      toast.error('ID não disponível', {
        description: 'Não foi possível copiar o ID do lead'
      })
      return
    }
    
    // Check if Clipboard API is available
    if (!navigator.clipboard) {
      // Fallback for browsers without Clipboard API
      try {
        const textArea = document.createElement('textarea')
        textArea.value = actualLeadId
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (successful) {
          toast.success('ID copiado!', {
            description: 'O ID do lead foi copiado para a área de transferência'
          })
        } else {
          throw new Error('execCommand failed')
        }
      } catch {
        toast.error('Erro ao copiar', {
          description: 'Não foi possível copiar o ID para a área de transferência'
        })
      }
      return
    }
    
    // Copy to clipboard using modern API
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

  const handleSchedule = (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      if (onScheduleClick) {
        // Create a Lead object from the current row data
        const lead: Lead = {
          id: actualLeadId!,
          legalName: legalName ?? '',
          tradeName: tradeName,
          leadStatusId: status ?? '',
          leadOriginId: origin ?? '',
          createdAt: createdAt ?? created_at ?? '',
          updatedAt: '',
          createdBy: '',
          priorityBucket: priorityBucket,
          priorityScore: priorityScore,
          priorityDescription: priorityDescription,
          lastInteractionAt: lastInteractionAt,
          nextAction: nextAction,
          owner: owner
        }
        onScheduleClick(lead)
      } else {
        // Fallback temporário
        toast.info('Integração de calendário em breve')
      }
    } catch (error) {
      console.error('[LeadSalesRow] Error in schedule handler:', error)
      toast.error('Erro ao abrir agendamento', {
        description: 'Não foi possível abrir o calendário. Tente novamente.'
      })
    }
  }

  const safeLegalName = safeString(legalName, 'Lead sem nome')
  const safeTradeName = safeStringOptional(tradeName)
  const safePrimaryContactName = safeString(primaryContact?.name, 'Contato não informado')
  const safePrimaryContactRole = safeStringOptional(primaryContact?.role)
  const safeNextActionLabel = safeNextAction ? safeString(safeNextAction.label, '—') : null
  const safeNextActionReason = safeNextAction ? safeStringOptional(safeNextAction.reason) : undefined
  const nextActionDueAt = safeNextAction?.dueAt ?? safeNextAction?.due_at ?? null
  const urgencyLevel = getUrgencyLevel(nextActionDueAt)
  const urgencyStyle = URGENCY_STYLES[urgencyLevel]
  const safeOwnerName = owner ? safeString(owner.name, 'Responsável não informado') : null

  // Compute priority using the same logic as LeadDetailPage for consistency
  const computedPriority = useMemo(() => {
    return calculateLeadPriority({
      priorityScore,
      priorityBucket,
      lastInteractionAt,
      createdAt: createdAt ?? created_at,
      leadStatusId: status
    })
  }, [priorityScore, priorityBucket, lastInteractionAt, createdAt, created_at, status])

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

  // Guard to prevent row click navigation when modal is open
  const handleRowClick = () => {
    if (isContactModalOpen) {
      return
    }
    onClick?.()
  }

  return (
    <TableRow className="group cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleRowClick}>
      <TableCell 
        className="shrink-0" 
        style={{ width: columnWidths?.checkbox ?? 40 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox checked={selected} onCheckedChange={(value) => onSelectChange?.(Boolean(value))} />
      </TableCell>

      {/* Empresa - navigates to Lead Detail */}
      <TableCell style={{ width: columnWidths?.empresa ?? 200 }}>
        <div className="flex items-start gap-3 min-w-0">
          <div onClick={(e) => e.stopPropagation()}>
            <LeadPriorityBadge
              leadId={actualLeadId}
              priorityBucket={computedPriority.bucket}
              priorityScore={computedPriority.score}
              priorityDescription={computedPriority.description}
              editable={true}
            />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="font-semibold leading-tight text-foreground truncate">{safeLegalName}</div>
            {safeTradeName ? (
              <div className="text-xs text-muted-foreground truncate">{safeTradeName}</div>
            ) : (
              tradeName && <div className="text-xs text-muted-foreground">—</div>
            )}
            {computedPriority.score !== undefined && computedPriority.score !== null && (
              <div className="text-[11px] text-muted-foreground">Score: {computedPriority.score}</div>
            )}
          </div>
        </div>
      </TableCell>

      {/* Contato principal - does NOT navigate to Lead Detail */}
      <TableCell style={{ width: columnWidths?.contato ?? 190 }} onClick={(e) => e.stopPropagation()}>
        {(() => {
          const contacts = fullLead?.contacts || []
          const primaryContactData = contacts.find(c => c.isPrimary) || contacts[0]
          const count = contacts.length

          if (count === 0) {
            return (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground gap-1"
                onClick={() => setIsContactModalOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="text-xs">Adicionar</span>
              </Button>
            )
          }

          return (
            <div className="flex items-center gap-2 min-w-0 cursor-pointer hover:bg-muted/50 rounded-md p-1.5 -m-1.5 transition-colors"
              onClick={() => setIsContactModalOpen(true)}>
              <Avatar className="h-9 w-9 border">
                <AvatarFallback>{getInitials(primaryContactData?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{primaryContactData?.name || 'Sem nome'}</div>
                {primaryContactData?.role && <div className="text-xs text-muted-foreground truncate">{primaryContactData.role}</div>}
              </div>
              {count > 1 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">+{count - 1}</Badge>
              )}
            </div>
          )
        })()}
      </TableCell>

      {/* Status - does NOT navigate to Lead Detail */}
      <TableCell style={{ width: columnWidths?.status ?? 130 }} onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                backgroundColor: `${getStatusColor(currentStatus)}20`,
                color: getStatusColor(currentStatus),
                borderLeft: `3px solid ${getStatusColor(currentStatus)}`
              }}
            >
              {statusLabel}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Alterar status
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {leadStatuses
              .filter((s) => s.isActive)
              .map((opt) => {
                const isSelected = status === opt.id
                return (
                  <DropdownMenuItem
                    key={opt.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange(opt.id)
                    }}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <span
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getStatusColor(opt) }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm">{opt.label}</span>
                      {opt.description && (
                        <p className="text-xs text-muted-foreground truncate">{opt.description}</p>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      {/* Interações - navigates to Lead Detail */}
      <TableCell style={{ width: columnWidths?.interacoes ?? 140 }}>
        <div className="space-y-1 min-w-0">
          <div className="text-xs text-muted-foreground">Última interação</div>
          {parsedLastInteractionDate ? (
            <div className="flex items-center gap-2 text-sm text-foreground">
              {interactionType === 'email' && <Mail className="h-4 w-4 shrink-0" />}
              {interactionType === 'event' && <CalendarDays className="h-4 w-4 shrink-0" />}
              <span className="truncate">
                {formatDistanceToNow(parsedLastInteractionDate, { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Nenhuma interação</div>
          )}
        </div>
      </TableCell>

      {/* Próxima ação - navigates to Lead Detail, with urgency styling */}
      <TableCell style={{ width: columnWidths?.proxima_acao ?? 180 }}>
        {safeNextAction ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className={`w-4/5 max-w-full flex flex-col items-start gap-0.5 py-2 px-3 text-left ${urgencyStyle.border} ${urgencyStyle.bg}`}
                >
                  <div className="flex items-baseline gap-1 max-w-full">
                    <span className="text-xs text-muted-foreground shrink-0">Ação:</span>
                    <span className={`text-sm font-semibold truncate ${urgencyStyle.textColor}`}>{safeNextActionLabel}</span>
                  </div>
                  {safeNextActionReason && (
                    <div className="flex items-baseline gap-1 max-w-full">
                      <span className="text-xs text-muted-foreground shrink-0">Descrição:</span>
                      <span className="text-[11px] text-muted-foreground line-clamp-1">{safeNextActionReason}</span>
                    </div>
                  )}
                </Badge>
              </TooltipTrigger>
              {safeNextActionReason && (
                <TooltipContent className="max-w-xs text-left">
                  <div className="text-primary-foreground text-sm font-semibold">Descrição</div>
                  <div className="text-primary-foreground/80 text-xs leading-relaxed">{safeNextActionReason}</div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Badge 
            variant="secondary" 
            className={`w-4/5 max-w-full flex items-center justify-center py-2 px-3 ${URGENCY_STYLES.none.border} ${URGENCY_STYLES.none.bg}`}
          >
            <span className="text-sm text-muted-foreground">Sem próxima ação</span>
          </Badge>
        )}
      </TableCell>

      {/* Tags - does NOT navigate to Lead Detail */}
      <TableCell style={{ width: columnWidths?.tags ?? 220 }} onClick={(e) => e.stopPropagation()}>
        {actualLeadId ? (
          <TagsCellCompact
            tags={leadTags}
            leadId={actualLeadId}
            leadName={safeLegalName}
          />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Responsável - does NOT navigate to Lead Detail */}
      <TableCell style={{ width: columnWidths?.responsavel ?? 160 }} onClick={(e) => e.stopPropagation()}>
        {actualLeadId ? (
          <OwnerActionMenu leadId={actualLeadId} currentOwner={owner ? { id: owner.id, name: owner.name, avatar: owner.avatar } : null}>
            <div className="flex items-center gap-2 min-w-0 cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors">
              {owner ? (
                <>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={owner.avatar || undefined} alt={safeOwnerName ?? undefined} />
                    <AvatarFallback>{getInitials(safeOwnerName ?? undefined)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium leading-tight truncate">{safeOwnerName}</div>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Sem responsável</span>
              )}
            </div>
          </OwnerActionMenu>
        ) : owner ? (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={owner.avatar || undefined} alt={safeOwnerName ?? undefined} />
              <AvatarFallback>{getInitials(safeOwnerName ?? undefined)}</AvatarFallback>
            </Avatar>
            <div className="text-sm font-medium leading-tight truncate">{safeOwnerName}</div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Sem responsável</span>
        )}
      </TableCell>

      {/* Ações - All actions consolidated in kebab menu "..." */}
      <TableCell 
        className="shrink-0 whitespace-nowrap" 
        style={{ width: columnWidths?.acoes ?? 60 }}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              data-testid="lead-actions-menu"
            >
              <MoreVertical className="h-[18px] w-[18px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={handleWhatsApp}
              disabled={!primaryContact?.phone}
              data-testid="action-whatsapp"
            >
              <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
              Enviar Whatsapp
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={handleEmail}
              disabled={!primaryContact?.email}
              data-testid="action-email"
            >
              <Mail className="mr-2 h-4 w-4 text-blue-600" />
              Enviar E-mail
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={handlePhone}
              disabled={!primaryContact?.phone}
              data-testid="action-phone"
            >
              <Phone className="mr-2 h-4 w-4" />
              Ligar
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={handleOpenDriveFolder}
              disabled={isDriveLoading}
              data-testid="action-drive"
            >
              {isDriveLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-yellow-600" />
              ) : (
                <HardDrive className="mr-2 h-4 w-4 text-yellow-600" />
              )}
              Drive
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={handleSchedule}
              data-testid="action-schedule"
            >
              <Calendar className="mr-2 h-4 w-4 text-orange-600" />
              Agendar Reunião
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation()
                setTasksModalOpen(true)
              }}
              data-testid="action-tasks"
            >
              <ListTodo className="mr-2 h-4 w-4 text-purple-600" />
              Gerenciar Tarefas
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleCopyId}
              data-testid="action-copy-id"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar ID
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={onClick}
              data-testid="action-details"
            >
              <MoreVertical className="mr-2 h-4 w-4" />
              Detalhes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      {/* Modals - rendered via portals so they can be inside TableRow */}
      {actualLeadId && (
        <>
          <LeadContactsModal
            open={isContactModalOpen}
            onOpenChange={setIsContactModalOpen}
            leadId={actualLeadId}
            leadName={safeLegalName}
            contacts={fullLead?.contacts || []}
          />
          <LeadTasksModal
            open={tasksModalOpen}
            onOpenChange={setTasksModalOpen}
            leadId={actualLeadId}
            leadName={safeLegalName}
          />
        </>
      )}
    </TableRow>
  )
}

export function LeadSalesRowSkeleton({ columnWidths }: { columnWidths?: Record<string, number> }) {
  return (
    <TableRow>
      <TableCell className="shrink-0" style={{ width: columnWidths?.checkbox ?? 40 }}><Skeleton className="h-4 w-4" /></TableCell>
      <TableCell style={{ width: columnWidths?.empresa ?? 200 }}><Skeleton className="h-12 w-full" /></TableCell>
      <TableCell style={{ width: columnWidths?.contato ?? 190 }}><Skeleton className="h-10 w-full" /></TableCell>
      <TableCell style={{ width: columnWidths?.status ?? 130 }}><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell style={{ width: columnWidths?.interacoes ?? 140 }}><Skeleton className="h-10 w-full" /></TableCell>
      <TableCell style={{ width: columnWidths?.proxima_acao ?? 180 }}><Skeleton className="h-12 w-full" /></TableCell>
      <TableCell style={{ width: columnWidths?.tags ?? 220 }}><Skeleton className="h-8 w-full" /></TableCell>
      <TableCell style={{ width: columnWidths?.responsavel ?? 160 }}><Skeleton className="h-8 w-full" /></TableCell>
      <TableCell className="shrink-0 whitespace-nowrap" style={{ width: columnWidths?.acoes ?? 60 }}><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  )
}
