import { useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/helpers'
import { useTracks } from '@/services/trackService'
import { useStages } from '@/services/pipelineService'

export function ConversionFunnel() {
  const { data: tracks } = useTracks()
  const { data: stages = [] } = useStages()

  const data = useMemo(() => {
    if (!tracks || !stages.length) return [];

    // Mapeia os estágios definidos no banco, respeitando a ordem
    return stages.map((stage) => {
      const stageTracks = tracks.filter(t => t.currentStage === stage.id && t.status === 'active');
      const volume = stageTracks.reduce((sum, t) => sum + (t.trackVolume || 0), 0);

      return {
        stage: stage.name, // Nome dinâmico
        stageId: stage.id,
        volume,
        count: stageTracks.length,
        fill: stage.color || '#94a3b8' // Cor dinâmica do banco
      };
    });
  }, [tracks, stages]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border text-popover-foreground shadow-md rounded-lg p-3 text-xs">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-sm font-medium text-primary">{formatCurrency(payload[0].value)}</p>
          <p className="text-muted-foreground mt-1">{payload[0].payload.count} players ativos</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Funil de Conversão (Volume)</CardTitle>
        <CardDescription>Volume financeiro ativo por estágio do pipeline</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/30" />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="stage" width={80} tick={{ fontSize: 12 }} interval={0} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar dataKey="volume" radius={[0, 4, 4, 0]} barSize={40}>
               {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}