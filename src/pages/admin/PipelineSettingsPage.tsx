import { useState } from 'react'
import { useStages, useCreateStage, useUpdateStage, useDeleteStage, useReorderStages } from '@/services/pipelineService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, PencilSimple, Trash, ArrowUp, ArrowDown, FloppyDisk } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { PipelineStage } from '@/lib/types'

export default function PipelineSettingsPage() {
  const { data: stages = [], isLoading } = useStages()
  const createStage = useCreateStage()
  const updateStage = useUpdateStage()
  const deleteStage = useDeleteStage()
  const reorderStages = useReorderStages()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [probability, setProbability] = useState(0)
  const [color, setColor] = useState('#64748b')

  const handleOpenDialog = (stage?: PipelineStage) => {
    if (stage) {
      setEditingStage(stage)
      setName(stage.name)
      setProbability(stage.probability)
      setColor(stage.color)
    } else {
      setEditingStage(null)
      setName('')
      setProbability(10)
      setColor('#64748b')
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingStage) {
        await updateStage.mutateAsync({
          stageId: editingStage.id,
          updates: { name, probability, color }
        })
        toast.success('Estágio atualizado!')
      } else {
        const maxOrder = Math.max(...stages.map(s => s.stageOrder), 0)
        await createStage.mutateAsync({
          pipelineId: null, // Global
          name,
          probability,
          color,
          stageOrder: maxOrder + 1,
          isDefault: false
        })
        toast.success('Estágio criado!')
      }
      setIsDialogOpen(false)
    } catch (error) {
      toast.error('Erro ao salvar estágio')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza? Tracks nesta fase ficarão órfãos ou invisíveis.')) {
      await deleteStage.mutateAsync(id)
      toast.success('Estágio removido')
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === stages.length - 1) return

    const newStages = [...stages]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap
    const temp = newStages[index]
    newStages[index] = newStages[targetIndex]
    newStages[targetIndex] = temp

    // Update orders locally then save
    const updates = newStages.map((s, i) => ({ id: s.id, stageOrder: i + 1 }))
    
    // Otimista (opcional) ou espera
    await reorderStages.mutateAsync(updates)
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Pipeline de Tracks</h1>
          <p className="text-muted-foreground">Gerencie as fases do funil de investidores (Tracks).</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2" /> Novo Estágio
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">Carregando configurações...</div>
        ) : (
          stages.map((stage, index) => (
            <Card key={stage.id} className="flex items-center p-4 gap-4">
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                  <ArrowUp size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(index, 'down')} disabled={index === stages.length - 1}>
                  <ArrowDown size={14} />
                </Button>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                <div className="font-semibold flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stage.color }} />
                  {stage.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  Probabilidade: <Badge variant="secondary">{stage.probability}%</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Ordem: {stage.stageOrder}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(stage)}>
                  <PencilSimple size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(stage.id)}>
                  <Trash size={18} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Editar Estágio' : 'Novo Estágio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Fase</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Análise Jurídica" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Probabilidade (%)</Label>
                <Input type="number" min="0" max="100" value={probability} onChange={e => setProbability(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Cor (Hex)</Label>
                <div className="flex gap-2">
                  <Input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 p-1" />
                  <Input value={color} onChange={e => setColor(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}><FloppyDisk className="mr-2" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}