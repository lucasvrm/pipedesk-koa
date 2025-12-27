import { Tag } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PencilSimple, Trash } from '@phosphor-icons/react';

interface TagCardProps {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
}

export function TagCard({ tag, onEdit, onDelete }: TagCardProps) {
  const isGlobal = tag.entity_type === 'global' || tag.entity_type === null;

  return (
    <div className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-1"
          style={{ backgroundColor: tag.color, '--tw-ring-color': tag.color } as React.CSSProperties}
        />
        <div className="flex flex-col">
          <span className="font-medium text-sm leading-none">{tag.name}</span>
          {isGlobal && (
            <span className="text-[10px] text-muted-foreground mt-1">Global</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onEdit(tag)}
        >
          <PencilSimple className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(tag.id)}
        >
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
