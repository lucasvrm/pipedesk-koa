import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import TagSelector from "@/components/TagSelector"
import { useAssignTag, useRemoveTag } from "@/services/tagService"
import { useDeal } from "@/services/dealService"
import { Tag } from "@phosphor-icons/react"

interface DealTagsDialogProps {
  dealId: string | null 
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DealTagsDialog({ dealId, open, onOpenChange }: DealTagsDialogProps) {
  const assignTagMutation = useAssignTag()
  const removeTagMutation = useRemoveTag()
  const { data: deal, isLoading } = useDeal(dealId)

  if (!dealId) return null

  const handleAddTag = (tagId: string) => {
    assignTagMutation.mutate({ tagId, entityId: dealId, entityType: 'deal' })
  }

  const handleRemoveTag = (tagId: string) => {
    removeTagMutation.mutate({ tagId, entityId: dealId, entityType: 'deal' })
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
                {isLoading ? "Carregando..." : <>Deal: <span className="font-medium text-foreground">{deal?.clientName}</span></>}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {!isLoading && deal && (
          <div className="py-2">
            <TagSelector 
              variant="inline"
              entityType="deal"
              selectedTagIds={deal.tags?.map(t => t.id) || []}
              onSelectTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}