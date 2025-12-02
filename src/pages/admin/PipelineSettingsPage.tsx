import { useState, useMemo } from 'react'
import {
  useStages,
  useReorderStages,
  useDeleteStage,
} from '@/services/pipelineService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ListChecks,
  Plus,
  Trash,
  PencilSimple,
  FloppyDisk,
  WarningCircle,
  ArrowsVertical,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { PipelineStage } from '@/lib/types'
import { PipelineSettingsDialog } from '@/components/PipelineSettingsDialog' // Importa o novo componente
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { arrayMove } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/PageContainer'

// Componente para um item da lista que pode ser reordenado
function SortableStageRow({ stage, onEdit, onDelete }: { stage: PipelineStage; onEdit: () => void; onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow 
        ref={setNodeRef} 
        style={style}
        className={cn(
            "cursor-default transition-transform duration-200 ease-in-out",
            isDragging && "z-10 shadow-xl bg-primary/10"
        )}
    >
      <TableCell className="w-[50px] cursor-grab" {...listeners} {...attributes}>
        <ArrowsVertical className="h-4 w-4 text-muted-foreground" />
      </TableCell>
      <TableCell className="font-medium flex items-center gap-3">
        <div style={{ backgroundColor: stage.color }} className="h-3 w-3 rounded-full shrink-0" />
        {stage.name}
      </TableCell>
      <TableCell className="w-[100px] text-center font-semibold">
        {stage.probability}%
      </TableCell>
      <TableCell className="w-[100px] text-center">
        {stage.isDefault && (
          <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-600 border-sky-200">
            Padrão
          </Badge>
        )}
      </TableCell>
      <TableCell className="w-[100px] text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <PencilSimple className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={onDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}


export default function PipelineSettingsPage() {
  const { data: fetchedStages, isLoading, refetch } = useStages()
  const reorderStagesMutation = useReorderStages()
  const deleteStageMutation = useDeleteStage()

  // Estado da lista que pode ser reordenada
  const [stages, setStages] = useState<PipelineStage[]>([])
  
  // Estado para edição/criação
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [stageToEdit, setStageToEdit] = useState<PipelineStage | null>(null)

  // Estado para exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [stageToDelete, setStageToDelete] = useState<PipelineStage | null>(null)

  // Sincroniza dados do hook com o estado local para reordenação
  useMemo(() => {
    if (fetchedStages) {
        setStages(fetchedStages);
    }
  }, [fetchedStages])
  
  // DRAG AND DROP SENSORS
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  )

  // --- Handlers de Ação ---

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setStages((currentStages) => {
        const oldIndex = currentStages.findIndex((stage) => stage.id === active.id);
        const newIndex = currentStages.findIndex((stage) => stage.id === over?.id);
        return arrayMove(currentStages, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    const reorderData = stages.map((stage, index) => ({
      id: stage.id,
      stageOrder: index, // A ordem é o índice na lista atual
    }));

    try {
      await reorderStagesMutation.mutateAsync(reorderData)
      toast.success('Ordem do pipeline salva com sucesso!')
      refetch()
    } catch (error) {
      toast.error('Erro ao salvar a ordem do pipeline.')
    }
  }

  const handleOpenEdit = (stage: PipelineStage) => {
    setStageToEdit(stage)
    setIsDialogOpen(true)
  }

  const handleOpenCreate = () => {
    setStageToEdit(null)
    setIsDialogOpen(true)
  }

  const handleOpenDelete = (stage: PipelineStage) => {
    setStageToDelete(stage)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!stageToDelete) return

    try {
      await deleteStageMutation.mutateAsync(stageToDelete.id)
      toast.success(`Estágio "${stageToDelete.name}" excluído!`)
      setIsDeleteDialogOpen(false)
      setStageToDelete(null)
      refetch()
    } catch (error) {
        if (error instanceof Error && error.message.includes('foreign key constraint')) {
            toast.error('Não é possível excluir este estágio.', {
                description: 'Existem players (tracks) ativos vinculados a este estágio. Realoque-os antes de excluir.'
            });
        } else {
            toast.error('Erro ao excluir estágio.');
        }
    }
  }

  // Se a ordem em stages for diferente de fetchedStages, mostra o botão "Salvar Ordem"
  const orderChanged = useMemo(() => {
    if (!fetchedStages) return false;
    if (stages.length !== fetchedStages.length) return true;
    return stages.some((stage, index) => stage.id !== fetchedStages[index].id);
  }, [stages, fetchedStages]);

  // --- Renderização ---

  return (
    <PageContainer className="pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <ListChecks className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciamento do Pipeline
          </h1>
        </div>
        <div className="flex gap-3">
          {orderChanged && (
            <Button 
                variant="default" 
                onClick={handleSaveOrder} 
                disabled={reorderStagesMutation.isPending}
            >
              <FloppyDisk className="mr-2 h-4 w-4" />
              {reorderStagesMutation.isPending ? 'Salvando...' : 'Salvar Ordem'}
            </Button>
          )}
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Estágio
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estágios do Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando estágios...</div>
          ) : stages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
              <WarningCircle className="h-8 w-8 mx-auto mb-2 text-primary/70" />
              Nenhum estágio encontrado. Clique em "Novo Estágio" para começar.
            </div>
          ) : (
            <div className="rounded-md border">
              <ScrollArea className="max-h-[600px]">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Ordem</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-[100px] text-center">Probabilidade</TableHead>
                      <TableHead className="w-[100px] text-center">Tipo</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext 
                        items={stages.map(s => s.id)} 
                        strategy={verticalListSortingStrategy}
                    >
                      {stages.map((stage) => (
                        <SortableStageRow
                          key={stage.id}
                          stage={stage}
                          onEdit={() => handleOpenEdit(stage)}
                          onDelete={() => handleOpenDelete(stage)}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
              </ScrollArea>
              {orderChanged && (
                  <div className="p-4 border-t bg-yellow-50/20 text-yellow-800 text-sm flex items-center gap-2">
                      <WarningCircle className="h-5 w-5 shrink-0" />
                      A ordem foi alterada. Clique em **"Salvar Ordem"** para aplicar as mudanças permanentemente.
                  </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Criação/Edição */}
      <PipelineSettingsDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setStageToEdit(null)
          refetch()
        }}
        stageToEdit={stageToEdit}
        stageOrder={stages.length} 
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Estágio "{stageToDelete?.name}"</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível e pode causar erros se existirem deals ativos neste estágio. Confirme se deseja prosseguir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteStageMutation.isPending}
            >
              {deleteStageMutation.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}
