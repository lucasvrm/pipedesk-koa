import { useState, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { hasPermission } from '@/lib/permissions';
import { 
  useNotificationPreferences, 
  useToggleDND 
} from '@/services/notificationService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getInitials } from '@/lib/helpers';
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
} from 'lucide-react';

// Tipos
type SectionId = 'profile' | 'management' | 'settings';
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
  {
    id: 'profile',
    label: 'Meu Perfil',
    icon: User,
    color: 'text-red-500',
    items: [
      { id: 'personal', label: 'Dados Pessoais', icon: User, path: '/profile' },
      { id: 'preferences', label: 'Preferências de Notificação', icon: Bell, path: '/profile/preferences' },
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
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { data: preferences } = useNotificationPreferences(profile?.id || null);
  const toggleDND = useToggleDND();

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

  const { activeSection, activeItem } = useMemo(() => {
    if (propActiveSection && propActiveItem) {
      return { activeSection: propActiveSection, activeItem: propActiveItem };
    }

    const path = location.pathname;
    const category = searchParams.get('category');

    if (path === '/profile') return { activeSection: 'profile' as SectionId, activeItem: 'personal' };
    if (path === '/profile/preferences') return { activeSection: 'profile' as SectionId, activeItem: 'preferences' };
    if (path.startsWith('/admin/settings')) {
      return { activeSection: 'settings' as SectionId, activeItem: category || 'crm' };
    }

    return { activeSection: 'profile' as SectionId, activeItem: 'personal' };
  }, [location.pathname, searchParams, propActiveSection, propActiveItem]);

  const userInitials = useMemo(() => getInitials(profile?.name || 'U'), [profile?.name]);
  const userAvatar = useMemo(() => profile?.avatar_url || profile?.avatar, [profile?.avatar_url, profile?.avatar]);
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
        {/* Spacer no lugar do logo */}
        <div className="h-4 mb-4" />

        {/* Section Icons */}
        <div className="flex-1 flex flex-col items-center gap-2">
          {menuSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const hasItems = section.items.length > 0;

            if (!hasItems) return null;

            return (
              <Tooltip key={section.id}>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <button
                      onClick={() => {
                        if (section.items.length > 0) {
                          const firstItem = section.items[0];
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
                    >
                      <Icon className={cn("h-5 w-5", isActive ? "text-white" : "")} />
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-500 rounded-r-full" />
                      )}
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {section.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Bottom Icons */}
        <div className="flex flex-col items-center gap-2 mt-auto">
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

          {/* Avatar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex mt-2">
                <button>
                  <Avatar className={cn(
                    "h-10 w-10 cursor-pointer border-2 transition-colors",
                    preferences?.dndEnabled 
                      ? "border-amber-400" 
                      : "border-transparent hover:border-white/30"
                  )}>
                    {userAvatar && <AvatarImage src={userAvatar} alt={profile.name || ''} />}
                    <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white font-bold text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              {profile.name}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Expanded Panel */}
      <div className="w-64 bg-background border-r border-border flex flex-col">
        {/* Section Header */}
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">
            {menuSections.find(s => s.id === activeSection)?.label || 'Menu'}
          </h2>
          
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
        <div className="p-3 border-t border-border space-y-2">
          {/* Theme Selector */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-accent/50">
            <span className="text-sm text-muted-foreground">Tema</span>
            <div className="flex items-center gap-1">
              <Button
                variant={theme === 'light' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setTheme('light')}
              >
                <Sun className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={theme === 'dark' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={theme === 'system' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setTheme('system')}
              >
                <Monitor className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}
