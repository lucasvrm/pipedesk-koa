import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { useQuery } from "@tanstack/react-query";
import { getPlayers } from "@/services/playerService"; 

interface PlayerSelectProps {
  value?: string;
  onChange: (value: string) => void;
  onCheckNew?: () => void;
}

export function PlayerSelect({ value, onChange, onCheckNew }: PlayerSelectProps) {
  const [open, setOpen] = useState(false);
  
  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: getPlayers,
  });

  const selectedPlayer = players.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value
            ? selectedPlayer?.name || "Player selecionado"
            : "Selecione um player..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar player..." />
          <CommandList>
            <CommandEmpty>
              <div className="p-2 text-center text-sm">
                <p className="mb-2 text-muted-foreground">Player não encontrado.</p>
                {onCheckNew && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => {
                      onCheckNew();
                      setOpen(false);
                    }} 
                    className="w-full"
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Cadastrar Novo
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup heading="Players Disponíveis">
              {isLoading ? (
                <div className="p-2 text-sm text-muted-foreground text-center">Carregando...</div>
              ) : (
                players.map((player) => (
                  <CommandItem
                    key={player.id}
                    value={player.name}
                    onSelect={() => {
                      onChange(player.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === player.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{player.name}</span>
                      {player.type && (
                        <span className="text-xs text-muted-foreground">{player.type}</span>
                      )}
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}