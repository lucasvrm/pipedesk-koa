import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { magicLinkService } from '@/services/magicLinkService'
import { User, ROLE_LABELS } from '@/lib/types'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
}

export default function InviteUserDialog({
  open,
  onOpenChange,
  currentUser,
}: InviteUserDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<string>('client')
  const [loading, setLoading] = useState(false)

  const handleInvite = async () => {
    if (!email) {
      toast.error('Email é obrigatório')
      return
    }

    setLoading(true)
    try {
      // In a real app, this would create a user in Supabase Auth
      // and send an email. For this demo, we'll simulate it.
      
      // We can use the magic link service to generate a link manually for now
      // assuming the user exists or will be created by the admin first
      
      // For the purpose of this demo, we'll just show success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(`Convite enviado para ${email}`)
      onOpenChange(false)
      setEmail('')
      setRole('client')
    } catch (error) {
      toast.error('Erro ao enviar convite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Convidar Usuário</DialogTitle>
          <DialogDescription>
            Envie um email de convite para um novo usuário acessar o sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colaborador@empresa.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Função</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                {/* Populando com as labels traduzidas */}
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleInvite} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Convite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}