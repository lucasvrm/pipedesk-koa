import { useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/helpers'
import { useDeals } from '@/features/deals/hooks/useDeals'
import { useTracks } from '@/features/deals/hooks/usePlayerTracks'
import { format, parseISO, isValid, addMonths, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function WeightedForecastChart() {
  const { data: deals } = useDeals()
  const { data: tracks } = useTracks()

  const data = useMemo(() => {
    if (!deals || !tracks) return [];

    // Agrupar por mês de deadline
    const forecastMap = new Map();

    // Inicializa próximos 6 meses
    const today = startOfMonth(new Date());
    for (let i = 0; i < 6; i++) {
      const monthDate = addMonths(today, i);
      const key = format(monthDate, 'yyyy-MM');
      forecastMap.set(key, {
        month: format(monthDate, 'MMM/yy', { locale: ptBR }),
        date: monthDate,
        ponderado: 0,
        potencial: 0 // Volume total sem ponderação
      });
    }

    deals.forEach(deal => {
      if (deal.status !== 'active' || !deal.deadline) return;

      const dealTracks = tracks.filter(t => t.masterDealId === deal.id && t.status === 'active');
      if (dealTracks.length === 0) return;

      // Pega a maior probabilidade entre os players
      const maxProb = Math.max(...dealTracks.map(t => t.probability));
      const validDeadline = parseISO(deal.deadline);
      
      if (isValid(validDeadline)) {
        const key = format(validDeadline, 'yyyy-MM');
        
        if (forecastMap.has(key)) {
          const entry = forecastMap.get(key);
          const dealVolume = deal.volume || 0;
          
          entry.potencial += dealVolume;
          entry.ponderado += dealVolume * (maxProb / 100);
        }
      }
    });

    return Array.from(forecastMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [deals, tracks]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border text-popover-foreground shadow-md rounded-lg p-3 text-xs">
          <p className="font-bold mb-2 capitalize">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-600 font-medium">
              Ponderado: {formatCurrency(payload[0].value)}
            </p>
            <p className="text-muted-foreground">
              Total Potencial: {formatCurrency(payload[1].value)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Forecast Financeiro</CardTitle>
        <CardDescription>Volume Ponderado vs. Total Potencial (Próximos 6 meses)</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
            <XAxis 
              dataKey="month" 
              className="text-xs capitalize" 
              tickLine={false}
            />
            <YAxis 
              tickFormatter={(val) => `R$${(val/1000000).toFixed(0)}M`} 
              className="text-xs"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            
            {/* Barras sobrepostas para comparar Ponderado dentro do Total */}
            <Bar dataKey="ponderado" name="Ponderado (Realista)" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={32} />
            <Bar dataKey="potencial" name="Gap Potencial" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}