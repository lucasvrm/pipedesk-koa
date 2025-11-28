import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { EnvelopeSimple, GoogleLogo, LockKey, UserPlus, Spinner } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getAuthSettings, AuthSettings } from '@/services/settingsService' // Importando o serviço criado acima

export default function LoginView() {
  const { signInWithMagicLink, signIn, signInWithGoogle, signUp, loading: authLoading } = useAuth()
  
  const [settings, setSettings] = useState<AuthSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 1. Carregar configurações globais antes de renderizar
  useEffect(() => {
    async function load() {
      try {
        const data = await getAuthSettings()
        setSettings(data)
      } catch (err) {
        console.error('Erro ao carregar configs:', err)
      } finally {
        setLoadingSettings(false)
      }
    }
    load()
  }, [])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const success = await signInWithMagicLink(email)
    setIsLoading(false)
    if (success) {
      toast.success('Link enviado!', {
        description: 'Verifique seu e-mail para acessar o sistema.'
      })
    } else {
      toast.error('Erro ao enviar link', {
        description: 'Verifique se o email é válido ou se esta opção está habilitada.'
      })
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signIn(email, password)
    } catch (error) {
      toast.error('Erro ao fazer login', {
        description: 'Verifique suas credenciais.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signUp(email, password, name)
      toast.success('Conta criada!', {
        description: 'Verifique seu e-mail para confirmar o cadastro.'
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao criar conta';
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  // Define qual aba abrir por padrão
  const showMagicLink = settings?.enableMagicLinks ?? true
  const defaultTab = showMagicLink ? "magic" : "password"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
            <LockKey className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">PipeDesk Koa</CardTitle>
          <CardDescription>Acesso ao Sistema de DealFlow</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              {showMagicLink ? (
                <TabsTrigger value="magic">Magic Link</TabsTrigger>
              ) : (
                <TabsTrigger value="magic" disabled className="opacity-50 cursor-not-allowed" title="Desabilitado pelo Admin">
                  Magic Link
                </TabsTrigger>
              )}
              <TabsTrigger value="password">Senha</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>

            {/* MAGIC LINK TAB */}
            {showMagicLink && (
              <TabsContent value="magic" className="space-y-4 animate-in fade-in-50">
                <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-700 mb-2 border border-blue-100">
                  Enviaremos um link de acesso direto para seu e-mail. Sem senha.
                </div>
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-magic">E-mail Corporativo</Label>
                    <div className="relative">
                      <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email-magic"
                        type="email"
                        className="pl-10"
                        placeholder="seu@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
                    {isLoading ? 'Enviando...' : 'Enviar Magic Link'}
                  </Button>
                </form>
              </TabsContent>
            )}

            {/* PASSWORD TAB */}
            <TabsContent value="password" className="space-y-4 animate-in fade-in-50">
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-pass">E-mail</Label>
                  <Input
                    id="email-pass"
                    type="email"
                    placeholder="seu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Button variant="link" className="p-0 h-auto text-xs" type="button" onClick={() => toast.info('Entre em contato com o suporte para resetar.')}>
                      Esqueceu?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register" className="space-y-4 animate-in fade-in-50">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-reg">Nome Completo</Label>
                  <Input
                    id="name-reg"
                    type="text"
                    placeholder="João Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-reg">E-mail Corporativo</Label>
                  <Input
                    id="email-reg"
                    type="email"
                    // Placeholder dinâmico para indicar a restrição
                    placeholder={settings?.restrictDomain ? `usuario@${settings.allowedDomain}` : "seu@empresa.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {/* Feedback Visual da Restrição */}
                  {settings?.restrictDomain && (
                    <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                      <LockKey size={10} />
                      Apenas e-mails @{settings.allowedDomain} são permitidos.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass-reg">Senha</Label>
                  <Input
                    id="pass-reg"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                  <UserPlus className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-4 bg-white" 
              onClick={signInWithGoogle}
              disabled={isLoading || authLoading}
            >
              <GoogleLogo className="mr-2 h-4 w-4 text-red-500" />
              Google Workspace
            </Button>
          </div>
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