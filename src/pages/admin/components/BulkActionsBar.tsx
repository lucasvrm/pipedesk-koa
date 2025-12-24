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
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">
          <span className="font-bold">{selectedCount}</span> usuário{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onActivate}
          className="gap-2"
        >
          <UserCheck className="h-4 w-4" />
          Ativar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeactivate}
          className="gap-2"
        >
          <UserX className="h-4 w-4" />
          Desativar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </div>
    </div>
  );
}
