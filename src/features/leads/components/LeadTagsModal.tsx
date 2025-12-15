import { useState, useMemo } from 'react'
import { X, Check, Tag as TagIcon, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { useTags, useTagOperations, useEntityTags } from '@/services/tagService'
import { Tag } from '@/lib/types'
import { safeString } from '@/lib/utils'
import { toast } from 'sonner'

interface LeadTagsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  leadName?: string
}

export function LeadTagsModal({ open, onOpenChange, leadId, leadName }: LeadTagsModalProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch all available tags for leads (includes global tags)
  const { data: availableTags = [], isLoading: isLoadingTags } = useTags('lead')
  
  // Fetch currently assigned tags to this lead
  const { data: assignedTags = [], isLoading: isLoadingAssigned } = useEntityTags(leadId, 'lead')
  
  const { assign, unassign } = useTagOperations()

  // Filter tags by search term
  const filteredTags = useMemo(() => {
    if (!searchTerm.trim()) return availableTags
    const lowerSearch = searchTerm.toLowerCase()
    return availableTags.filter((tag) =>
      safeString(tag.name, '').toLowerCase().includes(lowerSearch)
    )
  }, [availableTags, searchTerm])

  // Set of assigned tag IDs for quick lookup
  const assignedTagIds = useMemo(() => new Set(assignedTags.map((t) => t.id)), [assignedTags])

  const handleToggleTag = async (e: React.MouseEvent, tag: Tag) => {
    e.stopPropagation()
    const isAssigned = assignedTagIds.has(tag.id)

    try {
      if (isAssigned) {
        await unassign.mutateAsync({
          tagId: tag.id,
          entityId: leadId,
          entityType: 'lead',
        })
        toast.success('Tag removida', {
          description: `"${safeString(tag.name, 'Tag')}" foi removida do lead.`,
        })
      } else {
        await assign.mutateAsync({
          tagId: tag.id,
          entityId: leadId,
          entityType: 'lead',
        })
        toast.success('Tag adicionada', {
          description: `"${safeString(tag.name, 'Tag')}" foi adicionada ao lead.`,
        })
      }
    } catch (error) {
      console.error('[LeadTagsModal] Error toggling tag:', error)
      toast.error(isAssigned ? 'Erro ao remover tag' : 'Erro ao adicionar tag', {
        description: 'Tente novamente mais tarde.',
      })
    }
  }

  const isLoading = isLoadingTags || isLoadingAssigned
  const isMutating = assign.isPending || unassign.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Gerenciar Tags
          </DialogTitle>
          <DialogDescription>
            {leadName ? `Adicione ou remova tags de "${leadName}".` : 'Adicione ou remova tags deste lead.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <Input
            placeholder="Buscar tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="h-9"
          />

          {/* Currently assigned tags */}
          {assignedTags.length > 0 && (
            <div className="space-y-2 mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tags atuais
              </p>
              {/* Dynamic height: auto up to ~4 lines, then scroll internally */}
              <div className="flex flex-wrap gap-1.5 max-h-[7.5rem] overflow-y-auto">
                {assignedTags.map((tag) => {
                  const safeColor = safeString(tag.color, '#888')
                  return (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="cursor-pointer hover:opacity-80 transition-opacity gap-1 pr-1 border"
                      style={{ 
                        backgroundColor: `${safeColor}15`, 
                        color: 'hsl(var(--foreground))', 
                        borderColor: safeColor,
                        borderLeftWidth: '3px'
                      }}
                      onClick={(e) => handleToggleTag(e, tag)}
                    >
                      {safeString(tag.name, 'Tag')}
                      <X className="h-3 w-3 ml-1 opacity-60 hover:opacity-100" />
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Available tags list */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {assignedTags.length > 0 ? 'Adicionar mais tags' : 'Selecionar tags'}
            </p>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                {searchTerm ? 'Nenhuma tag encontrada.' : 'Nenhuma tag disponível.'}
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-3">
                <div className="space-y-1">
                  {filteredTags.map((tag) => {
                    const isAssigned = assignedTagIds.has(tag.id)
                    const safeColor = safeString(tag.color, '#888')
                    return (
                      <Button
                        key={tag.id}
                        variant="ghost"
                        className="w-full justify-start h-9 px-2 hover:bg-muted/50"
                        onClick={(e) => handleToggleTag(e, tag)}
                        disabled={isMutating}
                      >
                        <div
                          className="h-3 w-3 rounded-full mr-2 flex-shrink-0"
                          style={{ backgroundColor: safeColor }}
                        />
                        <span className="flex-1 text-left truncate text-sm">
                          {safeString(tag.name, 'Tag')}
                        </span>
                        {isAssigned && <Check className="h-4 w-4 text-primary ml-2" />}
                      </Button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
