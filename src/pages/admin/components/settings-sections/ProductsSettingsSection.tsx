import { useState } from 'react';
import { Package, Briefcase, TrendingDown, Target } from 'lucide-react';
import { SettingsSidebarLayout } from './SettingsSidebarLayout';
import { SettingsTable } from '../SettingsTable';
import { Badge } from '@/components/ui/badge';
import type { SidebarNavItem } from './SettingsSidebarNav';

type SectionId = 'products' | 'operation_types' | 'deal_sources' | 'loss_reasons';

const NAV_ITEMS: Omit<SidebarNavItem, 'count'>[] = [
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'operation_types', label: 'Tipos de Operação', icon: Briefcase },
  { id: 'deal_sources', label: 'Origens de Deal', icon: Target },
  { id: 'loss_reasons', label: 'Motivos de Perda', icon: TrendingDown },
];

interface ProductsSettingsSectionProps {
  activeTab?: SectionId;
  onTabChange?: (tab: SectionId) => void;
}

export function ProductsSettingsSection({ activeTab, onTabChange }: ProductsSettingsSectionProps) {
  const [internalSection, setInternalSection] = useState<SectionId>('products');
  const currentSection = activeTab ?? internalSection;

  const handleSectionChange = (id: string) => {
    const section = id as SectionId;
    if (!activeTab) setInternalSection(section);
    onTabChange?.(section);
  };

  const navItems: SidebarNavItem[] = NAV_ITEMS.map((item) => ({ ...item }));

  const renderContent = () => {
    switch (currentSection) {
      case 'products':
        return (
          <SettingsTable
            type="products"
            title="Produtos"
            description="Defina os produtos financeiros (ex: CRI, CRA, CCB) disponíveis."
            columns={[
              {
                key: 'name',
                label: 'Nome',
                width: '250px',
                render: (i) => <span className="font-medium">{i.name}</span>
              },
              {
                key: 'acronym',
                label: 'Sigla',
                width: '100px',
                render: (i) => <Badge variant="outline">{i.acronym}</Badge>
              },
              {
                key: 'defaultFeePercentage',
                label: 'Fee Padrão',
                width: '100px',
                render: (i) => (i.defaultFeePercentage ? `${i.defaultFeePercentage}%` : '-')
              },
              { key: 'description', label: 'Descrição' }
            ]}
          />
        );

      case 'operation_types':
        return (
          <SettingsTable
            type="operation_types"
            title="Tipos de Operação"
            description="Configure os tipos de operação suportados para negócios e deals."
            columns={[
              {
                key: 'name',
                label: 'Tipo',
                width: '220px',
                render: (i) => <span className="font-medium">{i.name}</span>
              },
              {
                key: 'code',
                label: 'Código',
                width: '120px',
                render: (i) =>
                  i.code ? (
                    <Badge variant="outline" className="uppercase">
                      {i.code}
                    </Badge>
                  ) : (
                    '-'
                  )
              },
              { key: 'description', label: 'Descrição' }
            ]}
          />
        );

      case 'deal_sources':
        return (
          <SettingsTable
            type="deal_sources"
            title="Origens de Deal (Sources)"
            description="Canais de aquisição de novos negócios."
            columns={[
              {
                key: 'name',
                label: 'Canal',
                width: '250px',
                render: (i) => <span className="font-medium">{i.name}</span>
              },
              {
                key: 'type',
                label: 'Tipo',
                width: '150px',
                render: (i) =>
                  i.type && (
                    <Badge variant="secondary" className="capitalize">
                      {i.type}
                    </Badge>
                  )
              },
              { key: 'description', label: 'Descrição' }
            ]}
          />
        );

      case 'loss_reasons':
        return (
          <SettingsTable
            type="loss_reasons"
            title="Motivos de Perda"
            description="Razões padronizadas para cancelamento de deals (Churn)."
            columns={[
              {
                key: 'name',
                label: 'Motivo',
                width: '250px',
                render: (i) => <span className="font-medium">{i.name}</span>
              },
              { key: 'description', label: 'Descrição' }
            ]}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SettingsSidebarLayout
      items={navItems}
      activeId={currentSection}
      onSelect={handleSectionChange}
      minHeight="500px"
    >
      {renderContent()}
    </SettingsSidebarLayout>
  );
}
