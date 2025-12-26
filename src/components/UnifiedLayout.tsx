import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

interface PageHeaderContextValue {
  setHeaderContent: (content: ReactNode | null) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

interface Breadcrumb {
  label: string;
  path?: string;
}

interface UnifiedLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  activeSection?: 'profile' | 'management' | 'settings';
  activeItem?: string;
  className?: string;
  contentClassName?: string;
  showBreadcrumbs?: boolean;
}

export function UnifiedLayout({
  children,
  title,
  description,
  breadcrumbs,
  activeSection,
  activeItem,
  className,
  contentClassName,
  showBreadcrumbs = true,
}: UnifiedLayoutProps) {
  const [headerContent, setHeaderContent] = useState<ReactNode | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const headerContext = useMemo(
    () => ({ setHeaderContent }),
    [setHeaderContent]
  );

  const segmentLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    leads: 'Leads',
    deals: 'Deals',
    companies: 'Empresas',
    contacts: 'Contatos',
    players: 'Players',
    tasks: 'Tarefas',
    tracks: 'Tracks',
    profile: 'Meu Perfil',
    activity: 'Atividades',
    security: 'Segurança',
    customize: 'Customização',
    admin: 'Admin',
    settings: 'Configurações',
  };

  const profileTabLabels: Record<string, string> = {
    avatar: 'Avatar',
    rail: 'Rail/Sidebar',
    notifications: 'Preferências de Notificação',
    timeline: 'Configurar Timeline',
    tuning: 'Personalização do Menu',
  };

  const adminCategoryLabels: Record<string, string> = {
    crm: 'CRM & Vendas',
    products: 'Produtos & Operações',
    system: 'Sistema & Segurança',
    productivity: 'Produtividade',
    integrations: 'Integrações & Automação',
  };

  const adminSectionLabels: Record<string, string> = {
    leads: 'Leads',
    deals: 'Deals & Pipeline',
    companies: 'Empresas & Contatos',
    products: 'Produtos',
    operation_types: 'Tipos de Operação',
    deal_sources: 'Origens de Deal',
    loss_reasons: 'Motivos de Perda',
    defaults: 'Defaults do Sistema',
    roles: 'Papéis & Permissões',
    permissions: 'Permissões Avançadas',
    tasks: 'Tarefas',
    tags: 'Tags',
    templates: 'Templates',
    holidays: 'Feriados',
    dashboards: 'Dashboards',
    automation: 'Automação',
  };

  const formatSegment = (segment: string) => segment.replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const isIdLike = (segment: string) => /^[0-9a-f-]{6,}$/i.test(segment);

  const autoBreadcrumbs = (): Breadcrumb[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const searchParams = new URLSearchParams(location.search);
    const crumbs: Breadcrumb[] = [];

    if (pathSegments.length === 0) return [];

    pathSegments.forEach((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
      const isLast = index === pathSegments.length - 1;

      let label = segmentLabels[segment] || formatSegment(segment);

      // IDs ou hashes viram "Detalhes"
      if (isIdLike(segment)) {
        label = 'Detalhes';
      }

      // Ajustes específicos para /admin/settings combinando categorias e seções
      if (segment === 'settings' && pathSegments[index - 1] === 'admin') {
        const category = searchParams.get('category');
        const section = searchParams.get('section');
        label = segmentLabels[segment] || 'Configurações';

        crumbs.push({ label, path: isLast ? undefined : path });

        if (category) {
          crumbs.push({
            label: adminCategoryLabels[category] || formatSegment(category),
            path: `/admin/settings?category=${category}`,
          });
        }

        if (section) {
          crumbs.push({
            label: adminSectionLabels[section] || formatSegment(section),
          });
        }

        return;
      }

      // Ajuste para /profile/customize com tabs
      if (segment === 'customize' && pathSegments[index - 1] === 'profile') {
        crumbs.push({ label: 'Meu Perfil', path: '/profile' });
        crumbs.push({ label: 'Customização', path: isLast ? undefined : path });

        const tab = searchParams.get('tab');
        if (tab) {
          const tabLabels: Record<string, string> = {
            avatar: 'Avatar',
            rail: 'Rail/Sidebar',
            tuning: 'Tuning'
          };
          crumbs.push({ label: tabLabels[tab] || 'Customização' });
        }

        return;
      }

      crumbs.push({
        label,
        path: isLast ? undefined : path,
      });
    });

    // Interpreta tabs via query param ?tab=
    const tab = searchParams.get('tab');
    if (tab) {
      const root = pathSegments[0];
      const tabLabel =
        (root === 'profile' ? profileTabLabels[tab] : undefined) ||
        formatSegment(tab);
      crumbs.push({ label: tabLabel });
    }

    return crumbs;
  };

  const finalBreadcrumbs = breadcrumbs || autoBreadcrumbs();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  useEffect(() => {
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  return (
    <PageHeaderContext.Provider value={headerContext}>
      <div className={cn("flex h-full min-h-0 bg-background overflow-hidden", className)}>
        {/* Sidebar */}
        <UnifiedSidebar
          activeSection={activeSection}
          activeItem={activeItem}
          onNavigate={handleNavigate}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header Unificado: Breadcrumbs + Título + Toggle Button */}
          {showBreadcrumbs && finalBreadcrumbs.length > 0 && (
            <div className="px-6 py-2.5 border-b bg-muted/30 shrink-0">
              <div className="flex items-center justify-between gap-4">
                {/* Coluna Esquerda: Breadcrumbs e Título */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Breadcrumbs */}
                  <nav className="flex items-center gap-1.5 text-[0.7rem] shrink-0">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Home className="h-3.5 w-3.5" />
                    </button>
                    
                    {finalBreadcrumbs.map((crumb, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                        {crumb.path && index < finalBreadcrumbs.length - 1 ? (
                          <button
                            onClick={() => navigate(crumb.path!)}
                            className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                          >
                            {crumb.label}
                          </button>
                        ) : (
                          <span className={cn(
                            "whitespace-nowrap",
                            index === finalBreadcrumbs.length - 1 
                              ? "text-foreground font-medium" 
                              : "text-muted-foreground"
                          )}>
                            {crumb.label}
                          </span>
                        )}
                      </div>
                    ))}
                  </nav>

                </div>
              </div>

            </div>
          )}

          {headerContent && (
            <div className="px-6 py-3 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 shrink-0">
              {headerContent}
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 min-h-0 overflow-auto">
            <div className={cn("p-6", contentClassName)}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader(content: ReactNode | null) {
  const context = useContext(PageHeaderContext);

  useEffect(() => {
    if (!context) return;
    context.setHeaderContent(content);

    return () => context.setHeaderContent(null);
  }, [content, context]);
}
