import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { Clock, FloppyDisk, ArrowCounterClockwise } from '@phosphor-icons/react'
import { PlayerStage, STAGE_LABELS } from '../lib/types'

interface SLAConfigItem {
  stage: PlayerStage
  maxDays: number
  alertThresholdPercent: number
}

const DEFAULT_SLA_CONFIG: SLAConfigItem[] = [
  { stage: 'nda', maxDays: 7, alertThresholdPercent: 80 },
  { stage: 'analysis', maxDays: 14, alertThresholdPercent: 80 },
  { stage: 'proposal', maxDays: 21, alertThresholdPercent: 80 },
  { stage: 'negotiation', maxDays: 30, alertThresholdPercent: 80 },
  { stage: 'closing', maxDays: 15, alertThresholdPercent: 80 },
]

export function SLAConfigManager() {
  const [slaConfig, setSlaConfig] = useKV<SLAConfigItem[]>('sla_config', DEFAULT_SLA_CONFIG)
  const [editedConfig, setEditedConfig] = useState<SLAConfigItem[]>(slaConfig)
  const [hasChanges, setHasChanges] = useState(false)

  const handleConfigChange = (stage: PlayerStage, field: 'maxDays' | 'alertThresholdPercent', value: number) => {
    const updated = editedConfig.map(item =>
      item.stage === stage ? { ...item, [field]: value } : item
    )
    setEditedConfig(updated)
    setHasChanges(true)
  }

  const handleSave = () => {
    setSlaConfig(editedConfig)
    setHasChanges(false)
    toast.success('Configurações de SLA salvas com sucesso!')
  }

  const handleReset = () => {
    setEditedConfig(slaConfig)
    setHasChanges(false)
    toast.info('Alterações descartadas')
  }

  const handleResetToDefaults = () => {
    setEditedConfig(DEFAULT_SLA_CONFIG)
    setHasChanges(true)
    toast.info('Configurações resetadas para valores padrão')
  }

  const getStageColor = (stage: PlayerStage): string => {
    const colors: Record<PlayerStage, string> = {
      nda: 'bg-slate-100 text-slate-700',
      analysis: 'bg-blue-100 text-blue-700',
      proposal: 'bg-purple-100 text-purple-700',
      negotiation: 'bg-amber-100 text-amber-700',
      closing: 'bg-green-100 text-green-700',
    }
    return colors[stage]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuração de SLA</h2>
          <p className="text-muted-foreground">
            Defina limites de tempo para cada etapa do pipeline e percentual de alerta
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            disabled={!hasChanges}
          >
            <ArrowCounterClockwise className="mr-2 h-4 w-4" />
            Restaurar Padrões
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <FloppyDisk className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {editedConfig.map((config) => (
          <Card key={config.stage}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">
                      {STAGE_LABELS[config.stage]}
                    </CardTitle>
                    <CardDescription>
                      Configurações de SLA para esta etapa
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStageColor(config.stage)}>
                  {config.stage.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${config.stage}-maxDays`}>
                    Tempo Máximo (dias)
                  </Label>
                  <Input
                    id={`${config.stage}-maxDays`}
                    type="number"
                    min="1"
                    max="365"
                    value={config.maxDays}
                    onChange={(e) => handleConfigChange(config.stage, 'maxDays', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Limite de dias para permanência nesta etapa
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${config.stage}-threshold`}>
                    Alerta em (%)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`${config.stage}-threshold`}
                      type="number"
                      min="1"
                      max="100"
                      value={config.alertThresholdPercent}
                      onChange={(e) => handleConfigChange(config.stage, 'alertThresholdPercent', parseInt(e.target.value) || 0)}
                    />
                    <Badge variant="outline">
                      {Math.round(config.maxDays * (config.alertThresholdPercent / 100))}d
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alerta quando atingir este percentual do tempo máximo
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Status atual:</span>
                  <div className="flex gap-4">
                    <span>
                      🟢 Normal: 0-{config.alertThresholdPercent - 1}% ({Math.round(config.maxDays * ((config.alertThresholdPercent - 1) / 100))}d)
                    </span>
                    <span>
                      🟡 Alerta: {config.alertThresholdPercent}-99% ({Math.round(config.maxDays * (config.alertThresholdPercent / 100))}-{config.maxDays - 1}d)
                    </span>
                    <span>
                      🔴 Crítico: ≥{config.maxDays}d
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-base">ℹ️ Como funciona o SLA</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • <strong>Tempo Máximo:</strong> Define quantos dias uma negociação pode permanecer em uma etapa antes de ser considerada atrasada
          </p>
          <p>
            • <strong>Alerta em:</strong> Percentual do tempo máximo para iniciar alertas visuais (ex: 80% = alerta aos 8 dias em uma etapa de 10 dias)
          </p>
          <p>
            • <strong>Indicadores:</strong> Cards de negociação mostrarão cores e badges indicando o status do SLA
          </p>
          <p>
            • <strong>Notificações:</strong> Alertas automáticos serão gerados quando negociações entrarem em zona de risco
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
