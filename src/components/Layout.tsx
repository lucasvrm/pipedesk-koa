import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useUnreadCount, useNotificationPreferences } from '@/services/notificationService';
import {
  BarChart3,
  Kanban,
  Bell,
  Plus,
  Search,
  Filter,
  BookOpen,
  Briefcase,
  Building2,
  ListTodo,
  BellOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserBadge } from '@/components/ui/user-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { CreateDealDialog } from '@/features/deals/components/CreateDealDialog';
import GlobalSearch from '@/components/GlobalSearch';
import InboxPanel from '@/features/inbox/components/InboxPanel';
import { SLAMonitoringService } from '@/components/SLAMonitoringService';
import { OnboardingTour } from '@/components/OnboardingTour';
import { CreateNewDropdown } from '@/components/CreateNewDropdown';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [inboxOpen, setInboxOpen] = useState(false);
  const [createDealOpen, setCreateDealOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useRealtimeNotifications(profile?.id, {
    onOpenInbox: () => setInboxOpen(true),
  });

  const { data: unreadCount = 0 } = useUnreadCount(profile?.id || null);
  const { data: preferences } = useNotificationPreferences(profile?.id || null);

  if (!profile) return null;

  const userAvatar = profile.avatar_url || profile.avatar;

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(path + '/');

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
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>

              <Button
                variant={isActive('/leads') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/leads">
                  <Filter className="mr-2 h-4 w-4" />
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
                  <Kanban className="mr-2 h-4 w-4" />
                  Deals
                </Link>
              </Button>

              <Button
                variant={isActive('/companies') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/companies">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Empresas
                </Link>
              </Button>

              <Button
                variant={isActive('/contacts') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/contacts">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Contatos
                </Link>
              </Button>

              <Button
                variant={isActive('/players') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/players">
                  <Building2 className="mr-2 h-4 w-4" />
                  Players
                </Link>
              </Button>

              <Button
                variant={isActive('/tasks') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/tasks">
                  <ListTodo className="mr-2 h-4 w-4" />
                  Tarefas
                </Link>
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Busca Global */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              title="Busca Global (Ctrl+K)"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Botão +Novo */}
            <div className="hidden md:block">
              <CreateNewDropdown />
            </div>

            {/* Notificações */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setInboxOpen(true)}
              data-tour="notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Avatar - Navega para /profile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate('/profile')}
                  className="relative flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Meu perfil e configurações"
                >
                  <UserBadge
                    name={profile.name || 'Usuário'}
                    avatarUrl={userAvatar}
                    bgColor={profile.avatarBgColor}
                    textColor={profile.avatarTextColor}
                    borderColor={preferences?.dndEnabled 
                      ? undefined 
                      : profile.avatarBorderColor}
                    size="sm"
                    className={cn(
                      "cursor-pointer transition-colors",
                      preferences?.dndEnabled && "ring-2 ring-amber-400 dark:ring-amber-600"
                    )}
                  />
                  {/* DND Indicator */}
                  {preferences?.dndEnabled && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center">
                      <BellOff className="h-2 w-2 text-white" />
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Perfil e Configurações
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">{children}</main>

      {/* Modais e Serviços */}
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        currentUser={profile}
      />
      <InboxPanel open={inboxOpen} onOpenChange={setInboxOpen} />
      <CreateDealDialog
        open={createDealOpen}
        onOpenChange={setCreateDealOpen}
      />

      <SLAMonitoringService />
      <OnboardingTour />

      {/* Bottom Navigation Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex items-center justify-around h-16 px-2 z-50 safe-area-bottom">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="flex-col h-full py-1 px-2 rounded-none flex-1"
        >
          <Link to="/dashboard">
            <BarChart3 className="mb-1 h-5 w-5" />
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
          <Link to="/profile">
            <UserBadge
              name={profile.name || 'Usuário'}
              avatarUrl={userAvatar}
              bgColor={profile.avatarBgColor}
              textColor={profile.avatarTextColor}
              borderColor={profile.avatarBorderColor}
              size="xs"
              className="mb-1"
            />
            <span className="text-[10px]">Perfil</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
