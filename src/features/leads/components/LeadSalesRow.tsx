import { useState } from 'react'
import { formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DotsThreeVertical, EnvelopeSimple, CalendarBlank, FireSimple } from '@phosphor-icons/react'
import { MessageCircle, Mail, Copy, Calendar, Phone, HardDrive, Loader2 } from 'lucide-react'
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
import { getGmailComposeUrl, cleanPhoneNumber } from '@/utils/googleLinks'
import { getDriveItems } from '@/services/driveService'
import { LeadTagsModal } from './LeadTagsModal'
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
  status,
  origin,
  createdAt,
  created_at,
  onScheduleClick
}: LeadSalesRowProps) {
  const { getLeadStatusById, leadStatuses } = useSystemMetadata()
  const updateLeadMutation = useUpdateLead()
  const [isDriveLoading, setIsDriveLoading] = useState(false)
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
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
    
    const { cleanPhone, isValid } = cleanPhoneNumber(phone)
    if (!isValid) {
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
    
    // Open Gmail compose as a popup window
    const subject = `Contato - ${safeString(legalName, 'Lead')}`
    const gmailUrl = getGmailComposeUrl(email, subject)
    window.open(gmailUrl, '_blank', 'width=800,height=600,noopener,noreferrer')
  }

  const handlePhone = (e: React.MouseEvent) => {
    e.stopPropagation()
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
      const response = await getDriveItems('lead', actualLeadId)
      
      // Try to find the folder with webViewLink or construct a reasonable fallback
      const folder = response.items.find(item => item.type === 'folder')
      if (folder?.url) {
        window.open(folder.url, '_blank', 'noopener,noreferrer')
      } else if (response.items.length > 0 && response.items[0].url) {
        // Fallback to first item's URL
        window.open(response.items[0].url, '_blank', 'noopener,noreferrer')
      } else {
        // No items yet, just inform the user
        toast.info('Pasta do Drive', {
          description: 'A pasta ainda não contém arquivos. Envie o primeiro documento.'
        })
      }
    } catch (error) {
      console.error('[LeadSalesRow] Error opening Drive folder:', error)
      toast.error('Erro ao acessar pasta do Drive', {
        description: 'Não foi possível abrir a pasta. Tente novamente.'
      })
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
      <TableCell className="w-[40px] shrink-0" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={(value) => onSelectChange?.(Boolean(value))} />
      </TableCell>

      {/* Empresa - navigates to Lead Detail */}
      <TableCell className="min-w-0">
        <TooltipProvider delayDuration={200}>
          <div className="flex items-start gap-3 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${PRIORITY_COLORS[safePriorityBucket]}`}
                >
                  <FireSimple size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left space-y-1">
                <div className="font-semibold text-primary-foreground">{PRIORITY_LABELS[safePriorityBucket]}</div>
                {priorityScore !== undefined && priorityScore !== null && (
                  <div className="text-primary-foreground/80">Score: {priorityScore}</div>
                )}
                {safePriorityDescription && (
                  <div className="text-primary-foreground/80 text-xs leading-relaxed">{safePriorityDescription}</div>
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
      <TableCell className="min-w-0" onClick={(e) => e.stopPropagation()}>
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
              {interactionType === 'email' && <EnvelopeSimple size={16} className="shrink-0" />}
              {interactionType === 'event' && <CalendarBlank size={16} className="shrink-0" />}
              <span className="truncate">
                {formatDistanceToNow(parsedLastInteractionDate, { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Nenhuma interação</div>
          )}
        </div>
      </TableCell>

      {/* Próxima ação - navigates to Lead Detail, text in red */}
      <TableCell className="min-w-0">
        {safeNextAction ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="w-4/5 max-w-full flex flex-col items-start gap-0.5 py-2 px-3 text-left">
                  <div className="flex items-baseline gap-1 max-w-full">
                    <span className="text-xs text-muted-foreground shrink-0">Ação:</span>
                    <span className="text-sm font-semibold text-destructive truncate">{safeNextActionLabel}</span>
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
          <span className="text-sm text-muted-foreground">Sem próxima ação</span>
        )}
      </TableCell>

      {/* Tags - does NOT navigate to Lead Detail */}
      <TableCell className="min-w-0" onClick={(e) => e.stopPropagation()}>
        <div 
          className="space-y-2 cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors"
          onClick={() => actualLeadId && setIsTagsModalOpen(true)}
        >
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
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>

      {/* Responsável - does NOT navigate to Lead Detail */}
      <TableCell className="min-w-0" onClick={(e) => e.stopPropagation()}>
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
        <div className="flex items-center justify-end gap-1">
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
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
                      className="h-8 w-8"
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
                      className="h-8 w-8"
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
                      className="h-8 w-8"
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
              triggerIcon={<DotsThreeVertical size={18} />}
              triggerVariant="ghost"
              triggerSize="icon"
            />
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMenuClick}>
              <DotsThreeVertical size={18} />
            </Button>
          )}
        </div>
      </TableCell>

      {/* Modals - rendered via portals so they can be inside TableRow */}
      {actualLeadId && (
        <LeadTagsModal
          open={isTagsModalOpen}
          onOpenChange={setIsTagsModalOpen}
          leadId={actualLeadId}
          leadName={safeLegalName}
        />
      )}

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
      <TableCell className="min-w-0"><Skeleton className="h-12 w-full" /></TableCell>
      <TableCell className="min-w-0"><Skeleton className="h-10 w-full" /></TableCell>
      <TableCell className="min-w-0"><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell className="min-w-0"><Skeleton className="h-10 w-full" /></TableCell>
      <TableCell className="min-w-0"><Skeleton className="h-12 w-full" /></TableCell>
      <TableCell className="min-w-0"><Skeleton className="h-8 w-full" /></TableCell>
      <TableCell className="min-w-0"><Skeleton className="h-8 w-full" /></TableCell>
      <TableCell className="w-[200px] shrink-0 whitespace-nowrap"><Skeleton className="h-8 w-full" /></TableCell>
    </TableRow>
  )
}
