import { useState, useMemo, useCallback } from 'react'
import { X, Search, ChevronRight, ChevronLeft, Tag as TagIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTags, useEntityTags, useTagOperations } from '@/services/tagService'
import { Tag } from '@/lib/types'
import { safeString, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface KanbanTagsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  leadName?: string
}

interface DragState {
  tagId: string | null
  fromColumn: 'active' | 'available' | null
}

export function KanbanTagsModal({ open, onOpenChange, leadId, leadName }: KanbanTagsModalProps) {
  // 1. Hooks de dados (sempre no topo)
  const { data: availableTags = [], isLoading: isLoadingTags } = useTags('lead')
  const { data: assignedTags = [], isLoading: isLoadingAssigned } = useEntityTags(leadId, 'lead')
  const { assign, unassign } = useTagOperations()
  const queryClient = useQueryClient()

  // 2. useState
  const [searchTerm, setSearchTerm] = useState('')
  const [dragState, setDragState] = useState<DragState>({ tagId: null, fromColumn: null })
  const [dropZone, setDropZone] = useState<'active' | 'available' | null>(null)
  const [localActiveTags, setLocalActiveTags] = useState<string[]>([])

  // 3. useMemo
  const assignedTagIds = useMemo(() => new Set(assignedTags.map((t) => t.id)), [assignedTags])

  const activeTags = useMemo(() => {
    return availableTags.filter((tag) => localActiveTags.includes(tag.id))
  }, [availableTags, localActiveTags])

  const filteredAvailableTags = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase()
    return availableTags.filter((tag) => {
      if (localActiveTags.includes(tag.id)) return false
      if (!searchTerm.trim()) return true
      return safeString(tag.name, '').toLowerCase().includes(lowerSearch)
    })
  }, [availableTags, localActiveTags, searchTerm])

  // 4. useCallback
  const initializeLocalState = useCallback(() => {
    setLocalActiveTags(Array.from(assignedTagIds))
  }, [assignedTagIds])

  const toggleTag = useCallback((tagId: string) => {
    setLocalActiveTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId)
      } else {
        return [...prev, tagId]
      }
    })
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent, tag: Tag, column: 'active' | 'available') => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', tag.id)
    setDragState({ tagId: tag.id, fromColumn: column })
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragState({ tagId: null, fromColumn: null })
    setDropZone(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, zone: 'active' | 'available') => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropZone(zone)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDropZone(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColumn: 'active' | 'available') => {
      e.preventDefault()
      const tagId = e.dataTransfer.getData('text/plain')
      
      if (!tagId || !dragState.fromColumn) return

      // If dropping in the same column, do nothing
      if (dragState.fromColumn === targetColumn) {
        setDropZone(null)
        return
      }

      // Toggle the tag
      toggleTag(tagId)
      setDropZone(null)
    },
    [dragState.fromColumn, toggleTag]
  )

  const handleConfirm = useCallback(async () => {
    const tagsToAdd = localActiveTags.filter((id) => !assignedTagIds.has(id))
    const tagsToRemove = Array.from(assignedTagIds).filter((id) => !localActiveTags.includes(id))

    try {
      // Remove tags first
      for (const tagId of tagsToRemove) {
        await unassign.mutateAsync({
          tagId,
          entityId: leadId,
          entityType: 'lead',
        })
      }

      // Then add new tags
      for (const tagId of tagsToAdd) {
        await assign.mutateAsync({
          tagId,
          entityId: leadId,
          entityType: 'lead',
        })
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads', leadId] })
      queryClient.invalidateQueries({ queryKey: ['tags', 'entity', 'lead', leadId] })

      toast.success('Tags atualizadas', {
        description: 'As tags do lead foram atualizadas com sucesso.',
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('[KanbanTagsModal] Error updating tags:', error)
      toast.error('Erro ao atualizar tags', {
        description: 'Tente novamente mais tarde.',
      })
    }
  }, [localActiveTags, assignedTagIds, leadId, assign, unassign, queryClient, onOpenChange])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // 5. useEffect - Initialize local state when modal opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        initializeLocalState()
      } else {
        setSearchTerm('')
      }
      onOpenChange(newOpen)
    },
    [initializeLocalState, onOpenChange]
  )

  // 6. Condicionais e early returns
  const isLoading = isLoadingTags || isLoadingAssigned
  const isMutating = assign.isPending || unassign.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
            <TagIcon className="h-5 w-5 text-primary" />
            Tags do Lead
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {leadName
              ? `Arraste entre as colunas ou clique para alternar tags de "${leadName}".`
              : 'Arraste entre as colunas ou clique para alternar tags.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 min-h-[400px]">
          {/* COLUNA ATIVA */}
          <div
            className={cn(
              'flex-1 rounded-2xl p-4 transition-all',
              'bg-success/5 border border-success/20',
              dropZone === 'active' && dragState.fromColumn !== 'active' && 'ring-2 ring-success/50 bg-success/10'
            )}
            onDragOver={(e) => handleDragOver(e, 'active')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'active')}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-success" />
              <h3 className="font-semibold text-foreground">
                ATIVAS ({activeTags.length})
              </h3>
            </div>

            <div className="space-y-2 min-h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : activeTags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TagIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma tag ativa</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Arraste tags da direita ou clique nelas
                  </p>
                </div>
              ) : (
                activeTags.map((tag) => (
                  <TagCard
                    key={tag.id}
                    tag={tag}
                    isActive={true}
                    isDragging={dragState.tagId === tag.id}
                    onClick={() => toggleTag(tag.id)}
                    onDragStart={(e) => handleDragStart(e, tag, 'active')}
                    onDragEnd={handleDragEnd}
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUNA DISPONÍVEL */}
          <div
            className={cn(
              'flex-1 rounded-2xl p-4 transition-all',
              'bg-muted/30 border border-border',
              dropZone === 'available' && dragState.fromColumn !== 'available' && 'ring-2 ring-accent/50 bg-muted/50'
            )}
            onDragOver={(e) => handleDragOver(e, 'available')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'available')}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <h3 className="font-semibold text-foreground">DISPONÍVEIS</h3>
              <div className="flex-1" />
              <div className="relative flex-shrink-0 w-48">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 pl-8 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>
            </div>

            <div className="space-y-2 min-h-[300px] overflow-y-auto max-h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : filteredAvailableTags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TagIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'Nenhuma tag encontrada' : 'Todas as tags estão ativas'}
                  </p>
                </div>
              ) : (
                filteredAvailableTags.map((tag) => (
                  <TagCard
                    key={tag.id}
                    tag={tag}
                    isActive={false}
                    isDragging={dragState.tagId === tag.id}
                    onClick={() => toggleTag(tag.id)}
                    onDragStart={(e) => handleDragStart(e, tag, 'available')}
                    onDragEnd={handleDragEnd}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground flex-1">
            💡 Arraste as tags ou clique para alternar
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isMutating}
              className="border-border text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isMutating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground border-0"
            >
              {isMutating ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface TagCardProps {
  tag: Tag
  isActive: boolean
  isDragging: boolean
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}

function TagCard({ tag, isActive, isDragging, onClick, onDragStart, onDragEnd }: TagCardProps) {
  const safeColor = safeString(tag.color, '#888')
  const safeName = safeString(tag.name, 'Tag')

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'group flex items-center gap-3 rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all',
        'hover:scale-[1.02] hover:shadow-lg',
        isActive
          ? 'bg-card border border-border'
          : 'bg-muted/50 border border-border hover:bg-muted',
        isDragging && 'opacity-50 scale-95'
      )}
      style={
        isActive
          ? {
              backgroundColor: `${safeColor}20`,
              borderColor: `${safeColor}30`,
              borderLeftWidth: '3px',
            }
          : undefined
      }
    >
      <div
        className="h-3 w-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: safeColor }}
      />
      <span className="flex-1 font-medium text-foreground text-sm">{safeName}</span>
      {isActive ? (
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      ) : (
        <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      )}
    </div>
  )
}
