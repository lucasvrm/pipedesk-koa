import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, UserRole } from '@/lib/types'
import { hasPermission } from '../lib/permissions'
import { 
  ShieldCheck, 
  Eye, 
  EyeSlash, 
  Users, 
  ChartBar, 
  Trash, 
  FileText,
  Link as LinkIcon,
  UserPlus
} from '@phosphor-icons/react'

interface RBACDemoProps {
  currentUser: User
}

export default function RBACDemo({ currentUser }: RBACDemoProps) {
  const permissions = [
    { key: 'VIEW_ALL_DEALS', label: 'Ver todos os negócios', icon: Eye },
    { key: 'CREATE_DEAL', label: 'Criar negócios', icon: UserPlus },
    { key: 'EDIT_DEAL', label: 'Editar negócios', icon: FileText },
    { key: 'DELETE_DEAL', label: 'Excluir negócios', icon: Trash },
    { key: 'EXPORT_DATA', label: 'Exportar dados', icon: FileText },
    { key: 'MANAGE_USERS', label: 'Gerenciar usuários', icon: Users },
    { key: 'VIEW_ANALYTICS', label: 'Ver analytics', icon: ChartBar },
    { key: 'VIEW_REAL_PLAYER_NAMES', label: 'Ver nomes reais de players', icon: Eye },
    { key: 'ASSIGN_TASKS', label: 'Atribuir tarefas', icon: UserPlus },
    { key: 'MANAGE_INTEGRATIONS', label: 'Gerenciar integrações', icon: LinkIcon },
  ] as const

  const roleDescriptions: Record<UserRole, string> = {
    admin: 'Acesso total ao sistema, incluindo gerenciamento de usuários e configurações',
    analyst: 'Pode criar e gerenciar negócios, atribuir tarefas e ver analytics',
    newbusiness: 'Acesso a todos os dados de negócios sem poder modificá-los',
    client: 'Acesso limitado com nomes de players anonimizados para proteção de dados',
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-24 md:pb-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-primary" size={32} />
          Sistema de Controle de Acesso
        </h2>
        <p className="text-muted-foreground">
          Demonstração do sistema RBAC (Role-Based Access Control)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seu Perfil</CardTitle>
          <CardDescription>Informações do usuário atual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nome</p>
              <p className="font-medium">{currentUser.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Função</p>
              <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
                {currentUser.role.toUpperCase()}
              </Badge>
            </div>
            {currentUser.clientEntity && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Empresa</p>
                <p className="font-medium">{currentUser.clientEntity}</p>
              </div>
            )}
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Descrição da função:</p>
            <p className="text-sm">{roleDescriptions[currentUser.role]}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suas Permissões</CardTitle>
          <CardDescription>
            Recursos que você pode acessar baseado na sua função
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {permissions.map(({ key, label, icon: Icon }) => {
              const hasAccess = hasPermission(
                currentUser.role,
                key as any
              )
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    hasAccess
                      ? 'bg-success/5 border-success/20'
                      : 'bg-muted/50 border-border opacity-50'
                  }`}
                >
                  {hasAccess ? (
                    <Eye className="text-success flex-shrink-0" size={20} />
                  ) : (
                    <EyeSlash className="text-muted-foreground flex-shrink-0" size={20} />
                  )}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon className="flex-shrink-0" size={18} />
                    <span className="text-sm truncate">{label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autenticação Magic Link</CardTitle>
          <CardDescription>
            Sistema de convites seguro para clientes externos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <LinkIcon className="mb-2 text-primary" size={24} />
              <h4 className="font-medium mb-1">Geração de Token</h4>
              <p className="text-sm text-muted-foreground">
                Tokens seguros de 64 caracteres com expiração configurável
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <Users className="mb-2 text-primary" size={24} />
              <h4 className="font-medium mb-1">Convite por Email</h4>
              <p className="text-sm text-muted-foreground">
                Template de email automático com link de acesso único
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <ShieldCheck className="mb-2 text-primary" size={24} />
              <h4 className="font-medium mb-1">Gestão de Links</h4>
              <p className="text-sm text-muted-foreground">
                Dashboard completo com status e revogação de links
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentUser.role === 'client' && (
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeSlash className="text-accent" />
              Proteção de Dados
            </CardTitle>
            <CardDescription>
              Como cliente externo, informações sensíveis são anonimizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Nomes de Players:</strong> Você verá identificadores genéricos
                (Player A, Player B, etc.) em vez de nomes reais para proteger informações
                competitivas.
              </p>
              <p className="text-sm text-muted-foreground">
                Exemplo: "JPMorgan Chase" → "Player A"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
