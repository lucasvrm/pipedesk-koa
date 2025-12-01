import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/Layout'
import LoginView from '@/features/rbac/components/LoginView'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import Profile from '@/pages/Profile'

// Lazy loads (Carregamento sob demanda)
const Dashboard = lazy(() => import('@/pages/DashboardPage'))
const DealsView = lazy(() => import('@/features/deals/components/DealsView'))
const DealDetailPage = lazy(() => import('@/features/deals/pages/DealDetailPage'))
const AnalyticsDashboard = lazy(() => import('@/features/analytics/components/AnalyticsDashboard'))
const MasterMatrixView = lazy(() => import('@/features/deals/components/MasterMatrixView'))
const TaskManagementView = lazy(() => import('@/features/tasks/components/TaskManagementView'))
const DataRoomView = lazy(() => import('@/components/DataRoomView'))
const AuditLogView = lazy(() => import('@/components/AuditLogView'))
const RBACDemo = lazy(() => import('@/features/rbac/components/RBACDemo'))
const FolderBrowser = lazy(() => import('@/components/FolderBrowser'))
const DealComparison = lazy(() => import('@/features/deals/pages/DealComparison'))

// Admin & Settings Pages
const PipelineSettingsPage = lazy(() => import('@/pages/admin/PipelineSettings'))
const SyntheticDataAdminPage = lazy(() => import('@/pages/admin/SyntheticDataAdminPage'))
const TagSettingsPage = lazy(() => import('@/pages/admin/TagSettings'))
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'))
const GoogleIntegrationPage = lazy(() => import('@/pages/admin/GoogleIntegrationPage'))
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'))
const CustomFieldsPage = lazy(() => import('@/pages/settings/CustomFieldsPage'))
const FolderManagerPage = lazy(() => import('@/pages/FolderManagerPage'))
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage'))

// Features Pages
const PlayersListPage = lazy(() => import('@/features/players/pages/PlayersListPage'))
const PlayerDetailPage = lazy(() => import('@/features/players/pages/PlayerDetailPage'))
const TrackDetailPage = lazy(() => import('@/features/tracks/pages/TrackDetailPage'))
const CompaniesListPage = lazy(() => import('@/features/companies/pages/CompaniesListPage'))
const CompanyDetailPage = lazy(() => import('@/features/companies/pages/CompanyDetailPage'))
const ContactDetailPage = lazy(() => import('@/features/contacts/pages/ContactDetailPage'))

// Leads & Contacts
const LeadsListPage = lazy(() => import('@/features/leads/pages/LeadsListPage'))
const LeadDetailPage = lazy(() => import('@/features/leads/pages/LeadDetailPage'))
const ContactsPage = lazy(() => import('@/pages/ContactsPage'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
)

// const Unauthorized = () => <div className="p-8 text-center text-muted-foreground">Acesso não autorizado.</div>;

function App() {
  const { user, profile } = useAuth()

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!user ? <LoginView /> : <Navigate to="/dashboard" replace />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><Layout><Outlet /></Layout></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Core Modules */}
            <Route path="/deals" element={<DealsView />} />
            <Route path="/deals/:id" element={<DealDetailPage />} />
            <Route path="/deals/comparison" element={<DealComparison />} />
            
            <Route path="/players" element={<PlayersListPage />} />
            <Route path="/players/:id" element={<PlayerDetailPage />} />

            <Route path="/tracks/:id" element={<TrackDetailPage />} />

            <Route path="/companies" element={<CompaniesListPage />} />
            <Route path="/companies/:id" element={<CompanyDetailPage />} />

            {/* Leads & Contacts Modules */}
            <Route path="/leads" element={<LeadsListPage />} />
            <Route path="/leads/:id" element={<LeadDetailPage />} />

            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/contacts/:id" element={<ContactDetailPage />} />

            {/* Tools */}
            <Route path="/tasks" element={profile ? <TaskManagementView currentUser={profile} /> : null} />
            <Route path="/kanban" element={profile ? <MasterMatrixView currentUser={profile} /> : null} />
            
            <Route path="/folders" element={profile ? <FolderBrowser currentUser={profile} onManageFolders={() => {}} /> : null} />
            <Route path="/folders/manage" element={<FolderManagerPage />} />
            
            <Route path="/dataroom" element={<DataRoomView />} />
            <Route path="/audit" element={<AuditLogView />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<HelpCenterPage />} />

            {/* Admin & Settings Routes */}
            <Route path="/admin/users" element={<ProtectedRoute requiredRole={['admin']}><UserManagementPage /></ProtectedRoute>} />
            <Route path="/admin/integrations/google" element={<ProtectedRoute requiredRole={['admin']}><GoogleIntegrationPage /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requiredRole={['admin']}><SettingsPage /></ProtectedRoute>} />
            {/* Altera a rota antiga /admin/synthetic-data para a nova slug /admin/gerador-dados */}
            <Route path="/admin/gerador-dados" element={<ProtectedRoute requiredRole={['admin']}><SyntheticDataAdminPage /></ProtectedRoute>} />
            <Route path="/custom-fields" element={<CustomFieldsPage />} />
            <Route path="/admin/pipeline" element={<ProtectedRoute requiredRole={['admin']}><PipelineSettingsPage /></ProtectedRoute>} />
            <Route path="/admin/tags" element={<ProtectedRoute requiredRole={['admin']}><TagSettingsPage /></ProtectedRoute>} />

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

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" />
    </>
  )
}

export default App