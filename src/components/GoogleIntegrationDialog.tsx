import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { GoogleIntegration, GoogleDriveFolder, CalendarEvent, User, MasterDeal, PlayerTrack, Task } from '@/lib/types'
import { hasPermission } from '@/lib/permissions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  GoogleLogo,
  FolderOpen,
  CalendarBlank,
  EnvelopeSimple,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  Warning,
  Link as LinkIcon,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/helpers'

interface GoogleIntegrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
}

export default function GoogleIntegrationDialog({
  open,
  onOpenChange,
  currentUser,
}: GoogleIntegrationDialogProps) {
  const [integration, setIntegration] = useKV<GoogleIntegration | null>(
    `google-integration-${currentUser.id}`,
    null
  )
  const [folders, setFolders] = useKV<GoogleDriveFolder[]>('googleDriveFolders', [])
  const [calendarEvents, setCalendarEvents] = useKV<CalendarEvent[]>('calendarEvents', [])
  const [masterDeals] = useKV<MasterDeal[]>('masterDeals', [])
  const [playerTracks] = useKV<PlayerTrack[]>('playerTracks', [])
  const [tasks] = useKV<Task[]>('tasks', [])
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useKV<string | null>(`google-last-sync-${currentUser.id}`, null)

  const [settings, setSettings] = useState({
    autoCreateFolders: true,
    folderNamingPattern: '{dealName} - {playerName}',
    syncCalendar: true,
    syncEmail: false,
    autoSyncInterval: 15,
  })

  const canManage = hasPermission(currentUser.role, 'MANAGE_INTEGRATIONS')

  useEffect(() => {
    const savedSettings = localStorage.getItem(`google-settings-${currentUser.id}`)
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [currentUser.id])

  const handleSaveSettings = () => {
    localStorage.setItem(`google-settings-${currentUser.id}`, JSON.stringify(settings))
    toast.success('Configurações salvas')
  }

  const handleConnect = async () => {
    toast.info('Iniciando fluxo OAuth do Google...')

    // OAuth configuration (currently using mock implementation)
    // const clientId = 'YOUR_GOOGLE_CLIENT_ID'
    // const redirectUri = window.location.origin + '/oauth/google/callback'
    // const scope = [
    //   'https://www.googleapis.com/auth/drive.file',
    //   'https://www.googleapis.com/auth/calendar',
    //   'https://www.googleapis.com/auth/gmail.readonly',
    // ].join(' ')

    setTimeout(() => {
      const mockIntegration: GoogleIntegration = {
        id: `goog-${Date.now()}`,
        userId: currentUser.id,
        accessToken: 'mock-access-token-' + Math.random().toString(36).substr(2, 9),
        refreshToken: 'mock-refresh-token-' + Math.random().toString(36).substr(2, 9),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scope: ['drive.file', 'calendar', 'gmail.readonly'],
        email: currentUser.email,
        connectedAt: new Date().toISOString(),
      }

      setIntegration(mockIntegration)
      toast.success('Conectado ao Google Workspace')
    }, 2000)
  }

  const handleDisconnect = () => {
    setIntegration(null)
    setLastSync(null)
    toast.success('Desconectado do Google Workspace')
  }

  const createDriveFolder = async (dealId: string, dealName: string, playerName?: string) => {
    if (!integration) {
      toast.error('Google Drive não conectado')
      return
    }

    const folderName = settings.folderNamingPattern
      .replace('{dealName}', dealName)
      .replace('{playerName}', playerName || '')
      .trim()

    toast.info(`Criando pasta: ${folderName}`)

    setTimeout(() => {
      const mockFolder: GoogleDriveFolder = {
        id: `folder-${Date.now()}`,
        entityId: dealId,
        entityType: playerName ? 'track' : 'deal',
        folderId: 'mock-folder-id-' + Math.random().toString(36).substr(2, 9),
        folderUrl: `https://drive.google.com/drive/folders/mock-folder-id`,
        createdAt: new Date().toISOString(),
      }

      setFolders((current) => [...(current || []), mockFolder])
      toast.success(`Pasta criada: ${folderName}`)
    }, 1500)
  }

  const syncCalendar = async () => {
    if (!integration || !settings.syncCalendar) return

    setSyncing(true)
    toast.info('Sincronizando calendário...')

    setTimeout(() => {
      const newEvents: CalendarEvent[] = []

      ;(masterDeals || []).forEach(deal => {
        if (deal.deadline && deal.status === 'active') {
          const existingEvent = (calendarEvents || []).find(
            e => e.entityId === deal.id && e.entityType === 'deal'
          )

          if (!existingEvent) {
            newEvents.push({
              id: `cal-${Date.now()}-${Math.random()}`,
              googleEventId: `mock-event-${Math.random().toString(36).substr(2, 9)}`,
              entityId: deal.id,
              entityType: 'deal',
              title: `Prazo: ${deal.clientName}`,
              description: `Deadline para o negócio ${deal.clientName}`,
              startTime: deal.deadline,
              endTime: deal.deadline,
              attendees: [],
              synced: true,
              createdAt: new Date().toISOString(),
            })
          }
        }
      })

      ;(tasks || []).forEach(task => {
        if (task.dueDate && !task.completed && task.isMilestone) {
          const existingEvent = (calendarEvents || []).find(
            e => e.entityId === task.id && e.entityType === 'task'
          )

          if (!existingEvent) {
            newEvents.push({
              id: `cal-${Date.now()}-${Math.random()}`,
              googleEventId: `mock-event-${Math.random().toString(36).substr(2, 9)}`,
              entityId: task.id,
              entityType: 'task',
              title: `Marco: ${task.title}`,
              description: task.description,
              startTime: task.dueDate,
              endTime: task.dueDate,
              attendees: task.assignees,
              synced: true,
              createdAt: new Date().toISOString(),
            })
          }
        }
      })

      if (newEvents.length > 0) {
        setCalendarEvents((current) => [...(current || []), ...newEvents])
      }

      setLastSync(new Date().toISOString())
      setSyncing(false)
      toast.success(`${newEvents.length} eventos sincronizados`)
    }, 2000)
  }

  const syncAllDealFolders = async () => {
    if (!integration || !settings.autoCreateFolders) return

    toast.info('Criando pastas para todos os negócios ativos...')

    const activeDeals = (masterDeals || []).filter(d => d.status === 'active')
    let created = 0

    for (const deal of activeDeals) {
      const existingFolder = (folders || []).find(
        f => f.entityId === deal.id && f.entityType === 'deal'
      )

      if (!existingFolder) {
        await createDriveFolder(deal.id, deal.clientName)
        created++
      }

      const dealTracks = (playerTracks || []).filter(
        t => t.masterDealId === deal.id && t.status === 'active'
      )

      for (const track of dealTracks) {
        const existingTrackFolder = (folders || []).find(
          f => f.entityId === track.id && f.entityType === 'track'
        )

        if (!existingTrackFolder) {
          await createDriveFolder(track.id, deal.clientName, track.playerName)
          created++
        }
      }
    }

    toast.success(`${created} pastas criadas`)
  }

  const isConnected = !!integration
  const totalFolders = (folders || []).length
  const totalSyncedEvents = (calendarEvents || []).filter(e => e.synced).length
  const isTokenExpired = integration && new Date(integration.expiresAt) < new Date()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GoogleLogo size={24} />
            Google Workspace Integration
          </DialogTitle>
          <DialogDescription>
            Integração completa com Drive, Calendar e Gmail
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Status da Conexão</CardTitle>
                    <CardDescription>
                      {isConnected
                        ? `Conectado como ${integration.email}`
                        : 'Configure o OAuth para conectar'}
                    </CardDescription>
                  </div>
                  {isConnected ? (
                    <Badge 
                      variant={isTokenExpired ? 'destructive' : 'default'} 
                      className={!isTokenExpired ? 'bg-success text-success-foreground' : ''}
                    >
                      {isTokenExpired ? (
                        <>
                          <Warning className="mr-1" />
                          Expirado
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-1" />
                          Conectado
                        </>
                      )}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="mr-1" />
                      Desconectado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{integration.email}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Conectado em:</span>
                      <span className="font-medium">
                        {formatDate(integration.connectedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Token expira em:</span>
                      <span className={`font-medium ${isTokenExpired ? 'text-destructive' : ''}`}>
                        {formatDate(integration.expiresAt)}
                      </span>
                    </div>
                    {lastSync && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Última sincronização:</span>
                        <span className="font-medium">
                          {formatDate(lastSync)}
                        </span>
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="flex gap-2">
                      {canManage && (
                        <Button
                          onClick={handleDisconnect}
                          variant="destructive"
                          className="flex-1"
                          size="sm"
                        >
                          Desconectar
                        </Button>
                      )}
                      {isTokenExpired && (
                        <Button
                          onClick={handleConnect}
                          className="flex-1"
                          size="sm"
                        >
                          Reconectar
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Conecte sua conta Google para habilitar a sincronização automática
                      de pastas, eventos de calendário e threads de email.
                    </p>
                    <Button onClick={handleConnect} className="w-full">
                      <GoogleLogo className="mr-2" />
                      Conectar com Google
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {isConnected && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FolderOpen />
                          Google Drive
                        </CardTitle>
                        <CardDescription>
                          Criação automática de pastas organizadas por hierarquia
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{totalFolders} pastas</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-folders">Criar pastas automaticamente</Label>
                        <p className="text-xs text-muted-foreground">
                          Pastas serão criadas para novos negócios e players
                        </p>
                      </div>
                      <Switch
                        id="auto-folders"
                        checked={settings.autoCreateFolders}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, autoCreateFolders: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="folder-pattern">Padrão de Nomenclatura</Label>
                      <Input
                        id="folder-pattern"
                        value={settings.folderNamingPattern}
                        onChange={(e) =>
                          setSettings({ ...settings, folderNamingPattern: e.target.value })
                        }
                        placeholder="{dealName} - {playerName}"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {'{dealName}'} e {'{playerName}'} como variáveis
                      </p>
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button
                        onClick={syncAllDealFolders}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={!settings.autoCreateFolders}
                      >
                        <FolderOpen className="mr-2" />
                        Criar Pastas para Todos
                      </Button>
                    </div>

                    {totalFolders > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium mb-2">Pastas Recentes</h5>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {(folders || []).slice(-5).reverse().map((folder) => (
                            <div
                              key={folder.id}
                              className="flex items-center justify-between text-xs p-2 rounded hover:bg-muted/50"
                            >
                              <span className="flex items-center gap-2">
                                <FolderOpen className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate">
                                  {folder.entityType === 'deal' ? 'Deal' : 'Player'} Folder
                                </span>
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => window.open(folder.folderUrl, '_blank')}
                              >
                                <LinkIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CalendarBlank />
                          Google Calendar
                        </CardTitle>
                        <CardDescription>
                          Sincronização bidirecional de prazos e marcos
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{totalSyncedEvents} eventos</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sync-calendar">Sincronizar calendário</Label>
                        <p className="text-xs text-muted-foreground">
                          Deadlines e milestones vão para o Google Calendar
                        </p>
                      </div>
                      <Switch
                        id="sync-calendar"
                        checked={settings.syncCalendar}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, syncCalendar: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sync-interval">Intervalo de Sincronização (minutos)</Label>
                      <Input
                        id="sync-interval"
                        type="number"
                        min="5"
                        max="60"
                        value={settings.autoSyncInterval}
                        onChange={(e) =>
                          setSettings({ ...settings, autoSyncInterval: parseInt(e.target.value) })
                        }
                      />
                    </div>

                    <Separator />

                    <Button
                      onClick={syncCalendar}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!settings.syncCalendar || syncing}
                    >
                      <ArrowsClockwise className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <EnvelopeSimple />
                      Gmail (Beta)
                    </CardTitle>
                    <CardDescription>
                      Sincronização de threads de email
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sync-email">Sincronizar emails</Label>
                        <p className="text-xs text-muted-foreground">
                          Respostas de email podem atualizar status de negócios
                        </p>
                      </div>
                      <Switch
                        id="sync-email"
                        checked={settings.syncEmail}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, syncEmail: checked })
                        }
                      />
                    </div>
                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                      <p className="text-xs text-accent-foreground flex items-center gap-2">
                        <Warning className="h-4 w-4" />
                        Recurso em fase beta - use com cautela
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2 pb-4">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Fechar
                  </Button>
                  <Button onClick={handleSaveSettings}>Salvar Configurações</Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
