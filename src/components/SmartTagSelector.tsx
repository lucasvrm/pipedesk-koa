import { useState, type MouseEvent } from "react"
import { Check, Plus, Tag as TagIcon, Trash, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTags, useTagOperations, TAG_COLORS } from "@/services/tagService"
import { toast } from "sonner"

interface SmartTagSelectorProps {
  entityType: 'deal' | 'track' | 'lead'
  entityId: string
  selectedTagIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SELECTED_ALPHA = '26'   // ~15% opacity
const UNSELECTED_ALPHA = '14' // ~8% opacity

export function SmartTagSelector({ entityType, entityId, selectedTagIds = [], open, onOpenChange }: SmartTagSelectorProps) {
  const { data: tags } = useTags(entityType)
  const { create, assign, unassign, update, remove } = useTagOperations()
  
  const [search, setSearch] = useState("")
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const filteredTags = tags || []
  const exactMatch = filteredTags.some(t => t.name.toLowerCase() === search.toLowerCase())

  const handleSelect = (tagId: string) => {
    const isSelected = selectedTagIds.includes(tagId)
    
    if (isSelected) {
      unassign.mutate({ tagId, entityId, entityType }, {
        onSuccess: () => toast.success('Tag removida'),
        onError: () => toast.error('Erro ao remover tag')
      })
    } else {
      assign.mutate({ tagId, entityId, entityType }, {
        onSuccess: () => toast.success('Tag adicionada'),
        onError: () => toast.error('Erro ao adicionar tag')
      })
    }
  }

  const handleCreate = () => {
    if (!search.trim()) return
    const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
    create.mutate({ name: search.trim(), color: randomColor, entity_type: entityType }, {
      onSuccess: (newTag) => {
        assign.mutate({ tagId: newTag.id, entityId, entityType })
        setSearch("")
        toast.success("Tag criada e atribuída")
      }
    })
  }

  const handleUpdate = () => {
    if (editingTag && editName.trim()) {
      update.mutate({ id: editingTag, name: editName }, {
        onSuccess: () => {
          setEditingTag(null)
          setEditName("")
        }
      })
    }
  }

  const handleDelete = (tagId: string, e: MouseEvent) => {
    e.stopPropagation()
    if (confirm("Tem certeza? Isso removerá a tag de todos os itens.")) {
      remove.mutate(tagId)
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <span className="sr-only">Abrir seletor de tags</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[480px] max-h-[80vh] p-0 shadow-lg border bg-background">
        <div className="px-4 py-3 border-b flex items-center justify-between bg-background">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <TagIcon className="text-primary" />
            <span>Gerenciar Tags</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSearch(""); setEditingTag(null); onOpenChange(false) }}>
            Fechar
          </Button>
        </div>

        {editingTag ? (
          <div className="p-4 space-y-3 bg-background">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Editar Tag</p>
              <p className="text-xs text-muted-foreground">Ajuste o nome e confirme para salvar.</p>
            </div>
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Nome da tag"
              className="bg-background text-foreground border-border"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setEditingTag(null)}>Cancelar</Button>
              <Button size="sm" onClick={handleUpdate}>Salvar</Button>
            </div>
          </div>
        ) : (
          <Command className="rounded-b-lg bg-background">
            <CommandInput
              placeholder="Buscar ou criar tag..."
              value={search}
              onValueChange={setSearch}
              className="bg-background text-foreground border-border"
            />
            <CommandList className="max-h-[480px] overflow-y-auto">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                {search && !exactMatch ? (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-foreground">Tag "{search}" não existe.</p>
                    <Button variant="outline" size="sm" onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" /> Criar "{search}"
                    </Button>
                  </div>
                ) : "Nenhuma tag encontrada."}
              </CommandEmpty>

              <CommandGroup heading="Tags Disponíveis" className="text-foreground">
                {filteredTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id)
                  const tagColor = tag.color || '#3b82f6'
                  const backgroundColor = isSelected ? `${tagColor}${SELECTED_ALPHA}` : `${tagColor}${UNSELECTED_ALPHA}`
                  const textColor = isSelected ? tagColor : 'hsl(var(--foreground))'
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleSelect(tag.id)}
                      className={cn(
                        "flex items-center justify-between group cursor-pointer px-3 py-2.5 rounded-md border transition-colors",
                        "hover:bg-muted"
                      )}
                      style={{
                        backgroundColor: isSelected ? backgroundColor : undefined,
                        borderColor: tagColor,
                        color: textColor
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex items-center justify-center w-4 h-4 border rounded transition-colors",
                            isSelected && "bg-primary border-primary"
                          )}
                          style={{
                            borderColor: isSelected ? undefined : tagColor,
                            backgroundColor: isSelected ? undefined : 'transparent'
                          }}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs font-medium border px-2 py-1"
                          style={{
                            borderColor: tagColor,
                            backgroundColor,
                            color: textColor
                          }}
                        >
                          {tag.name}
                        </Badge>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); setEditingTag(tag.id); setEditName(tag.name); }}
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => handleDelete(tag.id, e)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}
