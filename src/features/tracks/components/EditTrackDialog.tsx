import { useState, useEffect } from 'react'
import { PlayerTrack } from '@/lib/types'
import { useUpdateTrack } from '@/services/trackService'
import { useAssignTag, useRemoveTag } from '@/services/tagService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import TagSelector from '@/components/TagSelector'

interface EditTrackDialogProps {
  track: PlayerTrack
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTrackDialog({ track, open, onOpenChange }: EditTrackDialogProps) {
  const updateTrack = useUpdateTrack()
  const assignTagMutation = useAssignTag()
  const removeTagMutation = useRemoveTag()

  const [formData, setFormData] = useState({
    trackVolume: track.trackVolume,
    probability: track.probability,
    notes: track.notes || ''
  })

  useEffect(() => {
    if (open) {
      setFormData({
        trackVolume: track.trackVolume,
        probability: track.probability,
        notes: track.notes || ''
      })
    }
  }, [track, open])

  const handleSave = async () => {
    try {
      await updateTrack.mutateAsync({
        trackId: track.id,
        updates: {
          trackVolume: Number(formData.trackVolume),
          probability: Number(formData.probability),
          notes: formData.notes
        }
      })
      toast.success('Track atualizado com sucesso!')
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao atualizar track')
    }
  }

  const handleAddTag = (tagId: string) => {
    assignTagMutation.mutate({ tagId, entityId: track.id, entityType: 'track' })
  }

  const handleRemoveTag = (tagId: string) => {
    removeTagMutation.mutate({ tagId, entityId: track.id, entityType: 'track' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Track - {track.playerName}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          
          {/* Seletor de Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagSelector 
              entityType="track"
              selectedTagIds={track.tags?.map(t => t.id) || []}
              onSelectTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="trackVolume">Volume (R$)</Label>
              <Input
                id="trackVolume"
                type="number"
                value={formData.trackVolume}
                onChange={(e) => setFormData({ ...formData, trackVolume: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="probability">Probabilidade (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas / Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}