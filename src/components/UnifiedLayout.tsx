import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

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
  const navigate = useNavigate();
  const location = useLocation();

  // Gera breadcrumbs automáticos se não fornecidos
  const autoBreadcrumbs = (): Breadcrumb[] => {
    const path = location.pathname;
    
    if (path === '/profile') {
      return [
        { label: 'Meu Perfil' },
        { label: 'Dados Pessoais' },
      ];
    }
    
    if (path === '/profile/preferences') {
      return [
        { label: 'Meu Perfil', path: '/profile' },
        { label: 'Preferências de Notificação' },
      ];
    }
    
    if (path.startsWith('/admin/settings')) {
      const searchParams = new URLSearchParams(location.search);
      const category = searchParams.get('category') || 'crm';
      const section = searchParams.get('section');
      
      const categoryLabels: Record<string, string> = {
        crm: 'CRM & Vendas',
        products: 'Produtos & Operações',
        system: 'Sistema & Segurança',
        productivity: 'Produtividade',
        integrations: 'Integrações & Automação',
      };

      const sectionLabels: Record<string, string> = {
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

      const crumbs: Breadcrumb[] = [
        { label: 'Configurações' },
        { label: categoryLabels[category] || category, path: `/admin/settings?category=${category}` },
      ];

      if (section && sectionLabels[section]) {
        crumbs.push({ label: sectionLabels[section] });
      }

      return crumbs;
    }

    return [];
  };

  const finalBreadcrumbs = breadcrumbs || autoBreadcrumbs();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className={cn("flex h-[calc(100vh-4rem)] bg-background", className)}>
      {/* Sidebar */}
      <UnifiedSidebar
        activeSection={activeSection}
        activeItem={activeItem}
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Breadcrumbs */}
        {showBreadcrumbs && finalBreadcrumbs.length > 0 && (
          <div className="px-6 py-3 border-b bg-muted/30 shrink-0">
            <nav className="flex items-center gap-1.5 text-sm">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
              </button>
              
              {finalBreadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  {crumb.path && index < finalBreadcrumbs.length - 1 ? (
                    <button
                      onClick={() => navigate(crumb.path!)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className={cn(
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
        )}

        {/* Page Header (optional) */}
        {(title || description) && (
          <div className="px-6 py-4 border-b shrink-0">
            {title && <h1 className="text-2xl font-bold text-foreground">{title}</h1>}
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>
        )}

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className={cn("p-6", contentClassName)}>
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
