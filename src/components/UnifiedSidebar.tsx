import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { hasPermission } from '@/lib/permissions';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  useNotificationPreferences, 
  useToggleDND 
} from '@/services/notificationService';
import { 
  useSidebarPreferences, 
  DEFAULT_SIDEBAR_CONFIG 
} from '@/services/sidebarPreferencesService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  User,
  Settings,
  BarChart3,
  Bell,
  BellOff,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  Copy,
  Check,
  Sun,
  Moon,
  Monitor,
  Users,
  Briefcase,
  Package,
  Shield,
  ListChecks,
  Bot,
  HelpCircle,
  Activity,
  Home,
  Filter,
  Kanban,
  Building2,
  CheckSquare,
  FileText,
  Palette,
} from 'lucide-react';

// Tipos
type SectionId = 
  | 'dashboard' 
  | 'leads' 
  | 'deals' 
  | 'kanban' 
  | 'companies' 
  | 'contacts' 
  | 'players' 
  | 'tasks' 
  | 'profile' 
  | 'management' 
  | 'settings';
type Theme = 'light' | 'dark' | 'system';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  external?: boolean;
  badge?: string;
  requiredRole?: string[];
  children?: { id: string; label: string; section?: string }[];
}

interface MenuSection {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  color: string;
  items: MenuItem[];
}

interface UnifiedSidebarProps {
  activeSection?: SectionId;
  activeItem?: string;
  onNavigate?: (path: string) => void;
}

// Configuração do menu
const getMenuSections = (canManageUsers: boolean, canManageSettings: boolean, canViewAnalytics: boolean): MenuSection[] => [
  // ═══════════════════════════════════════════════════════════════
  // NOVAS SEÇÕES (Navegação Principal)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    color: 'text-blue-500',
    items: [
      { id: 'overview', label: 'Visão Geral', icon: Home, path: '/dashboard' },
    ],
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: Filter,
    color: 'text-green-500',
    items: [
      { id: 'list', label: 'Lista de Leads', icon: Filter, path: '/leads' },
      { id: 'sales-view', label: 'Sales View', icon: BarChart3, path: '/admin/leads/sales-view' },
    ],
  },
  {
    id: 'deals',
    label: 'Deals',
    icon: Briefcase,
    color: 'text-purple-500',
    items: [
      { id: 'list', label: 'Lista de Deals', icon: Briefcase, path: '/deals' },
      { id: 'comparison', label: 'Comparador', icon: FileText, path: '/deals/comparison' },
    ],
  },
  {
    id: 'kanban',
    label: 'Tracks',
    icon: Kanban,
    color: 'text-orange-500',
    items: [
      { id: 'matrix', label: 'Master Matrix', icon: Kanban, path: '/tracks' },
    ],
  },
  {
    id: 'companies',
    label: 'Empresas',
    icon: Building2,
    color: 'text-cyan-500',
    items: [
      { id: 'list', label: 'Lista de Empresas', icon: Building2, path: '/companies' },
    ],
  },
  {
    id: 'contacts',
    label: 'Contatos',
    icon: User,
    color: 'text-indigo-500',
    items: [
      { id: 'list', label: 'Lista de Contatos', icon: User, path: '/contacts' },
    ],
  },
  {
    id: 'players',
    label: 'Players',
    icon: Users,
    color: 'text-pink-500',
    items: [
      { id: 'list', label: 'Lista de Players', icon: Users, path: '/players' },
    ],
  },
  {
    id: 'tasks',
    label: 'Tarefas',
    icon: CheckSquare,
    color: 'text-yellow-500',
    items: [
      { id: 'list', label: 'Minhas Tarefas', icon: CheckSquare, path: '/tasks' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SEÇÕES EXISTENTES (NÃO MODIFICAR)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'profile',
    label: 'Meu Perfil',
    icon: User,
    color: 'text-red-500',
    items: [
      { id: 'personal', label: 'Dados Pessoais', icon: User, path: '/profile' },
      { id: 'preferences', label: 'Preferências', icon: Settings, path: '/profile/preferences' },
      { id: 'customize', label: 'Personalizar Sidebar', icon: Palette, path: '/profile/customize' },
      { id: 'activity', label: 'Atividades', icon: Activity, path: '/profile/activity' },
      { id: 'security', label: 'Segurança', icon: Shield, path: '/profile/security' },
    ],
  },
  {
    id: 'management',
    label: 'Gestão',
    icon: BarChart3,
    color: 'text-blue-500',
    items: [
      ...(canViewAnalytics ? [{ id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics', external: true }] : []),
      ...(canManageUsers ? [{ id: 'users', label: 'Usuários', icon: Users, path: '/admin/users', external: true, badge: 'Restrito' }] : []),
    ].filter(Boolean) as MenuItem[],
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    color: 'text-purple-500',
    items: canManageSettings ? [
      { 
        id: 'crm', 
        label: 'CRM & Vendas', 
        icon: Briefcase, 
        path: '/admin/settings?category=crm',
        children: [
          { id: 'leads', label: 'Leads', section: 'leads' },
          { id: 'deals', label: 'Deals & Pipeline', section: 'deals' },
          { id: 'companies', label: 'Empresas & Contatos', section: 'companies' },
        ]
      },
      { 
        id: 'products', 
        label: 'Produtos & Operações', 
        icon: Package, 
        path: '/admin/settings?category=products',
        children: [
          { id: 'products-list', label: 'Produtos', section: 'products' },
          { id: 'operation_types', label: 'Tipos de Operação', section: 'operation_types' },
          { id: 'deal_sources', label: 'Origens de Deal', section: 'deal_sources' },
          { id: 'loss_reasons', label: 'Motivos de Perda', section: 'loss_reasons' },
        ]
      },
      { 
        id: 'system', 
        label: 'Sistema & Segurança', 
        icon: Shield, 
        path: '/admin/settings?category=system',
        children: [
          { id: 'defaults', label: 'Defaults do Sistema', section: 'defaults' },
          { id: 'roles', label: 'Papéis & Permissões', section: 'roles' },
          { id: 'permissions', label: 'Permissões Avançadas', section: 'permissions' },
        ]
      },
      { 
        id: 'productivity', 
        label: 'Produtividade', 
        icon: ListChecks, 
        path: '/admin/settings?category=productivity',
        children: [
          { id: 'tasks', label: 'Tarefas', section: 'tasks' },
          { id: 'tags', label: 'Tags', section: 'tags' },
          { id: 'templates', label: 'Templates', section: 'templates' },
          { id: 'holidays', label: 'Feriados', section: 'holidays' },
        ]
      },
      { 
        id: 'integrations', 
        label: 'Integrações & Automação', 
        icon: Bot, 
        path: '/admin/settings?category=integrations',
        children: [
          { id: 'dashboards', label: 'Dashboards', section: 'dashboards' },
          { id: 'automation', label: 'Automação', section: 'automation' },
        ]
      },
    ] : [],
  },
];

export function UnifiedSidebar({ activeSection: propActiveSection, activeItem: propActiveItem, onNavigate }: UnifiedSidebarProps) {
  // Hooks de dados (ordem obrigatória: hooks de dados primeiro)
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: preferences } = useNotificationPreferences(profile?.id || null);
  const toggleDND = useToggleDND();
  const { data: sidebarPrefs } = useSidebarPreferences(profile?.id || null);

  // ═══════════════════════════════════════════════════════════════
  // ESTADO DE COLLAPSE (persistido em localStorage)
  // ═══════════════════════════════════════════════════════════════
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(
    'unified-sidebar-collapsed',
    false  // padrão: expandido
  );

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, [setCollapsed]);

  // useEffect para escutar evento de toggle do header
  useEffect(() => {
    const handleToggleEvent = () => {
      toggleCollapse();
    };

    window.addEventListener('toggle-sidebar', handleToggleEvent);
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleEvent);
    };
  }, [toggleCollapse]);

  // useState
  const [copiedId, setCopiedId] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // useMemo
  const canManageUsers = useMemo(() => profile ? hasPermission(profile.role, 'MANAGE_USERS') : false, [profile]);
  const canManageSettings = useMemo(() => profile ? hasPermission(profile.role, 'MANAGE_SETTINGS') : false, [profile]);
  const canViewAnalytics = useMemo(() => profile ? hasPermission(profile.role, 'VIEW_ANALYTICS') : false, [profile]);

  const menuSections = useMemo(() => 
    getMenuSections(canManageUsers, canManageSettings, canViewAnalytics),
    [canManageUsers, canManageSettings, canViewAnalytics]
  );

  // Customized sections based on user preferences
  const customizedSections = useMemo(() => {
    const config = sidebarPrefs?.config?.sections || DEFAULT_SIDEBAR_CONFIG;
    return config.filter(s => s.enabled).sort((a, b) => a.order - b.order);
  }, [sidebarPrefs]);

  const { activeSection, activeItem } = useMemo(() => {
    if (propActiveSection && propActiveItem) {
      return { activeSection: propActiveSection, activeItem: propActiveItem };
    }

    const path = location.pathname;
    const category = searchParams.get('category');

    // ═══════════════════════════════════════════════════════════════
    // NOVAS DETECÇÕES (Adicionar aqui)
    // ═══════════════════════════════════════════════════════════════
    if (path === '/dashboard') {
      return { activeSection: 'dashboard' as SectionId, activeItem: 'overview' };
    }
    if (path.startsWith('/leads') || path.startsWith('/admin/leads')) {
      const item = path.includes('sales-view') ? 'sales-view' : 'list';
      return { activeSection: 'leads' as SectionId, activeItem: item };
    }
    if (path.startsWith('/deals')) {
      const item = path.includes('comparison') ? 'comparison' : 'list';
      return { activeSection: 'deals' as SectionId, activeItem: item };
    }
    if (path === '/tracks' || path === '/kanban') {
      return { activeSection: 'kanban' as SectionId, activeItem: 'matrix' };
    }
    if (path.startsWith('/companies')) {
      return { activeSection: 'companies' as SectionId, activeItem: 'list' };
    }
    if (path.startsWith('/contacts')) {
      return { activeSection: 'contacts' as SectionId, activeItem: 'list' };
    }
    if (path.startsWith('/players')) {
      return { activeSection: 'players' as SectionId, activeItem: 'list' };
    }
    if (path === '/tasks') {
      return { activeSection: 'tasks' as SectionId, activeItem: 'list' };
    }

    // ═══════════════════════════════════════════════════════════════
    // DETECÇÕES EXISTENTES (NÃO MODIFICAR ABAIXO)
    // ═══════════════════════════════════════════════════════════════
    if (path === '/profile') return { activeSection: 'profile' as SectionId, activeItem: 'personal' };
    if (path === '/profile/preferences') return { activeSection: 'profile' as SectionId, activeItem: 'preferences' };
    if (path === '/profile/customize') return { activeSection: 'profile' as SectionId, activeItem: 'customize' };
    if (path === '/profile/activity') return { activeSection: 'profile' as SectionId, activeItem: 'activity' };
    if (path === '/profile/security') return { activeSection: 'profile' as SectionId, activeItem: 'security' };
    if (path.startsWith('/admin/settings')) {
      return { activeSection: 'settings' as SectionId, activeItem: category || 'crm' };
    }

    return { activeSection: 'profile' as SectionId, activeItem: 'personal' };
  }, [location.pathname, searchParams, propActiveSection, propActiveItem]);

  const truncatedId = useMemo(() => profile?.id ? `${profile.id.slice(0, 8)}...${profile.id.slice(-4)}` : '', [profile?.id]);

  const getThemeIcon = () => {
    if (theme === 'system') return Monitor;
    if (theme === 'dark') return Moon;
    return Sun;
  };

  const ThemeIcon = getThemeIcon();

  // Handlers
  const handleCopyId = async () => {
    if (profile?.id) {
      await navigator.clipboard.writeText(profile.id);
      setCopiedId(true);
      toast.success('ID copiado!');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleToggleDND = async () => {
    if (!profile?.id) return;
    try {
      const newState = await toggleDND.mutateAsync(profile.id);
      toast.success(newState ? 'Não Perturbe ativado' : 'Não Perturbe desativado');
    } catch {
      toast.error('Erro ao alterar Não Perturbe');
    }
  };

  const handleSignOut = async () => {
    const success = await signOut();
    if (success) {
      toast.success('Você saiu do sistema');
      navigate('/login');
    } else {
      toast.error('Erro ao sair');
    }
  };

  const handleItemClick = (item: MenuItem, section: MenuSection) => {
    if (item.external && item.path) {
      navigate(item.path);
      return;
    }

    if (item.children) {
      setExpandedItems(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        return next;
      });
      return;
    }

    if (item.path) {
      if (onNavigate) {
        onNavigate(item.path);
      } else {
        navigate(item.path);
      }
    }
  };

  const handleChildClick = (parentItem: MenuItem, child: { id: string; label: string; section?: string }) => {
    if (parentItem.path && child.section) {
      const basePath = parentItem.path.split('?')[0];
      const category = new URLSearchParams(parentItem.path.split('?')[1]).get('category');
      const newPath = `${basePath}?category=${category}&section=${child.section}`;
      
      if (onNavigate) {
        onNavigate(newPath);
      } else {
        navigate(newPath);
      }
    }
  };

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Early return após todos os hooks
  if (!profile) return null;

  return (
    <div className="flex h-full">
      {/* Icon Rail */}
      <div className="w-16 bg-slate-900 flex flex-col items-center py-4 shrink-0">
        {/* Botão Expand (só aparece quando colapsado) */}
        {collapsed && (
          <div className="mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <button
                    onClick={toggleCollapse}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">
                Expandir menu
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Spacer no lugar do logo */}
        {!collapsed && <div className="h-5 mb-4" />}

        {/* Section Icons */}
        <div className="flex-1 flex flex-col items-center gap-2">
          {customizedSections.map((customSection) => {
            const originalSection = menuSections.find(s => s.id === customSection.id);
            if (!originalSection) return null;
            
            // Check if section has items (respects permissions)
            const hasItems = originalSection.items.length > 0;
            if (!hasItems) return null;

            const Icon = originalSection.icon;
            const isActive = activeSection === originalSection.id;

            return (
              <Tooltip key={customSection.id}>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <button
                      onClick={() => {
                        if (originalSection.items.length > 0) {
                          const firstItem = originalSection.items[0];
                          if (firstItem.path) {
                            navigate(firstItem.path);
                          }
                        }
                      }}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all relative",
                        isActive
                          ? "bg-white/20 shadow-lg"
                          : "hover:bg-white/10 text-white/60 hover:text-white"
                      )}
                      style={{ color: isActive ? undefined : customSection.color }}
                    >
                      <Icon className={cn("h-5 w-5", isActive ? "text-white" : "")} />
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-500 rounded-r-full" />
                      )}
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {originalSection.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Bottom Icons */}
        <div className="flex flex-col items-center gap-2 mt-auto pb-2">
          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <button
                  onClick={cycleTheme}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ThemeIcon className="h-5 w-5" />
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              Tema: {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
            </TooltipContent>
          </Tooltip>

          {/* DND Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <button
                  onClick={handleToggleDND}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    preferences?.dndEnabled 
                      ? "bg-amber-500/20 text-amber-400" 
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  {preferences?.dndEnabled ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              {preferences?.dndEnabled ? 'Não Perturbe ativo' : 'Não Perturbe'}
            </TooltipContent>
          </Tooltip>

          {/* Help */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <button
                  onClick={() => navigate('/help')}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              Central de Ajuda
            </TooltipContent>
          </Tooltip>
        </div>

      </div>

      {/* Expanded Panel */}
      <div 
        className={cn(
          "bg-background border-r border-border flex flex-col transition-all duration-300 ease-in-out",
          collapsed ? "w-0 opacity-0 overflow-hidden" : "w-64 opacity-100"
        )}
      >
        {/* Section Header */}
        <div className={cn(
          "border-b border-border",
          activeSection === 'profile' ? 'p-4' : 'px-6 py-3'
        )}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-foreground">
              {menuSections.find(s => s.id === activeSection)?.label || 'Menu'}
            </h2>
            
            {/* Botão toggle collapse */}
            <button
              onClick={toggleCollapse}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              title="Fechar menu"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          </div>
          
          {activeSection === 'profile' && (
            <div className="mt-3 space-y-2">
              <div className="space-y-1.5">
                <p className="font-medium text-sm text-foreground">{profile.name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-2 py-1 rounded text-[10px] font-mono text-muted-foreground truncate">
                  {truncatedId}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleCopyId}
                >
                  {copiedId ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-1">
            {menuSections.find(s => s.id === activeSection)?.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              const isExpanded = expandedItems.has(item.id);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => handleItemClick(item, menuSections.find(s => s.id === activeSection)!)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                      isActive && !hasChildren
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {item.badge}
                      </Badge>
                    )}
                    {item.external && (
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                    )}
                    {hasChildren && (
                      <ChevronRight className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        isExpanded && "rotate-90"
                      )} />
                    )}
                  </button>

                  {/* Children */}
                  {hasChildren && isExpanded && (
                    <div className="ml-4 mt-1 pl-4 border-l-2 border-muted space-y-0.5">
                      {item.children!.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => handleChildClick(item, child)}
                          className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-3 border-t border-border space-y-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <ThemeIcon className="h-4 w-4" />
                Tema: {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-full">
              <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
                <Sun className="h-4 w-4" />
                <span>Claro</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
                <Moon className="h-4 w-4" />
                <span>Escuro</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
                <Monitor className="h-4 w-4" />
                <span>Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}
