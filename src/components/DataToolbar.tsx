import { Search, X, AlignJustify, LayoutGrid, Kanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";

interface DataToolbarProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DataToolbar({
  searchTerm = "",
  onSearchChange,
  currentView = "list",
  onViewChange,
  children,
  actions,
  className
}: DataToolbarProps) {
  
  const handleClearSearch = useCallback(() => {
    onSearchChange?.("");
  }, [onSearchChange]);

  const handleViewClick = useCallback((view: string) => {
    onViewChange?.(view);
  }, [onViewChange]);

  return (
    <div className={cn(
      // FIXED: Layout estático, sem sticky, integrado ao card
      "w-full bg-card border-b p-4 flex flex-col sm:flex-row items-center justify-between gap-4", 
      className
    )}>
      
      {/* Esquerda: Busca e Filtros */}
      <div className="flex items-center flex-1 gap-3 w-full sm:w-auto">
        {onSearchChange && (
          <div className="relative w-full max-w-[320px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 bg-background border-input focus-visible:ring-1 transition-all"
            />
            {searchTerm.length > 0 && (
              <button 
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {children && (
          <div className="flex items-center gap-2">
            <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
            {children}
          </div>
        )}
      </div>

      {/* Direita: View Toggles e Ações */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        
        {onViewChange && (
          <div className="flex items-center p-1 bg-muted rounded-md border">
            <Button
              variant={currentView === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleViewClick('list')}
              title="Lista"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>

            <Button
              variant={currentView === 'cards' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleViewClick('cards')}
              title="Cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>

            <Button
              variant={currentView === 'kanban' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleViewClick('kanban')}
              title="Kanban"
            >
              <Kanban className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {actions ?? (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        )}
      </div>
    </div>
  );
}