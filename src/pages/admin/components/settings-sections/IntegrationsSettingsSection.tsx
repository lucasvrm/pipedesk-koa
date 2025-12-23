import { useState } from 'react';
import { BarChart3, FileCode } from 'lucide-react';
import { SettingsSidebarLayout } from './SettingsSidebarLayout';
import type { SidebarNavItem } from './SettingsSidebarNav';
import DashboardSettingsContent from './DashboardSettingsContent';
import DocumentAutomationContent from './DocumentAutomationContent';

type SectionId = 'dashboards' | 'automation';

const NAV_ITEMS: Omit<SidebarNavItem, 'count'>[] = [
  { id: 'dashboards', label: 'Dashboards', icon: BarChart3 },
  { id: 'automation', label: 'Automação de Docs', icon: FileCode },
];

interface IntegrationsSettingsSectionProps {
  activeTab?: SectionId;
  onTabChange?: (tab: SectionId) => void;
}

export function IntegrationsSettingsSection({ activeTab, onTabChange }: IntegrationsSettingsSectionProps) {
  const [internalSection, setInternalSection] = useState<SectionId>('dashboards');
  const currentSection = activeTab ?? internalSection;

  const handleSectionChange = (id: string) => {
    const section = id as SectionId;
    if (!activeTab) setInternalSection(section);
    onTabChange?.(section);
  };

  const navItems: SidebarNavItem[] = NAV_ITEMS.map((item) => ({ ...item }));

  return (
    <SettingsSidebarLayout
      items={navItems}
      activeId={currentSection}
      onSelect={handleSectionChange}
      minHeight="560px"
    >
      {currentSection === 'dashboards' && <DashboardSettingsContent />}
      {currentSection === 'automation' && <DocumentAutomationContent />}
    </SettingsSidebarLayout>
  );
}
