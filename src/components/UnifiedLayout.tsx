import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { cn } from '@/lib/utils';
import { ChevronRight, Home, ChevronsLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    
    // ═══════════════════════════════════════════════════════════════
    // BREADCRUMBS PARA ROTAS PRINCIPAIS
    // ═══════════════════════════════════════════════════════════════
    
    // Dashboard
    if (path === '/dashboard') {
      return [
        { label: 'Dashboard' },
      ];
    }

    // Leads
    if (path === '/leads' || path.startsWith('/leads/')) {
      const crumbs: Breadcrumb[] = [{ label: 'Leads', path: '/leads' }];
      
      // Detalhes de lead específico
      if (path.startsWith('/leads/') && path !== '/leads') {
        crumbs.push({ label: 'Detalhes do Lead' });
      }
      
      return crumbs;
    }

    // Deals
    if (path === '/deals' || path.startsWith('/deals/')) {
      const crumbs: Breadcrumb[] = [{ label: 'Deals', path: '/deals' }];
      
      // Sub-rotas de deals
      if (path === '/deals/comparison') {
        crumbs.push({ label: 'Comparador de Deals' });
      } else if (path.startsWith('/deals/') && path !== '/deals') {
        crumbs.push({ label: 'Detalhes do Deal' });
      }
      
      return crumbs;
    }

    // Companies
    if (path === '/companies' || path.startsWith('/companies/')) {
      const crumbs: Breadcrumb[] = [{ label: 'Empresas', path: '/companies' }];
      
      // Detalhes de empresa específica
      if (path.startsWith('/companies/') && path !== '/companies') {
        crumbs.push({ label: 'Detalhes da Empresa' });
      }
      
      return crumbs;
    }

    // Contacts
    if (path === '/contacts' || path.startsWith('/contacts/')) {
      const crumbs: Breadcrumb[] = [{ label: 'Contatos', path: '/contacts' }];
      
      // Detalhes de contato específico
      if (path.startsWith('/contacts/') && path !== '/contacts') {
        crumbs.push({ label: 'Detalhes do Contato' });
      }
      
      return crumbs;
    }

    // Players
    if (path === '/players' || path.startsWith('/players/')) {
      const crumbs: Breadcrumb[] = [{ label: 'Players', path: '/players' }];
      
      // Detalhes de player específico
      if (path.startsWith('/players/') && path !== '/players') {
        crumbs.push({ label: 'Detalhes do Player' });
      }
      
      return crumbs;
    }

    // Tasks
    if (path === '/tasks') {
      return [
        { label: 'Tarefas' },
      ];
    }

    // ═══════════════════════════════════════════════════════════════
    // BREADCRUMBS EXISTENTES (NÃO MODIFICAR ABAIXO)
    // ═══════════════════════════════════════════════════════════════
    
    if (path === '/tracks') {
      return [
        { label: 'Tracks' },
        { label: 'Master Matrix' },
      ];
    }

    if (path === '/profile') {
      return [
        { label: 'Meu Perfil' },
        { label: 'Dados Pessoais' },
      ];
    }
    
    if (path === '/profile/preferences') {
      const searchParams = new URLSearchParams(location.search);
      const tab = searchParams.get('tab') || 'notifications';
      
      const tabLabels: Record<string, string> = {
        notifications: 'Preferências de Notificação',
        avatar: 'Personalizar Avatar',
        timeline: 'Configurar Timeline',
      };

      return [
        { label: 'Meu Perfil', path: '/profile' },
        { label: tabLabels[tab] || 'Preferências' },
      ];
    }

    if (path === '/profile/activity') {
      return [
        { label: 'Meu Perfil', path: '/profile' },
        { label: 'Atividades' },
      ];
    }

    if (path === '/profile/security') {
      return [
        { label: 'Meu Perfil', path: '/profile' },
        { label: 'Segurança' },
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
    <div className={cn("flex h-[calc(100vh-4rem)] bg-background overflow-hidden", className)}>
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
          <div className="px-6 py-3 border-b bg-muted/30 shrink-0">
            <div className="flex items-center justify-between gap-4">
              {/* Coluna Esquerda: Breadcrumbs e Título */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-1.5 text-sm shrink-0">
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

                {/* Título (alinhado verticalmente com breadcrumbs) */}
                {title && (
                  <h1 className="text-xl font-bold text-foreground truncate">
                    {title}
                  </h1>
                )}
              </div>

              {/* Coluna Direita: Botão Toggle Sidebar */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-sidebar'));
                }}
                className="shrink-0"
                title="Abrir/Fechar menu"
              >
                <ChevronsLeft className="h-5 w-5" />
              </Button>
            </div>

            {/* Descrição (se existir) em linha separada */}
            {description && (
              <p className="text-sm text-muted-foreground mt-2">{description}</p>
            )}
          </div>
        )}

        {/* Fallback: Se não tem breadcrumbs mas tem título */}
        {(!showBreadcrumbs || finalBreadcrumbs.length === 0) && (title || description) && (
          <div className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between gap-4">
              {title && <h1 className="text-2xl font-bold text-foreground">{title}</h1>}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-sidebar'));
                }}
                className="shrink-0"
                title="Abrir/Fechar menu"
              >
                <ChevronsLeft className="h-5 w-5" />
              </Button>
            </div>
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className={cn("p-6", contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
