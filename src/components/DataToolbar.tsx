import { Search, X, AlignJustify, LayoutGrid, Kanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";

// FIXED: Made all props optional to prevent crashes when component is rendered without props
interface DataToolbarProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
  children?: ReactNode; // Slot para filtros
  actions?: ReactNode; // Botão New Lead
  className?: string; // FIXED: Added className support for custom styling
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
  
  // FIXED: Stabilized event handlers with useCallback to prevent unnecessary re-renders
  const handleSearchChange = useCallback((value: string) => {
    onSearchChange?.(value);
  }, [onSearchChange]);

  const handleViewChange = useCallback((view: string) => {
    onViewChange?.(view);
  }, [onViewChange]);

  // FIXED: Only show search if onSearchChange is provided
  const showSearch = !!onSearchChange;
  // FIXED: Only show view toggle if onViewChange is provided
  const showViewToggle = !!onViewChange;

  return (
    <div className={cn(
      "sticky top-0 z-20 w-full backdrop-blur-sm bg-background/80 border-b px-6 py-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-200",
      className
    )}>
      
      {/* Esquerda: Busca e Filtros */}
      <div className="flex items-center flex-1 gap-3 w-full sm:w-auto">
        {/* FIXED: Conditionally render search input only when onSearchChange is provided */}
        {showSearch && (
          <div className="relative w-full max-w-[320px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-9 bg-background/50 border-muted focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Slot para Filtros (Children) - FIXED: Show separator only when search is visible */}
        {children && (
          <div className="flex items-center gap-2">
            {showSearch && <Separator orientation="vertical" className="h-6 mx-1" />}
            {children}
          </div>
        )}
      </div>

      {/* Direita: View Toggles e Ações */}
      <div className="flex items-center gap-3">
        {/* FIXED: Conditionally render view toggles only when onViewChange is provided */}
        {showViewToggle && (
          <div className="flex items-center p-1 bg-muted/50 rounded-lg border border-border/40">
            {/* FIXED: Removed outer TooltipProvider - each Tooltip component already includes its own provider */}
            <Tooltip>
              <TooltipTrigger asChild>
                {/* FIXED: Wrapper div to prevent Radix UI ref loop with rapid re-renders */}
                <div className="flex">
                  <Button
                    variant={currentView === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Lista"
                    onClick={() => handleViewChange('list')}
                  >
                    <AlignJustify className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>Lista</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                {/* FIXED: Wrapper div to prevent Radix UI ref loop with rapid re-renders */}
                <div className="flex">
                  <Button
                    variant={currentView === 'cards' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Cards"
                    onClick={() => handleViewChange('cards')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>Cards</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                {/* FIXED: Wrapper div to prevent Radix UI ref loop with rapid re-renders */}
                <div className="flex">
                  <Button
                    variant={currentView === 'kanban' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Kanban"
                    onClick={() => handleViewChange('kanban')}
                  >
                    <Kanban className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>Kanban</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* FIXED: Show separator only when view toggle is visible */}
        {showViewToggle && actions && (
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
        )}

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