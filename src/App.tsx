import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/Layout'
import LoginView from '@/features/rbac/components/LoginView'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import Profile from '@/pages/Profile'

// --- LAZY LOADS (Performance) ---

// Dashboards
const Dashboard = lazy(() => import('@/features/analytics/components/Dashboard'))
const AnalyticsDashboard = lazy(() => import('@/features/analytics/components/AnalyticsDashboard'))

// Deals (Negócios)
const DealsView = lazy(() => import('@/features/deals/components/DealsView'))
const DealDetailPage = lazy(() => import('@/features/deals/pages/DealDetailPage')) // Nova Página
const DealComparison = lazy(() => import('@/features/deals/pages/DealComparison'))
const MasterMatrixView = lazy(() => import('@/features/deals/components/MasterMatrixView'))

// Players (Nova Feature)
const PlayersListPage = lazy(() => import('@/features/players/pages/PlayersListPage'))
const PlayerDetailPage = lazy(() => import('@/features/players/pages/PlayerDetailPage'))

// Tasks
const TaskManagementView = lazy(() => import('@/features/tasks/components/TaskManagementView'))

// Ferramentas
const DataRoomView = lazy(() => import('@/components/DataRoomView'))
const AuditLogView = lazy(() => import('@/components/AuditLogView'))
const FolderBrowser = lazy(() => import('@/components/FolderBrowser'))

// Admin & Configurações
const RBACDemo = lazy(() => import('@/features/rbac/components/RBACDemo'))
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'))
const GoogleIntegrationPage = lazy(() => import('@/pages/admin/GoogleIntegrationPage'))
const CustomFieldsPage = lazy(() => import('@/pages/settings/CustomFieldsPage'))
const PhaseValidationPage = lazy(() => import('@/pages/settings/PhaseValidationPage'))
const FolderManagerPage = lazy(() => import('@/pages/FolderManagerPage'))
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage'))

// Componente de Loading Centralizado
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground animate-pulse">Carregando aplicação...</p>
    </div>
  </div>
)

function App() {
  const { user, profile } = useAuth()

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rota Pública: Login */}
          <Route path="/login" element={!user ? <LoginView /> : <Navigate to="/dashboard" replace />} />

          {/* Rotas Protegidas (Layout Principal) */}
          <Route element={<ProtectedRoute><Layout><Outlet /></Layout></ProtectedRoute>}>
            {/* Redirecionamento padrão */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Negócios */}
            <Route path="/deals" element={<DealsView />} />
            <Route path="/deals/:id" element={<DealDetailPage />} />
            <Route path="/deals/comparison" element={<DealComparison />} />
            <Route path="/kanban" element={profile ? <MasterMatrixView currentUser={profile} /> : null} />
            
            {/* Players (CRUD) */}
            <Route path="/players" element={<PlayersListPage />} />
            <Route path="/players/:id" element={<PlayerDetailPage />} />

            {/* Tarefas */}
            <Route path="/tasks" element={profile ? <TaskManagementView currentUser={profile} /> : null} />
            
            {/* Gestão de Arquivos */}
            <Route path="/folders" element={profile ? <FolderBrowser currentUser={profile} onManageFolders={() => {}} /> : null} />
            <Route path="/folders/manage" element={<FolderManagerPage />} />
            <Route path="/dataroom" element={<DataRoomView />} />
            
            {/* Auditoria e Perfil */}
            <Route path="/audit" element={<AuditLogView />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<HelpCenterPage />} />

            {/* Rotas de Admin (Proteção Extra) */}
            <Route path="/admin/users" element={<ProtectedRoute requiredRole={['admin']}><UserManagementPage /></ProtectedRoute>} />
            <Route path="/admin/integrations/google" element={<ProtectedRoute requiredRole={['admin']}><GoogleIntegrationPage /></ProtectedRoute>} />
            
            {/* Configurações */}
            <Route path="/settings/custom-fields" element={<CustomFieldsPage />} />
            <Route path="/settings/phase-validation" element={<PhaseValidationPage />} />

            {/* Analytics Avançado */}
            <Route path="/analytics" element={
                <ProtectedRoute requiredRole={['admin', 'analyst', 'newbusiness']}>
                  {profile ? <AnalyticsDashboard currentUser={profile} /> : null}
                </ProtectedRoute>
              }
            />
            
            {/* Painel de Controle (RBAC / Sintéticos) */}
            <Route path="/rbac" element={
                <ProtectedRoute requiredRole={['admin']}>
                  {profile ? <RBACDemo currentUser={profile} /> : <div>Carregando...</div>}
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback Geral: Qualquer rota desconhecida vai para o Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" />
    </>
  )
}

export default App


**Copie este código para o `src/App.tsx` e faça o deploy.** Isso deve conectar todas as partes que construímos.