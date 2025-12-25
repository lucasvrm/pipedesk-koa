import { Tags, Plus, Minus, Loader2 } from 'lucide-react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useTags, useAssignTag, useUnassignTag } from '@/services/tagService'

interface BulkTagsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: string[]
  selectedLeads?: { id: string; name: string }[]
  onComplete?: () => void
}

export function BulkTagsDialog({
  open,
  onOpenChange,
  selectedIds,
  selectedLeads = [],
  onComplete
}: BulkTagsDialogProps) {
  // 1. Data hooks (always first - Error 310 prevention)
  const { data: tags = [] } = useTags('lead')
  const assignTag = useAssignTag()
  const unassignTag = useUnassignTag()

  // 2. useState
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  // 3. useMemo
  const pendingCount = useMemo(
    () => selectedIds.length * selectedTagIds.size,
    [selectedIds.length, selectedTagIds.size]
  )

  const selectedTagsArray = useMemo(
    () => tags.filter((t) => selectedTagIds.has(t.id)),
    [tags, selectedTagIds]
  )

  const leadsPreview = useMemo(() => {
    if (selectedLeads.length <= 5) {
      return selectedLeads.map((l) => l.name).join(', ')
    }
    return `${selectedLeads.slice(0, 5).map((l) => l.name).join(', ')} +${selectedLeads.length - 5}`
  }, [selectedLeads])

  // 4. useCallback
  const handleToggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) {
        next.delete(tagId)
      } else {
        next.add(tagId)
      }
      return next
    })
  }, [])

  // 5. useEffect
  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setSelectedTagIds(new Set())
      setMode('add')
      setProgress(0)
    }
  }, [open])

  const handleApply = async () => {
    if (selectedTagIds.size === 0) {
      toast.error('Selecione pelo menos uma tag')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    const total = selectedIds.length * selectedTagIds.size
    let completed = 0
    let successCount = 0
    let errorCount = 0

    // Sequential loop (avoid race conditions)
    for (const leadId of selectedIds) {
      for (const tagId of selectedTagIds) {
        try {
          if (mode === 'add') {
            await assignTag.mutateAsync({ 
              entityId: leadId, 
              entityType: 'lead', 
              tagId 
            })
          } else {
            await unassignTag.mutateAsync({ 
              entityId: leadId, 
              entityType: 'lead', 
              tagId 
            })
          }
          successCount++
        } catch (error) {
          console.error('Error applying tag:', error)
          errorCount++
        }

        completed++
        setProgress(Math.round((completed / total) * 100))
      }
    }

    setIsProcessing(false)

    // Toast result notification
    if (errorCount === 0) {
      toast.success(
        mode === 'add' 
          ? `${successCount} tags adicionadas com sucesso` 
          : `${successCount} tags removidas com sucesso`
      )
    } else {
      toast.warning(
        `Concluído: ${successCount} sucesso, ${errorCount} erros`
      )
    }

    onComplete?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Gerenciar Tags
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Adicionar' : 'Remover'} tags de {selectedIds.length} lead
            {selectedIds.length !== 1 ? 's' : ''} selecionado{selectedIds.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'add' | 'remove')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Adicionar Tags</TabsTrigger>
            <TabsTrigger value="remove">Remover Tags</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Lista de Tags */}
        <div className="space-y-2 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Selecionar Tags ({selectedTagIds.size} selecionadas)
            </Label>
            {selectedTagIds.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTagIds(new Set())}
              >
                Limpar
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTagIds.has(tag.id)}
                    onCheckedChange={() => handleToggleTag(tag.id)}
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <Label
                      htmlFor={`tag-${tag.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tag.name}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Preview Tags Selecionadas */}
        {selectedTagsArray.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {selectedTagsArray.length} tag{selectedTagsArray.length !== 1 ? 's' : ''} selecionada{selectedTagsArray.length !== 1 ? 's' : ''}:
            </Label>
            <div className="flex flex-wrap gap-2">
              {selectedTagsArray.map((tag) => (
                <Badge key={tag.id} variant="outline" className="gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Preview Leads */}
        {selectedLeads.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <strong>Leads: </strong>{leadsPreview}
          </div>
        )}

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Processando... {progress}%
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            disabled={isProcessing || selectedTagIds.size === 0}
            className={cn(
              mode === 'add' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {mode === 'add' ? <Plus className="mr-2 h-4 w-4" /> : <Minus className="mr-2 h-4 w-4" />}
                {mode === 'add' ? 'Adicionar' : 'Remover'} ({pendingCount})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
