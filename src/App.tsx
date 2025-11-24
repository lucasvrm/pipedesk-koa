import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/Layout'
import MagicLinkAuth from '@/features/rbac/components/MagicLinkAuth'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import Profile from '@/pages/Profile'

// Lazy load components
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

// Loading component
const PageLoader = () => (
  <div 
    className="min-h-screen flex items-center justify-center bg-background"
    role="status"
    aria-live="polite"
    aria-label="Loading page content"
  >
    <div className="text-center">
      <div 
        className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
        aria-hidden="true"
      ></div>
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
          {/* Public Routes */}
          <Route path="/login" element={!user ? <MagicLinkAuth /> : <Navigate to="/dashboard" replace />} />

          {/* Protected Routes */}
          <Route element={
            <ProtectedRoute>
              <Layout>
                <Outlet />
              </Layout>
            </ProtectedRoute>
          }>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/deals" element={<DealsView />} />
            <Route path="/deals/comparison" element={<DealComparison />} />
            <Route path="/tasks" element={profile ? <TaskManagementView currentUser={profile} /> : null} />
            <Route path="/kanban" element={profile ? <MasterMatrixView currentUser={profile} /> : null} />
            <Route path="/folders" element={profile ? <FolderBrowser currentUser={profile} onManageFolders={() => {}} /> : null} />
            <Route path="/dataroom" element={<DataRoomView />} />
            <Route path="/audit" element={<AuditLogView />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Role Restricted Routes */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredRole={['admin', 'analyst', 'newbusiness']}>
                  {profile ? <AnalyticsDashboard currentUser={profile} /> : null}
                </ProtectedRoute>
              }
            />
            <Route
              path="/rbac"
              element={
                <ProtectedRoute requiredRole={['admin']}>
                  {profile ? <RBACDemo currentUser={profile} /> : null}
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" />
    </>
  )
}

export default App
