import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemMetadata } from '@/hooks/useSystemMetadata';
import { Buildings, Handshake } from '@phosphor-icons/react';

export function CompanyRelationshipSettingsSection() {
  const { companyTypes, relationshipLevels, isLoading } = useSystemMetadata();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando configurações de empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Buildings className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Tipos de Empresa</CardTitle>
              <CardDescription>
                Categorização de empresas por tipo ou segmento de atuação
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {companyTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum tipo configurado
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {companyTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{type.label}</p>
                        <Badge variant="outline" className="text-xs">
                          {type.code}
                        </Badge>
                      </div>
                      {type.description && (
                        <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                      )}
                    </div>
                    <Badge variant={type.isActive ? 'default' : 'secondary'}>
                      {type.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Relationship Levels */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Handshake className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle>Níveis de Relacionamento</CardTitle>
              <CardDescription>
                Classificação do grau de relacionamento com empresas parceiras
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {relationshipLevels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum nível configurado
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {relationshipLevels.map((level) => (
                  <div
                    key={level.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{level.label}</p>
                        <Badge variant="outline" className="text-xs">
                          {level.code}
                        </Badge>
                      </div>
                      {level.description && (
                        <p className="text-xs text-muted-foreground mt-1">{level.description}</p>
                      )}
                    </div>
                    <Badge variant={level.isActive ? 'default' : 'secondary'}>
                      {level.isActive ? 'Ativo' : 'Inativo'}
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
