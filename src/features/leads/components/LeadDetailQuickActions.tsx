import { useState } from 'react'
import { MessageCircle, Mail, Copy, Calendar, Phone, HardDrive, Loader2, MoreVertical, CheckCircle, Pencil, CalendarPlus, Plus, Users, ArrowLeftRight, Tag, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { getGmailComposeUrl, cleanPhoneNumber, getWhatsAppWebUrl } from '@/utils/googleLinks'
import { getRootFolderUrl } from '@/services/driveService'
import { DriveApiError } from '@/lib/driveClient'

interface PrimaryContact {
  id?: string
  name?: string
  email?: string | null
  phone?: string | null
}

interface LeadDetailQuickActionsProps {
  leadId: string
  primaryContact?: PrimaryContact | null
  onScheduleClick?: () => void
  // Kebab menu callbacks
  onQualify?: () => void
  onEdit?: () => void
  onAddMember?: () => void
  onChangeOwner?: () => void
  onManageTags?: () => void
  onAddContact?: () => void
  onAddTask?: () => void
  onDelete?: () => void
  // Permission for change owner
  canChangeOwner?: boolean
}

/**
 * LeadDetailQuickActions - Reusable quick actions for Lead Detail page
 * 
 * Provides the same quick actions as the /leads list:
 * - WhatsApp
 * - Email
 * - Phone
 * - Drive
 * - Schedule Meeting
 * - Copy ID
 */
export function LeadDetailQuickActions({
  leadId,
  primaryContact,
  onScheduleClick,
  onQualify,
  onEdit,
  onAddContact,
  onAddMember,
  onChangeOwner,
  onManageTags,
  onAddTask,
  onDelete,
  canChangeOwner = false,
}: LeadDetailQuickActionsProps) {
  const [isDriveLoading, setIsDriveLoading] = useState(false)

  const handleWhatsApp = () => {
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
    
    const whatsappUrl = getWhatsAppWebUrl(cleanPhone)
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const handleEmail = () => {
    const email = primaryContact?.email
    if (!email) {
      toast.error('E-mail não disponível', {
        description: 'O contato principal não possui e-mail cadastrado'
      })
      return
    }
    
    const subject = email
    const gmailUrl = getGmailComposeUrl(email, subject)
    window.open(gmailUrl, '_blank', 'noopener,noreferrer')
  }

  const handlePhone = () => {
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
    
    window.open(`tel:${cleanPhone}`)
  }

  const handleOpenDriveFolder = async () => {
    if (!leadId) {
      toast.error('ID do lead não encontrado', {
        description: 'Não foi possível abrir a pasta do Drive'
      })
      return
    }

    setIsDriveLoading(true)
    try {
      const response = await getRootFolderUrl('lead', leadId)
      
      if (response.url) {
        window.open(response.url, '_blank', 'noopener,noreferrer')
        
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
      console.error('[LeadDetailQuickActions] Error opening Drive folder:', error)
      
      const isDriveApiError = error instanceof DriveApiError
      const isServiceUnavailable = isDriveApiError && error.statusCode && error.statusCode >= 500
      const isAuthError = isDriveApiError && (error.statusCode === 401 || error.statusCode === 403)
      
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

  const handleCopyId = () => {
    if (!leadId) {
      toast.error('ID não disponível', {
        description: 'Não foi possível copiar o ID do lead'
      })
      return
    }
    
    if (!navigator.clipboard) {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = leadId
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
    
    navigator.clipboard.writeText(leadId)
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

  const handleSchedule = () => {
    if (onScheduleClick) {
      onScheduleClick()
    } else {
      toast.info('Integração de calendário em breve')
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap gap-2">
        {/* Kebab Menu - Dropdown de ações secundárias */}
        <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                data-testid="quick-action-kebab"
                aria-label="Mais ações"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {/* Ações do Lead */}
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            {onQualify && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQualify() }}>
                <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                Qualificar
              </DropdownMenuItem>
            )}
            {onAddTask && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddTask() }}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Adicionar Tarefa
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit() }}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}

            {/* Gerenciar */}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>
            {onAddContact && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddContact() }}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Contato
              </DropdownMenuItem>
            )}
            {onAddMember && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddMember() }}>
                <Users className="mr-2 h-4 w-4" />
                Adicionar Membro
              </DropdownMenuItem>
            )}
            {onChangeOwner && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onChangeOwner() }}
                disabled={!canChangeOwner}
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Alterar Responsável
              </DropdownMenuItem>
            )}

            {/* Organização */}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Organização</DropdownMenuLabel>
            {onManageTags && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onManageTags() }}>
                <Tag className="mr-2 h-4 w-4" />
                Gerenciar Tags
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                  className="text-amber-600 hover:text-amber-700 focus:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-red-900/20"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Excluir Lead
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleWhatsApp}
                disabled={!primaryContact?.phone}
                data-testid="quick-action-whatsapp"
                aria-label="Enviar WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                <span>WhatsApp</span>
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Enviar WhatsApp para o contato principal</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleEmail}
                disabled={!primaryContact?.email}
                data-testid="quick-action-email"
                aria-label="Enviar E-mail"
              >
                <Mail className="h-3.5 w-3.5 text-blue-600" />
                <span>E-mail</span>
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Enviar e-mail para o contato principal</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handlePhone}
                disabled={!primaryContact?.phone}
                data-testid="quick-action-phone"
                aria-label="Ligar"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Ligar</span>
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ligar para o contato principal</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleOpenDriveFolder}
                disabled={isDriveLoading}
                data-testid="quick-action-drive"
                aria-label="Drive"
              >
                {isDriveLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-600" />
                ) : (
                  <HardDrive className="h-3.5 w-3.5 text-yellow-600" />
                )}
                <span>Drive</span>
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Abrir pasta do lead no Drive</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleSchedule}
                data-testid="quick-action-schedule"
                aria-label="Agendar Reunião"
              >
                <Calendar className="h-3.5 w-3.5 text-orange-600" />
                <span>Agendar</span>
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Agendar reunião</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleCopyId}
                data-testid="quick-action-copy-id"
                aria-label="Copiar ID"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar ID</span>
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copiar ID do lead</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
