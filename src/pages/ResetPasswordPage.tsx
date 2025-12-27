import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { BrandMark } from '@/components/BrandMark'

type ViewState = 'loading' | 'valid' | 'invalid'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (currentSession) {
          setViewState('valid')
          
          // Limpar tokens da URL para segurança
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname)
          }
        } else {
          setViewState('invalid')
        }
      } catch (error) {
        console.error('[ResetPassword] Erro ao verificar sessão:', error)
        setViewState('invalid')
      }
    }

    checkSession()
  }, [])

  useEffect(() => {
    // Também verifica se o contexto já tem uma sessão
    if (session && viewState === 'loading') {
      setViewState('valid')
      
      // Limpar tokens da URL
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
  }, [session, viewState])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!newPassword || !confirmPassword) {
      toast.error('Erro de validação', {
        description: 'Por favor, preencha todos os campos.'
      })
      return
    }

    if (newPassword.length < 8) {
      toast.error('Senha muito curta', {
        description: 'A senha deve ter no mínimo 8 caracteres.'
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Senhas não coincidem', {
        description: 'As senhas digitadas não são iguais.'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('Senha atualizada!', {
        description: 'Sua senha foi redefinida com sucesso.'
      })

      // Redirecionar para dashboard
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('[ResetPassword] Erro ao atualizar senha:', error)
      toast.error('Erro ao redefinir senha', {
        description: 'Não foi possível atualizar sua senha. Tente novamente.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/login', { replace: true })
  }

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/20 backdrop-blur-3xl" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <Card className="w-full max-w-md shadow-lg border relative z-10">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Verificando link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (viewState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/20 backdrop-blur-3xl" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <Card className="w-full max-w-md shadow-lg border relative z-10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Link Inválido ou Expirado</CardTitle>
            <CardDescription>
              Este link de recuperação não é mais válido. Por favor, solicite um novo link de recuperação de senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              className="w-full"
              onClick={handleBackToLogin}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-muted/20 backdrop-blur-3xl" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      
      <Card className="w-full max-w-md shadow-lg border relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <BrandMark variant="login" />
          </div>
          <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="pr-10 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary"
                  placeholder="Mínimo 8 caracteres"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="pr-10 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary"
                  placeholder="Digite a senha novamente"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Salvar Nova Senha
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBackToLogin}
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
