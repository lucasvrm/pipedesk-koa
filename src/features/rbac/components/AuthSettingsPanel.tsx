import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ShieldCheck, LockKey, Envelope, MagicWand } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function AuthSettingsPanel() {
  // Simulando estado inicial (em produção, viria do banco de dados)
  const [settings, setSettings] = useState({
    enableMagicLinks: true,
    restrictDomain: true,
    allowedDomain: 'koacapital.com.br',
    requireMFA: false
  })

  const [loading, setLoading] = useState(false)

  const handleSave = () => {
    setLoading(true)
    // Simulação de delay de rede
    setTimeout(() => {
        toast.success('Políticas de autenticação atualizadas com sucesso!')
        setLoading(false)
    }, 800)
  }

  return (
    <div className="grid gap-6 max-w-4xl">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-primary h-6 w-6" />
                    <CardTitle>Políticas de Acesso</CardTitle>
                </div>
                <CardDescription>
                    Configure como os usuários podem se autenticar e acessar a plataforma.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Magic Links */}
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <MagicWand className="text-purple-500" />
                                <Label className="text-base">Magic Links</Label>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Permitir login via link enviado por email (sem senha).
                            </p>
                        </div>
                        <Switch 
                            checked={settings.enableMagicLinks}
                            onCheckedChange={c => setSettings(s => ({...s, enableMagicLinks: c}))}
                        />
                    </div>
                </div>

                <Separator />

                {/* Restrição de Domínio */}
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Envelope className="text-blue-500" />
                                <Label className="text-base">Restrição de Domínio Corporativo</Label>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Bloquear cadastros de emails que não pertençam à organização.
                            </p>
                        </div>
                        <Switch 
                            checked={settings.restrictDomain}
                            onCheckedChange={c => setSettings(s => ({...s, restrictDomain: c}))}
                        />
                    </div>
                    
                    {settings.restrictDomain && (
                        <div className="ml-6 pl-4 border-l-2 border-muted animate-in slide-in-from-top-2">
                            <Label className="text-xs text-muted-foreground">Domínio Permitido</Label>
                            <div className="flex items-center gap-2 mt-1.5 max-w-sm">
                                <span className="text-sm font-semibold text-muted-foreground">@</span>
                                <Input 
                                    value={settings.allowedDomain}
                                    onChange={e => setSettings(s => ({...s, allowedDomain: e.target.value}))}
                                    className="h-8"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <Separator />

                {/* MFA (Futuro) */}
                <div className="flex flex-col space-y-4 opacity-70">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <LockKey className="text-amber-500" />
                                <Label className="text-base">Autenticação de Dois Fatores (MFA)</Label>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Exigir segundo fator para todos os administradores. (Em breve)
                            </p>
                        </div>
                        <Switch disabled checked={settings.requireMFA} />
                    </div>
                </div>

            </CardContent>
            <CardFooter className="bg-muted/20 flex justify-end py-3">
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </CardFooter>
        </Card>
    </div>
  )
}