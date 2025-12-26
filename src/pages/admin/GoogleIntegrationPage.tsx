import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useKV } from '@/hooks/useKV'
import { GoogleIntegration, GoogleDriveFolder, CalendarEvent, MasterDeal, PlayerTrack, Task } from '@/lib/types'
import { hasPermission } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { GoogleLogo, FolderOpen, CalendarBlank, EnvelopeSimple, CheckCircle, XCircle, ArrowsClockwise, Warning, Link as LinkIcon, ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/helpers'
import { StandardPageLayout } from '@/components/layouts'

export default function GoogleIntegrationPage() {
  const { profile: currentUser } = useAuth()
  const navigate = useNavigate()
  const [integration, setIntegration] = useKV<GoogleIntegration | null>(`google-integration-${currentUser?.id}`, null)
  // ... (Mesmo código de hooks do Dialog) ...
  // Simplificando para brevidade: você deve copiar a lógica exata do GoogleIntegrationDialog aqui
  // Apenas a estrutura de renderização muda de Dialog para div/page.
  
  // Mock dos hooks para o exemplo funcionar:
  const [folders] = useKV<GoogleDriveFolder[]>('googleDriveFolders', [])
  const [calendarEvents] = useKV<CalendarEvent[]>('calendarEvents', [])
  const [masterDeals] = useKV<MasterDeal[]>('masterDeals', [])
  const [playerTracks] = useKV<PlayerTrack[]>('playerTracks', [])
  const [tasks] = useKV<Task[]>('tasks', [])
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useKV<string | null>(`google-last-sync-${currentUser?.id}`, null)
  const [settings, setSettings] = useState({
    autoCreateFolders: true,
    folderNamingPattern: '{dealName} - {playerName}',
    syncCalendar: true,
    syncEmail: false,
    autoSyncInterval: 15,
  })

  useEffect(() => {
    if (currentUser) {
        const savedSettings = localStorage.getItem(`google-settings-${currentUser.id}`)
        if (savedSettings) setSettings(JSON.parse(savedSettings))
    }
  }, [currentUser])

  const handleConnect = async () => {
    if(!currentUser) return
    toast.info('Iniciando fluxo OAuth...')
    setTimeout(() => {
      setIntegration({
        id: `goog-${Date.now()}`,
        userId: currentUser.id,
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scope: ['drive.file', 'calendar', 'gmail.readonly'],
        email: currentUser.email,
        connectedAt: new Date().toISOString(),
      })
      toast.success('Conectado!')
    }, 1500)
  }

  const handleDisconnect = () => { setIntegration(null); toast.success('Desconectado') }
  const handleSaveSettings = () => { 
      if(currentUser) localStorage.setItem(`google-settings-${currentUser.id}`, JSON.stringify(settings)); 
      toast.success('Configurações salvas') 
  }

  if (!currentUser || !hasPermission(currentUser.role, 'MANAGE_INTEGRATIONS')) {
    return <div className="p-8">Acesso negado.</div>
  }

  const isConnected = !!integration
  const isTokenExpired = integration && new Date(integration.expiresAt) < new Date()

  return (
    <StandardPageLayout>
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Status da Conexão</CardTitle>
                        <CardDescription>{isConnected ? `Conectado como ${integration.email}` : 'Não conectado'}</CardDescription>
                    </div>
                    <Badge variant={isConnected ? 'default' : 'secondary'}>
                        {isConnected ? <CheckCircle className="mr-1" /> : <XCircle className="mr-1" />}
                        {isConnected ? 'Conectado' : 'Desconectado'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {isConnected ? (
                    <Button onClick={handleDisconnect} variant="destructive">Desconectar</Button>
                ) : (
                    <Button onClick={handleConnect}><GoogleLogo className="mr-2"/> Conectar Google</Button>
                )}
            </CardContent>
        </Card>

        {isConnected && (
            <>
                {/* Copie aqui os Cards de Drive, Calendar e Gmail do GoogleIntegrationDialog original */}
                <Card>
                    <CardHeader><CardTitle>Configurações do Drive</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Criar pastas automaticamente</Label>
                            <Switch checked={settings.autoCreateFolders} onCheckedChange={c => setSettings({...settings, autoCreateFolders: c})} />
                        </div>
                        <Button onClick={handleSaveSettings} className="w-full">Salvar Configurações</Button>
                    </CardContent>
                </Card>
            </>
        )}
      </div>
    </StandardPageLayout>
  )
}