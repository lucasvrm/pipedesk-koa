import { X, Tag as TagIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tag } from '@/lib/types'
import { safeString } from '@/lib/utils'

interface TagsSectionCardsProps {
  tags: Tag[]
  onRemove: (tagId: string) => void
  onManage: () => void
  isRemoving?: boolean
}

export function TagsSectionCards({ tags, onRemove, onManage, isRemoving }: TagsSectionCardsProps) {
  return (
    <div className="pt-2 border-t">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <TagIcon className="h-3.5 w-3.5" />
          Tags
        </label>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onManage}
        >
          Editar
        </Button>
      </div>

      {/* Cards Grid */}
      {tags.length > 0 ? (
        <div className="space-y-1.5">
          {tags.map(tag => {
            const safeColor = tag.color || '#3b82f6'
            const safeName = safeString(tag.name, 'Tag')
            const initial = safeName.charAt(0).toUpperCase()

            return (
              <div
                key={tag.id}
                className="group flex items-center gap-2.5 rounded-lg bg-card p-2 ring-1 ring-border transition-all hover:ring-border/80 hover:shadow-sm"
              >
                {/* Inicial colorida */}
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                  style={{ backgroundColor: safeColor }}
                >
                  {initial}
                </div>

                {/* Nome da tag */}
                <span className="flex-1 truncate text-sm font-medium text-foreground">
                  {safeName}
                </span>

                {/* Botão remover */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(tag.id)
                  }}
                  disabled={isRemoving}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-4 text-center border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={onManage}
        >
          <TagIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">Nenhuma tag</p>
          <p className="text-xs text-primary mt-1">+ Adicionar</p>
        </div>
      )}
    </div>
  )
}
