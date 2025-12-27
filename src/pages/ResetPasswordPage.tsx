import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, AlertCircle, CheckCircle2, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { BrandMark } from '@/components/BrandMark'
import { cn } from '@/lib/utils'

type ViewState = 'loading' | 'valid' | 'invalid' | 'success'

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'Mínimo de 8 caracteres', test: (pwd) => pwd.length >= 8 },
  { label: 'Uma letra maiúscula', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'Um número', test: (pwd) => /\d/.test(pwd) },
]

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate password strength
  const passwordStrength = useMemo<PasswordStrength>(() => {
    if (!newPassword) return 'weak'
    
    let score = 0
    if (newPassword.length >= 8) score++
    if (/[A-Z]/.test(newPassword)) score++
    if (/[a-z]/.test(newPassword)) score++
    if (/\d/.test(newPassword)) score++
    if (/[^A-Za-z0-9]/.test(newPassword)) score++
    
    if (score <= 2) return 'weak'
    if (score === 3) return 'fair'
    if (score === 4) return 'good'
    return 'strong'
  }, [newPassword])

  // Check which requirements are met
  const requirementsMet = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map(req => req.test(newPassword))
  }, [newPassword])

  // Check if all requirements are met
  const allRequirementsMet = useMemo(() => {
    return requirementsMet.every(met => met)
  }, [requirementsMet])

  // Check if passwords match
  const passwordsMatch = useMemo(() => {
    return confirmPassword !== '' && newPassword === confirmPassword
  }, [newPassword, confirmPassword])

  // Enable submit button only when all requirements are met and passwords match
  const canSubmit = useMemo(() => {
    return allRequirementsMet && passwordsMatch && !isSubmitting
  }, [allRequirementsMet, passwordsMatch, isSubmitting])

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

    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      // Show success state
      setViewState('success')
    } catch (error) {
      console.error('[ResetPassword] Erro ao atualizar senha:', error)
      toast.error('Erro ao redefinir senha', {
        description: 'Não foi possível atualizar sua senha. Tente novamente.'
      })
      setIsSubmitting(false)
    }
  }

  const handleGoToDashboard = () => {
    navigate('/dashboard', { replace: true })
  }

  const handleBackToLogin = () => {
    navigate('/login', { replace: true })
  }

  const getStrengthConfig = (strength: PasswordStrength) => {
    const configs = {
      weak: { label: 'Fraca', color: 'bg-destructive', width: 'w-1/4' },
      fair: { label: 'Razoável', color: 'bg-secondary', width: 'w-2/4' },
      good: { label: 'Boa', color: 'bg-accent', width: 'w-3/4' },
      strong: { label: 'Forte', color: 'bg-success', width: 'w-full' },
    }
    return configs[strength]
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/20 backdrop-blur-3xl" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="w-full max-w-md space-y-6 relative z-10">
          <div className="flex justify-center">
            <BrandMark variant="login" />
          </div>
          
          <Card className="shadow-lg border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">Link Expirado</CardTitle>
              <CardDescription className="text-base">
                Este link de recuperação não é mais válido. Por favor, solicite um novo link de recuperação de senha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                className="w-full"
                onClick={handleBackToLogin}
              >
                Voltar ao Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (viewState === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/20 backdrop-blur-3xl" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="w-full max-w-md space-y-6 relative z-10">
          <div className="flex justify-center">
            <BrandMark variant="login" />
          </div>
          
          <Card className="shadow-lg border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-success/10 w-16 h-16 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl font-bold">Senha Alterada!</CardTitle>
              <CardDescription className="text-base">
                Sua senha foi redefinida com sucesso. Você já pode acessar sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                className="w-full"
                onClick={handleGoToDashboard}
              >
                Ir para o Dashboard
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBackToLogin}
              >
                Voltar ao Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-muted/20 backdrop-blur-3xl" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex justify-center">
          <BrandMark variant="login" />
        </div>
        
        <Card className="shadow-lg border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Criar nova senha</CardTitle>
            <CardDescription>
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pr-10"
                    placeholder="Digite sua senha"
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

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Força da senha:</span>
                      <span className={cn(
                        "font-medium",
                        passwordStrength === 'weak' && "text-destructive",
                        passwordStrength === 'fair' && "text-secondary-foreground",
                        passwordStrength === 'good' && "text-accent-foreground",
                        passwordStrength === 'strong' && "text-success-foreground"
                      )}>
                        {getStrengthConfig(passwordStrength).label}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-300",
                          getStrengthConfig(passwordStrength).color,
                          getStrengthConfig(passwordStrength).width
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Requirements List */}
                <div className="space-y-2 pt-2">
                  {PASSWORD_REQUIREMENTS.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {requirementsMet[index] ? (
                        <CheckCircle2 className="h-4 w-4 text-success-foreground flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={cn(
                        requirementsMet[index] ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pr-10"
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
                {confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-destructive">As senhas não coincidem</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Nova Senha'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          Lembrou a senha?{' '}
          <button
            type="button"
            onClick={handleBackToLogin}
            className="text-primary hover:underline font-medium"
          >
            Fazer login
          </button>
        </div>
      </div>
    </div>
  )
}
