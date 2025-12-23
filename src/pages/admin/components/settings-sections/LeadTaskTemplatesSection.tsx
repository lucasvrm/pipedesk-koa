import { useState } from 'react'
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Settings2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

import { LeadTaskTemplate } from '@/services/leadTaskTemplatesService'
import {
  useLeadTaskTemplates,
  useCreateLeadTaskTemplate,
  useUpdateLeadTaskTemplate,
  useDeleteLeadTaskTemplate,
  useReorderLeadTaskTemplates,
} from '@/hooks/useLeadTaskTemplates'
import { LeadTaskTemplateForm } from './LeadTaskTemplateForm'

function SortableTemplateItem({
  template,
  onEdit,
  onDelete,
}: {
  template: LeadTaskTemplate
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-background border rounded-lg"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{template.label}</span>
          <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {template.code}
          </code>
        </div>
        {template.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {template.description}
          </p>
        )}
      </div>

      <Badge variant={template.is_active ? 'default' : 'secondary'}>
        {template.is_active ? 'Ativo' : 'Inativo'}
      </Badge>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Settings2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

export function LeadTaskTemplatesSection() {
  const { data, isLoading, error } = useLeadTaskTemplates(true)
  const createMutation = useCreateLeadTaskTemplate()
  const updateMutation = useUpdateLeadTaskTemplate()
  const deleteMutation = useDeleteLeadTaskTemplate()
  const reorderMutation = useReorderLeadTaskTemplates()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<LeadTaskTemplate | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<LeadTaskTemplate | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const templates = data?.data || []

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = templates.findIndex((t) => t.id === active.id)
      const newIndex = templates.findIndex((t) => t.id === over.id)
      const newOrder = arrayMove(templates, oldIndex, newIndex)
      reorderMutation.mutate(newOrder.map((t) => t.id))
    }
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setFormOpen(true)
  }

  const handleEdit = (template: LeadTaskTemplate) => {
    setEditingTemplate(template)
    setFormOpen(true)
  }

  const handleFormSubmit = (data: any) => {
    if (editingTemplate) {
      updateMutation.mutate(
        { id: editingTemplate.id, data },
        { onSuccess: () => setFormOpen(false) }
      )
    } else {
      createMutation.mutate(data, { onSuccess: () => setFormOpen(false) })
    }
  }

  const handleDelete = () => {
    if (deletingTemplate) {
      deleteMutation.mutate(deletingTemplate.id, {
        onSuccess: () => setDeletingTemplate(null),
      })
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates de Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro ao carregar templates.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Templates de Tarefas</CardTitle>
            <CardDescription>
              Templates pré-definidos para tarefas de leads. Arraste para reordenar.
            </CardDescription>
          </div>
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum template cadastrado.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={templates.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {templates.map((template) => (
                    <SortableTemplateItem
                      key={template.id}
                      template={template}
                      onEdit={() => handleEdit(template)}
                      onDelete={() => setDeletingTemplate(template)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <LeadTaskTemplateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        template={editingTemplate}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={(open) => !open && setDeletingTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar template?</AlertDialogTitle>
            <AlertDialogDescription>
              O template "{deletingTemplate?.label}" será desativado e não aparecerá
              mais para seleção. Tarefas existentes não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
