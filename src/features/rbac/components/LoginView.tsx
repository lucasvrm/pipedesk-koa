import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { EnvelopeSimple, GoogleLogo, LockKey, UserPlus } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function LoginView() {
  const { signInWithMagicLink, signIn, signInWithGoogle, signUp, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
      toast.error('Erro ao enviar link')
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signIn(email, password)
      // O redirecionamento acontece automaticamente via AuthContext -> App
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
      toast.error('Erro ao criar conta', {
        description: 'Tente novamente mais tarde.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
            <LockKey className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">PipeDesk Koa</CardTitle>
          <CardDescription>Gerenciamento de DealFlow Inteligente</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="magic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="magic">Magic Link</TabsTrigger>
              <TabsTrigger value="password">Senha</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>

            {/* MAGIC LINK TAB */}
            <TabsContent value="magic">
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-magic">E-mail Corporativo</Label>
                  <Input
                    id="email-magic"
                    type="email"
                    placeholder="seu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || loading}>
                  {isLoading ? 'Enviando...' : 'Enviar Magic Link'}
                  <EnvelopeSimple className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            {/* PASSWORD TAB */}
            <TabsContent value="password">
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
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || loading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register">
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
                  <Label htmlFor="email-reg">E-mail</Label>
                  <Input
                    id="email-reg"
                    type="email"
                    placeholder="seu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
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
                <Button type="submit" className="w-full" disabled={isLoading || loading}>
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                  <UserPlus className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={signInWithGoogle}
              disabled={isLoading || loading}
            >
              <GoogleLogo className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Protegido por criptografia de ponta a ponta
        </CardFooter>
      </Card>
    </div>
  )
}