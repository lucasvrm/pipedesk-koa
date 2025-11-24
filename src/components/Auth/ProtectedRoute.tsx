import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ReactNode, useEffect } from 'react'

interface ProtectedRouteProps {
  children?: ReactNode
  requiredRole?: string[]
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (!loading) {
      console.log('[ProtectedRoute] Check:', {
        path: location.pathname,
        hasUser: !!user,
        profileRole: profile?.role,
        required: requiredRole,
        accessGranted: requiredRole ? profile && requiredRole.includes(profile.role) : true
      })
    }
  }, [loading, user, profile, location, requiredRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="text-muted-foreground animate-pulse">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se a rota exige permissões e o usuário não tem (ou perfil não carregou)
  if (requiredRole && (!profile || !requiredRole.includes(profile.role))) {
    console.warn(`[ProtectedRoute] Acesso negado. Role atual: ${profile?.role}, Necessária: ${requiredRole}`)
    // Redireciona para dashboard se for bloqueado
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}