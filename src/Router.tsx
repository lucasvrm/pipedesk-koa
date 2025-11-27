import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import AuthForm from '@/components/Auth/AuthForm'
import Profile from '@/pages/Profile'
import App from '@/App'
import DealDetailPage from '@/features/deals/pages/DealDetailPage' // Importante
import TrackDetailPage from '@/features/tracks/pages/TrackDetailPage' // VERIFIQUE ESTA IMPORTAÇÃO

export default function Router() {
  const { isAuthenticated, loading } = useAuth()

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthForm />
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/deals/:id" element={
          <ProtectedRoute>
            <DealDetailPage />
          </ProtectedRoute>
        } />

        {/* VERIFIQUE SE ESTA ROTA EXISTE */}
        <Route path="/tracks/:id" element={
          <ProtectedRoute>
            <TrackDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}