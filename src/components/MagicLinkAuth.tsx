import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Clock, ArrowRight, EnvelopeSimple } from '@phosphor-icons/react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function MagicLinkAuth() {
  const { signInWithMagicLink, user } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    // Check if we're coming back from a magic link
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      setVerifying(true)
      // Supabase will automatically handle the token verification
      // The AuthProvider will detect the session change
    }
  }, [])

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Por favor, insira seu email')
      return
    }

    setStatus('sending')
    const success = await signInWithMagicLink(email)
    
    if (success) {
      setStatus('sent')
      toast.success('Magic link enviado! Verifique seu email.')
    } else {
      setStatus('error')
      toast.error('Erro ao enviar magic link. Tente novamente.')
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="animate-spin" />
              Verificando acesso...
            </CardTitle>
            <CardDescription>
              Aguarde enquanto confirmamos sua autenticação
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (status === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle weight="fill" />
              Magic Link Enviado
            </CardTitle>
            <CardDescription>
              Verifique seu email para acessar o DealFlow Manager
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">
                Enviamos um link de acesso para:
              </p>
              <p className="font-semibold">{email}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Clique no link do email para fazer login. O link expira em 1 hora.
            </p>
            <Button 
              onClick={() => setStatus('idle')} 
              variant="outline" 
              className="w-full"
            >
              Enviar para outro email
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
          <CardTitle>Bem-vindo ao DealFlow Manager</CardTitle>
          <CardDescription>
            Insira seu email para receber um link de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'sending'}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? (
                <>
                  <Clock className="mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <EnvelopeSimple className="mr-2" />
                  Enviar Magic Link
                </>
              )}
            </Button>
          </form>
          {status === 'error' && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              Erro ao enviar magic link. Tente novamente.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
