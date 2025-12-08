import { useNavigate } from 'react-router-dom'
import { Lead, LeadStatus, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, LEAD_STATUS_PROGRESS } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Envelope, Phone, WhatsappLogo, Copy, CalendarBlank, Clock, User as UserIcon, Building } from '@phosphor-icons/react'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import TagSelector from '@/components/TagSelector'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'
import { getLeadQuickActions } from '@/hooks/useQuickActions'
import { useAuth } from '@/contexts/AuthContext'
import { useUpdateLead, useDeleteLead } from '@/services/leadService'
import { useEntityTags } from '@/services/tagService'

interface LeadsSalesListProps {
  leads: Lead[]
  isLoading: boolean
  selectedIds: string[]
  onSelectAll: () => void
  onSelectOne: (id: string) => void
  onEdit: (lead: Lead) => void
  onDelete: (lead: Lead) => void
}

function LeadTagsList({ leadId }: { leadId: string }) {
  const { data: tags } = useEntityTags(leadId, 'lead')

  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {tags.slice(0, 3).map(tag => (
        <Badge
          key={tag.id}
          variant="outline"
          className="text-[10px] px-1 py-0 h-4 border-0"
          style={{
            backgroundColor: `${tag.color}20`,
            color: tag.color
          }}
        >
          {tag.name}
        </Badge>
      ))}
      {tags.length > 3 && (
        <span className="text-[10px] text-muted-foreground px-1">+{tags.length - 3}</span>
      )}
    </div>
  )
}

export function LeadsSalesList({
  leads,
  isLoading,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onEdit,
  onDelete
}: LeadsSalesListProps) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()

  // Adapter for quick actions type compatibility
  const updateLeadAdapter = {
    ...updateLead,
    mutate: (vars: { leadId: string; updates: any }, options?: any) => {
      updateLead.mutate({ id: vars.leadId, data: vars.updates }, options)
    }
  } as any

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando visualização de vendas...</div>
  }

  const getPrimaryContact = (lead: Lead) => {
    return lead.contacts?.find(c => c.isPrimary) || lead.contacts?.[0]
  }

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`)
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px]">
              <Checkbox
                checked={leads.length > 0 && selectedIds.length === leads.length}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead className="w-[30%]">Empresa / Contexto</TableHead>
            <TableHead className="w-[25%]">Contato Principal</TableHead>
            <TableHead className="w-[25%]">Status & Pipeline</TableHead>
            <TableHead className="w-[15%]">Responsável</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const contact = getPrimaryContact(lead)
            const owner = (lead as any).owner
            const isSelected = selectedIds.includes(lead.id)
            const daysOpen = differenceInDays(new Date(), new Date(lead.createdAt))
            const lastUpdate = lead.updatedAt ? formatDistanceToNow(new Date(lead.updatedAt), { locale: ptBR, addSuffix: true }) : 'N/A'

            return (
              <TableRow key={lead.id} className="group cursor-pointer hover:bg-muted/50 transition-colors h-20" onClick={() => navigate(`/leads/${lead.id}`)}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isSelected} onCheckedChange={() => onSelectOne(lead.id)} />
                </TableCell>

                {/* COMPANY / CONTEXT */}
                <TableCell>
                  <div className="flex flex-col justify-center h-full space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-1.5 rounded-md text-primary shrink-0">
                        <Building size={16} weight="duotone" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block leading-tight">{lead.legalName}</span>
                        {lead.tradeName && <span className="text-xs text-muted-foreground block">{lead.tradeName}</span>}
                      </div>
                    </div>
                    <LeadTagsList leadId={lead.id} />
                  </div>
                </TableCell>

                {/* PRIMARY CONTACT */}
                <TableCell>
                  {contact ? (
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 border">
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1 w-full overflow-hidden">
                        <div
                          className="font-medium text-sm truncate hover:text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/contacts/${contact.id}`)
                          }}
                        >
                          {contact.name}
                        </div>
                        {contact.role && <div className="text-xs text-muted-foreground truncate">{contact.role}</div>}

                        {/* Quick Contact Actions */}
                        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          {contact.email && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(`mailto:${contact.email}`)}>
                                    <Envelope className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Enviar Email</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {contact.phone && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(`https://wa.me/${contact.phone?.replace(/\D/g, '')}`)}>
                                      <WhatsappLogo className="h-3.5 w-3.5 text-green-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>WhatsApp</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(contact.phone!, 'Telefone')}>
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copiar Telefone</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic flex items-center gap-2">
                      <UserIcon size={14} />
                      Sem contato principal
                    </span>
                  )}
                </TableCell>

                {/* STATUS & PIPELINE */}
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={`${LEAD_STATUS_COLORS[lead.status]} text-white border-0`}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </Badge>
                      <span className="text-[10px] font-medium text-muted-foreground">{LEAD_STATUS_PROGRESS[lead.status]}%</span>
                    </div>
                    <Progress value={LEAD_STATUS_PROGRESS[lead.status]} className="h-1.5" indicatorClassName={LEAD_STATUS_COLORS[lead.status]} />
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1" title="Data de criação">
                        <CalendarBlank size={12} />
                        <span>{daysOpen} dias</span>
                      </div>
                      <div className="flex items-center gap-1" title="Última atualização">
                        <Clock size={12} />
                        <span>{lastUpdate}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* RESPONSIBLE */}
                <TableCell>
                  {owner ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={owner.avatar || ''} />
                        <AvatarFallback className="text-[10px]">{getInitials(owner.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{owner.name.split(' ')[0]}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* ACTIONS */}
                <TableCell onClick={e => e.stopPropagation()}>
                   <div className="flex justify-end">
                      <QuickActionsMenu
                        actions={getLeadQuickActions({
                          lead,
                          navigate,
                          updateLead: updateLeadAdapter,
                          deleteLead,
                          profileId: profile?.id,
                          onEdit: () => onEdit(lead),
                        })}
                      />
                   </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
