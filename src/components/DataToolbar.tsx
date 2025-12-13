import { Search, X, AlignJustify, LayoutGrid, Kanban, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { ReactNode } from "react";

interface DataToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  currentView: string;
  onViewChange: (view: string) => void;
  children?: ReactNode; // Slot para filtros
  actions?: ReactNode; // Botão New Lead
}

export function DataToolbar({
  searchTerm,
  onSearchChange,
  currentView,
  onViewChange,
  children,
  actions
}: DataToolbarProps) {
  
  const hasActiveFilters = searchTerm.length > 0;

  return (
    <div className="sticky top-0 z-20 w-full backdrop-blur-md bg-background/80 border-b px-6 py-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-200">
      
      {/* Esquerda: Busca e Filtros */}
      <div className="flex items-center flex-1 gap-3 w-full sm:w-auto">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads, empresas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-background/50 border-muted focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Slot para Filtros (Children) */}
        {children && (
          <div className="flex items-center gap-2">
            <Separator orientation="vertical" className="h-6 mx-1" />
            {children}
          </div>
        )}
      </div>

      {/* Direita: View Toggles e Ações */}
      <div className="flex items-center gap-3">
        {/* View Toggles - Implementação Manual Segura (Sem ToggleGroup para evitar erro de Ref) */}
        <div className="flex items-center p-1 bg-muted/50 rounded-lg border border-border/40">
          <TooltipProvider delayDuration={300}>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentView === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onViewChange('list')}
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Lista</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentView === 'cards' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onViewChange('cards')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cards</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentView === 'kanban' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onViewChange('kanban')}
                >
                  <Kanban className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Kanban</TooltipContent>
            </Tooltip>

          </TooltipProvider>
        </div>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Ações Principais */}
        {actions ?? (
          <Button size="sm" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        )}
      </div>
    </div>
  );
}