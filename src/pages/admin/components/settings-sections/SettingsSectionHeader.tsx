import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface SettingsSectionHeaderProps {
  title: string;
  description: string;
  onAdd?: () => void;
  addLabel?: string;
  children?: React.ReactNode;
}

export function SettingsSectionHeader({
  title,
  description,
  onAdd,
  addLabel = 'Novo',
  children
}: SettingsSectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" /> {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
