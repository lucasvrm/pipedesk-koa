import { useState } from "react";
import { Check, Plus, X, PencilSimple, Trash, FloppyDisk, Tag as TagIcon } from "@phosphor-icons/react";
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
  const [isCreating, setIsCreating] = useState(false);

  const selectedTags = tags?.filter(t => selectedTagIds.includes(t.id)) || [];

  const handleCreate = async () => {
    if (!searchValue.trim() || !profile) return;
    try {
      await createMutation.mutateAsync({
        name: searchValue,
        color: '#64748b',
        entityType,
        userId: profile.id
      });
      toast.success("Tag criada!");
      setSearchValue("");
      setIsCreating(false);
    } catch {
      toast.error("Erro ao criar tag");
    }
  };

  const handleUpdate = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editName.trim()) return;
    try {
      await updateMutation.mutateAsync({ id: tagId, updates: { name: editName } });
      toast.success("Tag atualizada!");
      setEditingTagId(null);
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleDelete = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Excluir esta tag permanentemente?")) return;
    try {
      await deleteMutation.mutateAsync(tagId);
      toast.success("Tag excluída!");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const startEditing = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTagId(id);
    setEditName(currentName);
  };

  const CreateSection = (
    <div className="p-2 border-b bg-muted/10">
      {isCreating ? (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Input 
            value={searchValue} 
            onChange={e => setSearchValue(e.target.value)} 
            placeholder="Nome da tag"
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setIsCreating(false);
            }}
          />
          <Button size="sm" className="h-8 px-3" onClick={handleCreate}>Salvar</Button>
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setIsCreating(false)}>
            <X />
          </Button>
        </div>
      ) : (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-primary h-8 px-2 hover:bg-primary/10"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="mr-2 h-3.5 w-3.5" /> Nova Tag
        </Button>
      )}
    </div>
  );

  const ListContent = (
    <Command className={cn("w-full bg-transparent", variant === 'inline' ? "border rounded-md bg-background" : "")}>
      
      {/* Seção de Criação FORA da lista virtualizada do Command */}
      {CreateSection}

      <CommandInput 
        placeholder="Filtrar tags..." 
        value={searchValue}
        onValueChange={setSearchValue}
        className="h-9"
      />
      
      <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
        <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">
           Nenhuma tag encontrada.
        </CommandEmpty>
        
        <CommandGroup>
          {tags?.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            const isEditing = editingTagId === tag.id;

            if (isEditing) {
              return (
                <div key={tag.id} className="flex items-center p-2 gap-2 bg-background border-b last:border-0">
                  <Input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    className="h-7 text-xs"
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-100" onClick={(e) => handleUpdate(tag.id, e)}>
                    <FloppyDisk size={14} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-slate-200" onClick={() => setEditingTagId(null)}>
                    <X size={14} />
                  </Button>
                </div>
              )
            }

            return (
              <CommandItem
                key={tag.id}
                value={tag.name} // Necessário para o filtro funcionar
                onSelect={() => {
                  // Lógica direta de toggle
                  if (isSelected) onRemoveTag(tag.id);
                  else onSelectTag(tag.id);
                }}
                className="cursor-pointer flex items-center justify-between py-2 px-3 aria-selected:bg-accent/50 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                  <div className={cn(
                    "flex items-center justify-center w-4 h-4 border rounded transition-colors shrink-0",
                    isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                  )}>
                    {isSelected && <Check size={10} weight="bold" />}
                  </div>
                  
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="truncate text-sm font-medium">{tag.name}</span>
                </div>
                
                <div className="flex items-center gap-0.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={(e) => startEditing(tag.id, tag.name, e)}>
                    <PencilSimple size={12} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(tag.id, e)}>
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

  // Renderização Inline (Dialogs)
  if (variant === 'inline') {
    return (
      <div className="flex flex-col gap-3">
        {/* Tags Selecionadas */}
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-muted/10 rounded-md border border-dashed border-muted-foreground/20 items-center">
          {selectedTags.length > 0 ? selectedTags.map(tag => (
            <Badge 
              key={tag.id} 
              variant="outline" 
              style={{ backgroundColor: tag.color + '15', color: tag.color, borderColor: tag.color + '40' }}
              className="flex items-center gap-1 pr-1 pl-2 h-6"
            >
              {tag.name}
              <div role="button" className="cursor-pointer hover:bg-black/5 rounded-full p-0.5 ml-1" onClick={() => onRemoveTag(tag.id)}>
                <X size={10} />
              </div>
            </Badge>
          )) : <span className="text-xs text-muted-foreground italic ml-1">Nenhuma tag selecionada</span>}
        </div>
        
        {ListContent}
      </div>
    );
  }

  // Renderização Default (Popover)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 mb-1">
        {selectedTags.map(tag => (
          <Badge key={tag.id} variant="outline" style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }} className="border flex items-center gap-1 pl-2 pr-1 py-0.5">
            {tag.name}
            <div role="button" className="cursor-pointer hover:bg-black/10 rounded-full p-0.5 ml-1" onClick={() => onRemoveTag(tag.id)}>
              <X size={10} />
            </div>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="justify-start w-fit h-8 border-dashed text-muted-foreground">
            <Plus className="mr-2 h-3.5 w-3.5" /> Adicionar Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]" align="start" side="bottom">
          {ListContent}
        </PopoverContent>
      </Popover>
    </div>
  );
}