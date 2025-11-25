import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import { hasPermission } from '@/lib/permissions'
import { getInitials } from '@/lib/helpers'
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
  GridFour,
  ShieldCheck,
  Gear,
  ListChecks,
  FolderOpen,
  GitBranch,
  List,
  Eye,
  EyeSlash,
  Question,
  FlowArrow,
  Clock,
  ChartLineUp,
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

// Dialogs (Mantidos apenas para ações rápidas ou não migrados ainda)
import CreateDealDialog from '@/features/deals/components/CreateDealDialog'
import { PipelineSettingsDialog } from '@/components/PipelineSettingsDialog'
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

  // Dialog States (Apenas para os que sobraram)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [createDealOpen, setCreateDealOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [pipelineSettingsOpen, setPipelineSettingsOpen] = useState(false)
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

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-primary tracking-tight">
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
              {/* ... Outros links de navegação mantidos ... */}
               <Button
                variant={isActive('/deals') && !isActive('/deals/comparison') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
                data-tour="deals-nav"
              >
                <Link to="/deals">
                  <Kanban className="mr-2" />
                  Negócios
                </Link>
              </Button>
              <Button
                variant={isActive('/deals/comparison') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
                data-tour="comparison-nav"
              >
                <Link to="/deals/comparison">
                  <ChartLineUp className="mr-2" />
                  Comparação
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
              <Button
                variant={isActive('/kanban') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
                data-tour="kanban-nav"
              >
                <Link to="/kanban">
                  <GridFour className="mr-2" />
                  Kanban
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
            {currentUser.role === 'admin' && (
              <div className="flex items-center gap-2 mr-2 px-3 py-1 rounded-md bg-muted">
                {isImpersonating ? (
                  <EyeSlash className="text-muted-foreground" size={16} />
                ) : (
                  <Eye className="text-muted-foreground" size={16} />
                )}
                <Label htmlFor="impersonation-mode" className="text-xs text-muted-foreground cursor-pointer">
                  Modo Cliente
                </Label>
                <Switch
                  id="impersonation-mode"
                  checked={isImpersonating}
                  onCheckedChange={setIsImpersonating}
                />
              </div>
            )}

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
              Novo Negócio
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
                      <p className="text-xs text-muted-foreground">{currentUser.email || ''}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserIcon className="mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {canManageUsers && (
                  <DropdownMenuItem onClick={() => navigate('/rbac')}>
                    <ShieldCheck className="mr-2" />
                    RBAC
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                
                {/* --- NOVAS ROTAS DE ADMINISTRAÇÃO --- */}
                {canManageUsers && (
                  <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                    <Users className="mr-2" />
                    Gerenciar Usuários
                  </DropdownMenuItem>
                )}
                {canManageIntegrations && (
                  <DropdownMenuItem onClick={() => navigate('/admin/integrations/google')}>
                    <GoogleLogo className="mr-2" />
                    Google Workspace
                  </DropdownMenuItem>
                )}
                {canManageSettings && (
                  <DropdownMenuItem onClick={() => navigate('/settings/custom-fields')}>
                    <Gear className="mr-2" />
                    Campos Customizados
                  </DropdownMenuItem>
                )}
                {canManageSettings && (
                  <DropdownMenuItem onClick={() => navigate('/settings/phase-validation')}>
                    <GitBranch className="mr-2" />
                    Validação de Fases
                  </DropdownMenuItem>
                )}
                
                {/* Mantido como Modal por enquanto pois não foi migrado */}
                {canManageSettings && (
                  <DropdownMenuItem onClick={() => setPipelineSettingsOpen(true)}>
                    <FlowArrow className="mr-2" />
                    Configurar Pipeline
                  </DropdownMenuItem>
                )}
                {canManageSettings && (
                  <DropdownMenuItem onClick={() => setSlaConfigOpen(true)}>
                    <Clock className="mr-2" />
                    Configurar SLA
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={() => navigate('/folders/manage')}>
                  <FolderOpen className="mr-2" />
                  Gerenciar Pastas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/help')}>
                  <Question className="mr-2" />
                  Central de Ajuda
                </DropdownMenuItem>
                {/* ------------------------------------ */}

                <DropdownMenuSeparator />
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
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
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

      {/* Global Components */}
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        currentUser={currentUser}
      />
      <InboxPanel open={inboxOpen} onOpenChange={setInboxOpen} />
      <CreateDealDialog open={createDealOpen} onOpenChange={setCreateDealOpen} />

      {/* REMOVIDOS: UserManagementDialog, GoogleIntegrationDialog, CustomFieldsManager, 
          FolderManager, PhaseValidationManager, HelpCenter 
          MOTIVO: Migrados para rotas dedicadas
      */}

      <PipelineSettingsDialog
        open={pipelineSettingsOpen}
        onOpenChange={setPipelineSettingsOpen}
        pipelineId={null}
      />

      {/* SLA Config Dialog (Pode ser migrado depois) */}
      {canManageSettings && (
        <div className={slaConfigOpen ? 'fixed inset-0 z-50 bg-background overflow-y-auto p-6' : 'hidden'}>
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <Button variant="ghost" onClick={() => setSlaConfigOpen(false)}>
                ← Voltar
              </Button>
            </div>
            <SLAConfigManager />
          </div>
        </div>
      )}

      <SLAMonitoringService />
      <OnboardingTour />

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex items-center justify-around h-16 px-4 z-50">
        {/* ... Mobile menu items mantidos ... */}
         <Button
          variant={isActive('/dashboard') ? 'secondary' : 'ghost'}
          size="sm"
          asChild
          className="flex-col h-auto py-2 px-3"
        >
          <Link to="/dashboard">
            <ChartBar className="mb-1" />
            <span className="text-xs">Dash</span>
          </Link>
        </Button>
        <Button
          variant={isActive('/deals') && !isActive('/deals/comparison') ? 'secondary' : 'ghost'}
          size="sm"
          asChild
          className="flex-col h-auto py-2 px-3"
        >
          <Link to="/deals">
            <Kanban className="mb-1" />
            <span className="text-xs">Deals</span>
          </Link>
        </Button>
        <Button
          variant={isActive('/deals/comparison') ? 'secondary' : 'ghost'}
          size="sm"
          asChild
          className="flex-col h-auto py-2 px-3"
        >
          <Link to="/deals/comparison">
            <ChartLineUp className="mb-1" />
            <span className="text-xs">Compare</span>
          </Link>
        </Button>
        <Button
          variant={isActive('/tasks') ? 'secondary' : 'ghost'}
          size="sm"
          asChild
          className="flex-col h-auto py-2 px-3"
        >
          <Link to="/tasks">
            <ListChecks className="mb-1" />
            <span className="text-xs">Tasks</span>
          </Link>
        </Button>
        <Button
          variant={isActive('/kanban') ? 'secondary' : 'ghost'}
          size="sm"
          asChild
          className="flex-col h-auto py-2 px-3"
        >
          <Link to="/kanban">
            <GridFour className="mb-1" />
            <span className="text-xs">Kanban</span>
          </Link>
        </Button>
        <Button
          size="sm"
          onClick={() => setCreateDealOpen(true)}
          className="flex-col h-auto py-2 px-3"
        >
          <Plus className="mb-1" />
          <span className="text-xs">Novo</span>
        </Button>
      </div>
    </div>
  )
}