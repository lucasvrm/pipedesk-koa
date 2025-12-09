import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemMetadata } from '@/hooks/useSystemMetadata';
import { ShieldCheck } from '@phosphor-icons/react';

export function SystemMetadataSettingsSection() {
  const { userRoleMetadata, isLoading } = useSystemMetadata();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando configurações do sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Role Metadata */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <ShieldCheck className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle>Papéis de Usuário</CardTitle>
              <CardDescription>
                Definição de funções e permissões para controle de acesso ao sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {userRoleMetadata.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum papel configurado
              </p>
            ) : (
              <div className="space-y-2">
                {userRoleMetadata.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-lg">{role.label}</p>
                          <Badge variant="outline" className="text-xs">
                            {role.code}
                          </Badge>
                          <Badge variant={role.isActive ? 'default' : 'secondary'}>
                            {role.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {role.description && (
                          <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                        )}
                        {role.permissions && role.permissions.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Permissões:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {role.permissions.map((permission, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {permission}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
