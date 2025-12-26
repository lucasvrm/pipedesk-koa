import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Lock, Eye, EyeOff, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type ViewState = 'login' | 'reset' | 'reset-success'

export default function LoginView() {
  const { signIn, signInWithGoogle, resetPassword, loading: authLoading } = useAuth()
  
  const [view, setView] = useState<ViewState>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Erro de validação', {
        description: 'Por favor, preencha email e senha.'
      })
      return
    }
    
    setIsSubmitting(true)
    try {
      await signIn(email, password)
    } catch (error) {
      toast.error('Erro ao fazer login', {
        description: 'Verifique suas credenciais.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      toast.error('Erro ao fazer login com Google', {
        description: 'Tente novamente mais tarde.'
      })
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Erro de validação', {
        description: 'Por favor, preencha seu email.'
      })
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(email)
      setView('reset-success')
    } catch (error) {
      toast.error('Erro ao enviar link', {
        description: 'Verifique seu email e tente novamente.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = isSubmitting || authLoading

  if (view === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/20 backdrop-blur-3xl" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <Card className="w-full max-w-md shadow-lg border relative z-10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
            <CardDescription>Enviaremos um link de recuperação para seu email</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-reset">Email</Label>
                <Input
                  id="email-reset"
                  type="email"
                  placeholder="seu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isDisabled}
                  className="focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isDisabled}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setView('login')}
                disabled={isDisabled}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (view === 'reset-success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/20 backdrop-blur-3xl" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <Card className="w-full max-w-md shadow-lg border relative z-10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Email Enviado!</CardTitle>
            <CardDescription>
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setView('login')
                setEmail('')
                setPassword('')
              }}
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
          <div className="mx-auto mb-4 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">PipeDesk Koa</CardTitle>
          <CardDescription>Acesso ao Sistema de DealFlow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isDisabled}
                className="focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs"
                  type="button"
                  onClick={() => setView('reset')}
                  disabled={isDisabled}
                >
                  Esqueceu?
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isDisabled}
                  className="pr-10 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isDisabled}
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
            <Button type="submit" className="w-full" disabled={isDisabled}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isDisabled}
            type="button"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google Workspace
          </Button>
        </CardContent>
        <CardFooter className="justify-center py-4 bg-muted/20 border-t">
          <p className="text-xs text-muted-foreground">
            Protegido por criptografia de ponta a ponta
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}