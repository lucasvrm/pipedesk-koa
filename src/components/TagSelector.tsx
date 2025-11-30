import { useState } from 'react'
import { Plus, Tag as TagIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SmartTagSelector } from '@/components/SmartTagSelector'
import { useTags, useEntityTags } from '@/services/tagService'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
  entityId: string
  entityType: 'deal' | 'track' | 'lead'
  variant?: 'default' | 'minimal' | 'icon'
  className?: string
}

export default function TagSelector({ entityId, entityType, variant = 'default', className }: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const { data: allTags } = useTags(entityType)
  const { data: entityTags } = useEntityTags(entityId, entityType)

  const selectedTagIds = entityTags?.map(t => t.id) || []

  // Resolve full tag objects for display
  const displayTags = allTags?.filter(t => selectedTagIds.includes(t.id)) || []

  if (variant === 'minimal') {
    return (
      <>
        <div className={cn("flex flex-wrap gap-1", className)}>
          {displayTags.slice(0, 3).map(tag => (
            <div
              key={tag.id}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color }}
              title={tag.name}
            />
          ))}
          {(displayTags.length > 3 || displayTags.length === 0) && (
            <Button
                variant="ghost"
                size="icon"
                className="w-4 h-4 p-0 opacity-50 hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            >
                <Plus className="w-3 h-3" />
            </Button>
          )}
        </div>
        <SmartTagSelector
            entityId={entityId}
            entityType={entityType}
            selectedTagIds={selectedTagIds}
            open={open}
            onOpenChange={setOpen}
        />
      </>
    )
  }

  if (variant === 'icon') {
    return (
      <>
        <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 text-muted-foreground", className)}
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        >
            <TagIcon className="w-4 h-4" />
        </Button>
        <SmartTagSelector
            entityId={entityId}
            entityType={entityType}
            selectedTagIds={selectedTagIds}
            open={open}
            onOpenChange={setOpen}
        />
      </>
    )
  }

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {displayTags.map(tag => (
        <Badge
            key={tag.id}
            variant="outline"
            style={{
                borderColor: tag.color,
                color: tag.color,
                backgroundColor: tag.color + '10'
            }}
        >
            {tag.name}
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-muted-foreground dashed border border-transparent hover:border-muted-foreground/30"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        <Plus className="mr-1 h-3 w-3" /> Tags
      </Button>

      <SmartTagSelector
            entityId={entityId}
            entityType={entityType}
            selectedTagIds={selectedTagIds}
            open={open}
            onOpenChange={setOpen}
      />
    </div>
  )
}
