import { useState, useEffect, useMemo } from 'react'
import { useUpdateTrack } from '@/services/trackService'
import { useStages } from '@/services/pipelineService' // Importação dinâmica
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, // Componentes de Select
} from '@/components/ui/select'
import { PlayerTrack, PlayerStage } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface EditTrackDialogProps {
  track: PlayerTrack
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTrackDialog({ track, open, onOpenChange }: EditTrackDialogProps) {
  const { profile: currentUser } = useAuth()
  const updateTrack = useUpdateTrack()
  const { data: stages = [], isLoading: stagesLoading } = useStages() // Busca estágios dinâmicos

  const [formData, setFormData] = useState({
    trackVolume: '',
    probability: '',
    notes: '',
    currentStage: '', // Adicionado campo de estágio
  })
  
  // Mapeamento para fácil acesso à probabilidade e nome do estágio
  const stageMap = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = stage;
      return acc;
    }, {} as Record<string, { probability: number, name: string, color: string }>);
  }, [stages]);

  // Carrega os dados atuais quando o modal abre
  useEffect(() => {
    if (track && open) {
      setFormData({
        trackVolume: track.trackVolume?.toString() || '0',
        // Carrega o valor atual para visualização.
        probability: track.probability?.toString() || '0', 
        notes: track.notes || '',
        currentStage: track.currentStage || ''
      })
    }
  }, [track, open, stages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.trackVolume) {
      toast.error('O volume é obrigatório')
      return
    }
    
    const newStage = formData.currentStage;
    const oldStage = track.currentStage;
    
    // 1. Determina a nova probabilidade:
    // Se o estágio MUDOU, pega a probabilidade do estágio no banco.
    // Se o estágio NÃO MUDOU, usa o valor editado no formulário (se houver).
    let newProbability = parseInt(formData.probability) || 0;
    
    if (newStage !== oldStage) {
        newProbability = stageMap[newStage]?.probability || 0;
    }

    // 2. Constrói o objeto de updates (apenas o que mudou)
    const updates: Record<string, any> = {};
    const oldVolume = track.trackVolume?.toString() || '0';
    const oldProb = track.probability?.toString() || '0';
    const oldNotes = track.notes || '';

    if (formData.trackVolume !== oldVolume) updates.trackVolume = parseFloat(formData.trackVolume);
    if (newProbability.toString() !== oldProb) updates.probability = newProbability;
    if (formData.notes !== oldNotes) updates.notes = formData.notes;
    if (newStage !== oldStage) updates.currentStage = newStage;


    if (Object.keys(updates).length === 0) {
        toast.info('Nenhuma alteração detectada para salvar.')
        onOpenChange(false)
        return
    }

    try {
      await updateTrack.mutateAsync({
        trackId: track.id,
        updates: updates
      })

      // Log de atividade
      if (currentUser) {
        logActivity(
          track.masterDealId,
          'track',
          `Editou informações do track de ${track.playerName}. ${newStage !== oldStage ? `Fase de ${stageMap[oldStage]?.name || oldStage} para ${stageMap[newStage]?.name || newStage}.` : ''}`,
          currentUser.id,
          { 
            volume_old: oldVolume,
            volume_new: formData.trackVolume,
            stage_old: oldStage,
            stage_new: newStage,
            prob_old: oldProb,
            prob_new: newProbability,
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
            Atualize as informações principais e o estágio deste track.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="currentStage">Estágio Atual</Label>
             <Select 
                value={formData.currentStage} 
                onValueChange={(v) => {
                    const newProb = stageMap[v]?.probability?.toString() || '0';
                    setFormData({ ...formData, currentStage: v, probability: newProb })
                }}
                disabled={stagesLoading}
             >
                <SelectTrigger id="currentStage">
                  <SelectValue placeholder="Selecione o estágio" />
                </SelectTrigger>
                <SelectContent>
                  {stages.length === 0 ? (
                      <div className="p-2 text-center text-muted-foreground text-xs">Carregando estágios...</div>
                  ) : (
                    stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name} ({stage.probability}%)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
          </div>

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
              <div className="relative">
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                  placeholder="0-100"
                  // Desabilita edição se o estágio for diferente do original (Probabilidade automática)
                  disabled={formData.currentStage !== track.currentStage}
                  className={cn(
                    "pr-12",
                    formData.currentStage !== track.currentStage && "bg-muted/50 cursor-not-allowed"
                  )}
                />
                {formData.currentStage !== track.currentStage && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-primary/10 px-1 rounded-sm">
                        Automático
                    </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                 A probabilidade é definida pelo estágio, mas pode ser ajustada manualmente no estágio atual.
              </p>
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