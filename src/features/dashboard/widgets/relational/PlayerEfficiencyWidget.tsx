import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from '@phosphor-icons/react';
import { useAnalyticsWithMetadata } from '@/services/analyticsService';
import { useSystemMetadata } from '@/hooks/useSystemMetadata';
import { useOperationalTeam } from '@/contexts/OperationalTeamContext';
import { useDateRangeContext } from '@/contexts/DateRangeContext';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

export function PlayerEfficiencyWidget() {
  const { stages } = useSystemMetadata();
  const { teamMembers } = useOperationalTeam();
  const { dateRange } = useDateRangeContext();

  const { data: analytics, isLoading } = useAnalyticsWithMetadata(
    'all',
    'all',
    'all',
    {
      stages,
      teamMembers: teamMembers.map(m => m.id),
      dateRange
    }
  );

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Eficiência por Player
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const data = analytics?.playerEfficiency || [];

  // Custom tooltip to show player name and metrics
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            Volume: R$ {(data.volume / 1000000).toFixed(2)}M
          </p>
          <p className="text-xs text-muted-foreground">
            Conversão: {data.conversionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Deals: {data.totalDeals}
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
          <Target className="h-4 w-4" />
          Eficiência por Player
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Sem dados disponíveis</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number" 
                dataKey="volume" 
                name="Volume (R$)"
                tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`}
                className="text-xs"
              />
              <YAxis 
                type="number" 
                dataKey="conversionRate" 
                name="Conversão (%)"
                domain={[0, 100]}
                className="text-xs"
              />
              <ZAxis 
                type="number" 
                dataKey="totalDeals" 
                range={[50, 400]} 
                name="Total Deals"
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                name="Players" 
                data={data} 
                fill="hsl(var(--primary))" 
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
