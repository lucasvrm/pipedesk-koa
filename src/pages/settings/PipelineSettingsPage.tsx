import { useState } from 'react'
import { useStages, useCreateStage, useUpdateStage, useDeleteStage, useReorderStages } from '@/services/pipelineService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, PencilSimple, Trash, ArrowUp, ArrowDown, FloppyDisk, Check } from '@phosphor-icons/react'
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
  const [isDefault, setIsDefault] = useState(false)

  const handleOpenDialog = (stage?: PipelineStage) => {
    if (stage) {
      setEditingStage(stage)
      setName(stage.name)
      setProbability(stage.probability)
      setColor(stage.color)
      setIsDefault(stage.isDefault)
    } else {
      setEditingStage(null)
      setName('')
      setProbability(10)
      setColor('#64748b')
      setIsDefault(false)
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return toast.error('O nome do estágio é obrigatório')

    try {
      if (editingStage) {
        await updateStage.mutateAsync({
          stageId: editingStage.id,
          updates: { name, probability, color, isDefault }
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
          isDefault
        })
        toast.success('Estágio criado!')
      }
      setIsDialogOpen(false)
    } catch (error) {
      toast.error('Erro ao salvar estágio')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem a certeza? Tracks que estiverem nesta fase poderão ficar sem visualização no Kanban.')) {
      await deleteStage.mutateAsync(id)
      toast.success('Estágio removido')
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === stages.length - 1) return

    const newStages = [...stages]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Troca de posição localmente
    const temp = newStages[index]
    newStages[index] = newStages[targetIndex]
    newStages[targetIndex] = temp

    // Atualiza as ordens para enviar ao banco
    const updates = newStages.map((s, i) => ({ id: s.id, stageOrder: i + 1 }))
    
    await reorderStages.mutateAsync(updates)
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fases do Pipeline</h1>
          <p className="text-muted-foreground">Configure os estágios, probabilidades e cores do seu funil de vendas.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2" /> Novo Estágio
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando configurações...</div>
        ) : stages.length === 0 ? (
           <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Nenhuma fase configurada.</p>
              <Button variant="link" onClick={() => handleOpenDialog()}>Criar a primeira fase</Button>
           </div>
        ) : (
          stages.map((stage, index) => (
            <Card key={stage.id} className="flex items-center p-3 gap-4 group hover:border-primary/50 transition-colors">
              <div className="flex flex-col gap-1 text-muted-foreground">
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-primary" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                  <ArrowUp size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-primary" onClick={() => handleMove(index, 'down')} disabled={index === stages.length - 1}>
                  <ArrowDown size={14} />
                </Button>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                {/* Cor e Nome */}
                <div className="md:col-span-4 font-semibold flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full shadow-sm border" style={{ backgroundColor: stage.color }} />
                  <span className="truncate">{stage.name}</span>
                  {stage.isDefault && <Badge variant="secondary" className="text-[10px] h-5">Padrão</Badge>}
                </div>

                {/* Probabilidade */}
                <div className="md:col-span-3 text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider">Probabilidade:</span>
                  <Badge variant="outline" className="font-mono">{stage.probability}%</Badge>
                </div>

                {/* ID Técnico (Útil para debug) */}
                <div className="md:col-span-5 text-xs text-muted-foreground truncate font-mono opacity-50">
                  ID: {stage.id}
                </div>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(stage)}>
                  <PencilSimple size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(stage.id)}>
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
          <div className="space-y-5 py-4">
            
            <div className="space-y-2">
              <Label>Nome da Fase</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Análise Jurídica" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Probabilidade (%)</Label>
                <div className="relative">
                    <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={probability} 
                        onChange={e => setProbability(Number(e.target.value))} 
                        className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Usado para cálculo de forecast ponderado.</p>
              </div>
              
              <div className="space-y-2">
                <Label>Cor de Identificação</Label>
                <div className="flex gap-2">
                  <Input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                  <Input value={color} onChange={e => setColor(e.target.value)} placeholder="#000000" className="font-mono uppercase" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg bg-muted/20">
              <Label htmlFor="is-default" className="flex flex-col gap-1 cursor-pointer">
                <span className="font-medium">Estágio Padrão?</span>
                <span className="text-xs font-normal text-muted-foreground">Novos tracks entrarão nesta fase automaticamente.</span>
              </Label>
              <Switch id="is-default" checked={isDefault} onCheckedChange={setIsDefault} />
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