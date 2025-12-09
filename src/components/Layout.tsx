import { ReactNode, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { hasPermission } from '@/lib/permissions';
import { getInitials } from '@/lib/helpers';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ChartBar,
  Kanban,
  Bell,
  Plus,
  User as UserIcon,
  SignOut,
  Users,
  GoogleLogo,
  MagnifyingGlass,
  Gear,
  FolderOpen,
  List,
  Question,
  FlowArrow,
  Funnel,
  AddressBook,
  Briefcase,
  Buildings,
  ListChecks,
  Package,
  TagSimple,
  FileText,
  CalendarBlank,
  ChartLine,
  Robot,
  ShieldCheck,
  ShieldStar
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { CreateDealDialog } from '@/features/deals/components/CreateDealDialog';
import { SLAConfigManager } from '@/components/SLAConfigManager';
import GlobalSearch from '@/components/GlobalSearch';
import InboxPanel from '@/features/inbox/components/InboxPanel';
import { SLAMonitoringService } from '@/components/SLAMonitoringService';
import { OnboardingTour } from '@/components/OnboardingTour';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile, signOut: authSignOut } = useAuth();
  const { isImpersonating, setIsImpersonating } = useImpersonation();
  const navigate = useNavigate();
  const location = useLocation();

  useRealtimeNotifications(profile?.id);

  const [inboxOpen, setInboxOpen] = useState(false);
  const [createDealOpen, setCreateDealOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [slaConfigOpen, setSlaConfigOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const currentUser = profile;
  const unreadCount = 0;

  const handleSignOut = async () => {
    const success = await authSignOut();
    if (success) {
      toast.success('Você saiu do sistema');
      navigate('/login');
    } else {
      toast.error('Erro ao sair do sistema');
    }
  };

  if (!currentUser) return null;

  const canManageUsers = hasPermission(currentUser.role, 'MANAGE_USERS');
  const canViewAnalytics = hasPermission(currentUser.role, 'VIEW_ANALYTICS');
  const canManageIntegrations = hasPermission(
    currentUser.role,
    'MANAGE_INTEGRATIONS'
  );
  const canManageSettings = hasPermission(
    currentUser.role,
    'MANAGE_SETTINGS'
  );

  const settingsDefaultSections = useMemo(
    () => ({
      crm: 'leads',
      products: 'products',
      system: 'defaults',
      productivity: 'tasks',
      integrations: 'dashboards'
    }),
    []
  );

  const settingsShortcuts = useMemo(
    () =>
      [
        {
          category: 'system',
          label: 'Configurações do Sistema',
          icon: ShieldCheck,
          restricted: true,
          visible: canManageSettings,
          items: [
            {
              label: 'Defaults do Sistema',
              section: 'defaults',
              icon: Gear,
              description: 'Valores padrão para deals e leads'
            },
            {
              label: 'Papéis & Permissões',
              section: 'roles',
              icon: ShieldStar,
              description: 'Gestão de perfis e papéis'
            },
            {
              label: 'Permissões Avançadas',
              section: 'permissions',
              icon: ShieldCheck,
              description: 'Controle granular de acesso'
            }
          ]
        },
        {
          category: 'crm',
          label: 'CRM & Vendas',
          icon: Users,
          restricted: true,
          visible: canManageSettings,
          items: [
            { label: 'Leads', section: 'leads', icon: Users },
            { label: 'Deals & Pipeline', section: 'deals', icon: FlowArrow },
            { label: 'Empresas & Contatos', section: 'companies', icon: Briefcase }
          ]
        },
        {
          category: 'products',
          label: 'Produtos & Operações',
          icon: Package,
          restricted: true,
          visible: canManageSettings,
          items: [
            { label: 'Produtos', section: 'products', icon: Package },
            { label: 'Tipos de Operação', section: 'operation_types', icon: FlowArrow },
            { label: 'Origens de Deal', section: 'deal_sources', icon: Funnel },
            { label: 'Motivos de Perda', section: 'loss_reasons', icon: ListChecks }
          ]
        },
        {
          category: 'productivity',
          label: 'Produtividade',
          icon: ListChecks,
          restricted: true,
          visible: canManageSettings,
          items: [
            { label: 'Tarefas', section: 'tasks', icon: ListChecks },
            { label: 'Tags', section: 'tags', icon: TagSimple },
            { label: 'Templates', section: 'templates', icon: FileText },
            { label: 'Feriados', section: 'holidays', icon: CalendarBlank }
          ]
        },
        {
          category: 'integrations',
          label: 'Integrações & Automação',
          icon: Robot,
          restricted: true,
          visible: canManageSettings,
          items: [
            { label: 'Dashboards', section: 'dashboards', icon: ChartLine },
            { label: 'Automação de Documentos', section: 'automation', icon: Robot }
          ]
        }
      ].filter((group) => group.visible),
    [canManageSettings]
  );

  type MenuItem = {
    label: string;
    icon: typeof Gear;
    path: string;
    restricted?: boolean;
  };

  const managementItems = useMemo<MenuItem[]>(
    () =>
      [
        canViewAnalytics && {
          label: 'Analytics',
          icon: ChartBar,
          path: '/analytics'
        },
        canManageIntegrations && {
          label: 'Google Workspace',
          icon: GoogleLogo,
          path: '/admin/integrations/google',
          restricted: true
        },
        {
          label: 'Pastas',
          icon: FolderOpen,
          path: '/folders/manage'
        },
        canManageUsers && {
          label: 'Usuários',
          icon: Users,
          path: '/admin/users',
          restricted: true
        }
      ].filter(Boolean) as MenuItem[],
    [canManageIntegrations, canManageUsers, canViewAnalytics]
  );

  const personalItems = useMemo(
    () => [
      { label: 'Perfil', icon: UserIcon, path: '/profile' },
      { label: 'Central de Ajuda', icon: Question, path: '/help' }
    ],
    []
  );

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(path + '/');

  const isSettingsActive = (category: string, section?: string) => {
    if (location.pathname !== '/admin/settings') return false;

    const params = new URLSearchParams(location.search);
    const currentCategory = params.get('category') || 'crm';
    const currentSection = params.get('section') || settingsDefaultSections[currentCategory];

    const matchesCategory = currentCategory === category;
    const matchesSection = section ? currentSection === section : true;

    return matchesCategory && matchesSection;
  };

  const navigateToSettings = (category: string, section?: string) => {
    const params = new URLSearchParams({
      category,
      section: section || settingsDefaultSections[category]
    });
    navigate(`/admin/settings?${params.toString()}`);
    setMenuOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const renderSettingsDropdown = () => (
    <DropdownMenuGroup>
      <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
        Configurações
      </DropdownMenuLabel>
      {settingsShortcuts.map((group) => {
        const GroupIcon = group.icon;
        return (
          <DropdownMenuSub key={group.category}>
            <DropdownMenuSubTrigger
              className={`flex items-center gap-2 ${
                isSettingsActive(group.category) ? 'bg-muted text-primary' : ''
              }`}
            >
              <GroupIcon className="mr-2" />
              {group.label}
              {group.restricted && (
                <Badge variant="outline" className="ml-auto text-[10px] uppercase">
                  Admin/Manager
                </Badge>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-72">
              <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground uppercase">
                <GroupIcon className="h-4 w-4" />
                {group.label}
              </DropdownMenuLabel>
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <DropdownMenuItem
                    key={`${group.category}-${item.section}`}
                    className={
                      isSettingsActive(group.category, item.section)
                        ? 'bg-muted text-primary'
                        : ''
                    }
                    onClick={() => navigateToSettings(group.category, item.section)}
                  >
                    <ItemIcon className="mr-2" />
                    <div className="flex flex-col">
                      <span>{item.label}</span>
                      {item.description && (
                        <span className="text-[11px] text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                    {group.restricted && (
                      <Badge variant="outline" className="ml-auto text-[10px] uppercase">
                        Restrito
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      })}
    </DropdownMenuGroup>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-6">
            <h1
              className="text-xl font-bold text-primary tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/dashboard')}
            >
              PipeDesk
            </h1>

            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant={isActive('/dashboard') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
                data-tour="dashboard-nav"
              >
                <Link to="/dashboard">
                  <ChartBar className="mr-2" />
                  Dashboard
                </Link>
              </Button>

              <Button
                variant={isActive('/leads') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/leads">
                  <Funnel className="mr-2" />
                  Leads
                </Link>
              </Button>

              <Button
                variant={
                  isActive('/deals') && !isActive('/deals/comparison')
                    ? 'secondary'
                    : 'ghost'
                }
                size="sm"
                asChild
                data-tour="deals-nav"
              >
                <Link to="/deals">
                  <Kanban className="mr-2" />
                  Deals
                </Link>
              </Button>

              <Button
                variant={isActive('/companies') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/companies">
                  <Briefcase className="mr-2" />
                  Empresas
                </Link>
              </Button>

              <Button
                variant={isActive('/contacts') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/contacts">
                  <AddressBook className="mr-2" />
                  Contatos
                </Link>
              </Button>

              <Button
                variant={isActive('/players') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/players">
                  <Buildings className="mr-2" />
                  Players
                </Link>
              </Button>

              <Button
                variant={isActive('/tasks') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/tasks">
                  <ListChecks className="mr-2" />
                  Tarefas
                </Link>
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              title="Busca Global (Ctrl+K)"
            >
              <MagnifyingGlass />
            </Button>

            <Button
              onClick={() => setCreateDealOpen(true)}
              size="sm"
              className="hidden md:flex"
              data-tour="new-deal-button"
            >
              <Plus className="mr-2" />
              Novo Deal
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setInboxOpen(true)}
              data-tour="notifications"
            >
              <Bell />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {isMobile ? (
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Menu, gestão e configurações"
                    aria-label="Menu, gestão e configurações"
                  >
                    <List weight="bold" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[90%] sm:max-w-sm overflow-y-auto">
                  <SheetHeader className="text-left">
                    <SheetTitle>Menu principal</SheetTitle>
                    <SheetDescription>
                      Atalhos pessoais, de gestão e das seções de Configurações.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex items-center gap-3 py-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(currentUser.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">
                        {currentUser.name || 'Usuário'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {currentUser.email || ''}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Pessoal
                      </p>
                      {personalItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.path}
                            variant={isActive(item.path) ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleNavigate(item.path)}
                            aria-label={`Ir para ${item.label}`}
                          >
                            <Icon className="mr-2" />
                            {item.label}
                          </Button>
                        );
                      })}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Gestão
                      </p>
                      {managementItems.map((item) => {
                        const Icon = item.icon as typeof Gear;
                        return (
                          <Button
                            key={item.path}
                            variant={isActive(item.path) ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleNavigate(item.path)}
                            aria-label={`Ir para ${item.label}`}
                          >
                            <Icon className="mr-2" />
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.restricted && (
                              <Badge variant="outline" className="text-[10px] uppercase">
                                Restrito
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>

                    {settingsShortcuts.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                          Configurações
                        </p>
                        {settingsShortcuts.map((group) => {
                          const GroupIcon = group.icon;
                          return (
                            <div key={group.category} className="rounded-lg border p-3">
                              <div className="flex items-center gap-2">
                                <GroupIcon className="h-4 w-4" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{group.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Acesso direto às seções do Settings
                                  </p>
                                </div>
                                {group.restricted && (
                                  <Badge variant="outline" className="text-[10px] uppercase">
                                    Admin/Manager
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-2 grid grid-cols-1 gap-1">
                                {group.items.map((item) => {
                                  const ItemIcon = item.icon;
                                  const active = isSettingsActive(group.category, item.section);
                                  return (
                                    <Button
                                      key={`${group.category}-${item.section}`}
                                      variant={active ? 'secondary' : 'ghost'}
                                      className="w-full justify-start"
                                      onClick={() => navigateToSettings(group.category, item.section)}
                                      aria-label={`Ir para ${item.label}`}
                                    >
                                      <ItemIcon className="mr-2 h-4 w-4" />
                                      <div className="flex flex-col items-start">
                                        <span>{item.label}</span>
                                        {item.description && (
                                          <span className="text-[11px] text-muted-foreground">
                                            {item.description}
                                          </span>
                                        )}
                                      </div>
                                      {group.restricted && (
                                        <Badge variant="outline" className="ml-auto text-[10px] uppercase">
                                          Restrito
                                        </Badge>
                                      )}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={handleSignOut}
                        aria-label="Sair da conta"
                      >
                        <SignOut className="mr-2" />
                        Sair
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Menu de navegação"
                        aria-label="Menu de navegação"
                      >
                        <List weight="bold" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Menu, atalhos e configurações
                    </TooltipContent>
                  </Tooltip>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-3 py-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {getInitials(currentUser.name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">
                          {currentUser.name || 'Usuário'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {currentUser.email || ''}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {personalItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.path}
                        className={isActive(item.path) ? 'bg-muted text-primary' : ''}
                        onClick={() => handleNavigate(item.path)}
                      >
                        <Icon className="mr-2" />
                        {item.label}
                      </DropdownMenuItem>
                    );
                  })}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
                    Gestão
                  </DropdownMenuLabel>

                  {managementItems.map((item) => {
                    const Icon = item.icon as typeof Gear;
                    return (
                      <Tooltip key={item.path}>
                        <TooltipTrigger asChild>
                          <DropdownMenuItem
                            className={isActive(item.path) ? 'bg-muted text-primary' : ''}
                            onClick={() => handleNavigate(item.path)}
                          >
                            <Icon className="mr-2" />
                            <span className="flex-1">{item.label}</span>
                            {item.restricted && (
                              <Badge variant="outline" className="text-[10px] uppercase">
                                Restrito
                              </Badge>
                            )}
                          </DropdownMenuItem>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          Abrir {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}

                  {settingsShortcuts.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      {renderSettingsDropdown()}
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleSignOut}
                  >
                    <SignOut className="mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        currentUser={currentUser}
      />
      <InboxPanel open={inboxOpen} onOpenChange={setInboxOpen} />
      <CreateDealDialog
        open={createDealOpen}
        onOpenChange={setCreateDealOpen}
      />

      {/* SLA Modal Legacy */}
      {canManageSettings && (
        <div
          className={
            slaConfigOpen
              ? 'fixed inset-0 z-50 bg-background overflow-y-auto p-6 animate-in fade-in duration-200'
              : 'hidden'
          }
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
              <Button variant="ghost" onClick={() => setSlaConfigOpen(false)}>
                ← Voltar
              </Button>
              <h2 className="text-2xl font-bold">Configuração de SLA</h2>
            </div>
            <SLAConfigManager />
          </div>
        </div>
      )}

      <SLAMonitoringService />
      <OnboardingTour />

      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex items-center justify-around h-16 px-2 z-50 safe-area-bottom">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="flex-col h-full py-1 px-2 rounded-none flex-1"
        >
          <Link to="/dashboard">
            <ChartBar className="mb-1 h-5 w-5" />
            <span className="text-[10px]">Dash</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="flex-col h-full py-1 px-2 rounded-none flex-1"
        >
          <Link to="/deals">
            <Kanban className="mb-1 h-5 w-5" />
            <span className="text-[10px]">Deals</span>
          </Link>
        </Button>
        <Button
          size="sm"
          onClick={() => setCreateDealOpen(true)}
          className="flex-col h-12 w-12 rounded-full -mt-6 shadow-lg bg-primary text-primary-foreground border-4 border-background hover:bg-primary/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="flex-col h-full py-1 px-2 rounded-none flex-1"
        >
          <Link to="/companies">
            <Briefcase className="mb-1 h-5 w-5" />
            <span className="text-[10px]">Empresas</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="flex-col h-full py-1 px-2 rounded-none flex-1"
        >
          <Link to="/players">
            <Buildings className="mb-1 h-5 w-5" />
            <span className="text-[10px]">Players</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
