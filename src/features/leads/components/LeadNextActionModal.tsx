import { useCallback, useEffect, useMemo, useState } from 'react'
import { GripVertical, Loader2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, safeString } from '@/lib/utils'
import { useLeadTaskTemplates } from '@/hooks/useLeadTaskTemplates'
import { useLeadTasks, useCreateLeadTaskFromTemplate } from '../hooks/useLeadTasks'

interface LeadNextActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  leadName?: string
}

type DragColumn = 'selected' | 'available' | null

export function LeadNextActionModal({
  open,
  onOpenChange,
  leadId,
  leadName,
}: LeadNextActionModalProps) {
  // 1. Hooks de dados
  const { data: templatesData, isLoading: templatesLoading } = useLeadTaskTemplates(false)
  const { data: leadTasksData, isLoading: leadTasksLoading } = useLeadTasks(leadId, false)
  const createFromTemplate = useCreateLeadTaskFromTemplate(leadId)

  // 2. useState
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropZone, setDropZone] = useState<DragColumn>(null)

  // 3. useMemo
  const templates = useMemo(() => {
    const data = templatesData?.data ?? []
    return [...data].sort((a, b) => {
      if (typeof a.sort_order === 'number' && typeof b.sort_order === 'number') {
        return a.sort_order - b.sort_order
      }
      return a.label.localeCompare(b.label)
    })
  }, [templatesData?.data])

  const currentNextActionTemplateId = useMemo(() => {
    const nextAction = leadTasksData?.next_action || leadTasksData?.data?.find((task) => task.is_next_action)
    return nextAction?.template_id ?? null
  }, [leadTasksData])

  const selectedTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === (selectedTemplateId ?? currentNextActionTemplateId)),
    [templates, selectedTemplateId, currentNextActionTemplateId]
  )

  // 4. useCallback
  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId)
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedTemplateId(null)
  }, [])

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setSelectedTemplateId(currentNextActionTemplateId)
      } else {
        setSelectedTemplateId(null)
        setDraggingId(null)
        setDropZone(null)
      }
      onOpenChange(isOpen)
    },
    [currentNextActionTemplateId, onOpenChange]
  )

  const handleDragStart = useCallback((templateId: string) => {
    setDraggingId(templateId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDropZone(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, column: DragColumn) => {
    e.preventDefault()
    setDropZone(column)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, column: DragColumn) => {
      e.preventDefault()
      const templateId = e.dataTransfer.getData('text/plain')
      if (!templateId) return

      if (column === 'selected') {
        handleTemplateSelect(templateId)
      }
      if (column === 'available') {
        handleClearSelection()
      }
      setDropZone(null)
      setDraggingId(null)
    },
    [handleTemplateSelect, handleClearSelection]
  )

  const handleSave = useCallback(async () => {
    if (!selectedTemplate && !currentNextActionTemplateId) return

    const templateIdToUse = selectedTemplate?.id ?? currentNextActionTemplateId
    if (!templateIdToUse) return

    await createFromTemplate.mutateAsync({
      template_id: templateIdToUse,
      is_next_action: true,
    })
    handleOpenChange(false)
  }, [createFromTemplate, selectedTemplate, currentNextActionTemplateId, handleOpenChange])

  // 5. useEffect - sync when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTemplateId(currentNextActionTemplateId)
    }
  }, [open, currentNextActionTemplateId])

  // 6. Derived lists
  const availableTemplates = useMemo(
    () => templates.filter((tpl) => tpl.id !== (selectedTemplate?.id ?? currentNextActionTemplateId ?? null)),
    [templates, selectedTemplate?.id, currentNextActionTemplateId]
  )

  const isLoading = templatesLoading || leadTasksLoading
  const isSaving = createFromTemplate.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Próxima ação
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {leadName
              ? `Selecione a próxima ação para "${leadName}". Apenas uma ação pode ficar ativa.`
              : 'Selecione a próxima ação para o lead. Apenas uma ação pode ficar ativa.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[340px]">
          {/* Coluna Selecionada */}
          <div
            className={cn(
              'rounded-2xl p-4 border transition-all',
              'bg-primary/5 border-primary/20',
              dropZone === 'selected' && 'ring-2 ring-primary/40'
            )}
            onDragOver={(e) => handleDragOver(e, 'selected')}
            onDrop={(e) => handleDrop(e, 'selected')}
            onDragLeave={() => setDropZone(null)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <h3 className="font-semibold text-foreground">Selecionada</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                Máx. 1
              </Badge>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : selectedTemplate ? (
              <TemplateCard
                templateId={selectedTemplate.id}
                label={safeString(selectedTemplate.label, 'Ação')}
                description={selectedTemplate.description}
                isActive
                dragging={draggingId === selectedTemplate.id}
                onClick={handleClearSelection}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', selectedTemplate.id)
                  handleDragStart(selectedTemplate.id)
                }}
                onDragEnd={handleDragEnd}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 py-10 text-center text-sm text-muted-foreground">
                Arraste uma ação ou clique em uma disponível para selecionar
              </div>
            )}
          </div>

          {/* Coluna Disponíveis */}
          <div
            className={cn(
              'rounded-2xl p-4 border transition-all',
              'bg-muted/30 border-border',
              dropZone === 'available' && 'ring-2 ring-muted-foreground/30 bg-muted/50'
            )}
            onDragOver={(e) => handleDragOver(e, 'available')}
            onDrop={(e) => handleDrop(e, 'available')}
            onDragLeave={() => setDropZone(null)}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <h3 className="font-semibold text-foreground">Disponíveis</h3>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-xs text-muted-foreground">
                {availableTemplates.length} opções
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : availableTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
                Todas as ações estão selecionadas no momento.
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {availableTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    templateId={template.id}
                    label={safeString(template.label, 'Ação')}
                    description={template.description}
                    dragging={draggingId === template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', template.id)
                      handleDragStart(template.id)
                    }}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 Apenas uma próxima ação fica ativa por lead. Arraste ou clique para selecionar.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || (!selectedTemplate && !currentNextActionTemplateId)}
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </span>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface TemplateCardProps {
  templateId: string
  label: string
  description?: string | null
  isActive?: boolean
  dragging?: boolean
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}

function TemplateCard({
  templateId,
  label,
  description,
  isActive = false,
  dragging = false,
  onClick,
  onDragStart,
  onDragEnd,
}: TemplateCardProps) {
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
        isActive
          ? 'bg-primary/10 border-primary/30'
          : 'bg-card hover:bg-muted border-border',
        dragging && 'opacity-60 scale-[0.99]'
      )}
      data-template-id={templateId}
    >
      <span
        className={cn(
          'h-8 w-8 rounded-lg border flex items-center justify-center',
          isActive ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border text-muted-foreground'
        )}
      >
        <GripVertical className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground truncate">{label}</div>
        {description ? (
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground/80">Sem descrição</p>
        )}
      </div>
      {isActive ? (
        <Badge variant="secondary" className="text-[11px]">
          Selecionada
        </Badge>
      ) : (
        <Badge variant="outline" className="text-[11px] text-muted-foreground group-hover:border-primary">
          Definir
        </Badge>
      )}
    </button>
  )
}
