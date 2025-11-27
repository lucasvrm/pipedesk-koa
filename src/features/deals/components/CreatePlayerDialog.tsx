import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUsers } from '@/services/userService'
import { useCreateTrack } from '@/services/trackService'
import { usePlayers, useCreatePlayer } from '@/services/playerService'
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
import { ArrowLeft, Plus } from '@phosphor-icons/react'
import { PlayerSelect } from '@/components/PlayerSelect' // Certifique-se que o caminho está correto

interface CreatePlayerDialogProps {
  masterDeal: MasterDeal
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreatePlayerDialog({ masterDeal, open, onOpenChange }: CreatePlayerDialogProps) {
  const { profile: currentUser } = useAuth()
  
  // Hooks de dados
  const { data: users } = useUsers()
  const { data: existingPlayers } = usePlayers() // Busca para recuperar o nome pelo ID selecionado
  
  // Hooks de mutação
  const createTrack = useCreateTrack()
  const createPlayerMutation = useCreatePlayer()

  // Estados do Formulário
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  
  const [trackVolume, setTrackVolume] = useState(masterDeal.volume.toString())
  const [currentStage, setCurrentStage] = useState<PlayerStage>('nda')
  const [notes, setNotes] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string[]>([])

  const resetForm = () => {
    setIsCreatingNew(false)
    setSelectedPlayerId('')
    setNewPlayerName('')
    setTrackVolume(masterDeal.volume.toString())
    setCurrentStage('nda')
    setNotes('')
    setSelectedTeam([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!trackVolume) {
      toast.error('O volume é obrigatório')
      return
    }

    let finalPlayerId = selectedPlayerId
    let finalPlayerName = ''

    try {
      // Cenário 1: Criando um novo Player no banco antes de criar o Track
      if (isCreatingNew) {
        if (!newPlayerName.trim()) {
          toast.error('Nome do player é obrigatório')
          return
        }

        if (!currentUser) {
          toast.error('Usuário não autenticado')
          return
        }

        const newPlayer = await createPlayerMutation.mutateAsync({
          data: {
            name: newPlayerName,
            type: 'other', // Padrão, pode ser editado depois na tela do player
            relationshipLevel: 'none'
          },
          userId: currentUser.id
        })

        finalPlayerId = newPlayer.id
        finalPlayerName = newPlayer.name
      
      } else {
        // Cenário 2: Usando Player Existente
        if (!selectedPlayerId) {
          toast.error('Selecione um player')
          return
        }
        
        const selectedPlayer = existingPlayers?.find(p => p.id === selectedPlayerId)
        if (!selectedPlayer) {
          toast.error('Player selecionado inválido')
          return
        }
        
        finalPlayerId = selectedPlayer.id
        finalPlayerName = selectedPlayer.name
      }

      // Criação do Track (Vínculo)
      await createTrack.mutateAsync({
        masterDealId: masterDeal.id,
        playerName: finalPlayerName,
        playerId: finalPlayerId,
        trackVolume: parseFloat(trackVolume),
        currentStage,
        probability: 0,
        responsibles: selectedTeam,
        status: 'active',
        notes,
      })

      toast.success('Player adicionado ao deal com sucesso!')
      resetForm()
      onOpenChange(false)

    } catch (error) {
      console.error(error)
      toast.error('Erro ao adicionar player')
    }
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
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) resetForm()
      onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Player</DialogTitle>
          <DialogDescription>
            Adicione um novo player/investidor para {masterDeal.clientName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Seleção ou Criação de Player */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="player-select">Player *</Label>
              {isCreatingNew ? (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs px-2"
                  onClick={() => setIsCreatingNew(false)}
                >
                  <ArrowLeft className="mr-1 h-3 w-3" /> Voltar para Seleção
                </Button>
              ) : (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs px-2 text-primary"
                  onClick={() => setIsCreatingNew(true)}
                >
                  <Plus className="mr-1 h-3 w-3" /> Criar Novo
                </Button>
              )}
            </div>

            {isCreatingNew ? (
              <Input
                autoFocus
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Digite o nome do novo player..."
                className="bg-primary/5 border-primary/20"
              />
            ) : (
              <PlayerSelect 
                value={selectedPlayerId}
                onChange={setSelectedPlayerId}
                onCheckNew={() => setIsCreatingNew(true)}
              />
            )}
            {isCreatingNew && (
              <p className="text-[10px] text-muted-foreground">
                Um novo registro será criado na base de players.
              </p>
            )}
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
            <Button type="submit" disabled={isCreatingNew ? !newPlayerName : !selectedPlayerId}>
              {isCreatingNew ? 'Criar e Adicionar' : 'Adicionar Player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}