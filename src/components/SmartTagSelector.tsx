import { useState } from "react"
import { Check, Plus, Tag as TagIcon, Trash, PencilSimple } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useTags, useTagOperations, TAG_COLORS } from "@/services/tagService"
import { toast } from "sonner"

interface SmartTagSelectorProps {
  entityType: 'deal' | 'track'
  entityId: string
  selectedTagIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

  const handleDelete = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Tem certeza? Isso removerá a tag de todos os itens.")) {
      remove.mutate(tagId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-[400px]">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-sm font-medium flex items-center gap-2">
            <TagIcon className="text-primary" /> Gerenciar Tags
          </DialogTitle>
        </DialogHeader>

        {editingTag ? (
          <div className="p-4 space-y-3">
            <h4 className="text-sm font-medium">Editar Tag</h4>
            <Input 
              value={editName} 
              onChange={e => setEditName(e.target.value)} 
              placeholder="Nome da tag" 
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setEditingTag(null)}>Cancelar</Button>
              <Button size="sm" onClick={handleUpdate}>Salvar</Button>
            </div>
          </div>
        ) : (
          <Command className="rounded-b-lg">
            <CommandInput 
              placeholder="Buscar ou criar tag..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-6 text-center text-sm">
                {search && !exactMatch ? (
                  <div className="flex flex-col items-center gap-2">
                    <p>Tag "{search}" não existe.</p>
                    <Button variant="outline" size="sm" onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" /> Criar "{search}"
                    </Button>
                  </div>
                ) : "Nenhuma tag encontrada."}
              </CommandEmpty>
              
              <CommandGroup heading="Tags Disponíveis">
                {filteredTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id)
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleSelect(tag.id)}
                      className="flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className={`flex items-center justify-center w-4 h-4 border rounded transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'}`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <Badge variant="outline" style={{ borderColor: tag.color, color: tag.color, backgroundColor: tag.color + '15' }}>
                          {tag.name}
                        </Badge>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" size="icon" className="h-6 w-6" 
                          onClick={(e) => { e.stopPropagation(); setEditingTag(tag.id); setEditName(tag.name); }}
                        >
                          <PencilSimple className="h-3 w-3 text-muted-foreground" />
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
      </DialogContent>
    </Dialog>
  )
}