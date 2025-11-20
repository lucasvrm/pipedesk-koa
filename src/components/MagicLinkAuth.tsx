import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { User } from '@/lib/types'
import { MagicLink, isMagicLinkValid } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Clock, ArrowRight } from '@phosphor-icons/react'

interface MagicLinkAuthProps {
  onAuthSuccess: (user: User) => void
}

export default function MagicLinkAuth({ onAuthSuccess }: MagicLinkAuthProps) {
  const [users] = useKV<User[]>('users', [])
  const [magicLinks, setMagicLinks] = useKV<MagicLink[]>('magicLinks', [])
  const [currentUser, setCurrentUser] = useKV<User | null>('currentUser', null)
  
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid' | 'expired' | 'used'>('checking')
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setStatus('invalid')
      return
    }

    const link = (magicLinks || []).find(l => l.token === token)
    
    if (!link) {
      setStatus('invalid')
      return
    }

    if (!isMagicLinkValid(link)) {
      if (link.usedAt) {
        setStatus('used')
      } else if (link.revokedAt) {
        setStatus('invalid')
      } else {
        setStatus('expired')
      }
      return
    }

    const user = (users || []).find(u => u.id === link.userId)
    
    if (!user) {
      setStatus('invalid')
      return
    }

    setMagicLinks((current) =>
      (current || []).map((l) =>
        l.id === link.id
          ? { ...l, usedAt: new Date().toISOString() }
          : l
      )
    )

    setAuthenticatedUser(user)
    setStatus('valid')
  }, [magicLinks, users, setMagicLinks])

  const handleContinue = () => {
    if (authenticatedUser) {
      setCurrentUser(authenticatedUser)
      window.history.replaceState({}, '', '/')
      onAuthSuccess(authenticatedUser)
    }
  }

  const handleRequestNewLink = () => {
    window.location.href = '/request-access'
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="animate-spin" />
              Verificando acesso...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (status === 'valid' && authenticatedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle weight="fill" />
              Acesso Autorizado
            </CardTitle>
            <CardDescription>
              Bem-vindo ao DealFlow Manager
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-1">Você está entrando como:</p>
              <p className="font-semibold">{authenticatedUser.name}</p>
              <p className="text-sm text-muted-foreground">{authenticatedUser.email}</p>
            </div>
            <Button onClick={handleContinue} className="w-full">
              Continuar para Dashboard
              <ArrowRight className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle weight="fill" />
            Link Inválido
          </CardTitle>
          <CardDescription>
            {status === 'expired' && 'Este link de acesso expirou'}
            {status === 'used' && 'Este link de acesso já foi utilizado'}
            {status === 'invalid' && 'Este link de acesso não é válido'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {status === 'expired' && 'Por favor, solicite um novo link de acesso ao administrador do sistema.'}
            {status === 'used' && 'Links de acesso só podem ser usados uma vez. Solicite um novo link ao administrador.'}
            {status === 'invalid' && 'Verifique se você copiou o link completo ou solicite um novo.'}
          </p>
          <Button onClick={handleRequestNewLink} variant="outline" className="w-full">
            Solicitar Novo Acesso
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
