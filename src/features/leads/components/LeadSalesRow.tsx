import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDistanceToNow, isValid, parseISO, differenceInDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle, Mail, Copy, Calendar, Phone, HardDrive, Loader2, MoreVertical, Flame, CalendarDays } from 'lucide-react'
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
import { Lead } from '@/lib/types'
import { safeString, safeStringOptional } from '@/lib/utils'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { useUpdateLead } from '@/services/leadService'
import { toast } from 'sonner'
import { getGmailComposeUrl, cleanPhoneNumber, getWhatsAppWebUrl } from '@/utils/googleLinks'
import { getRootFolderUrl } from '@/services/driveService'
import { DriveApiError } from '@/lib/driveClient'
import { TagManagerPopover } from './TagManagerPopover'
import { ContactPreviewModal } from './ContactPreviewModal'
import { OwnerActionMenu } from './OwnerActionMenu'

interface LeadSalesRowProps extends LeadSalesViewItem {
  selected?: boolean
  onSelectChange?: (selected: boolean) => void
  onClick?: () => void
  onMenuClick?: () => void
  actions?: QuickAction[]
  onScheduleClick?: (lead: Lead) => void
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

const PRIORITY_TOOLTIP_COLORS: Record<LeadPriorityBucket, string> = {
  hot: 'bg-red-600 text-white',
  warm: 'bg-yellow-400 text-gray-900',
  cold: 'bg-blue-600 text-white'
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

const isConstructableResizeObserver = (() => {
  if (typeof ResizeObserver !== 'function') return false
  try {
    // eslint-disable-next-line no-new
    new ResizeObserver(() => {})
    return true
  } catch {
    return false
  }
})()

const shouldPolyfillResizeObserver = !isConstructableResizeObserver && typeof window !== 'undefined' && process.env.NODE_ENV === 'test'
const canUseResizeObserver = isConstructableResizeObserver || shouldPolyfillResizeObserver

if (shouldPolyfillResizeObserver) {
  ;(window as unknown as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

type LeadTag = NonNullable<LeadSalesViewItem['tags']>[number]

const AVERAGE_CHAR_WIDTH = 7
const TAG_HORIZONTAL_PADDING = 22
const TAG_GAP = 8
const MORE_BADGE_WIDTH = 44

export function truncateTags(tags: LeadTag[] = [], maxWidth: number): { visible: LeadTag[]; hiddenCount: number } {
  if (!tags.length) {
    return { visible: [], hiddenCount: 0 }
  }

  if (!maxWidth || maxWidth <= 0) {
    return { visible: tags, hiddenCount: 0 }
  }

  const visible: LeadTag[] = []
  let usedWidth = 0

  for (let index = 0; index < tags.length; index += 1) {
    const tag = tags[index]
    const label = safeString(tag?.name, 'Tag')
    const estimatedTagWidth = Math.min(maxWidth, label.length * AVERAGE_CHAR_WIDTH + TAG_HORIZONTAL_PADDING)
    const gap = visible.length > 0 ? TAG_GAP : 0
    const remaining = tags.length - (index + 1)
    const reservedForMore = remaining > 0 ? MORE_BADGE_WIDTH : 0

    if (usedWidth + gap + estimatedTagWidth + reservedForMore > maxWidth) {
      break
    }

    visible.push(tag)
    usedWidth += gap + estimatedTagWidth
  }

  return {
    visible,
    hiddenCount: Math.max(tags.length - visible.length, 0)
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
  actions,
  status,
  origin,
  createdAt,
  created_at,
  onScheduleClick,
  tags
}: LeadSalesRowProps) {
  const { getLeadStatusById, leadStatuses } = useSystemMetadata()
  const updateLeadMutation = useUpdateLead()
  const [isDriveLoading, setIsDriveLoading] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const safeNextAction = typeof nextAction?.label === 'string' ? nextAction : undefined
  const tagContainerRef = useRef<HTMLButtonElement | null>(null)
  const [tagColumnWidth, setTagColumnWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => {
      if (tagContainerRef.current) {
        setTagColumnWidth(tagContainerRef.current.getBoundingClientRect().width)
      }
    }

    updateWidth()

    let observer: ResizeObserver | undefined
    let resizeListenerAttached = false

    const attachWindowResize = () => {
      if (!resizeListenerAttached) {
        window.addEventListener('resize', updateWidth)
        resizeListenerAttached = true
      }
    }

    if (canUseResizeObserver && tagContainerRef.current) {
      try {
        observer = new ResizeObserver(() => updateWidth())
        observer.observe(tagContainerRef.current)
      } catch (error) {
        console.warn('[LeadSalesRow] ResizeObserver unavailable, falling back to window resize', error)
        attachWindowResize()
      }
    } else {
      attachWindowResize()
    }

    return () => {
      observer?.disconnect()
      if (resizeListenerAttached) {
        window.removeEventListener('resize', updateWidth)
      }
    }
  }, [])

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

  const safePriorityBucket: LeadPriorityBucket = priorityBucket ?? 'cold'
  const safeLegalName = safeString(legalName, 'Lead sem nome')
  const safeTradeName = safeStringOptional(tradeName)
  const safePriorityDescription = safeStringOptional(priorityDescription)
  const safePrimaryContactName = safeString(primaryContact?.name, 'Contato não informado')
  const safePrimaryContactRole = safeStringOptional(primaryContact?.role)
  const safeNextActionLabel = safeNextAction ? safeString(safeNextAction.label, '—') : null
  const safeNextActionReason = safeNextAction ? safeStringOptional(safeNextAction.reason) : undefined
  const nextActionDueAt = safeNextAction?.dueAt ?? safeNextAction?.due_at ?? null
  const urgencyLevel = getUrgencyLevel(nextActionDueAt)
  const urgencyStyle = URGENCY_STYLES[urgencyLevel]
  const safeOwnerName = owner ? safeString(owner.name, 'Responsável não informado') : null
  const normalizedTags = useMemo<LeadTag[]>(() => {
    if (!Array.isArray(tags)) return []

    return tags
      .filter((tag): tag is LeadTag => Boolean(tag && typeof tag === 'object'))
      .map((tag) => ({
        ...tag,
        name: safeString(tag.name, 'Tag'),
        color: safeStringOptional(tag.color)
      }))
  }, [tags])

  const { visible: visibleTags, hiddenCount: hiddenTagCount } = useMemo(
    () => truncateTags(normalizedTags, tagColumnWidth || 240),
    [normalizedTags, tagColumnWidth]
  )

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

  const tagTriggerContent = (
    <button
      type="button"
      ref={tagContainerRef}
      className="w-full min-w-0 rounded-md border border-transparent bg-muted/30 px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label="Gerenciar tags do lead"
    >
      <div className="flex flex-wrap items-center gap-2">
        {visibleTags.length === 0 ? (
          <Badge variant="outline" className="bg-muted text-muted-foreground text-xs font-medium">
            Tags
          </Badge>
        ) : (
          <>
            {visibleTags.map((tag) => {
              const safeColor = safeStringOptional(tag.color) ?? '#888'
              return (
                <Badge
                  key={tag.id ?? tag.name}
                  variant="secondary"
                  className="border text-xs font-medium gap-1 truncate max-w-[160px]"
                  style={{
                    backgroundColor: `${safeColor}15`,
                    color: 'hsl(var(--foreground))',
                    borderColor: safeColor,
                    borderLeftWidth: '3px'
                  }}
                >
                  <span className="truncate">{safeString(tag.name, 'Tag')}</span>
                </Badge>
              )
            })}
            {hiddenTagCount > 0 && (
              <Badge
                variant="outline"
                className="border-dashed bg-muted text-xs font-semibold text-foreground"
              >
                +{hiddenTagCount}
              </Badge>
            )}
          </>
        )}
      </div>
    </button>
  )

  return (
    <TableRow className="group cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleRowClick}>
      <TableCell className="w-[40px] shrink-0" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={(value) => onSelectChange?.(Boolean(value))} />
      </TableCell>

      {/* Empresa - navigates to Lead Detail */}
      <TableCell className="min-w-[200px] lg:w-[16%]">
        <TooltipProvider delayDuration={200}>
          <div className="flex items-start gap-3 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${PRIORITY_COLORS[safePriorityBucket]}`}
                >
                  <Flame className="h-[18px] w-[18px]" />
                </div>
              </TooltipTrigger>
              <TooltipContent className={`max-w-xs text-left space-y-1 ${PRIORITY_TOOLTIP_COLORS[safePriorityBucket]}`}>
                <div className="font-semibold">{PRIORITY_LABELS[safePriorityBucket]}</div>
                {priorityScore !== undefined && priorityScore !== null && (
                  <div className="opacity-90">Score: {priorityScore}</div>
                )}
                {safePriorityDescription && (
                  <div className="opacity-90 text-xs leading-relaxed">{safePriorityDescription}</div>
                )}
              </TooltipContent>
            </Tooltip>
            <div className="space-y-1 min-w-0">
              <div className="font-semibold leading-tight text-foreground truncate">{safeLegalName}</div>
              {safeTradeName ? (
                <div className="text-xs text-muted-foreground truncate">{safeTradeName}</div>
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

      {/* Contato principal - does NOT navigate to Lead Detail */}
      <TableCell className="min-w-[190px] lg:w-[16%]" onClick={(e) => e.stopPropagation()}>
        {primaryContact ? (
          <div 
            className="flex items-center gap-3 min-w-0 cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors"
            onClick={() => setIsContactModalOpen(true)}
          >
            <Avatar className="h-9 w-9 shrink-0 border">
              <AvatarImage src={primaryContact.avatar || undefined} alt={safePrimaryContactName} />
              <AvatarFallback>{getInitials(safePrimaryContactName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 min-w-0">
              <div className="font-medium text-sm leading-tight truncate">{safePrimaryContactName}</div>
              {safePrimaryContactRole && <div className="text-xs text-muted-foreground truncate">{safePrimaryContactRole}</div>}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Status - does NOT navigate to Lead Detail */}
      <TableCell className="min-w-0" onClick={(e) => e.stopPropagation()}>
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

      {/* Interações - navigates to Lead Detail */}
      <TableCell className="min-w-0">
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
      <TableCell className="min-w-[180px] lg:w-[14%]">
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
      <TableCell className="min-w-[220px] lg:w-[22%]" onClick={(e) => e.stopPropagation()}>
        {actualLeadId ? (
          <TagManagerPopover
            leadId={actualLeadId}
            leadName={safeLegalName}
            triggerContent={tagTriggerContent}
          />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Responsável - does NOT navigate to Lead Detail */}
      <TableCell className="min-w-[160px] lg:w-[12%]" onClick={(e) => e.stopPropagation()}>
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

      {/* Ações - quick actions + kebab menu in a single cell */}
      <TableCell className="w-[200px] shrink-0 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={handleWhatsApp}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>WhatsApp</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={handleEmail}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Gmail</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-900 hover:text-black hover:bg-gray-100"
                      onClick={handlePhone}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ligar</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                      onClick={handleOpenDriveFolder}
                      disabled={isDriveLoading}
                    >
                      {isDriveLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <HardDrive className="h-4 w-4" />
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Google Drive</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={handleSchedule}
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Agendar Reunião</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={handleCopyId}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copiar ID</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Kebab menu - always visible */}
          {actions && actions.length > 0 ? (
            <QuickActionsMenu
              actions={actions}
              triggerIcon={<MoreVertical className="h-[18px] w-[18px]" />}
              triggerVariant="ghost"
              triggerSize="icon"
            />
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMenuClick}>
              <MoreVertical className="h-[18px] w-[18px]" />
            </Button>
          )}
        </div>
      </TableCell>

      {/* Modals - rendered via portals so they can be inside TableRow */}
      {primaryContact && (
        <ContactPreviewModal
          open={isContactModalOpen}
          onOpenChange={setIsContactModalOpen}
          contact={{
            id: primaryContact.id,
            name: primaryContact.name,
            role: primaryContact.role,
            email: primaryContact.email,
            phone: primaryContact.phone,
            avatar: primaryContact.avatar,
          }}
        />
      )}
    </TableRow>
  )
}

export function LeadSalesRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="w-[40px] shrink-0"><Skeleton className="h-4 w-4" /></TableCell>
      <TableCell className="min-w-[200px] lg:w-[16%]"><Skeleton className="h-12 w-full" /></TableCell>
      <TableCell className="min-w-[190px] lg:w-[16%]"><Skeleton className="h-10 w-full" /></TableCell>
      <TableCell className="min-w-0"><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell className="min-w-0"><Skeleton className="h-10 w-full" /></TableCell>
      <TableCell className="min-w-[180px] lg:w-[14%]"><Skeleton className="h-12 w-full" /></TableCell>
      <TableCell className="min-w-[220px] lg:w-[22%]"><Skeleton className="h-8 w-full" /></TableCell>
      <TableCell className="min-w-[160px] lg:w-[12%]"><Skeleton className="h-8 w-full" /></TableCell>
      <TableCell className="w-[200px] shrink-0 whitespace-nowrap"><Skeleton className="h-8 w-full" /></TableCell>
    </TableRow>
  )
}
