import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useSystemMetadata } from '@/hooks/useSystemMetadata';
import { updateSystemSetting } from '@/services/settingsService';
import { parseLeadPriorityConfig, validateLeadPriorityConfig, DEFAULT_LEAD_PRIORITY_CONFIG } from '@/utils/leadPriorityConfig';
import type { LeadPriorityConfig } from '@/types/metadata';

export function LeadPriorityConfigSection() {
  const { settings, refreshMetadata } = useSystemMetadata();
  const [config, setConfig] = useState<LeadPriorityConfig>(DEFAULT_LEAD_PRIORITY_CONFIG);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastValidationToastKeyRef = useRef<string>('');

useEffect(() => {
  setIsLoading(true);

  try {
    const rawConfig = settings.find((s) => s.key === 'lead_priority_config')?.value;
    const parsedConfig = parseLeadPriorityConfig(rawConfig);
    setConfig(parsedConfig);
  } catch (error) {
    console.error('Error loading lead priority config:', error);
    toast.error('Erro ao carregar configuração');
  } finally {
    setIsLoading(false);
  }
}, [settings]);

  const validation = useMemo(() => {
    return validateLeadPriorityConfig(config);
  }, [config]);

  useEffect(() => {
    if (isLoading) return;

    const key = validation.errors.join('|');
    
    if (key && key !== lastValidationToastKeyRef.current) {
      toast.error('Configuração inválida', { 
        description: validation.errors.join(' • ') 
      });
      lastValidationToastKeyRef.current = key;
    } else if (validation.valid && lastValidationToastKeyRef.current) {
      lastValidationToastKeyRef.current = '';
    }
  }, [validation, isLoading]);

  const handleSave = async () => {
    const validationResult = validateLeadPriorityConfig(config);
    if (!validationResult.valid) {
      toast.error('Configuração inválida', { 
        description: validationResult.errors.join(' • ') 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await updateSystemSetting(
        'lead_priority_config',
        config,
        'Lead priority configuration'
      );

      if (error) throw error;

      toast.success('Configuração salva com sucesso!');
      await refreshMetadata();
    } catch (error) {
      console.error('Error saving lead priority config:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuração');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (confirm('Resetar configuração para os valores padrão?')) {
      setConfig(DEFAULT_LEAD_PRIORITY_CONFIG);
      toast.info('Configuração resetada. Clique em Salvar para aplicar.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Configuração de Prioridade de Leads</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure os parâmetros de cálculo e classificação de prioridade dos leads
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          A prioridade é calculada automaticamente baseada em: recência de atividade, status, origem, e reuniões agendadas.
          Os thresholds definem os limites entre os buckets de prioridade (hot/warm/cold).
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div className="space-y-6">
          {/* Thresholds Section */}
          <Card>
          <CardHeader>
            <CardTitle>Thresholds de Prioridade</CardTitle>
            <CardDescription>
              Defina os limites de pontuação para cada nível de prioridade (0-100)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="threshold-hot">Hot (Mínimo) *</Label>
                <Input
                  id="threshold-hot"
                  type="number"
                  min={0}
                  max={100}
                  value={config.thresholds.hot}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      thresholds: { ...config.thresholds, hot: parseInt(e.target.value) || 0 }
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Pontuação mínima para leads "hot"</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold-warm">Warm (Mínimo) *</Label>
                <Input
                  id="threshold-warm"
                  type="number"
                  min={0}
                  max={100}
                  value={config.thresholds.warm}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      thresholds: { ...config.thresholds, warm: parseInt(e.target.value) || 0 }
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Pontuação mínima para leads "warm"</p>
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              <p><strong>Distribuição:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Hot: ≥ {config.thresholds.hot} pontos</li>
                <li>Warm: {config.thresholds.warm} - {config.thresholds.hot - 1} pontos</li>
                <li>Cold: &lt; {config.thresholds.warm} pontos</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Descriptions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Descrições dos Buckets</CardTitle>
            <CardDescription>
              Defina descrições personalizadas para cada nível de prioridade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="desc-hot">Descrição Hot *</Label>
              <Textarea
                id="desc-hot"
                rows={2}
                value={config.descriptions.hot}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    descriptions: { ...config.descriptions, hot: e.target.value }
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc-warm">Descrição Warm *</Label>
              <Textarea
                id="desc-warm"
                rows={2}
                value={config.descriptions.warm}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    descriptions: { ...config.descriptions, warm: e.target.value }
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc-cold">Descrição Cold *</Label>
              <Textarea
                id="desc-cold"
                rows={2}
                value={config.descriptions.cold}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    descriptions: { ...config.descriptions, cold: e.target.value }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Scoring Section */}
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros de Pontuação</CardTitle>
            <CardDescription>
              Configure os pesos e limites para o cálculo automático de prioridade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recency-max-points">Pontos Máximos de Recência *</Label>
                <Input
                  id="recency-max-points"
                  type="number"
                  min={0}
                  max={100}
                  value={config.scoring.recencyMaxPoints}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      scoring: { ...config.scoring, recencyMaxPoints: parseInt(e.target.value) || 0 }
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Pontos para atividade recente</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stale-days">Dias para Considerar Obsoleto *</Label>
                <Input
                  id="stale-days"
                  type="number"
                  min={1}
                  value={config.scoring.staleDays}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      scoring: { ...config.scoring, staleDays: parseInt(e.target.value) || 1 }
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Dias sem atividade = obsoleto</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-score">Score Mínimo *</Label>
                <Input
                  id="min-score"
                  type="number"
                  min={0}
                  value={config.scoring.minScore}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      scoring: { ...config.scoring, minScore: parseInt(e.target.value) || 0 }
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Limite inferior do score</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-score">Score Máximo *</Label>
                <Input
                  id="max-score"
                  type="number"
                  min={0}
                  value={config.scoring.maxScore}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      scoring: { ...config.scoring, maxScore: parseInt(e.target.value) || 0 }
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Limite superior do score</p>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="upcoming-meeting-points">Pontos por Reunião Agendada *</Label>
                <Input
                  id="upcoming-meeting-points"
                  type="number"
                  min={0}
                  max={100}
                  value={config.scoring.upcomingMeetingPoints}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      scoring: { ...config.scoring, upcomingMeetingPoints: parseInt(e.target.value) || 0 }
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Pontos bônus por reunião futura</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Descriptions Section - moved to left column above */}
        {/* No longer here */}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={handleReset} disabled={isSubmitting}>
          Resetar Padrão
        </Button>
        <Button onClick={handleSave} disabled={isSubmitting || !validation.valid}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configuração
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
