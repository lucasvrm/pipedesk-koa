import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';
import { buildBreadcrumbs, BreadcrumbItem } from '@/utils/breadcrumbs';

interface PageHeaderContextValue {
  setHeaderContent: (content: ReactNode | null) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[] | null) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

interface UnifiedLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  /**
   * Explicit breadcrumbs override the automatic URL-based builder.
   * Use only for derived state (data-driven labels/steps) that cannot live in the URL.
   */
  breadcrumbs?: BreadcrumbItem[];
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
  const [pageBreadcrumbs, setPageBreadcrumbs] = useState<BreadcrumbItem[] | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const headerContext = useMemo(
    () => ({ setHeaderContent, setBreadcrumbs: setPageBreadcrumbs }),
    [setHeaderContent, setPageBreadcrumbs]
  );

  const finalBreadcrumbs: BreadcrumbItem[] = useMemo(() => {
    if (breadcrumbs) return breadcrumbs;
    if (pageBreadcrumbs) return pageBreadcrumbs;
    return buildBreadcrumbs(location.pathname, new URLSearchParams(location.search));
  }, [breadcrumbs, location.pathname, location.search, pageBreadcrumbs]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  useEffect(() => {
    return () => {
      setHeaderContent(null);
      setPageBreadcrumbs(null);
    };
  }, [setHeaderContent, setPageBreadcrumbs]);

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
          <div className={cn("flex-1 min-h-0 overflow-auto px-6", contentClassName)}>
            {children}
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

export function usePageBreadcrumbs(breadcrumbs: BreadcrumbItem[] | null) {
  const context = useContext(PageHeaderContext);

  useEffect(() => {
    if (!context) return;
    context.setBreadcrumbs(breadcrumbs);

    return () => context.setBreadcrumbs(null);
  }, [breadcrumbs, context]);
}
