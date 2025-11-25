import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/Layout'
import LoginView from '@/features/rbac/components/LoginView'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import Profile from '@/pages/Profile'

// Lazy loads existentes
const Dashboard = lazy(() => import('@/features/analytics/components/Dashboard'))
const DealsView = lazy(() => import('@/features/deals/components/DealsView'))
const AnalyticsDashboard = lazy(() => import('@/features/analytics/components/AnalyticsDashboard'))
const MasterMatrixView = lazy(() => import('@/features/deals/components/MasterMatrixView'))
const TaskManagementView = lazy(() => import('@/features/tasks/components/TaskManagementView'))
const DataRoomView = lazy(() => import('@/components/DataRoomView'))
const AuditLogView = lazy(() => import('@/components/AuditLogView'))
const RBACDemo = lazy(() => import('@/features/rbac/components/RBACDemo'))
const FolderBrowser = lazy(() => import('@/components/FolderBrowser'))
const DealComparison = lazy(() => import('@/features/deals/pages/DealComparison'))

// --- NOVAS PÁGINAS ---
const DealDetailPage = lazy(() => import('@/features/deals/pages/DealDetailPage'))
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'))
const GoogleIntegrationPage = lazy(() => import('@/pages/admin/GoogleIntegrationPage'))
const CustomFieldsPage = lazy(() => import('@/pages/settings/CustomFieldsPage'))
const PhaseValidationPage = lazy(() => import('@/pages/settings/PhaseValidationPage'))
const FolderManagerPage = lazy(() => import('@/pages/FolderManagerPage'))
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
)

function App() {
  const { user, profile } = useAuth()

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={!user ? <LoginView /> : <Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute><Layout><Outlet /></Layout></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Rotas de Negócios */}
            <Route path="/deals" element={<DealsView />} />
            <Route path="/deals/:id" element={<DealDetailPage />} /> {/* NOVA ROTA */}
            <Route path="/deals/comparison" element={<DealComparison />} />
            
            <Route path="/tasks" element={profile ? <TaskManagementView currentUser={profile} /> : null} />
            <Route path="/kanban" element={profile ? <MasterMatrixView currentUser={profile} /> : null} />
            
            {/* Rotas de Pastas */}
            <Route path="/folders" element={profile ? <FolderBrowser currentUser={profile} onManageFolders={() => {}} /> : null} />
            <Route path="/folders/manage" element={<FolderManagerPage />} /> {/* NOVA ROTA */}
            
            <Route path="/dataroom" element={<DataRoomView />} />
            <Route path="/audit" element={<AuditLogView />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<HelpCenterPage />} /> {/* NOVA ROTA */}

            {/* Rotas de Admin/Configurações */}
            <Route path="/admin/users" element={<ProtectedRoute requiredRole={['admin']}><UserManagementPage /></ProtectedRoute>} />
            <Route path="/admin/integrations/google" element={<ProtectedRoute requiredRole={['admin']}><GoogleIntegrationPage /></ProtectedRoute>} />
            <Route path="/settings/custom-fields" element={<CustomFieldsPage />} />
            <Route path="/settings/phase-validation" element={<PhaseValidationPage />} />

            <Route path="/analytics" element={
                <ProtectedRoute requiredRole={['admin', 'analyst', 'newbusiness']}>
                  {profile ? <AnalyticsDashboard currentUser={profile} /> : null}
                </ProtectedRoute>
              }
            />
            
            <Route path="/rbac" element={
                <ProtectedRoute requiredRole={['admin']}>
                  {profile ? <RBACDemo currentUser={profile} /> : <div>Carregando...</div>}
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" />
    </>
  )
}

export default App