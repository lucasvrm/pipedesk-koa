import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { EnvelopeSimple, GoogleLogo, LockKey, UserPlus, Spinner, Buildings, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getAuthSettings, AuthSettings } from '@/services/settingsService'

export default function LoginView() {
  const { signInWithMagicLink, signIn, signInWithGoogle, signUp, loading: authLoading } = useAuth()
  
  const [settings, setSettings] = useState<AuthSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Carregar configurações
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
      toast.success('Link enviado!', { description: 'Verifique seu e-mail para acessar o sistema.' })
    } else {
      toast.error('Erro ao enviar link', { description: 'Verifique se o email é válido.' })
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signIn(email, password)
    } catch (error) {
      toast.error('Erro ao fazer login', { description: 'Verifique suas credenciais.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signUp(email, password, name)
      toast.success('Conta criada!', { description: 'Verifique seu e-mail para confirmar o cadastro.' })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao criar conta';
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  const showMagicLink = settings?.enableMagicLinks ?? true
  const defaultTab = showMagicLink ? "magic" : "password"

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      
      {/* Coluna da Esquerda: Branding (Visível apenas em telas grandes) */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406140926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <Buildings className="w-8 h-8 text-white" weight="duotone" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Gestão de Ativos & Projetos</h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Centralize suas operações, acompanhe negociações com players e gerencie o fluxo de caixa dos seus projetos imobiliários em um só lugar.
          </p>
          
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-400 w-5 h-5" weight="fill" />
              <span className="text-slate-200">Pipeline de Vendas e Captação</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-400 w-5 h-5" weight="fill" />
              <span className="text-slate-200">Gestão de Tarefas e Prazos</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-400 w-5 h-5" weight="fill" />
              <span className="text-slate-200">Data Room Seguro Integrado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coluna da Direita: Formulário */}
      <div className="flex items-center justify-center p-6 bg-slate-50/50">
        <Card className="w-full max-w-[420px] shadow-xl border-none">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-2 bg-primary/5 w-14 h-14 rounded-full flex items-center justify-center border border-primary/10">
              <LockKey className="w-7 h-7 text-primary" weight="fill" />
            </div>
            {/* Título Atualizado */}
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">PipeDesk</CardTitle>
            {/* Subtítulo Atualizado */}
            <CardDescription className="text-base mt-2">
              Sistema CRM & Projects da Koa Capital
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8">
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 h-11 bg-slate-100/80">
                {showMagicLink ? (
                  <TabsTrigger value="magic" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Magic Link</TabsTrigger>
                ) : (
                  <TabsTrigger value="magic" disabled className="opacity-50">Magic Link</TabsTrigger>
                )}
                <TabsTrigger value="password" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Senha</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Cadastro</TabsTrigger>
              </TabsList>

              {/* MAGIC LINK */}
              {showMagicLink && (
                <TabsContent value="magic" className="space-y-5 animate-in fade-in-20 slide-in-from-bottom-2">
                  <div className="bg-blue-50/80 p-4 rounded-lg text-sm text-blue-800 border border-blue-100 flex gap-3 items-start">
                    <EnvelopeSimple className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <strong>Acesso sem senha.</strong><br/>
                      Enviaremos um link seguro de acesso direto para seu e-mail corporativo.
                    </div>
                  </div>
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-magic">E-mail Corporativo</Label>
                      <Input
                        id="email-magic"
                        type="email"
                        className="h-11 bg-white"
                        placeholder="nome@koacapital.com.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 text-base" disabled={isLoading || authLoading}>
                      {isLoading ? 'Enviando Link...' : 'Enviar Link de Acesso'}
                    </Button>
                  </form>
                </TabsContent>
              )}

              {/* SENHA */}
              <TabsContent value="password" className="space-y-5 animate-in fade-in-20 slide-in-from-bottom-2">
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-pass">E-mail</Label>
                    <Input
                      id="email-pass"
                      type="email"
                      className="h-11 bg-white"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground hover:text-primary" type="button" onClick={() => toast.info('Contate o administrador para resetar sua senha.')}>
                        Esqueceu?
                      </Button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      className="h-11 bg-white"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base" disabled={isLoading || authLoading}>
                    {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
                  </Button>
                </form>
              </TabsContent>

              {/* CADASTRO */}
              <TabsContent value="register" className="space-y-5 animate-in fade-in-20 slide-in-from-bottom-2">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-reg">Nome Completo</Label>
                    <Input
                      id="name-reg"
                      type="text"
                      className="h-11 bg-white"
                      placeholder="Ex: Ana Souza"
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
                      className="h-11 bg-white"
                      placeholder={settings?.restrictDomain ? `usuario@${settings.allowedDomain}` : "seu@empresa.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    {settings?.restrictDomain && (
                      <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5 bg-amber-50 p-2 rounded border border-amber-100">
                        <LockKey size={12} weight="fill" />
                        Restrito para domínios @{settings.allowedDomain}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass-reg">Senha</Label>
                    <Input
                      id="pass-reg"
                      type="password"
                      className="h-11 bg-white"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base" disabled={isLoading || authLoading}>
                    {isLoading ? 'Processando...' : 'Criar Minha Conta'}
                    {!isLoading && <UserPlus className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-muted-foreground font-medium border rounded-full">Ou entre com</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-11 bg-white hover:bg-slate-50 border-slate-200 text-slate-700" 
                onClick={signInWithGoogle}
                disabled={isLoading || authLoading}
              >
                <GoogleLogo className="mr-2 h-5 w-5 text-red-500" weight="bold" />
                Google Workspace
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="justify-center py-6">
            <p className="text-xs text-muted-foreground text-center max-w-[280px]">
              &copy; {new Date().getFullYear()} Koa Capital. Todos os direitos reservados.<br/>
              <span className="opacity-70">Acesso restrito a colaboradores e parceiros.</span>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}