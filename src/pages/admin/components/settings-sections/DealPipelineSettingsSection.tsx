import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemMetadata } from '@/hooks/useSystemMetadata';
import { ChartLineUp, FlowArrow } from '@phosphor-icons/react';

export function DealPipelineSettingsSection() {
  const { dealStatuses, stages, isLoading } = useSystemMetadata();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando configurações de deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deal Statuses */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <ChartLineUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Status de Deals</CardTitle>
              <CardDescription>
                Status disponíveis para classificação e acompanhamento de deals
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dealStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum status configurado
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dealStatuses.map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{status.label}</p>
                        <Badge variant="outline" className="text-xs">
                          {status.code}
                        </Badge>
                      </div>
                      {status.description && (
                        <p className="text-xs text-muted-foreground mt-1">{status.description}</p>
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

      {/* Pipeline Stages */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <FlowArrow className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle>Estágios de Pipeline</CardTitle>
              <CardDescription>
                Etapas do funil de vendas com suas probabilidades de conversão
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum estágio configurado
              </p>
            ) : (
              <div className="space-y-2">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color || '#94a3b8' }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{stage.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Ordem: {stage.stageOrder} • Probabilidade: {stage.probability}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stage.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                      <Badge variant={stage.active ? 'default' : 'secondary'}>
                        {stage.active ? 'Ativo' : 'Inativo'}
                      </Badge>
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
