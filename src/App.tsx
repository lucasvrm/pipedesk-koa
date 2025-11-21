import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
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
import { Toaster } from '@/components/ui/sonner'
import { OnboardingTour } from '@/components/OnboardingTour'
import { HelpCenter } from '@/components/HelpCenter'
import { PipelineSettingsDialog } from '@/components/PipelineSettingsDialog'
import Dashboard from '@/features/analytics/components/Dashboard'
import DealsView from '@/features/deals/components/DealsView'
import InboxPanel from '@/features/inbox/components/InboxPanel'
import CreateDealDialog from '@/features/deals/components/CreateDealDialog'
import UserManagementDialog from '@/features/rbac/components/UserManagementDialog'
import AnalyticsDashboard from '@/features/analytics/components/AnalyticsDashboard'
import GoogleIntegrationDialog from '@/components/GoogleIntegrationDialog'
import GlobalSearch from '@/components/GlobalSearch'
import MasterMatrixView from '@/features/deals/components/MasterMatrixView'
import MagicLinkAuth from '@/features/rbac/components/MagicLinkAuth'
import RBACDemo from '@/features/rbac/components/RBACDemo'
import CustomFieldsManager from '@/components/CustomFieldsManager'
import TaskManagementView from '@/features/tasks/components/TaskManagementView'
import FolderManager from '@/components/FolderManager'
import FolderBrowser from '@/components/FolderBrowser'
import PhaseValidationManager from '@/components/PhaseValidationManager'
import DataRoomView from '@/components/DataRoomView'
import AuditLogView from '@/components/AuditLogView'
import { getInitials } from '@/lib/helpers'
import { hasPermission } from '@/lib/permissions'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useImpersonation } from '@/contexts/ImpersonationContext'

type Page = 'dashboard' | 'deals' | 'analytics' | 'kanban' | 'rbac' | 'tasks' | 'folders' | 'dataroom' | 'audit'

function App() {
  const { profile, loading, signOut: authSignOut, isAuthenticated } = useAuth()
  const { isImpersonating, setIsImpersonating } = useImpersonation()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [inboxOpen, setInboxOpen] = useState(false)
  const [createDealOpen, setCreateDealOpen] = useState(false)
  const [userManagementOpen, setUserManagementOpen] = useState(false)
  const [googleIntegrationOpen, setGoogleIntegrationOpen] = useState(false)
  const [customFieldsOpen, setCustomFieldsOpen] = useState(false)
  const [folderManagerOpen, setFolderManagerOpen] = useState(false)
  const [phaseValidationOpen, setPhaseValidationOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [helpCenterOpen, setHelpCenterOpen] = useState(false)
  const [pipelineSettingsOpen, setPipelineSettingsOpen] = useState(false)

  const [notifications] = useKV<any[]>('notifications', [])

  const handleSignOut = async () => {
    const success = await authSignOut()
    if (success) {
      toast.success('Você saiu do sistema')
    } else {
      toast.error('Erro ao sair do sistema')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !profile) {
    return <MagicLinkAuth />
  }

  const currentUser = profile

  const unreadCount = (notifications || []).filter((n: any) => !n.read).length

  const canManageUsers = hasPermission(currentUser?.role || 'client', 'MANAGE_USERS')
  const canViewAnalytics = hasPermission(currentUser?.role || 'client', 'VIEW_ANALYTICS')
  const canManageIntegrations = hasPermission(currentUser?.role || 'client', 'MANAGE_INTEGRATIONS')
  const canManageSettings = hasPermission(currentUser?.role || 'client', 'MANAGE_SETTINGS')

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
                variant={currentPage === 'dashboard' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentPage('dashboard')}
                data-tour="dashboard-nav"
              >
                <ChartBar className="mr-2" />
                Dashboard
              </Button>
              <Button
                variant={currentPage === 'deals' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentPage('deals')}
                data-tour="deals-nav"
              >
                <Kanban className="mr-2" />
                Negócios
              </Button>
              <Button
                variant={currentPage === 'tasks' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentPage('tasks')}
              >
                <ListChecks className="mr-2" />
                Tarefas
              </Button>
              <Button
                variant={currentPage === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentPage('kanban')}
                data-tour="kanban-nav"
              >
                <GridFour className="mr-2" />
                Kanban
              </Button>
              {canViewAnalytics && (
                <Button
                  variant={currentPage === 'analytics' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('analytics')}
                >
                  <ChartBar className="mr-2" />
                  Analytics
                </Button>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {currentUser?.role === 'admin' && (
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
                        {getInitials(currentUser?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{currentUser?.name || 'Usuário'}</p>
                      <p className="text-xs text-muted-foreground">{currentUser?.email || ''}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserIcon className="mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {canManageUsers && (
                  <DropdownMenuItem onClick={() => setCurrentPage('rbac')}>
                    <ShieldCheck className="mr-2" />
                    RBAC
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {canManageUsers && (
                  <DropdownMenuItem onClick={() => setUserManagementOpen(true)}>
                    <Users className="mr-2" />
                    Gerenciar Usuários
                  </DropdownMenuItem>
                )}
                {canManageIntegrations && (
                  <DropdownMenuItem onClick={() => setGoogleIntegrationOpen(true)}>
                    <GoogleLogo className="mr-2" />
                    Google Workspace
                  </DropdownMenuItem>
                )}
                {canManageSettings && (
                  <DropdownMenuItem onClick={() => setCustomFieldsOpen(true)}>
                    <Gear className="mr-2" />
                    Campos Customizados
                  </DropdownMenuItem>
                )}
                {canManageSettings && (
                  <DropdownMenuItem onClick={() => setPhaseValidationOpen(true)}>
                    <GitBranch className="mr-2" />
                    Validação de Fases
                  </DropdownMenuItem>
                )}
                {canManageSettings && (
                  <DropdownMenuItem onClick={() => setPipelineSettingsOpen(true)}>
                    <FlowArrow className="mr-2" />
                    Configurar Pipeline
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setFolderManagerOpen(true)}>
                  <FolderOpen className="mr-2" />
                  Gerenciar Pastas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setHelpCenterOpen(true)}>
                  <Question className="mr-2" />
                  Central de Ajuda
                </DropdownMenuItem>
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
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'deals' && <DealsView />}
        {currentPage === 'tasks' && currentUser && <TaskManagementView currentUser={currentUser} />}
        {currentPage === 'folders' && currentUser && <FolderBrowser currentUser={currentUser} onManageFolders={() => setFolderManagerOpen(true)} />}
        {currentPage === 'kanban' && currentUser && <MasterMatrixView currentUser={currentUser} />}
        {currentPage === 'analytics' && currentUser && (
          <AnalyticsDashboard currentUser={currentUser} />
        )}
        {currentPage === 'rbac' && currentUser && (
          <RBACDemo currentUser={currentUser} />
        )}
        {currentPage === 'dataroom' && <DataRoomView />}
        {currentPage === 'audit' && <AuditLogView />}
      </main>

      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        currentUser={currentUser!}
      />
      <InboxPanel open={inboxOpen} onOpenChange={setInboxOpen} />
      <CreateDealDialog open={createDealOpen} onOpenChange={setCreateDealOpen} />
      
      {currentUser && (
        <>
          <UserManagementDialog
            open={userManagementOpen}
            onOpenChange={setUserManagementOpen}
            currentUser={currentUser}
          />
          <GoogleIntegrationDialog
            open={googleIntegrationOpen}
            onOpenChange={setGoogleIntegrationOpen}
            currentUser={currentUser}
          />
          <CustomFieldsManager
            open={customFieldsOpen}
            onOpenChange={setCustomFieldsOpen}
            currentUser={currentUser}
          />
          <FolderManager
            open={folderManagerOpen}
            onOpenChange={setFolderManagerOpen}
            currentUser={currentUser}
          />
          <PhaseValidationManager
            open={phaseValidationOpen}
            onOpenChange={setPhaseValidationOpen}
            currentUser={currentUser}
          />
          <PipelineSettingsDialog
            open={pipelineSettingsOpen}
            onOpenChange={setPipelineSettingsOpen}
            pipelineId={null}  // null = global default stages
          />
          <HelpCenter
            open={helpCenterOpen}
            onOpenChange={setHelpCenterOpen}
          />
        </>
      )}
      
      <OnboardingTour />
      <Toaster position="top-right" />

      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex items-center justify-around h-16 px-4 z-50">
        <Button
          variant={currentPage === 'dashboard' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setCurrentPage('dashboard')}
          className="flex-col h-auto py-2 px-3"
        >
          <ChartBar className="mb-1" />
          <span className="text-xs">Dashboard</span>
        </Button>
        <Button
          variant={currentPage === 'deals' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setCurrentPage('deals')}
          className="flex-col h-auto py-2 px-3"
        >
          <Kanban className="mb-1" />
          <span className="text-xs">Negócios</span>
        </Button>
        <Button
          variant={currentPage === 'tasks' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setCurrentPage('tasks')}
          className="flex-col h-auto py-2 px-3"
        >
          <ListChecks className="mb-1" />
          <span className="text-xs">Tarefas</span>
        </Button>
        <Button
          variant={currentPage === 'kanban' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setCurrentPage('kanban')}
          className="flex-col h-auto py-2 px-3"
        >
          <GridFour className="mb-1" />
          <span className="text-xs">Kanban</span>
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

export default App
