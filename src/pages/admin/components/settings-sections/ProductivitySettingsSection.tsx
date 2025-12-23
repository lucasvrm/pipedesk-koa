import { useState } from 'react';
import { ListChecks, Tag, FileText, Calendar } from 'lucide-react';
import { SettingsSidebarLayout } from './SettingsSidebarLayout';
import type { SidebarNavItem } from './SettingsSidebarNav';
import { SettingsTable } from '../SettingsTable';
import TagSettings from '../../TagSettings';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type SectionId = 'tasks' | 'tags' | 'templates' | 'holidays';

const NAV_ITEMS: Omit<SidebarNavItem, 'count'>[] = [
  { id: 'tasks', label: 'Tarefas', icon: ListChecks },
  { id: 'tags', label: 'Tags', icon: Tag },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'holidays', label: 'Feriados', icon: Calendar },
];

// ============================================================================
// Tasks Section (Status + Priorities)
// ============================================================================

function TasksSection() {
  return (
    <div className="space-y-6">
      <SettingsTable
        type="task_statuses"
        title="Status de Tarefas"
        description="Padronize os status das tarefas"
        columns={[
          { key: 'name', label: 'Status', width: '200px', render: (i) => <span className="font-medium">{i.name}</span> },
          {
            key: 'color',
            label: 'Cor',
            width: '100px',
            render: (i) => (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: i.color || '#475569' }} />
                <span className="text-xs text-muted-foreground font-mono">{i.color || '-'}</span>
              </div>
            )
          },
          { key: 'description', label: 'Descrição' }
        ]}
      />

      <SettingsTable
        type="task_priorities"
        title="Prioridades de Tarefas"
        description="Defina níveis de prioridade para o fluxo de trabalho"
        columns={[
          { key: 'name', label: 'Prioridade', width: '200px', render: (i) => <span className="font-medium">{i.name}</span> },
          {
            key: 'color',
            label: 'Cor',
            width: '100px',
            render: (i) => (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: i.color || '#475569' }} />
                <span className="text-xs text-muted-foreground font-mono">{i.color || '-'}</span>
              </div>
            )
          },
          { key: 'description', label: 'Descrição' }
        ]}
      />
    </div>
  );
}

// ============================================================================
// Templates Section
// ============================================================================

function TemplatesSection() {
  return (
    <SettingsTable
      type="communication_templates"
      title="Templates de Mensagens"
      description="Padronização de emails, whatsapps e documentos"
      columns={[
        { key: 'title', label: 'Título', width: '180px', render: (i) => <span className="font-medium">{i.title}</span> },
        { key: 'type', label: 'Canal', width: '100px', render: (i) => <Badge variant="outline" className="capitalize">{i.type}</Badge> },
        { key: 'category', label: 'Categoria', width: '120px', render: (i) => <Badge variant="secondary">{i.category}</Badge> },
        { key: 'subject', label: 'Assunto', render: (i) => <span className="text-sm text-muted-foreground truncate max-w-[150px] block">{i.subject || '-'}</span> }
      ]}
    />
  );
}

// ============================================================================
// Holidays Section
// ============================================================================

function HolidaysSection() {
  return (
    <SettingsTable
      type="holidays"
      title="Feriados & Dias Não Úteis"
      description="Cadastro para cálculo correto de SLA"
      columns={[
        { key: 'date', label: 'Data', width: '120px', render: (i) => format(new Date(i.date), 'dd/MM/yyyy') },
        { key: 'name', label: 'Feriado', render: (i) => <span className="font-medium">{i.name}</span> },
        {
          key: 'type',
          label: 'Tipo',
          width: '120px',
          render: (i) => (
            <Badge className={i.type === 'national' ? 'bg-blue-500' : 'bg-orange-500'}>
              {i.type === 'national' ? 'Nacional' : 'Regional'}
            </Badge>
          )
        }
      ]}
    />
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface ProductivitySettingsSectionProps {
  activeTab?: SectionId;
  onTabChange?: (tab: SectionId) => void;
}

export function ProductivitySettingsSection({ activeTab, onTabChange }: ProductivitySettingsSectionProps) {
  const [internalSection, setInternalSection] = useState<SectionId>('tasks');
  const currentSection = activeTab ?? internalSection;

  const handleSectionChange = (id: string) => {
    const section = id as SectionId;
    if (!activeTab) setInternalSection(section);
    onTabChange?.(section);
  };

  const navItems: SidebarNavItem[] = NAV_ITEMS.map((item) => ({ ...item }));

  const renderContent = () => {
    switch (currentSection) {
      case 'tasks':
        return <TasksSection />;
      case 'tags':
        return <TagSettings />;
      case 'templates':
        return <TemplatesSection />;
      case 'holidays':
        return <HolidaysSection />;
      default:
        return null;
    }
  };

  return (
    <SettingsSidebarLayout
      items={navItems}
      activeId={currentSection}
      onSelect={handleSectionChange}
      minHeight="560px"
    >
      {renderContent()}
    </SettingsSidebarLayout>
  );
}
