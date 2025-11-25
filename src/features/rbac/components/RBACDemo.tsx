import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, UserRole } from '@/lib/types'
import { hasPermission } from '@/lib/permissions'
import { 
  ShieldCheck, 
  Eye, 
  EyeSlash, 
  Users, 
  ChartBar, 
  Trash, 
  FileText,
  Link as LinkIcon,
  UserPlus,
  Database // Novo ícone
} from '@phosphor-icons/react'
// IMPORTS NOVOS NECESSÁRIOS
import SyntheticDataPanel from './SyntheticDataPanel'
import UserManagementDialog from './UserManagementDialog' 
import MagicLinksDialog from './MagicLinksDialog'

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
    <div className="p-6 space-y-6 max-w-6xl mx-auto pb-24 md:pb-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-primary" size={32} />
          Painel Administrativo
        </h2>
        <p className="text-muted-foreground">
          Gerenciamento de sistema, usuários e dados de teste.
        </p>
      </div>

      {/* CARD DE DADOS SINTÉTICOS (NOVO) */}
      {currentUser.role === 'admin' && (
        <div className="mt-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">Ambiente de Testes</h3>
          </div>
          <SyntheticDataPanel />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* SEU PERFIL */}
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

        {/* FERRAMENTAS DE ADMINISTRAÇÃO */}
        {currentUser.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Ferramentas de Gestão</CardTitle>
              <CardDescription>Ações rápidas administrativas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <UserManagementDialog />
                <MagicLinksDialog />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* PERMISSÕES (DETALHE TÉCNICO) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Suas Permissões</CardTitle>
          <CardDescription>
            Recursos que você pode acessar baseado na sua função
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900'
                      : 'bg-muted/50 border-border opacity-50'
                  }`}
                >
                  {hasAccess ? (
                    <Eye className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
                  ) : (
                    <EyeSlash className="text-muted-foreground flex-shrink-0" size={20} />
                  )}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon className="flex-shrink-0" size={18} />
                    <span className="text-sm truncate" title={label}>{label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {currentUser.role === 'client' && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <EyeSlash />
              Proteção de Dados
            </CardTitle>
            <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
              Como cliente externo, informações sensíveis são anonimizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-blue-800 dark:text-blue-200">
              <p className="text-sm">
                <strong>Nomes de Players:</strong> Você verá identificadores genéricos
                (Player A, Player B, etc.) em vez de nomes reais para proteger informações
                competitivas.
              </p>
              <p className="text-sm opacity-80">
                Exemplo: "JPMorgan Chase" → "Player A"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
