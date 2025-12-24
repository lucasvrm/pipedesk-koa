import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Briefcase, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UserBadge } from '@/components/ui/user-badge'
import { safeString, safeStringOptional } from '@/lib/utils'

interface ContactInfo {
  id?: string
  name?: string
  role?: string | null
  email?: string | null
  phone?: string | null
  avatar?: string | null
}

interface ContactPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: ContactInfo | null | undefined
}

function getInitials(name?: string) {
  if (!name) return 'NA'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function ContactPreviewModal({ open, onOpenChange, contact }: ContactPreviewModalProps) {
  const navigate = useNavigate()

  if (!contact) return null

  const safeName = safeString(contact.name, 'Contato')
  const safeRole = safeStringOptional(contact.role)
  const safeEmail = safeStringOptional(contact.email)
  const safePhone = safeStringOptional(contact.phone)
  const safeAvatar = safeStringOptional(contact.avatar)

  const handleViewContact = () => {
    if (contact.id) {
      onOpenChange(false)
      navigate(`/contacts/${contact.id}`)
    }
  }

  const handleEmailClick = () => {
    if (safeEmail) {
      window.open(`mailto:${safeEmail}`, '_blank')
    }
  }

  const handlePhoneClick = () => {
    if (safePhone) {
      // Clean phone number
      const cleanPhone = safePhone.replace(/\D/g, '')
      window.open(`tel:${cleanPhone}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contato Principal
          </DialogTitle>
          <DialogDescription>
            Informações do contato associado a este lead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Header with Avatar */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <UserBadge
              name={safeName}
              avatarUrl={safeAvatar ?? undefined}
              size="lg"
              className="h-14 w-14 border-2 border-background shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{safeName}</h3>
              {safeRole && (
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {safeRole}
                </p>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            {safeEmail && (
              <button
                onClick={handleEmailClick}
                className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {safeEmail}
                  </p>
                </div>
              </button>
            )}

            {safePhone && (
              <button
                onClick={handlePhoneClick}
                className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {safePhone}
                  </p>
                </div>
              </button>
            )}

            {!safeEmail && !safePhone && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Nenhuma informação de contato adicional disponível.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {contact.id ? (
            <Button onClick={handleViewContact} className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver contato
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
