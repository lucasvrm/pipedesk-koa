import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import TagSelector from "@/components/TagSelector"
import { MasterDeal } from "@/lib/types"
import { useAssignTag, useRemoveTag } from "@/services/tagService"
import { Tag } from "@phosphor-icons/react"

interface DealTagsDialogProps {
  deal: MasterDeal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DealTagsDialog({ deal, open, onOpenChange }: DealTagsDialogProps) {
  const assignTagMutation = useAssignTag()
  const removeTagMutation = useRemoveTag()

  if (!deal) return null

  const handleAddTag = (tagId: string) => {
    assignTagMutation.mutate({ tagId, entityId: deal.id, entityType: 'deal' })
  }

  const handleRemoveTag = (tagId: string) => {
    removeTagMutation.mutate({ tagId, entityId: deal.id, entityType: 'deal' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Tag size={20} />
            </div>
            <div>
              <DialogTitle>Gerenciar Tags</DialogTitle>
              <DialogDescription className="mt-1">
                Classifique o deal <strong>{deal.clientName}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <TagSelector 
            entityType="deal"
            selectedTagIds={deal.tags?.map(t => t.id) || []}
            onSelectTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}