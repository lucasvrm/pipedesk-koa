import { useState } from "react";
import { Check, Plus, Tag as TagIcon, X, PencilSimple, Trash, FloppyDisk } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/services/tagService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TagSelectorProps {
  entityType: 'deal' | 'track';
  selectedTagIds: string[];
  onSelectTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
}

export default function TagSelector({ entityType, selectedTagIds, onSelectTag, onRemoveTag }: TagSelectorProps) {
  const { profile } = useAuth();
  const { data: tags } = useTags(entityType);
  
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Filtra as tags selecionadas para exibição
  const selectedTags = tags?.filter(t => selectedTagIds.includes(t.id)) || [];

  const handleCreate = async () => {
    if (!searchValue.trim()) return;
    if (!profile) return;

    try {
      await createMutation.mutateAsync({
        name: searchValue,
        color: '#64748b', // Cor padrão (slate)
        entityType,
        userId: profile.id
      });
      toast.success("Tag criada!");
      setSearchValue(""); // Limpa busca
    } catch (error) {
      toast.error("Erro ao criar tag");
    }
  };

  const handleUpdate = async (tagId: string) => {
    if (!editName.trim()) return;
    try {
      await updateMutation.mutateAsync({
        id: tagId,
        updates: { name: editName }
      });
      toast.success("Tag atualizada!");
      setEditingTagId(null);
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const handleDelete = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Excluir esta tag permanentemente?")) return;
    
    try {
      await deleteMutation.mutateAsync(tagId);
      toast.success("Tag excluída!");
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const startEditing = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTagId(id);
    setEditName(currentName);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Lista de Tags Selecionadas (Badges) */}
      <div className="flex flex-wrap gap-2 mb-1">
        {selectedTags.map(tag => (
          <Badge 
            key={tag.id} 
            variant="outline" 
            style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }}
            className="border flex items-center gap-1 pl-2 pr-1 py-0.5"
          >
            {tag.name}
            <div 
              role="button"
              className="cursor-pointer hover:bg-black/10 rounded-full p-0.5 ml-1 transition-colors"
              onClick={() => onRemoveTag(tag.id)}
            >
              <X size={10} />
            </div>
          </Badge>
        ))}
      </div>

      {/* Popover de Seleção e Gestão */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="justify-start w-fit h-8 border-dashed text-muted-foreground">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Gerenciar Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[280px]" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar ou criar tag..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {/* Opção de Criar (se não existir exata) */}
              {searchValue && !tags?.some(t => t.name.toLowerCase() === searchValue.toLowerCase()) && (
                <CommandGroup>
                  <CommandItem onSelect={handleCreate} className="cursor-pointer text-primary" value={`create-${searchValue}`}>
                    <Plus className="mr-2 h-4 w-4" /> Criar "{searchValue}"
                  </CommandItem>
                </CommandGroup>
              )}

              <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
              
              <CommandGroup heading="Tags Disponíveis">
                {tags?.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const isEditing = editingTagId === tag.id;

                  if (isEditing) {
                    return (
                      <div key={tag.id} className="flex items-center p-2 gap-2 bg-muted/50">
                        <Input 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)} 
                          className="h-7 text-xs"
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleUpdate(tag.id)}>
                          <FloppyDisk size={14} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTagId(null)}>
                          <X size={14} />
                        </Button>
                      </div>
                    )
                  }

                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name} // IMPORTANTE: Usar nome para filtro do cmdk
                      onSelect={() => {
                        if (isSelected) {
                          onRemoveTag(tag.id);
                        } else {
                          onSelectTag(tag.id);
                        }
                      }}
                      className="cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2 shrink-0" 
                          style={{ backgroundColor: tag.color }} 
                        />
                        <span>{tag.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                         {isSelected && <Check className="h-4 w-4 mr-1 text-primary" />}
                         
                         {/* Botões de Ação (só aparecem no hover) */}
                         <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary"
                              onClick={(e) => startEditing(tag.id, tag.name, e)}
                            >
                              <PencilSimple size={12} />
                            </Button>
                            <Button 
                              size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDelete(tag.id, e)}
                            >
                              <Trash size={12} />
                            </Button>
                         </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}