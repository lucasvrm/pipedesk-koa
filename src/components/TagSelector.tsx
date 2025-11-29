import { useState } from "react";
import { Check, Plus, Tag as TagIcon, X } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTags } from "@/services/tagService";
import { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  entityType: 'deal' | 'track';
  selectedTagIds: string[];
  onSelectTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
}

export default function TagSelector({ entityType, selectedTagIds, onSelectTag, onRemoveTag }: TagSelectorProps) {
  const { data: tags } = useTags(entityType);
  const [open, setOpen] = useState(false);

  const selectedTags = tags?.filter(t => selectedTagIds.includes(t.id)) || [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 mb-1">
        {selectedTags.map(tag => (
          <Badge 
            key={tag.id} 
            variant="secondary" 
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
        <PopoverContent className="p-0 w-[200px]" align="start">
          <Command>
            <CommandInput placeholder="Buscar tag..." />
            <CommandList>
              <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
              <CommandGroup>
                {tags?.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => {
                        if (isSelected) {
                          onRemoveTag(tag.id);
                        } else {
                          onSelectTag(tag.id);
                        }
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: tag.color }} 
                      />
                      <span>{tag.name}</span>
                      {isSelected && <Check className="ml-auto h-4 w-4" />}
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