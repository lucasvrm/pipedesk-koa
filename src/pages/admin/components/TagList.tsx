import { Tag } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PencilSimple, Trash } from '@phosphor-icons/react';

interface TagListProps {
  tags: Tag[];
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
}

export function TagList({ tags, onEdit, onDelete }: TagListProps) {
  if (tags.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
        Nenhuma tag encontrada.
      </div>
    );
  }

  const getScopeLabel = (type?: string | null) => {
    switch (type) {
      case 'deal': return <Badge variant="outline">Deals</Badge>;
      case 'track': return <Badge variant="outline">Tracks</Badge>;
      case 'lead': return <Badge variant="outline">Leads</Badge>;
      default: return <Badge variant="secondary">Global</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Cor</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Escopo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => (
            <TableRow key={tag.id}>
              <TableCell>
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: tag.color }}
                />
              </TableCell>
              <TableCell className="font-medium">{tag.name}</TableCell>
              <TableCell>
                {getScopeLabel(tag.entity_type)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(tag)}
                  >
                    <PencilSimple className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(tag.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
