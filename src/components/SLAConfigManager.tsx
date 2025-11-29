import { useState, useEffect } from 'react'
import { useStages } from '@/services/pipelineService'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { Clock, FloppyDisk, ArrowCounterClockwise } from '@phosphor-icons/react'
import { PipelineStage } from '@/lib/types'

// Como ainda não temos uma tabela de SLA no backend (estava usando useKV), 
// vamos manter o estado local por enquanto, mas usando os estágios REAIS do banco.

interface SLAConfigItem {
  stageId: string
  maxDays: number
  alertThresholdPercent: number
}

export function SLAConfigManager() {
  const { data: stages = [], isLoading } = useStages()
  
  // Estado local para armazenar as configurações (idealmente isso iria para uma tabela 'sla_configs')
  const [slaConfigs, setSlaConfigs] = useState<Record<string, SLAConfigItem>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Inicializa configs quando os estágios carregam
  useEffect(() => {
    if (stages.length > 0) {
      const initialConfigs: Record<string, SLAConfigItem> = {}
      stages.forEach(stage => {
        // Tenta recuperar do localStorage ou usa padrão
        const saved = localStorage.getItem(`sla_config_${stage.id}`)
        if (saved) {
          initialConfigs[stage.id] = JSON.parse(saved)
        } else {
          initialConfigs[stage.id] = {
            stageId: stage.id,
            maxDays: 7, // Padrão
            alertThresholdPercent: 80
          }
        }
      })
      setSlaConfigs(initialConfigs)
    }
  }, [stages])

  const handleConfigChange = (stageId: string, field: 'maxDays' | 'alertThresholdPercent', value: number) => {
    setSlaConfigs(prev => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    // Salva no localStorage por enquanto (Mock de persistência)
    Object.values(slaConfigs).forEach(config => {
      localStorage.setItem(`sla_config_${config.stageId}`, JSON.stringify(config))
    })
    setHasChanges(false)
    toast.success('Configurações de SLA salvas (Localmente)')
  }

  const handleResetToDefaults = () => {
    const defaults: Record<string, SLAConfigItem> = {}
    stages.forEach(stage => {
      defaults[stage.id] = { stageId: stage.id, maxDays: 7, alertThresholdPercent: 80 }
    })
    setSlaConfigs(defaults)
    setHasChanges(true)
    toast.info('Valores resetados para o padrão')
  }

  if (isLoading) return <div>Carregando estágios...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuração de SLA</h2>
          <p className="text-muted-foreground">
            Defina limites de tempo para cada etapa do pipeline dinâmico.
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
        {stages.map((stage) => {
          const config = slaConfigs[stage.id] || { stageId: stage.id, maxDays: 7, alertThresholdPercent: 80 }
          
          return (
            <Card key={stage.id} className="border-l-4" style={{ borderLeftColor: stage.color }}>
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {stage.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Probabilidade: {stage.probability}%
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" style={{ borderColor: stage.color, color: stage.color }}>
                    {stage.name.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-4 pt-0">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${stage.id}-maxDays`}>Tempo Máximo (dias)</Label>
                    <Input
                      id={`${stage.id}-maxDays`}
                      type="number"
                      min="1"
                      max="365"
                      value={config.maxDays}
                      onChange={(e) => handleConfigChange(stage.id, 'maxDays', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${stage.id}-threshold`}>Alerta em (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`${stage.id}-threshold`}
                        type="number"
                        min="1"
                        max="100"
                        value={config.alertThresholdPercent}
                        onChange={(e) => handleConfigChange(stage.id, 'alertThresholdPercent', parseInt(e.target.value) || 0)}
                      />
                      <Badge variant="secondary" className="whitespace-nowrap">
                        ~ {Math.round(config.maxDays * (config.alertThresholdPercent / 100))} dias
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}