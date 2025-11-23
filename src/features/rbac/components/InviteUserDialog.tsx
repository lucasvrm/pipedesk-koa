import { useState } from 'react'
import { useUsers } from '@/services/userService'
import { useCreateMagicLink } from '@/services/magicLinkService'
import { UserRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/types'
import { getMagicLinkUrl, getInvitationEmailBody } from '@/lib/auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EnvelopeSimple, Copy, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: any
}

export default function InviteUserDialog({
  open,
  onOpenChange,
  currentUser,
}: InviteUserDialogProps) {
  const { data: users } = useUsers()
  const createMagicLink = useCreateMagicLink()
  const [copied, setCopied] = useState(false)

  const [step, setStep] = useState<'form' | 'success'>('form')
  const [generatedLink, setGeneratedLink] = useState('')
  const [emailBody, setEmailBody] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'client' as UserRole,
    clientEntity: '',
    expirationHours: 72,
  })

  const handleInvite = () => {
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios')
      return
    }

    const existingUser = (users || []).find(u => u.email === formData.email)
    if (existingUser) {
      toast.error('Já existe um usuário com este email')
      return
    }

    // Note: This needs full user creation implementation in userService
    // For now, showing warning that this needs backend
    toast.warning('Criação de usuários requer implementação completa no backend')

    // Simulate success for demo
    setStep('success')
    setGeneratedLink('https://app.pipedesk.com/auth/magic-link?token=demo-token')
    setEmailBody(getInvitationEmailBody(
      formData.name,
      currentUser.name,
      ROLE_LABELS[formData.role],
      'https://app.pipedesk.com/auth/magic-link?token=demo-token',
      formData.expirationHours
    ))
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Erro ao copiar link')
    }
  }

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailBody)
      toast.success('Email copiado!')
    } catch (err) {
      toast.error('Erro ao copiar email')
    }
  }

  const handleClose = () => {
    setStep('form')
    setFormData({
      name: '',
      email: '',
      role: 'client',
      clientEntity: '',
      expirationHours: 72,
    })
    setGeneratedLink('')
    setEmailBody('')
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convidar Usuário</DialogTitle>
          <DialogDescription>
            Crie um link de acesso único para um novo usuário
          </DialogDescription>
        </DialogHeader>

        {step === 'form' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Nome</Label>
              <Input
                id="invite-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Função</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="analyst">Analista</SelectItem>
                  <SelectItem value="newbusiness">Novos Negócios</SelectItem>
                  <SelectItem value="client">Cliente Externo</SelectItem>
                </SelectContent>
              </Select>
              <div className="rounded-md bg-muted/50 p-3 mt-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {ROLE_DESCRIPTIONS[formData.role]}
                </p>
              </div>
            </div>

            {formData.role === 'client' && (
              <div className="space-y-2">
                <Label htmlFor="invite-entity">Empresa Cliente</Label>
                <Input
                  id="invite-entity"
                  value={formData.clientEntity}
                  onChange={(e) =>
                    setFormData({ ...formData, clientEntity: e.target.value })
                  }
                  placeholder="Nome da empresa"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="invite-expiration">Validade do Link (horas)</Label>
              <Select
                value={formData.expirationHours.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, expirationHours: parseInt(value) })
                }
              >
                <SelectTrigger id="invite-expiration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                  <SelectItem value="72">72 horas (padrão)</SelectItem>
                  <SelectItem value="168">7 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleInvite}>
                <EnvelopeSimple className="mr-2" />
                Criar Convite
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-start gap-3">
                <EnvelopeSimple className="text-success mt-1" size={20} />
                <div className="flex-1">
                  <h4 className="font-medium text-success mb-1">Convite criado!</h4>
                  <p className="text-sm text-muted-foreground">
                    O usuário {formData.name} foi adicionado ao sistema. Compartilhe o link abaixo para que ele possa acessar.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Link de Acesso</Label>
                <Badge variant="secondary">
                  Expira em {formData.expirationHours}h
                </Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                >
                  {copied ? <Check className="text-success" /> : <Copy />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Modelo de Email</Label>
              <Textarea
                value={emailBody}
                readOnly
                rows={12}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyEmail}
                className="w-full"
              >
                <Copy className="mr-2" />
                Copiar Email
              </Button>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button onClick={handleClose}>
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
