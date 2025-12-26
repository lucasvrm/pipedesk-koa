import { useEffect, useMemo, useState } from 'react';
import { DynamicBreadcrumbs } from '@/components/DynamicBreadcrumbs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Users,
  GitBranch,
  Briefcase,
  Lightbulb,
  Search,
} from 'lucide-react';
import {
  LeadSettingsSection,
  DealPipelineSettingsSection,
  CompanyRelationshipSettingsSection,
  SystemSettingsSection,
  ProductivitySettingsSection,
  ProductsSettingsSection,
  IntegrationsSettingsSection
} from '@/pages/admin/components/settings-sections';
import { useSearchParams } from 'react-router-dom';
import { StandardPageLayout } from '@/components/layouts';

// Configuração das categorias
const CATEGORIES = {
  crm: {
    value: 'crm',
    label: 'CRM & Vendas',
    description: 'Gerencie leads, deals, pipeline e relacionamentos'
  },
  products: {
    value: 'products',
    label: 'Produtos & Operações',
    description: 'Configure produtos, tipos de operação e origens'
  },
  system: {
    value: 'system',
    label: 'Sistema & Segurança',
    description: 'Papéis, permissões e configurações do sistema'
  },
  productivity: {
    value: 'productivity',
    label: 'Produtividade',
    description: 'Tarefas, tags, templates e feriados'
  },
  integrations: {
    value: 'integrations',
    label: 'Integrações & Automação',
    description: 'Dashboards e automação de documentos'
  }
} as const;

// Helper component for help cards
function HelpCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/20">
      <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-medium">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-tight">{description}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  const CATEGORY_SECTIONS: Record<string, string[]> = useMemo(
    () => ({
      crm: ['leads', 'deals', 'companies'],
      products: ['products', 'operation_types', 'deal_sources', 'loss_reasons'],
      system: ['defaults', 'roles', 'permissions'],
      productivity: ['tasks', 'tags', 'templates', 'holidays'],
      integrations: ['dashboards', 'automation']
    }),
    []
  );

  const defaultSectionByCategory: Record<string, string> = {
    crm: 'leads',
    products: 'products',
    system: 'defaults',
    productivity: 'tasks',
    integrations: 'dashboards'
  };

  // Pega categoria e seção da URL
  const requestedCategory = searchParams.get('category') || 'crm';
  const activeCategory = Object.prototype.hasOwnProperty.call(CATEGORIES, requestedCategory)
    ? requestedCategory
    : 'crm';
  const categorySections = CATEGORY_SECTIONS[activeCategory] || [];
  const requestedSection = searchParams.get('section');
  const activeSection = categorySections.includes(requestedSection || '')
    ? requestedSection!
    : defaultSectionByCategory[activeCategory];

  // States para cada categoria
  const [crmSection, setCrmSection] = useState(activeCategory === 'crm' ? activeSection : 'leads');
  const [productsSection, setProductsSection] = useState(activeCategory === 'products' ? activeSection : 'products');
  const [systemSection, setSystemSection] = useState(activeCategory === 'system' ? activeSection : 'defaults');
  const [productivitySection, setProductivitySection] = useState(activeCategory === 'productivity' ? activeSection : 'tasks');
  const [integrationsSection, setIntegrationsSection] = useState(activeCategory === 'integrations' ? activeSection : 'dashboards');

  const updateSearchParams = (section: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('category', activeCategory);
    nextParams.set('section', section);
    nextParams.delete('sub');
    setSearchParams(nextParams, { replace: true });
  };

  // Sincroniza com URL quando categoria/seção mudam externamente (via sidebar)
  useEffect(() => {
    const category = searchParams.get('category') || 'crm';
    const section = searchParams.get('section');

    if (category === 'crm' && section && CATEGORY_SECTIONS.crm.includes(section)) {
      setCrmSection(section);
    }
    if (category === 'products' && section && CATEGORY_SECTIONS.products.includes(section)) {
      setProductsSection(section);
    }
    if (category === 'system' && section && CATEGORY_SECTIONS.system.includes(section)) {
      setSystemSection(section);
    }
    if (category === 'productivity' && section && CATEGORY_SECTIONS.productivity.includes(section)) {
      setProductivitySection(section);
    }
    if (category === 'integrations' && section && CATEGORY_SECTIONS.integrations.includes(section)) {
      setIntegrationsSection(section);
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [searchParams, CATEGORY_SECTIONS]);

  useEffect(() => {
    const shouldClearSub = activeCategory !== 'crm' || activeSection !== 'companies';
    if (shouldClearSub && searchParams.get('sub')) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete('sub');
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeCategory, activeSection, searchParams, setSearchParams]);

  const categoryConfig = CATEGORIES[activeCategory as keyof typeof CATEGORIES];

  // Renderiza conteúdo baseado na categoria ativa
  const renderContent = () => {
    switch (activeCategory) {
      case 'crm':
        return (
          <div className="space-y-4">
            <HelpCard
              title="CRM & Vendas"
              description="Configure todos os aspectos do seu funil de vendas, desde leads até empresas e contatos."
            />
            
            <Tabs
              value={crmSection}
              onValueChange={(value) => {
                setCrmSection(value);
                updateSearchParams(value);
              }}
              className="w-full"
            >
              <TabsList className="mb-3 h-9">
                <TabsTrigger value="leads" className="text-sm h-8">
                  <Users className="mr-1.5 h-3.5 w-3.5" /> Leads
                </TabsTrigger>
                <TabsTrigger value="deals" className="text-sm h-8">
                  <GitBranch className="mr-1.5 h-3.5 w-3.5" /> Deals & Pipeline
                </TabsTrigger>
                <TabsTrigger value="companies" className="text-sm h-8">
                  <Briefcase className="mr-1.5 h-3.5 w-3.5" /> Empresas & Contatos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="leads" className="space-y-4">
                <LeadSettingsSection />
              </TabsContent>

              <TabsContent value="deals" className="space-y-4">
                <DealPipelineSettingsSection />
              </TabsContent>

              <TabsContent value="companies" className="space-y-4">
                <CompanyRelationshipSettingsSection />
              </TabsContent>
            </Tabs>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-4">
            <HelpCard
              title="Produtos & Operações"
              description="Defina os produtos disponíveis, configure tipos de operação, origens de deals e motivos de perda."
            />

            <ProductsSettingsSection
              activeTab={productsSection as 'products' | 'operation_types' | 'deal_sources' | 'loss_reasons'}
              onTabChange={(value) => {
                setProductsSection(value);
                updateSearchParams(value);
              }}
            />
          </div>
        );

      case 'system':
        return (
          <div className="space-y-4">
            <HelpCard
              title="Sistema & Segurança"
              description="Configure papéis de usuários, gerencie permissões RBAC e defina valores padrão do sistema."
            />

            <SystemSettingsSection
              activeTab={systemSection as 'defaults' | 'roles' | 'permissions'}
              onTabChange={(value) => {
                setSystemSection(value);
                updateSearchParams(value);
              }}
            />
          </div>
        );

      case 'productivity':
        return (
          <div className="space-y-4">
            <HelpCard
              title="Produtividade"
              description="Organize o trabalho da equipe com configurações de tarefas, tags, templates e feriados."
            />
            
            <ProductivitySettingsSection
              activeTab={productivitySection as 'tasks' | 'tags' | 'templates' | 'holidays'}
              onTabChange={(value) => {
                setProductivitySection(value);
                updateSearchParams(value);
              }}
            />
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-4">
            <HelpCard
              title="Integrações & Automação"
              description="Configure dashboards personalizados e automatize a geração de documentos."
            />

            <IntegrationsSettingsSection
              activeTab={integrationsSection as 'dashboards' | 'automation'}
              onTabChange={(value) => {
                setIntegrationsSection(value);
                updateSearchParams(value);
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <StandardPageLayout>
      {/* Conteúdo da categoria */}
      {renderContent()}
    </StandardPageLayout>
  );
}
