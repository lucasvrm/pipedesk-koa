import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { GoogleIntegration, GoogleDriveFolder, User } from '@/lib/types'
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
import {
  GoogleLogo,
  FolderOpen,
  CalendarBlank,
  EnvelopeSimple,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

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

  const [settings, setSettings] = useState({
    autoCreateFolders: true,
    syncCalendar: true,
    syncEmail: false,
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

    setTimeout(() => {
      const mockIntegration: GoogleIntegration = {
        id: `goog-${Date.now()}`,
        userId: currentUser.id,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
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
    toast.success('Desconectado do Google Workspace')
  }

  const handleCreateFolder = async (dealName: string) => {
    if (!integration) {
      toast.error('Google Drive não conectado')
      return
    }

    toast.info('Criando pasta no Google Drive...')

    setTimeout(() => {
      const mockFolder: GoogleDriveFolder = {
        id: `folder-${Date.now()}`,
        entityId: `deal-${Date.now()}`,
        entityType: 'deal',
        folderId: 'mock-folder-id',
        folderUrl: `https://drive.google.com/drive/folders/mock-folder-id`,
        createdAt: new Date().toISOString(),
      }

      setFolders((current) => [...(current || []), mockFolder])
      toast.success(`Pasta criada: ${dealName}`)
    }, 1500)
  }

  const isConnected = !!integration
  const totalFolders = (folders || []).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GoogleLogo size={24} />
            Google Workspace
          </DialogTitle>
          <DialogDescription>
            Integração com Drive, Calendar e Gmail
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Status da Conexão</CardTitle>
                  <CardDescription>
                    {isConnected
                      ? `Conectado como ${integration.email}`
                      : 'Não conectado'}
                  </CardDescription>
                </div>
                {isConnected ? (
                  <Badge variant="default" className="bg-success text-success-foreground">
                    <CheckCircle className="mr-1" />
                    Conectado
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
                      {new Date(integration.connectedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Permissões:</span>
                    <span className="font-medium">
                      {integration.scope.join(', ')}
                    </span>
                  </div>
                  {canManage && (
                    <Button
                      onClick={handleDisconnect}
                      variant="destructive"
                      className="w-full mt-4"
                    >
                      Desconectar
                    </Button>
                  )}
                </div>
              ) : (
                <Button onClick={handleConnect} className="w-full">
                  <GoogleLogo className="mr-2" />
                  Conectar com Google
                </Button>
              )}
            </CardContent>
          </Card>

          {isConnected && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FolderOpen />
                    Google Drive
                  </CardTitle>
                  <CardDescription>
                    Criação automática de pastas para negócios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-folders">Criar pastas automaticamente</Label>
                    <Switch
                      id="auto-folders"
                      checked={settings.autoCreateFolders}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, autoCreateFolders: checked })
                      }
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total de pastas criadas: {totalFolders}
                  </div>
                  <Button
                    onClick={() => handleCreateFolder('Exemplo de Negócio')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <FolderOpen className="mr-2" />
                    Testar Criação de Pasta
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarBlank />
                    Google Calendar
                  </CardTitle>
                  <CardDescription>
                    Sincronização bidirecional de eventos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-calendar">Sincronizar calendário</Label>
                    <Switch
                      id="sync-calendar"
                      checked={settings.syncCalendar}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, syncCalendar: checked })
                      }
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Deadlines e milestones serão criados automaticamente no seu
                    calendário
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <EnvelopeSimple />
                    Gmail
                  </CardTitle>
                  <CardDescription>
                    Sincronização de threads de email (beta)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-email">Sincronizar emails</Label>
                    <Switch
                      id="sync-email"
                      checked={settings.syncEmail}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, syncEmail: checked })
                      }
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Respostas de email podem atualizar status de negócios
                  </p>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
                <Button onClick={handleSaveSettings}>Salvar Configurações</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
