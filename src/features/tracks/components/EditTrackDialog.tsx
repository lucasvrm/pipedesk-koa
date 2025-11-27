import { useState, useEffect } from 'react'
import { useUpdateTrack } from '@/services/trackService'
import { useAuth } from '@/contexts/AuthContext'
import { logActivity } from '@/services/activityService'
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
import { PlayerTrack } from '@/lib/types'
import { toast } from 'sonner'

interface EditTrackDialogProps {
  track: PlayerTrack
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ATENÇÃO: Deve ser "export function" (Exportação Nomeada) e NÃO "export default"
export function EditTrackDialog({ track, open, onOpenChange }: EditTrackDialogProps) {
  const { profile: currentUser } = useAuth()
  const updateTrack = useUpdateTrack()

  const [formData, setFormData] = useState({
    trackVolume: '',
    probability: '',
    notes: ''
  })

  // Carrega os dados atuais quando o modal abre
  useEffect(() => {
    if (track && open) {
      setFormData({
        trackVolume: track.trackVolume?.toString() || '0',
        probability: track.probability?.toString() || '0',
        notes: track.notes || ''
      })
    }
  }, [track, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.trackVolume) {
      toast.error('O volume é obrigatório')
      return
    }

    try {
      await updateTrack.mutateAsync({
        trackId: track.id,
        updates: {
          trackVolume: parseFloat(formData.trackVolume),
          probability: parseInt(formData.probability) || 0,
          notes: formData.notes
        }
      })

      // Log de atividade
      if (currentUser) {
        logActivity(
          track.masterDealId,
          'track',
          `Editou informações do track de ${track.playerName}`,
          currentUser.id,
          { 
            volume_old: track.trackVolume,
            volume_new: formData.trackVolume,
            prob_old: track.probability,
            prob_new: formData.probability
          }
        )
      }

      toast.success('Track atualizado com sucesso!')
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao atualizar track')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Track</DialogTitle>
          <DialogDescription>
            Atualize as informações principais deste track.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trackVolume">Volume (R$)</Label>
              <Input
                id="trackVolume"
                type="number"
                step="0.01"
                value={formData.trackVolume}
                onChange={(e) => setFormData({ ...formData, trackVolume: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">Probabilidade (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                placeholder="0-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais..."
              className="h-32 resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateTrack.isPending}>
              {updateTrack.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}