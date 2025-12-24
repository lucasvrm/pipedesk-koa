import { Button } from '@/components/ui/button';
import { UserCheck, UserX, Trash2, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onActivate,
  onDeactivate,
  onDelete,
  onClearSelection,
}: BulkActionsBarProps) {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-foreground">
          {selectedCount} usuário{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onActivate}
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Ativar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDeactivate}
            className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400"
          >
            <UserX className="h-4 w-4 mr-1" />
            Desativar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="text-muted-foreground"
      >
        <X className="h-4 w-4 mr-1" />
        Limpar seleção
      </Button>
    </div>
  );
}
