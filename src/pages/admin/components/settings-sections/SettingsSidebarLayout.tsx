import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsSidebarNav, SidebarNavItem } from './SettingsSidebarNav';

interface SettingsSidebarLayoutProps {
  items: SidebarNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  children: ReactNode;
  sidebarTitle?: string;
  minHeight?: string;
}

export function SettingsSidebarLayout({
  items,
  activeId,
  onSelect,
  children,
  sidebarTitle = 'Configurações',
  minHeight = '560px'
}: SettingsSidebarLayoutProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex" style={{ minHeight }}>
          {/* Sidebar */}
          <div className="w-[280px] border-r bg-muted/30 p-4 shrink-0">
            <SettingsSidebarNav
              items={items}
              activeId={activeId}
              onSelect={onSelect}
              title={sidebarTitle}
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
