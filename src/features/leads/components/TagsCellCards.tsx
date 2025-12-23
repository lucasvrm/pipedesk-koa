import { useState } from 'react'
import { X, Tag as TagIcon, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tag } from '@/lib/types'
import { safeString } from '@/lib/utils'
import { KanbanTagsModal } from './KanbanTagsModal'

interface TagsCellCardsProps {
  tags: Tag[]
  leadId: string
  leadName: string
  onRemove: (tagId: string) => void
  isRemoving?: boolean
}

export function TagsCellCards({ tags, leadId, leadName, onRemove, isRemoving }: TagsCellCardsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="w-full min-w-0">
      {/* Tags list */}
      {tags.length > 0 ? (
        <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
          {tags.map(tag => {
            const safeColor = tag.color || '#3b82f6'
            const safeName = safeString(tag.name, 'Tag')
            const initial = safeName.charAt(0).toUpperCase()

            return (
              <div
                key={tag.id}
                className="group flex items-center gap-2 rounded-md bg-card p-1.5 ring-1 ring-border transition-all hover:ring-border/80 hover:shadow-sm"
              >
                {/* Inicial colorida */}
                <div
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: safeColor }}
                >
                  {initial}
                </div>

                {/* Nome da tag */}
                <span className="flex-1 truncate text-xs font-medium text-foreground">
                  {safeName}
                </span>

                {/* Botão remover */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(tag.id)
                  }}
                  disabled={isRemoving}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>
      ) : (
        <div 
          className="flex items-center justify-center py-2 text-xs text-muted-foreground border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            setIsModalOpen(true)
          }}
        >
          <TagIcon className="h-3 w-3 mr-1" />
          Adicionar
        </div>
      )}

      {/* Botão editar (sempre visível se há tags) */}
      {tags.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1.5 h-6 text-xs text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation()
            setIsModalOpen(true)
          }}
        >
          <Pencil className="h-3 w-3 mr-1" />
          Editar tags
        </Button>
      )}

      {/* Modal Kanban */}
      <KanbanTagsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        leadId={leadId}
        leadName={leadName}
      />
    </div>
  )
}
