import { useState, useEffect } from 'react'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, X, DotsSixVertical, Palette } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { PipelineStage } from '@/lib/types'

interface PipelineSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pipelineId: string | null  // null for global default stages
}

const STAGE_COLORS = [
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarelo', value: '#F59E0B' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Cinza', value: '#6B7280' },
]

interface SortableStageItemProps {
  stage: PipelineStage
  onUpdate: (stage: PipelineStage) => void
  onDelete: (id: string) => void
}

function SortableStageItem({ stage, onUpdate, onDelete }: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <DotsSixVertical className="text-muted-foreground" size={20} />
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3">
        <div>
          <Input
            value={stage.name}
            onChange={(e) => onUpdate({ ...stage, name: e.target.value })}
            placeholder="Nome da fase"
            className="h-9"
          />
        </div>
        <div>
          <Select
            value={stage.color}
            onValueChange={(color) => onUpdate({ ...stage, color })}
          >
            <SelectTrigger className="h-9">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {STAGE_COLORS.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color.value }}
                    />
                    {color.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(stage.id)}
        disabled={stage.isDefault}
        title={stage.isDefault ? 'Não é possível excluir fase padrão' : 'Excluir fase'}
      >
        <X size={18} />
      </Button>
    </div>
  )
}

export function PipelineSettingsDialog({
  open,
  onOpenChange,
  pipelineId,
}: PipelineSettingsDialogProps) {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (open) {
      loadStages()
    }
  }, [open, pipelineId])

  const loadStages = async () => {
    // TODO: Implement Supabase integration when backend is ready
    // Example implementation:
    // const { data, error } = await supabase
    //   .from('pipeline_stages')
    //   .select('*')
    //   .eq('pipeline_id', pipelineId)
    //   .order('stage_order')
    
    // For MVP, use default stages as a working placeholder
    const defaultStages: PipelineStage[] = [
      {
        id: '1',
        pipelineId,
        name: 'NDA',
        color: '#6B7280',
        stageOrder: 0,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        pipelineId,
        name: 'Análise',
        color: '#3B82F6',
        stageOrder: 1,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        pipelineId,
        name: 'Proposta',
        color: '#F59E0B',
        stageOrder: 2,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        pipelineId,
        name: 'Negociação',
        color: '#8B5CF6',
        stageOrder: 3,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        pipelineId,
        name: 'Fechamento',
        color: '#10B981',
        stageOrder: 4,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    setStages(defaultStages)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newItems = arrayMove(items, oldIndex, newIndex)
        // Update stage orders
        return newItems.map((item, index) => ({
          ...item,
          stageOrder: index,
        }))
      })
    }
  }

  const handleAddStage = () => {
    const newStage: PipelineStage = {
      id: `temp-${Date.now()}`,
      pipelineId,
      name: 'Nova Fase',
      color: '#6366F1',
      stageOrder: stages.length,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setStages([...stages, newStage])
  }

  const handleUpdateStage = (updatedStage: PipelineStage) => {
    setStages((current) =>
      current.map((stage) =>
        stage.id === updatedStage.id ? updatedStage : stage
      )
    )
  }

  const handleDeleteStage = (id: string) => {
    if (stages.length <= 1) {
      toast.error('Você deve manter pelo menos uma fase')
      return
    }
    setStages((current) => current.filter((stage) => stage.id !== id))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // TODO: Implement Supabase integration when backend is ready
      // Example implementation:
      // const { error } = await supabase
      //   .from('pipeline_stages')
      //   .upsert(stages.map(stage => ({
      //     id: stage.id.startsWith('temp-') ? undefined : stage.id,
      //     pipeline_id: pipelineId,
      //     name: stage.name,
      //     color: stage.color,
      //     stage_order: stage.stageOrder,
      //     is_default: stage.isDefault,
      //   })))
      // if (error) throw error
      
      // For MVP: Simulate successful save
      console.log('Pipeline stages to save:', stages)
      toast.success('Configurações salvas com sucesso!')
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao salvar configurações')
      console.error('Error saving pipeline stages:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurações do Pipeline</DialogTitle>
          <DialogDescription>
            Personalize as fases do seu pipeline. Arraste para reordenar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stages.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {stages.map((stage) => (
                  <SortableStageItem
                    key={stage.id}
                    stage={stage}
                    onUpdate={handleUpdateStage}
                    onDelete={handleDeleteStage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            variant="outline"
            onClick={handleAddStage}
            className="w-full"
          >
            <Plus className="mr-2" />
            Adicionar Fase
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
