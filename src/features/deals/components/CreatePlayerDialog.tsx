import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUsers } from '@/services/userService'
import { useCreateTrack } from '@/services/trackService'
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MasterDeal, PlayerStage, STAGE_LABELS } from '@/lib/types'
import { toast } from 'sonner'
import { FolderOpen } from '@phosphor-icons/react'

interface CreatePlayerDialogProps {
  masterDeal: MasterDeal
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreatePlayerDialog({ masterDeal, open, onOpenChange }: CreatePlayerDialogProps) {
  const { profile: currentUser } = useAuth()
  const { data: users } = useUsers()
  const createTrack = useCreateTrack()

  const [playerName, setPlayerName] = useState('')
  const [trackVolume, setTrackVolume] = useState(masterDeal.volume.toString())
  const [currentStage, setCurrentStage] = useState<PlayerStage>('nda')
  const [notes, setNotes] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!playerName || !trackVolume) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    createTrack.mutate({
      masterDealId: masterDeal.id,
      playerName,
      trackVolume: parseFloat(trackVolume),
      currentStage,
      probability: 0,
      responsibles: selectedTeam,
      status: 'active',
      notes,
    }, {
      onSuccess: () => {
        toast.success('Player adicionado com sucesso!')
        setPlayerName('')
        setTrackVolume(masterDeal.volume.toString())
        setCurrentStage('nda')
        setNotes('')
        setSelectedTeam([])
        onOpenChange(false)
      },
      onError: () => {
        toast.error('Erro ao adicionar player')
      }
    })
  }

  const toggleTeamMember = (userId: string) => {
    setSelectedTeam((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    )
  }

  const teamMembers = (users || []).filter(
    (u) => u.role === 'admin' || u.role === 'analyst' || u.role === 'newbusiness'
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Player</DialogTitle>
          <DialogDescription>
            Adicione um novo player/investidor para {masterDeal.clientName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="player-name">Nome do Player *</Label>
            <Input
              id="player-name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ex: Banco ABC, Fundo XYZ"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="track-volume">Volume (R$) *</Label>
              <Input
                id="track-volume"
                type="number"
                step="0.01"
                value={trackVolume}
                onChange={(e) => setTrackVolume(e.target.value)}
                placeholder="0.00"
                className="currency-input"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-stage">Estágio Atual *</Label>
              <Select value={currentStage} onValueChange={(v) => setCurrentStage(v as PlayerStage)}>
                <SelectTrigger id="current-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STAGE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre este player..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Equipe Responsável</Label>
            <div className="border border-border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {teamMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum membro de equipe disponível</p>
              ) : (
                teamMembers.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`team-${user.id}`}
                      checked={selectedTeam.includes(user.id)}
                      onCheckedChange={() => toggleTeamMember(user.id)}
                    />
                    <Label
                      htmlFor={`team-${user.id}`}
                      className="flex-1 cursor-pointer text-sm font-normal"
                    >
                      {user.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar Player</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
