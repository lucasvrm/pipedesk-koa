import { useState, useMemo } from 'react'
import { X, Check, Tag as TagIcon, Plus, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTags, useEntityTags, useTagOperations, TAG_COLORS } from '@/services/tagService'
import { Tag } from '@/lib/types'
import { safeString } from '@/lib/utils'
import { toast } from 'sonner'

interface TagManagerPopoverProps {
  leadId: string
  leadName?: string
}

export function TagManagerPopover({ leadId, leadName }: TagManagerPopoverProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch all available tags for leads (includes global tags)
  const { data: availableTags = [], isLoading: isLoadingTags } = useTags('lead')
  
  // Fetch currently assigned tags to this lead
  const { data: assignedTags = [], isLoading: isLoadingAssigned } = useEntityTags(leadId, 'lead')
  
  const { assign, unassign, create } = useTagOperations()

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

  // Check if there's an exact match for creating new tag
  const exactMatch = useMemo(() => 
    availableTags.some(t => t.name.toLowerCase() === searchTerm.toLowerCase()),
    [availableTags, searchTerm]
  )

  // Core toggle logic without event handling - used by CommandItem onSelect
  const toggleTag = async (tag: Tag) => {
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
      console.error('[TagManagerPopover] Error toggling tag:', error)
      toast.error(isAssigned ? 'Erro ao remover tag' : 'Erro ao adicionar tag', {
        description: 'Tente novamente mais tarde.',
      })
    }
  }

  const handleRemoveTag = async (e: React.MouseEvent, tag: Tag) => {
    e.stopPropagation()
    try {
      await unassign.mutateAsync({
        tagId: tag.id,
        entityId: leadId,
        entityType: 'lead',
      })
      toast.success('Tag removida', {
        description: `"${safeString(tag.name, 'Tag')}" foi removida do lead.`,
      })
    } catch (error) {
      console.error('[TagManagerPopover] Error removing tag:', error)
      toast.error('Erro ao remover tag', {
        description: 'Tente novamente mais tarde.',
      })
    }
  }

  const handleCreateTag = async () => {
    if (!searchTerm.trim()) return
    
    try {
      const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
      const newTag = await create.mutateAsync({
        name: searchTerm.trim(),
        color: randomColor,
        entity_type: 'lead',
      })
      
      // Assign the new tag to this lead
      await assign.mutateAsync({
        tagId: newTag.id,
        entityId: leadId,
        entityType: 'lead',
      })
      
      setSearchTerm('')
      toast.success('Tag criada e adicionada', {
        description: `"${searchTerm.trim()}" foi criada e adicionada ao lead.`,
      })
    } catch (error) {
      console.error('[TagManagerPopover] Error creating tag:', error)
      toast.error('Erro ao criar tag', {
        description: 'Tente novamente mais tarde.',
      })
    }
  }

  const isLoading = isLoadingTags || isLoadingAssigned
  const isMutating = assign.isPending || unassign.isPending || create.isPending

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <div className="flex">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <TagIcon className="h-4 w-4 mr-1" />
            <span className="text-xs">
              {assignedTags.length > 0 ? `${assignedTags.length} tag${assignedTags.length > 1 ? 's' : ''}` : 'Tags'}
            </span>
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        align="start" 
        className="w-[320px] p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {leadName ? `Tags - ${leadName}` : 'Gerenciar Tags'}
          </span>
        </div>

        {/* Currently assigned tags */}
        {assignedTags.length > 0 && (
          <div className="px-3 py-2 border-b bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Tags atuais
            </p>
            <div className="flex flex-wrap gap-1.5">
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
                    onClick={(e) => handleRemoveTag(e, tag)}
                  >
                    {safeString(tag.name, 'Tag')}
                    <X className="h-3 w-3 ml-1 opacity-60 hover:opacity-100" />
                  </Badge>
                )
              })}
            </div>
          </div>
        )}

        <Command className="rounded-none">
          <CommandInput
            placeholder="Buscar ou criar tag..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            onClick={(e) => e.stopPropagation()}
          />
          <CommandList className="max-h-[200px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty className="py-4 text-center text-sm">
                  {searchTerm && !exactMatch ? (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">Tag "{searchTerm}" não existe.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCreateTag}
                        disabled={isMutating}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Criar "{searchTerm}"
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Nenhuma tag encontrada.</span>
                  )}
                </CommandEmpty>

                <CommandGroup heading="Tags Disponíveis">
                  {filteredTags.map((tag) => {
                    const isAssigned = assignedTagIds.has(tag.id)
                    const safeColor = safeString(tag.color, '#888')
                    return (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => toggleTag(tag)}
                        className="flex items-center justify-between cursor-pointer"
                        disabled={isMutating}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: safeColor }}
                          />
                          <span className="text-sm truncate">
                            {safeString(tag.name, 'Tag')}
                          </span>
                        </div>
                        {isAssigned && <Check className="h-4 w-4 text-primary" />}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
