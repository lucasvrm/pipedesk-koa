import { useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStages, useUpdateStage, useCreateStage, useDeleteStage, useReorderStages } from '@/services/pipelineService';
import { useSlaPolicies, useUpdateSlaPolicy } from '@/services/slaService';
import { PipelineStage, SlaPolicy } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PencilSimple, Trash, Plus, ArrowsDownUp, WarningCircle, Clock, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import TransitionRulesMatrix from '@/features/admin/components/TransitionRulesMatrix';
import { StandardPageLayout } from '@/components/layouts';

export default function PipelineSettings() {
  const { data: stages = [], isLoading } = useStages();
  const { data: slaPolicies = [] } = useSlaPolicies();

  const createMutation = useCreateStage();
  const updateMutation = useUpdateStage();
  const deleteMutation = useDeleteStage();
  const reorderMutation = useReorderStages();
  const slaMutation = useUpdateSlaPolicy();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [probability, setProbability] = useState(0);

  // SLA states inside the modal
  const [maxHours, setMaxHours] = useState(0);
  const [warningHours, setWarningHours] = useState(0);

  const openCreate = () => {
    setEditingStage(null);
    setName('');
    setColor('#6366f1');
    setProbability(0);
    setMaxHours(0);
    setWarningHours(0);
    setIsDialogOpen(true);
  };

  const openEdit = (stage: PipelineStage) => {
    setEditingStage(stage);
    setName(stage.name);
    setColor(stage.color);
    setProbability(stage.probability || 0);

    // Find existing SLA
    const policy = slaPolicies.find(p => p.stageId === stage.id);
    setMaxHours(policy?.maxHours || 0);
    setWarningHours(policy?.warningThresholdHours || 0);

    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name) return toast.error("Nome é obrigatório");

    try {
      let stageId = editingStage?.id;

      if (editingStage) {
        await updateMutation.mutateAsync({
          stageId: editingStage.id,
          updates: { name, color, probability }
        });
        toast.success("Estágio atualizado!");
      } else {
        const lastOrder = stages.length > 0 ? Math.max(...stages.map(s => s.stageOrder)) : 0;
        const newStage = await createMutation.mutateAsync({
          name,
          color,
          probability,
          stageOrder: lastOrder + 1
        });
        stageId = newStage.id;
        toast.success("Novo estágio criado!");
      }

      // Save SLA if modified
      if (stageId) {
        if (maxHours > 0 || warningHours > 0) {
            await slaMutation.mutateAsync({
                stageId,
                maxHours,
                warningThresholdHours: warningHours
            });
        }
      }

      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar.");
      console.error(error);
    }
  };

  const handleDelete = async (stage: PipelineStage) => {
    if (stage.isDefault) return toast.error("Não é possível excluir estágios padrão do sistema.");
    if (!confirm(`Excluir o estágio "${stage.name}"? Negócios nesta fase podem ficar inconsistentes.`)) return;

    try {
      await deleteMutation.mutateAsync(stage.id);
      toast.success("Estágio excluído.");
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex(stage => stage.id === active.id);
    const newIndex = stages.findIndex(stage => stage.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(stages, oldIndex, newIndex);
    const reorderedPayload = reordered.map((item, index) => ({
      id: item.id,
      stageOrder: index + 1,
    }));

    try {
      await reorderMutation.mutateAsync(reorderedPayload);
      toast.success("Ordem atualizada!");
    } catch (error) {
      toast.error("Erro ao reordenar.");
    }
  };

  if (isLoading) return <div>Carregando pipeline...</div>;

  return (
    <>
    <StandardPageLayout>
      <Tabs defaultValue="stages">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
            <TabsTrigger value="stages">Estágios & SLAs</TabsTrigger>
            <TabsTrigger value="transitions">Regras de Transição</TabsTrigger>
        </TabsList>

        <TabsContent value="stages">
            <div className="flex justify-end mb-4">
                 <Button onClick={openCreate}><Plus className="mr-2" /> Novo Estágio</Button>
            </div>

            <div className="bg-muted/10 border rounded-lg p-6">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={stages.map(stage => stage.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {stages.map(stage => {
                        const sla = slaPolicies.find(p => p.stageId === stage.id);
                        return (
                          <StageRow
                            key={stage.id}
                            stage={stage}
                            sla={sla}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
            </div>
        </TabsContent>

        <TabsContent value="transitions">
            <TransitionRulesMatrix stages={stages} />
        </TabsContent>
      </Tabs>
    </StandardPageLayout>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingStage ? 'Editar Estágio' : 'Novo Estágio'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nome do Estágio</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Negociação" />
                    </div>
                    <div className="space-y-2">
                        <Label>Probabilidade (%)</Label>
                        <Input
                            type="number"
                            min="0" max="100"
                            value={probability}
                            onChange={e => setProbability(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Cor de Identificação</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="color"
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground">{color}</span>
                    </div>
                </div>

                <div className="border-t pt-4 mt-2">
                    <Label className="mb-2 flex items-center gap-2 text-primary">
                        <Clock weight="fill" /> Configuração de SLA (Opcional)
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Tempo Limite (Horas)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={maxHours}
                                onChange={e => setMaxHours(Number(e.target.value))}
                                placeholder="0 = Sem limite"
                            />
                            <p className="text-[10px] text-muted-foreground">Ex: 48 horas (2 dias)</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Alerta de Atenção (Horas)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={warningHours}
                                onChange={e => setWarningHours(Number(e.target.value))}
                            />
                            <p className="text-[10px] text-muted-foreground">Dispara aviso antes de estourar</p>
                        </div>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StageRow({
  stage,
  sla,
  onEdit,
  onDelete,
}: {
  stage: PipelineStage;
  sla?: SlaPolicy;
  onEdit: (stage: PipelineStage) => void;
  onDelete: (stage: PipelineStage) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-4 justify-between group hover:border-primary/50 transition-colors ${
        isDragging ? 'shadow-md ring-2 ring-primary/20' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        >
          <ArrowsDownUp size={20} />
        </div>
        <div
          className="w-4 h-12 rounded-full"
          style={{ backgroundColor: stage.color }}
          title={`Cor: ${stage.color}`}
        />
        <div>
          <h4 className="font-semibold text-sm">{stage.name}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Badge variant="outline">{stage.probability}% prob.</Badge>
            {sla && sla.maxHours > 0 && (
              <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                <Clock size={12} weight="bold" />
                SLA: {sla.maxHours}h
              </span>
            )}
            {stage.isDefault && <Badge variant="secondary" className="text-[10px]">Sistema</Badge>}
          </div>
        </div>
      </div>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={() => onEdit(stage)}>
          <PencilSimple />
        </Button>
        {!stage.isDefault && (
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(stage)}>
            <Trash />
          </Button>
        )}
      </div>
    </Card>
  );
}
