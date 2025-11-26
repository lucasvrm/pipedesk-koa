import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useTracks } from '@/services/trackService'
import { ALL_PRODUCT_LABELS, PlayerTrack } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Treemap, Legend, Cell 
} from 'recharts'
import { Trophy, Warning, Clock, ChartPieSlice } from '@phosphor-icons/react'

export default function PlayerIntelligenceDashboard() {
  const { data: tracks, isLoading } = useTracks()

  // --------------------------------------------------------------------------
  // 1. DATA PROCESSING
  // --------------------------------------------------------------------------

  // A. Matriz de Apetite (Heatmap Data)
  // Estrutura: { [PlayerName]: { [ProductKey]: count } }
  const appetiteMatrix = useMemo(() => {
    if (!tracks) return {}
    const matrix: Record<string, Record<string, number>> = {}
    
    tracks.forEach((t: any) => {
      if (!t.dealProduct) return
      const player = t.playerName
      const product = t.dealProduct
      
      if (!matrix[player]) matrix[player] = {}
      matrix[player][product] = (matrix[player][product] || 0) + 1
    })

    // Filtrar top 8 players com mais atividade para não quebrar o layout
    const topPlayers = Object.entries(matrix)
      .sort(([, a], [, b]) => {
        const sumA = Object.values(a).reduce((sum, val) => sum + val, 0)
        const sumB = Object.values(b).reduce((sum, val) => sum + val, 0)
        return sumB - sumA
      })
      .slice(0, 8)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})

    return topPlayers
  }, [tracks])

  // B. Ranking de Conversão (Win Rate)
  const conversionData = useMemo(() => {
    if (!tracks) return []
    const stats: Record<string, { total: number, won: number }> = {}

    tracks.forEach(t => {
      const p = t.playerName
      if (!stats[p]) stats[p] = { total: 0, won: 0 }
      stats[p].total += 1
      if (t.status === 'concluded') stats[p].won += 1
    })

    return Object.entries(stats)
      .map(([name, { total, won }]) => ({
        name,
        rate: total > 0 ? Math.round((won / total) * 100) : 0,
        total,
        won
      }))
      .filter(i => i.total >= 3) // Exibe apenas quem tem mínimo de histórico
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10)
  }, [tracks])

  // C. Exposição de Pipeline (Treemap)
  const pipelineExposureData = useMemo(() => {
    if (!tracks) return []
    const stats: Record<string, number> = {}

    tracks.filter(t => t.status === 'active').forEach(t => {
      const p = t.playerName
      stats[p] = (stats[p] || 0) + t.trackVolume
    })

    return Object.entries(stats)
      .map(([name, value]) => ({ name, size: value }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 12)
  }, [tracks])

  // D. Gargalo (Tempo médio / Idade dos deals ativos)
  // Como não temos histórico de etapas detalhado em massa, usamos "Idade do Deal"
  const agingData = useMemo(() => {
    if (!tracks) return []
    const stats: Record<string, { totalDays: number, count: number }> = {}
    const now = new Date()

    tracks.filter(t => t.status === 'active').forEach(t => {
      const p = t.playerName
      const created = new Date(t.createdAt)
      const diffTime = Math.abs(now.getTime() - created.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (!stats[p]) stats[p] = { totalDays: 0, count: 0 }
      stats[p].totalDays += diffDays
      stats[p].count += 1
    })

    return Object.entries(stats)
      .map(([name, { totalDays, count }]) => ({
        name,
        avgDays: Math.round(totalDays / count)
      }))
      .sort((a, b) => b.avgDays - a.avgDays)
      .slice(0, 10)
  }, [tracks])

  // --------------------------------------------------------------------------
  // HELPER COMPONENTS
  // --------------------------------------------------------------------------

  // Custom Treemap Content
  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, size } = props;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: "#3b82f6",
            stroke: "#fff",
            strokeWidth: 2,
            opacity: 0.8,
          }}
        />
        {width > 50 && height > 30 && (
            <foreignObject x={x} y={y} width={width} height={height}>
                <div className="flex flex-col items-center justify-center h-full p-1 text-white text-xs text-center overflow-hidden">
                    <span className="font-bold truncate w-full">{name}</span>
                    <span className="opacity-80 text-[10px]">{formatCurrency(size)}</span>
                </div>
            </foreignObject>
        )}
      </g>
    );
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando inteligência de mercado...</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. MATRIZ DE APETITE (HEATMAP) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
                <ChartPieSlice className="text-primary h-5 w-5" />
                <CardTitle>Matriz de Apetite</CardTitle>
            </div>
            <CardDescription>Concentração de deals por Player vs. Tipo de Produto.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-muted-foreground font-medium">Player</th>
                    {Object.keys(ALL_PRODUCT_LABELS).slice(0, 8).map(key => ( // Mostrando os primeiros 8 produtos para caber
                       <th key={key} className="p-2 text-xs font-normal text-muted-foreground rotate-45 h-24 align-bottom">
                         {ALL_PRODUCT_LABELS[key]}
                       </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(appetiteMatrix).map(([player, products]) => (
                    <tr key={player} className="border-t border-border/50 hover:bg-muted/20">
                      <td className="p-2 font-medium">{player}</td>
                      {Object.keys(ALL_PRODUCT_LABELS).slice(0, 8).map(prodKey => {
                        const count = products[prodKey] || 0
                        // Mapa de calor manual
                        const bgClass = count === 0 ? 'bg-transparent' 
                          : count < 2 ? 'bg-blue-100 text-blue-700'
                          : count < 5 ? 'bg-blue-300 text-blue-900'
                          : 'bg-blue-600 text-white font-bold'
                        
                        return (
                          <td key={prodKey} className="p-1 text-center">
                            <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded ${bgClass}`}>
                              {count > 0 ? count : '-'}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {Object.keys(appetiteMatrix).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">Dados insuficientes para gerar a matriz.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. RANKING DE CONVERSÃO */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <Trophy className="text-yellow-500 h-5 w-5" />
                <CardTitle>Ranking de Conversão (Win Rate)</CardTitle>
            </div>
            <CardDescription>% de deals concluídos (Min. 3 interações)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={conversionData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    formatter={(value: number) => [`${value}%`, 'Conversão']}
                />
                <Bar dataKey="rate" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. EXPOSIÇÃO DE PIPELINE (TREEMAP) */}
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Warning className="text-orange-500 h-5 w-5" />
                    <CardTitle>Concentração de Pipeline</CardTitle>
                </div>
                <CardDescription>Volume financeiro ativo nas mãos de cada player.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        data={pipelineExposureData}
                        dataKey="size"
                        aspectRatio={4 / 3}
                        stroke="#fff"
                        fill="#3b82f6"
                        content={<CustomTreemapContent />}
                    />
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* 4. GARGALO (TEMPO MÉDIO) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
                <Clock className="text-purple-500 h-5 w-5" />
                <CardTitle>Gargalo Operacional</CardTitle>
            </div>
            <CardDescription>Idade média (em dias) dos deals ativos com cada player.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis unit="d" />
                <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    formatter={(value: number) => [`${value} dias`, 'Idade Média']}
                />
                <Bar dataKey="avgDays" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40}>
                    {
                        agingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.avgDays > 60 ? '#ef4444' : '#8b5cf6'} />
                        ))
                    }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}