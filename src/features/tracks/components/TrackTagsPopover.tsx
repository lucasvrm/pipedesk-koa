import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tag as TagIcon } from "@phosphor-icons/react"
import TagSelector from "@/components/TagSelector"
import { PlayerTrack } from "@/lib/types"
import { useAssignTag, useRemoveTag } from "@/services/tagService"
import { useState } from "react"

interface TrackTagsPopoverProps {
  track: PlayerTrack
}

export function TrackTagsPopover({ track }: TrackTagsPopoverProps) {
  const assignTagMutation = useAssignTag()
  const removeTagMutation = useRemoveTag()
  const [open, setOpen] = useState(false)

  const handleAddTag = (tagId: string) => {
    assignTagMutation.mutate({ tagId, entityId: track.id, entityType: 'track' })
  }

  const handleRemoveTag = (tagId: string) => {
    removeTagMutation.mutate({ tagId, entityId: track.id, entityType: 'track' })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          title="Gerenciar Tags"
          onClick={(e) => e.stopPropagation()}
        >
          <TagIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end">
        <div className="p-3 bg-muted/10 border-b">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <TagIcon className="text-primary" /> 
            Tags: <span className="truncate max-w-[180px] text-muted-foreground">{track.playerName}</span>
          </h4>
        </div>
        <div className="p-2">
          <TagSelector 
            entityType="track"
            selectedTagIds={track.tags?.map(t => t.id) || []}
            onSelectTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}