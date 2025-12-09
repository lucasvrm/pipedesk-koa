import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemMetadata } from '@/hooks/useSystemMetadata';
import { Users, TrendUp, UserCircle } from '@phosphor-icons/react';

export function LeadSettingsSection() {
  const { leadStatuses, leadOrigins, leadMemberRoles, isLoading } = useSystemMetadata();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando configurações de leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lead Statuses */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Status de Leads</CardTitle>
              <CardDescription>
                Status disponíveis para acompanhamento do ciclo de vida dos leads
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leadStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum status configurado
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {leadStatuses.map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{status.label}</p>
                      {status.description && (
                        <p className="text-xs text-muted-foreground">{status.description}</p>
                      )}
                    </div>
                    <Badge variant={status.isActive ? 'default' : 'secondary'}>
                      {status.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lead Origins */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle>Origens de Leads</CardTitle>
              <CardDescription>
                Canais e fontes de captação de novos leads
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leadOrigins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma origem configurada
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {leadOrigins.map((origin) => (
                  <div
                    key={origin.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{origin.label}</p>
                      {origin.description && (
                        <p className="text-xs text-muted-foreground">{origin.description}</p>
                      )}
                    </div>
                    <Badge variant={origin.isActive ? 'default' : 'secondary'}>
                      {origin.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lead Member Roles */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <UserCircle className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle>Papéis de Membros do Lead</CardTitle>
              <CardDescription>
                Funções e responsabilidades dos membros associados aos leads
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leadMemberRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum papel configurado
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {leadMemberRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{role.label}</p>
                      {role.description && (
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      )}
                    </div>
                    <Badge variant={role.isActive ? 'default' : 'secondary'}>
                      {role.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-dashed border-muted-foreground/25 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Próximos passos:</strong> Funcionalidade de CRUD (criar, editar, excluir) será implementada em uma próxima etapa.
        </p>
      </div>
    </div>
  );
}
