import { useState } from "react";
import { Check, Plus, X, PencilSimple, Trash, FloppyDisk } from "@phosphor-icons/react";
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
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  entityType: 'deal' | 'track';
  selectedTagIds: string[];
  onSelectTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  variant?: 'default' | 'inline';
}

export default function TagSelector({ 
  entityType, 
  selectedTagIds, 
  onSelectTag, 
  onRemoveTag, 
  variant = 'default' 
}: TagSelectorProps) {
  const { profile } = useAuth();
  const { data: tags } = useTags(entityType);
  
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const selectedTags = tags?.filter(t => selectedTagIds.includes(t.id)) || [];

  // --- Handlers CRUD ---

  const handleCreate = async () => {
    if (!searchValue.trim()) return;
    if (!profile) return;

    try {
      await createMutation.mutateAsync({
        name: searchValue,
        color: '#64748b',
        entityType,
        userId: profile.id
      });
      toast.success("Tag criada!");
      setSearchValue("");
    } catch (error) {
      toast.error("Erro ao criar tag");
    }
  };

  const handleUpdate = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTagId(null);
  };

  // --- Renderização da Lista ---
  const ListContent = (
    <Command className={cn("w-full", variant === 'inline' ? "border rounded-md" : "")}>
      <CommandInput 
        placeholder="Buscar ou criar tag..." 
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList className="max-h-[300px] overflow-y-auto">
        <CommandEmpty className="py-2 text-center text-sm text-muted-foreground">
           {searchValue ? (
             <button 
               onClick={handleCreate} 
               className="text-primary hover:underline flex items-center justify-center w-full gap-1"
             >
               <Plus size={14} /> Criar tag "{searchValue}"
             </button>
           ) : "Nenhuma tag encontrada."}
        </CommandEmpty>
        
        <CommandGroup heading="Tags Disponíveis">
          {tags?.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            const isEditing = editingTagId === tag.id;

            if (isEditing) {
              return (
                <div key={tag.id} className="flex items-center p-2 gap-2 bg-muted/50 border-b last:border-0">
                  <Input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    className="h-8 text-sm"
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-100" onClick={(e) => handleUpdate(tag.id, e)}>
                    <FloppyDisk size={16} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-slate-200" onClick={cancelEditing}>
                    <X size={16} />
                  </Button>
                </div>
              )
            }

            return (
              <CommandItem
                key={tag.id}
                value={tag.name}
                onSelect={() => {
                  if (isSelected) onRemoveTag(tag.id);
                  else onSelectTag(tag.id);
                }}
                className="cursor-pointer group flex items-center justify-between py-2 px-2 aria-selected:bg-accent"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div 
                    className={cn(
                      "flex items-center justify-center w-4 h-4 border rounded transition-colors",
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && <Check size={10} weight="bold" />}
                  </div>
                  
                  <div 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: tag.color }} 
                  />
                  <span className={cn("text-sm", isSelected && "font-medium")}>{tag.name}</span>
                </div>
                
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
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
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  // Modo Inline (Para dentro de Dialogs)
  if (variant === 'inline') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 min-h-[32px] p-2 bg-muted/10 rounded-md border border-dashed border-muted-foreground/20">
          {selectedTags.length > 0 ? selectedTags.map(tag => (
            <Badge 
              key={tag.id} 
              variant="outline" 
              style={{ backgroundColor: tag.color + '15', color: tag.color, borderColor: tag.color + '40' }}
              className="flex items-center gap-1 pr-1 pl-2"
            >
              {tag.name}
              <div 
                role="button"
                className="cursor-pointer hover:bg-black/5 rounded-full p-0.5 transition-colors ml-1"
                onClick={() => onRemoveTag(tag.id)}
              >
                <X size={10} />
              </div>
            </Badge>
          )) : (
            <span className="text-xs text-muted-foreground self-center ml-1">Nenhuma tag selecionada</span>
          )}
        </div>
        {ListContent}
      </div>
    );
  }

  // Modo Default (Popover)
  return (
    <div className="flex flex-col gap-2">
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
              className="cursor-pointer hover:bg-black/10 rounded-full p-0.5 ml-1"
              onClick={() => onRemoveTag(tag.id)}
            >
              <X size={10} />
            </div>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="justify-start w-fit h-8 border-dashed text-muted-foreground">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Adicionar Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]" align="start">
          {ListContent}
        </PopoverContent>
      </Popover>
    </div>
  );
}