import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import { hasPermission } from '@/lib/permissions'
import { getInitials } from '@/lib/helpers'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications' 
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
  ShieldCheck,
  Gear,
  ListChecks,
  FolderOpen,
  GitBranch,
  List,
  Question,
  FlowArrow,
  Clock,
  Buildings,
  Briefcase,
  Eye,
  EyeSlash,
  Tag
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

import { CreateDealDialog } from '@/features/deals/components/CreateDealDialog'
// REMOVIDO: Import do antigo modal de Pipeline
import { SLAConfigManager } from '@/components/SLAConfigManager'
import GlobalSearch from '@/components/GlobalSearch'
import InboxPanel from '@/features/inbox/components/InboxPanel'
import { SLAMonitoringService } from '@/components/SLAMonitoringService'
import { OnboardingTour } from '@/components/OnboardingTour'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { profile, signOut: authSignOut } = useAuth()
  const { isImpersonating, setIsImpersonating } = useImpersonation()
  const navigate = useNavigate()
  const location = useLocation()

  console.log("👤 [Layout] Renderizou. Profile ID:", profile?.id);

  useRealtimeNotifications(profile?.id);

  const [inboxOpen, setInboxOpen] = useState(false)
  const [createDealOpen, setCreateDealOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // REMOVIDO: Estado do antigo modal de pipeline
  const [slaConfigOpen, setSlaConfigOpen] = useState(false)
  const [compactMode, setCompactMode] = useState(false)

  const currentUser = profile
  const unreadCount = 0 

  const handleSignOut = async () => {
    const success = await authSignOut()
    if (success) {
      toast.success('Você saiu do sistema')
      navigate('/login')
    } else {
      toast.error('Erro ao sair do sistema')
    }
  }

  if (!currentUser) return null

  const canManageUsers = hasPermission(currentUser.role, 'MANAGE_USERS')
  const canViewAnalytics = hasPermission(currentUser.role, 'VIEW_ANALYTICS')
  const canManageIntegrations = hasPermission(currentUser.role, 'MANAGE_INTEGRATIONS')
  const canManageSettings = hasPermission(currentUser.role, 'MANAGE_SETTINGS')

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

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
                variant={isActive('/deals') && !isActive('/deals/comparison') ? 'secondary' : 'ghost'}
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

              {canViewAnalytics && (
                <Button
                  variant={isActive('/analytics') ? 'secondary' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link to="/analytics">
                    <ChartBar className="mr-2" />
                    Analytics
                  </Link>
                </Button>
              )}
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Menu">
                  <List weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3 py-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(currentUser.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{currentUser.name || 'Usuário'}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">{currentUser.email || ''}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserIcon className="mr-2" />
                  Perfil
                </DropdownMenuItem>
                
                {canManageUsers && (
                  <DropdownMenuItem onClick={() => navigate('/rbac')}>
                    <ShieldCheck className="mr-2" />
                    Painel Admin
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">Gestão</DropdownMenuLabel>
                
                {canManageUsers && (
                  <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                    <Users className="mr-2" />
                    Usuários
                  </DropdownMenuItem>
                )}
                
                {canManageIntegrations && (
                  <DropdownMenuItem onClick={() => navigate('/admin/integrations/google')}>
                    <GoogleLogo className="mr-2" />
                    Google Workspace
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={() => navigate('/folders/manage')}>
                  <FolderOpen className="mr-2" />
                  Pastas
                </DropdownMenuItem>

                {canManageSettings && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">Configurações</DropdownMenuLabel>
                    
                    <DropdownMenuItem onClick={() => navigate('/settings/custom-fields')}>
                      <Gear className="mr-2" />
                      Campos Customizados
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => navigate('/settings/tags')}>
                      <Tag className="mr-2" />
                      Tags
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => navigate('/settings/phase-validation')}>
                      <GitBranch className="mr-2" />
                      Validação de Fases
                    </DropdownMenuItem>
                    
                    {/* ATUALIZAÇÃO: Link direto para a nova página de Pipeline */}
                    <DropdownMenuItem onClick={() => navigate('/settings/pipeline')}>
                      <FlowArrow className="mr-2" />
                      Pipeline
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => setSlaConfigOpen(true)}>
                      <Clock className="mr-2" />
                      SLA
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => navigate('/help')}>
                  <Question className="mr-2" />
                  Central de Ajuda
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {currentUser.role === 'admin' && (
                  <div className="px-2 py-2 flex items-center justify-between hover:bg-accent rounded-sm transition-colors">
                    <div className="flex items-center gap-2">
                        {isImpersonating ? (
                            <EyeSlash className="text-muted-foreground" size={16} />
                        ) : (
                            <Eye className="text-muted-foreground" size={16} />
                        )}
                        <Label htmlFor="impersonation-mode" className="text-sm font-normal cursor-pointer">
                            Modo Cliente
                        </Label>
                    </div>
                    <Switch
                        id="impersonation-mode"
                        checked={isImpersonating}
                        onCheckedChange={setIsImpersonating}
                    />
                  </div>
                )}

                <div className="px-2 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="compact-mode" className="text-sm font-normal cursor-pointer">
                      Visão Compacta
                    </Label>
                    <Switch
                      id="compact-mode"
                      checked={compactMode}
                      onCheckedChange={setCompactMode}
                    />
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleSignOut}>
                  <SignOut className="mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        currentUser={currentUser}
      />
      <InboxPanel open={inboxOpen} onOpenChange={setInboxOpen} />
      <CreateDealDialog open={createDealOpen} onOpenChange={setCreateDealOpen} />

      {/* REMOVIDO: O PipelineSettingsDialog foi substituído pela página */}

      {canManageSettings && (
        <div className={slaConfigOpen ? 'fixed inset-0 z-50 bg-background overflow-y-auto p-6 animate-in fade-in duration-200' : 'hidden'}>
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

      {/* BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex items-center justify-around h-16 px-2 z-50 safe-area-bottom">
        <Button
          variant={isActive('/dashboard') ? 'secondary' : 'ghost'}
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
          variant={isActive('/deals') ? 'secondary' : 'ghost'}
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
          variant={isActive('/companies') ? 'secondary' : 'ghost'}
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
          variant={isActive('/players') ? 'secondary' : 'ghost'}
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
  )
}