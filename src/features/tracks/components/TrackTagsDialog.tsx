import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import TagSelector from "@/components/TagSelector"
import { PlayerTrack } from "@/lib/types"
import { useAssignTag, useRemoveTag } from "@/services/tagService"
import { Tag } from "@phosphor-icons/react"

interface TrackTagsDialogProps {
  track: PlayerTrack | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrackTagsDialog({ track, open, onOpenChange }: TrackTagsDialogProps) {
  const assignTagMutation = useAssignTag()
  const removeTagMutation = useRemoveTag()

  if (!track) return null

  const handleAddTag = (tagId: string) => {
    assignTagMutation.mutate({ tagId, entityId: track.id, entityType: 'track' })
  }

  const handleRemoveTag = (tagId: string) => {
    removeTagMutation.mutate({ tagId, entityId: track.id, entityType: 'track' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Tag size={20} weight="bold" />
            </div>
            <div>
              <DialogTitle>Gerenciar Tags</DialogTitle>
              <DialogDescription className="mt-1">
                Track: <span className="font-medium text-foreground">{track.playerName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-2">
          <TagSelector 
            variant="inline"
            entityType="track"
            selectedTagIds={track.tags?.map(t => t.id) || []}
            onSelectTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}