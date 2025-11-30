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
  // Propriedades adicionais do componente CreatePlayerDialog
  players: any[];
  selectedPlayerId: string | undefined;
  onSelect: (player: any) => void;
  onDeselect: () => void;
  disabled: boolean;
  label?: string; // Para manter o contexto dos últimos commits
}

// CORREÇÃO: Exportação alterada para default
export default function PlayerSelect({ 
    players, 
    selectedPlayerId, 
    onSelect, 
    onDeselect, 
    disabled, 
    label,
    onCheckNew // Mantido por compatibilidade
}: PlayerSelectProps) {
  const [open, setOpen] = useState(false);
  
  // Usaremos o players passado por prop (do usePlayers no CreatePlayerDialog)
  // Removendo o hook interno para evitar duplicação de dados e conflito com a interface anterior
  // Assumo que a interface PlayerSelectProps acima foi uma fusão de props, vamos usar o formato mais recente (CreatePlayerDialog)
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selectedPlayerId
            ? selectedPlayer?.name || "Player selecionado"
            : "Selecione um player..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        style={{ zIndex: 9999 }} 
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder="Buscar player..." autoFocus />
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
              {players.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">Nenhum player.</div>
              ) : (
                players.map((player) => (
                  <CommandItem
                    key={player.id}
                    value={player.name}
                    onSelect={() => {
                      onSelect(player);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedPlayerId === player.id ? "opacity-100" : "opacity-0"
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