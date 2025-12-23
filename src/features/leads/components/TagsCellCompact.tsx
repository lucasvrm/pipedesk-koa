import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tag } from '@/lib/types'
import { safeString } from '@/lib/utils'
import { KanbanTagsModal } from './KanbanTagsModal'

interface TagsCellCompactProps {
  tags: Tag[]
  leadId: string
  leadName: string
  maxVisibleTags?: number
}

export function TagsCellCompact({ 
  tags, 
  leadId, 
  leadName,
  maxVisibleTags = 6 // Padrão: 6 tags (2 linhas × ~3 tags por linha)
}: TagsCellCompactProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsModalOpen(true)
  }

  // Calcular tags visíveis e contagem de overflow
  const { visibleTags, hiddenCount } = useMemo(() => {
    if (tags.length <= maxVisibleTags) {
      return { visibleTags: tags, hiddenCount: 0 }
    }
    return {
      visibleTags: tags.slice(0, maxVisibleTags),
      hiddenCount: tags.length - maxVisibleTags
    }
  }, [tags, maxVisibleTags])

  // Se não há tags, mostrar botão "Adicionar"
  if (tags.length === 0) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={handleOpenModal}
        >
          <Plus className="h-3 w-3" />
          Adicionar
        </Button>
        <KanbanTagsModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          leadId={leadId}
          leadName={leadName}
        />
      </>
    )
  }

  // Se há tags, mostrar layout compacto com badge overflow
  return (
    <>
      <button
        type="button"
        className="w-full min-w-0 flex flex-wrap items-center gap-1.5 rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={handleOpenModal}
        aria-label="Gerenciar tags do lead"
      >
        {/* Tags visíveis com tamanho aumentado 30% */}
        {visibleTags.map(tag => {
          const safeColor = tag.color || '#3b82f6'
          const safeName = safeString(tag.name, 'Tag')
          const initial = safeName.charAt(0).toUpperCase()

          return (
            <div
              key={tag.id}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 max-w-[94px] ring-1 ring-border bg-card"
              title={safeName}
            >
              <span
                className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                style={{ backgroundColor: safeColor }}
              >
                {initial}
              </span>
              <span className="truncate text-[10px] font-medium text-foreground">
                {safeName}
              </span>
            </div>
          )
        })}

        {/* Badge de overflow "+N" */}
        {hiddenCount > 0 && (
          <Badge 
            variant="secondary" 
            className="h-[18px] px-2 text-[10px] font-medium shrink-0"
          >
            +{hiddenCount}
          </Badge>
        )}
      </button>

      {/* Modal Kanban */}
      <KanbanTagsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        leadId={leadId}
        leadName={leadName}
      />
    </>
  )
}
