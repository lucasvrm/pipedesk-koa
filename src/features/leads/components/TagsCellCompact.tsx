import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tag } from '@/lib/types'
import { safeString } from '@/lib/utils'
import { KanbanTagsModal } from './KanbanTagsModal'

interface TagsCellCompactProps {
  tags: Tag[]
  leadId: string
  leadName: string
}

export function TagsCellCompact({ 
  tags, 
  leadId, 
  leadName
}: TagsCellCompactProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsModalOpen(true)
  }

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

  // Se há tags, mostrar layout compacto horizontal
  return (
    <>
      <button
        type="button"
        className="w-full min-w-0 flex flex-wrap items-center gap-1 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 max-h-[52px] overflow-hidden"
        onClick={handleOpenModal}
        aria-label="Gerenciar tags do lead"
      >
        {tags.map(tag => {
          const safeColor = tag.color || '#3b82f6'
          const safeName = safeString(tag.name, 'Tag')
          const initial = safeName.charAt(0).toUpperCase()

          return (
            <div
              key={tag.id}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 max-w-[72px] ring-1 ring-border bg-card"
              title={safeName}
            >
              <span
                className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded text-[8px] font-bold text-white"
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
