import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/lib/types'
import { hasPermission } from '@/lib/permissions'

interface ProtectedRouteProps {
  children: ReactNode
  requireRole?: UserRole
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, loading, profile } = useAuth()
  const location = useLocation()

  useEffect(() => {
    // Save the attempted route for redirect after login
    if (!isAuthenticated && !loading) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname)
    }
  }, [isAuthenticated, loading, location.pathname])

  // Show loading state while checking session
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-background"
        role="status"
        aria-live="polite"
        aria-label="Verificando autenticação"
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
            aria-hidden="true"
          ></div>
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !profile) {
    return <Navigate to="/login" replace />
  }

  // Check role permissions if required
  if (requireRole) {
    const userRole = profile.role || 'client'
    
    // Check if user has the required role or higher permissions
    // For simplicity, we'll check if the user has MANAGE_USERS permission
    // which is typically available to admins
    if (requireRole === 'admin' && !hasPermission(userRole, 'MANAGE_USERS')) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground mb-4">
              Você não tem permissão para acessar esta página.
            </p>
            <Navigate to="/dashboard" replace />
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
