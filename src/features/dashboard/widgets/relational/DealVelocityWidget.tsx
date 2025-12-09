import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer } from '@phosphor-icons/react';
import { useAnalytics } from '@/services/analyticsService';
import { useDashboardFilters } from '@/contexts/DashboardFiltersContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Threshold for highlighting bottleneck stages (in days)
const BOTTLENECK_THRESHOLD = 30;

export function DealVelocityWidget() {
  const { filters } = useDashboardFilters();

  const { data: analytics, isLoading } = useAnalytics(
    filters.dateRangePreset,
    filters.selectedTeamMemberId,
    filters.selectedOperationTypeId
  );

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Velocidade por Fase
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const data = analytics?.dealVelocity || [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isBottleneck = data.avgDays > BOTTLENECK_THRESHOLD;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{data.stageName}</p>
          <p className="text-xs text-muted-foreground">
            Média: {data.avgDays.toFixed(1)} dias
          </p>
          {isBottleneck && (
            <p className="text-xs text-destructive font-medium mt-1">
              ⚠️ Fase Gargalo
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Format stage names for better readability
  const stageLabels: Record<string, string> = {
    nda: 'NDA',
    analysis: 'Análise',
    proposal: 'Proposta',
    negotiation: 'Negociação',
    closing: 'Fechamento',
    tease: 'Teaser',
    offer: 'Oferta',
    diligence: 'Diligência'
  };

  const formattedData = data.map(item => ({
    ...item,
    stageLabel: stageLabels[item.stageName] || item.stageName,
    isBottleneck: item.avgDays > BOTTLENECK_THRESHOLD
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Timer className="h-4 w-4" />
          Velocidade por Fase
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        {formattedData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Sem dados disponíveis</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={formattedData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="stageLabel" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                className="text-xs"
                label={{ value: 'Dias Médios', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgDays" radius={[4, 4, 0, 0]}>
                {formattedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isBottleneck ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
