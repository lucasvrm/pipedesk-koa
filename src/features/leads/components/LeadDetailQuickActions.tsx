import { useState } from 'react'
import { MessageCircle, Mail, MoreVertical, CheckCircle, Pencil, Plus, ArrowLeftRight, Trash, CalendarPlus, Loader2, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { getGmailComposeUrl, cleanPhoneNumber, getWhatsAppWebUrl } from '@/utils/googleLinks'
import { getRootFolderUrl } from '@/services/driveService'

interface LeadDetailQuickActionsProps {
  leadId: string
  primaryContact?: { id?: string; name?: string; email?: string | null; phone?: string | null } | null
  canChangeOwner?: boolean
  onQualify?: () => void
  onAddTask?: () => void
  onEdit?: () => void
  onAddContact?: () => void
  onAddMember?: () => void
  onChangeOwner?: () => void
  onManageTags?: () => void
  onDelete?: () => void
}

export function LeadDetailQuickActions({ leadId, primaryContact, canChangeOwner, onQualify, onAddTask, onEdit, onAddContact, onAddMember, onChangeOwner, onManageTags, onDelete }: LeadDetailQuickActionsProps) {
  const [isDriveLoading, setIsDriveLoading] = useState(false)

  const handleAction = (action?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    action?.()
  }

  const handleWhatsApp = () => {
    if (!primaryContact?.phone) return toast.error('Telefone não disponível')
    const { cleanPhone, isValid } = cleanPhoneNumber(primaryContact.phone)
    if (!isValid) return toast.error('Telefone inválido')
    window.open(getWhatsAppWebUrl(cleanPhone), '_blank', 'noopener,noreferrer')
  }

  const handleEmail = () => {
    if (!primaryContact?.email) return toast.error('E-mail não disponível')
    window.open(getGmailComposeUrl(primaryContact.email, primaryContact.email), '_blank', 'noopener,noreferrer')
  }

  const handleOpenDrive = async () => {
    if (!leadId) return
    setIsDriveLoading(true)
    try {
      const response = await getRootFolderUrl('lead', leadId)
      if (response.url) window.open(response.url, '_blank', 'noopener,noreferrer')
      else toast.error('URL não encontrada')
    } catch { toast.error('Erro no Drive') } finally { setIsDriveLoading(false) }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleAction(onQualify)}><CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Qualificar</DropdownMenuItem>
            <DropdownMenuItem onClick={handleAction(onAddTask)}><CalendarPlus className="mr-2 h-4 w-4 text-blue-600" /> Nova Tarefa</DropdownMenuItem>
            <DropdownMenuItem onClick={handleAction(onEdit)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAction(onAddContact)}><Plus className="mr-2 h-4 w-4" /> Add Contato</DropdownMenuItem>
            <DropdownMenuItem onClick={handleAction(onChangeOwner)} disabled={!canChangeOwner}><ArrowLeftRight className="mr-2 h-4 w-4" /> Mudar Dono</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAction(onDelete)} className="text-amber-600 focus:text-amber-700 focus:bg-amber-50"><Trash className="mr-2 h-4 w-4" /> Excluir Lead</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="h-4 w-px bg-border mx-1" />
        <Tooltip><TooltipTrigger asChild><span className="inline-flex"><Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handleWhatsApp} disabled={!primaryContact?.phone}><MessageCircle className="h-4 w-4 text-green-600" /></Button></span></TooltipTrigger><TooltipContent>WhatsApp</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><span className="inline-flex"><Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handleEmail} disabled={!primaryContact?.email}><Mail className="h-4 w-4 text-blue-600" /></Button></span></TooltipTrigger><TooltipContent>E-mail</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><span className="inline-flex"><Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handleOpenDrive} disabled={isDriveLoading}>{isDriveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4 text-yellow-600" />}</Button></span></TooltipTrigger><TooltipContent>Drive</TooltipContent></Tooltip>
      </div>
    </TooltipProvider>
  )
}
