import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DotsThreeVertical, EnvelopeSimple, CalendarBlank, FireSimple } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TableRow, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { QuickAction, QuickActionsMenu } from '@/components/QuickActionsMenu'
import { LeadSalesViewItem, LeadPriorityBucket } from '@/services/leadsSalesViewService'

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
  actions
}: LeadSalesRowProps) {
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
                {priorityDescription && (
                  <div className="text-primary-foreground/80 text-xs leading-relaxed">{priorityDescription}</div>
                )}
              </TooltipContent>
            </Tooltip>
            <div className="space-y-1">
              <div className="font-semibold leading-tight text-foreground">{legalName}</div>
              {tradeName && <div className="text-xs text-muted-foreground">{tradeName}</div>}
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
              <AvatarImage src={primaryContact.avatar || undefined} alt={primaryContact.name} />
              <AvatarFallback>{getInitials(primaryContact.name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="font-medium text-sm leading-tight">{primaryContact.name}</div>
              {primaryContact.role && <div className="text-xs text-muted-foreground">{primaryContact.role}</div>}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell className="w-[18%]">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Última interação</div>
          {lastInteractionAt ? (
            <div className="flex items-center gap-2 text-sm text-foreground">
              {lastInteractionType === 'email' && <EnvelopeSimple size={16} />}
              {lastInteractionType === 'event' && <CalendarBlank size={16} />}
              <span>
                {formatDistanceToNow(new Date(lastInteractionAt), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Nenhuma interação</div>
          )}
        </div>
      </TableCell>

      <TableCell className="w-[18%]">
        {nextAction ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="flex flex-col items-start gap-0.5 py-2 px-3 text-left">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Próxima ação</span>
                  <span className="text-sm font-semibold text-foreground">{nextAction.label}</span>
                  {nextAction.reason && (
                    <span className="text-[11px] text-muted-foreground line-clamp-1">{nextAction.reason}</span>
                  )}
                </Badge>
              </TooltipTrigger>
              {nextAction.reason && (
                <TooltipContent className="max-w-xs text-left">
                  <div className="text-primary-foreground text-sm font-semibold">Motivo</div>
                  <div className="text-primary-foreground/80 text-xs leading-relaxed">{nextAction.reason}</div>
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
          {tags && tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id ?? tag.name}
                  variant="outline"
                  className="text-[10px] px-2 py-0 h-5 border-muted-foreground/40"
                  style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : undefined}
                >
                  {tag.name}
                </Badge>
              ))}
              {tags.length > 3 && (
                <span className="text-[11px] text-muted-foreground">+{tags.length - 3}</span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      </TableCell>

      <TableCell className="w-[10%]">
        {owner ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={owner.avatar || undefined} alt={owner.name} />
              <AvatarFallback>{getInitials(owner.name)}</AvatarFallback>
            </Avatar>
            <div className="text-sm font-medium leading-tight">{owner.name}</div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Sem responsável</span>
        )}
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
      <TableCell className="w-[40px]"><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  )
}
