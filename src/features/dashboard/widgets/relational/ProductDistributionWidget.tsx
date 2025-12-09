import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartPieSlice } from '@phosphor-icons/react';
import { useAnalyticsWithMetadata } from '@/services/analyticsService';
import { useSystemMetadata } from '@/hooks/useSystemMetadata';
import { useOperationalTeam } from '@/contexts/OperationalTeamContext';
import { useDateRangeContext } from '@/contexts/DateRangeContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { OPERATION_LABELS } from '@/lib/types';

// Color palette for the donut chart
const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(291, 64%, 42%)',
];

export function ProductDistributionWidget() {
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
            <ChartPieSlice className="h-4 w-4" />
            Distribuição por Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const data = analytics?.productDistribution || [];

  // Format data with labels and percentages
  const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);
  
  const formattedData = data.map(item => ({
    ...item,
    typeLabel: OPERATION_LABELS[item.type as keyof typeof OPERATION_LABELS] || item.type,
    percentage: totalVolume > 0 ? (item.volume / totalVolume) * 100 : 0
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{data.typeLabel}</p>
          <p className="text-xs text-muted-foreground">
            Volume: R$ {(data.volume / 1000000).toFixed(2)}M
          </p>
          <p className="text-xs text-muted-foreground">
            Quantidade: {data.count} deal{data.count !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            Participação: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label to show percentage on the chart
  const renderCustomLabel = (entry: any) => {
    const { percentage } = entry;
    if (percentage > 5) { // Only show label if slice is big enough
      return `${percentage.toFixed(0)}%`;
    }
    return '';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ChartPieSlice className="h-4 w-4" />
          Distribuição por Produto
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        {formattedData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Sem dados disponíveis</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                innerRadius={50}
                fill="hsl(var(--primary))"
                dataKey="volume"
                nameKey="typeLabel"
              >
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
