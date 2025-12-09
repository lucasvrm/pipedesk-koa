import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBar } from '@phosphor-icons/react';
import { useAnalytics } from '@/services/analyticsService';
import { useDashboardFilters } from '@/contexts/DashboardFiltersContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function LeadOriginWidget() {
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
            <ChartBar className="h-4 w-4" />
            Performance por Origem de Lead
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const data = analytics?.leadOriginPerformance || [];

  // Format origin labels
  const originLabels: Record<string, string> = {
    inbound: 'Inbound',
    outbound: 'Outbound',
    referral: 'Indicação',
    event: 'Evento',
    other: 'Outro',
    unknown: 'Desconhecido'
  };

  const formattedData = data.map(item => ({
    ...item,
    originLabel: originLabels[item.origin] || item.origin
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{data.originLabel}</p>
          <p className="text-xs text-muted-foreground">
            Total Leads: {data.total}
          </p>
          <p className="text-xs text-muted-foreground">
            Convertidos: {data.converted}
          </p>
          <p className="text-xs text-muted-foreground">
            Taxa de Conversão: {data.conversionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Ticket Médio: R$ {(data.avgTicket / 1000000).toFixed(2)}M
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ChartBar className="h-4 w-4" />
          Performance por Origem de Lead
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
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" domain={[0, 100]} className="text-xs" />
              <YAxis 
                type="category" 
                dataKey="originLabel" 
                width={100}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="conversionRate" 
                name="Taxa de Conversão (%)"
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
