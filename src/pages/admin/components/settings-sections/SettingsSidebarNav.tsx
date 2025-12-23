import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface SettingsSidebarNavProps {
  items: SidebarNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  title?: string;
}

export function SettingsSidebarNav({ 
  items, 
  activeId, 
  onSelect, 
  title = 'Configurações' 
}: SettingsSidebarNavProps) {
  return (
    <div className="space-y-1">
      {title && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
          {title}
        </p>
      )}
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left group',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary-foreground')} />
              <span className="flex-1 truncate">{item.label}</span>
              {typeof item.count === 'number' && item.count > 0 && (
                <Badge
                  variant={isActive ? 'secondary' : 'outline'}
                  className={cn(
                    'text-xs px-1.5 py-0 h-5',
                    isActive && 'bg-primary-foreground/20 text-primary-foreground border-0'
                  )}
                >
                  {item.count}
                </Badge>
              )}
              <ChevronRight
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform',
                  isActive ? 'text-primary-foreground translate-x-0.5' : 'text-muted-foreground/50'
                )}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
