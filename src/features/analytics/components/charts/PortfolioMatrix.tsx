import { useMemo } from 'react'
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/helpers'
// CORREÇÃO: Imports via services
import { useDeals } from '@/services/dealService'
import { useTracks } from '@/services/trackService'

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f43f5e', '#8b5cf6'];

export function PortfolioMatrix() {
  const { data: deals } = useDeals()
  const { data: tracks } = useTracks()

  const data = useMemo(() => {
    if (!deals || !tracks) return [];

    return deals
      .filter(d => d.status === 'active')
      .map(deal => {
        const dealTracks = tracks.filter(t => t.masterDealId === deal.id && t.status === 'active');
        const maxProb = dealTracks.length > 0 
          ? Math.max(...dealTracks.map(t => t.probability)) 
          : 0;

        return {
          id: deal.id,
          name: deal.clientName,
          volume: deal.volume || 0,
          probability: maxProb,
          type: deal.operationType
        }
      })
      .filter(d => d.volume > 0 && d.probability > 0);
  }, [deals, tracks]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-popover border text-popover-foreground shadow-md rounded-lg p-3 text-xs z-50">
          <p className="font-bold mb-2">{item.name}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-muted-foreground">Volume:</span>
            <span className="font-medium text-right">{formatCurrency(item.volume)}</span>
            <span className="text-muted-foreground">Probabilidade:</span>
            <span className="font-medium text-right">{item.probability}%</span>
            <span className="text-muted-foreground">Tipo:</span>
            <span className="font-medium text-right capitalize">{item.type?.replace('_', ' ') || '-'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Matriz de Risco x Retorno</CardTitle>
        <CardDescription>Distribuição de deals por volume e probabilidade</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis 
              type="number" dataKey="probability" name="Probabilidade" unit="%" domain={[0, 100]} 
              label={{ value: 'Probabilidade (%)', position: 'bottom', offset: 0, fontSize: 12 }}
              className="text-xs"
            />
            <YAxis 
              type="number" dataKey="volume" name="Volume" unit="" 
              tickFormatter={(val) => `R$${(val/1000000).toFixed(0)}M`}
              label={{ value: 'Volume', angle: -90, position: 'left', offset: 10, fontSize: 12 }}
              className="text-xs"
            />
            <ZAxis type="number" dataKey="volume" range={[60, 400]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <ReferenceLine x={50} stroke="currentColor" strokeDasharray="3 3" className="text-muted-foreground/40" />
            <ReferenceLine y={data.length ? Math.max(...data.map(d => d.volume)) / 2 : 0} stroke="currentColor" strokeDasharray="3 3" className="text-muted-foreground/40" />
            <Scatter name="Deals" data={data}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.7} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}