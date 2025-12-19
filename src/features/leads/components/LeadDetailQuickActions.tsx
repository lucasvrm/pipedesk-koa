import { useState } from 'react'
import { MessageCircle, Mail, Copy, Calendar, Phone, HardDrive, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleWhatsApp}
                disabled={!primaryContact?.phone}
                data-testid="quick-action-whatsapp"
                aria-label="Enviar WhatsApp"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Enviar WhatsApp</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleEmail}
                disabled={!primaryContact?.email}
                data-testid="quick-action-email"
                aria-label="Enviar E-mail"
              >
                <Mail className="h-4 w-4 text-blue-600" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Enviar E-mail</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handlePhone}
                disabled={!primaryContact?.phone}
                data-testid="quick-action-phone"
                aria-label="Ligar"
              >
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ligar</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleOpenDriveFolder}
                disabled={isDriveLoading}
                data-testid="quick-action-drive"
                aria-label="Drive"
              >
                {isDriveLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                ) : (
                  <HardDrive className="h-4 w-4 text-yellow-600" />
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Drive</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSchedule}
                data-testid="quick-action-schedule"
                aria-label="Agendar Reunião"
              >
                <Calendar className="h-4 w-4 text-orange-600" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Agendar Reunião</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyId}
                data-testid="quick-action-copy-id"
                aria-label="Copiar ID"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copiar ID</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
