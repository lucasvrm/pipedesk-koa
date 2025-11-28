import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MagicWand, EnvelopeSimple, PaperPlaneRight } from '@phosphor-icons/react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function MagicLinkAuth() {
  const { signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const success = await signInWithMagicLink(email)
      if (success) {
        toast.success('Link enviado!', {
          description: `Verifique a caixa de entrada de ${email}`
        })
        setEmail('')
      } else {
        toast.error('Erro ao enviar link')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    // CLASSE h-full ADICIONADA AQUI PARA ALINHAMENTO
    <Card className="h-full flex flex-col border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <MagicWand size={24} weight="fill" />
          </div>
        </div>
        <CardTitle className="text-xl">Acesso Rápido</CardTitle>
        <CardDescription>
          Envie um link de acesso direto (Magic Link) para qualquer usuário cadastrado.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-end">
        <form onSubmit={handleSendLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="magic-email">Email do Usuário</Label>
            <div className="relative">
              <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                id="magic-email" 
                type="email" 
                placeholder="usuario@empresa.com" 
                className="pl-10 bg-background"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : (
              <>
                Enviar Link <PaperPlaneRight className="ml-2" />
              </>
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-xs text-center text-muted-foreground">
          <p>Links expiram em 24 horas.</p>
          <p>O usuário deve estar previamente cadastrado.</p>
        </div>
      </CardContent>
    </Card>
  )
}