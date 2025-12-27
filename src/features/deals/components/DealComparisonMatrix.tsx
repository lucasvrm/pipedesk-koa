import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { MasterDeal, PlayerTrack } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { useDealComparison } from '../hooks/useDealComparison'
import { 
  BarChart3, 
  Download, 
  Filter, 
  Star, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react'

interface DealComparisonProps {
  deals: MasterDeal[]
  playerTracks: PlayerTrack[]
}

export function DealComparisonMatrix({ deals, playerTracks }: DealComparisonProps) {
  const {
    dealMetrics,
    dealScores,
    sortedDeals,
    comparisonStats,
    selectedDeals,
    criteria,
    sortBy,
    toggleDealSelection,
    selectAllDeals,
    clearSelection,
    setSortBy,
    updateCriteriaWeight,
    hasSelection,
    canCompare
  } = useDealComparison(deals, playerTracks)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 30) return 'text-green-600'
    if (riskScore <= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const exportComparison = () => {
    // Implementar export para Excel/PDF
    const exportData = {
      deals: sortedDeals,
      scores: dealScores,
      criteria,
      stats: comparisonStats,
      timestamp: new Date().toISOString()
    }
    
    // Por enquanto, fazer download como JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deal-comparison-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Deal Comparison Matrix
          </h2>
          <p className="text-muted-foreground">
            Compare múltiplos deals com scoring automático baseado em critérios customizáveis
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Ordenar por Score</SelectItem>
              <SelectItem value="volume">Ordenar por Volume</SelectItem>
              <SelectItem value="probability">Ordenar por Probabilidade</SelectItem>
              <SelectItem value="expectedValue">Ordenar por Valor Esperado</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportComparison} variant="outline" disabled={!hasSelection}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Statistics Summary */}
      {comparisonStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Volume Total</p>
                  <p className="font-semibold">{formatCurrency(comparisonStats.totalVolume)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Esperado</p>
                  <p className="font-semibold">{formatCurrency(comparisonStats.totalExpectedValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Prob. Média</p>
                  <p className="font-semibold">{Math.round(comparisonStats.avgProbability)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${getRiskColor(comparisonStats.avgRiskScore)}`} />
                <div>
                  <p className="text-sm text-muted-foreground">Risco Médio</p>
                  <p className="font-semibold">{Math.round(comparisonStats.avgRiskScore)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Deals</p>
                  <p className="font-semibold">{comparisonStats.dealCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Deal Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Selecionar Deals
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAllDeals}
                disabled={selectedDeals.length === deals.length}
              >
                Todos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearSelection}
                disabled={selectedDeals.length === 0}
              >
                Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dealMetrics.map(deal => (
              <div key={deal.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                <Checkbox
                  id={deal.id}
                  checked={selectedDeals.includes(deal.id)}
                  onCheckedChange={() => toggleDealSelection(deal.id)}
                />
                <div className="flex-1 min-w-0">
                  <label htmlFor={deal.id} className="text-sm font-medium cursor-pointer block truncate">
                    {deal.clientName}
                  </label>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{deal.operationType}</span>
                    <span>•</span>
                    <span>{deal.tracksCount} players</span>
                    <span>•</span>
                    <span className={getRiskColor(deal.riskScore)}>
                      {Math.round(deal.riskScore)}% risco
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    {formatCurrency(deal.volume)}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.round(deal.avgProbability)}% prob.
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Criteria Weights */}
        <Card>
          <CardHeader>
            <CardTitle>Critérios & Pesos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ajuste os pesos para personalizar a análise
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {criteria.map(criterion => (
              <div key={criterion.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">{criterion.name}</label>
                    {criterion.description && (
                      <p className="text-xs text-muted-foreground">{criterion.description}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold">{criterion.weight}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[criterion.weight]}
                    onValueChange={([value]) => updateCriteriaWeight(criterion.id, value)}
                    max={50}
                    min={0}
                    step={5}
                    className="flex-1"
                  />
                  <Badge variant={criterion.type === 'higher_better' ? 'default' : 'secondary'} className="text-xs">
                    {criterion.type === 'higher_better' ? '↑' : '↓'}
                  </Badge>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Total: {criteria.reduce((sum, c) => sum + c.weight, 0)}%
                </p>
                <Progress 
                  value={criteria.reduce((sum, c) => sum + c.weight, 0)} 
                  className="w-20 h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Matrix */}
        <div className="lg:col-span-2">
          {!canCompare ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  {selectedDeals.length === 0 
                    ? "Selecione deals para comparar" 
                    : "Selecione pelo menos 2 deals para comparação"
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Use os checkboxes ao lado para selecionar os deals que deseja analisar
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Matriz de Comparação</span>
                  <Badge variant="outline">
                    {selectedDeals.length} deals selecionados
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Deal</th>
                        <th className="text-center p-3 font-medium">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4" />
                            Score
                          </div>
                        </th>
                        {criteria.map(criterion => (
                          <th key={criterion.id} className="text-center p-3 text-xs font-medium">
                            <div className="flex flex-col items-center">
                              <span>{criterion.name}</span>
                              <span className="text-muted-foreground">({criterion.weight}%)</span>
                            </div>
                          </th>
                        ))}
                        <th className="text-center p-3 font-medium">
                          <div className="flex items-center justify-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Volume
                          </div>
                        </th>
                        <th className="text-center p-3 font-medium">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Prob.
                          </div>
                        </th>
                        <th className="text-center p-3 font-medium">
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Risco
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDeals.map((deal, index) => {
                        const score = dealScores.find(s => s.dealId === deal.id)
                        return (
                          <tr key={deal.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{deal.clientName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {deal.operationType} • {deal.tracksCount} players • {deal.daysToDeadline} dias
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Badge className={`${getScoreColor(score?.totalScore || 0)} border`}>
                                {Math.round(score?.totalScore || 0)}
                              </Badge>
                            </td>
                            {criteria.map(criterion => (
                              <td key={criterion.id} className="p-3 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-medium">
                                    {Math.round(score?.criteriaScores[criterion.id] || 0)}
                                  </span>
                                  <Progress 
                                    value={score?.criteriaScores[criterion.id] || 0} 
                                    className="w-12 h-1 mt-1"
                                  />
                                </div>
                              </td>
                            ))}
                            <td className="p-3 text-center">
                              <div className="text-sm font-medium">
                                {formatCurrency(deal.volume)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(deal.expectedValue)} esperado
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="text-sm font-medium">
                                {Math.round(deal.avgProbability)}%
                              </div>
                              <Progress 
                                value={deal.avgProbability} 
                                className="w-16 h-1 mt-1 mx-auto"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <div className={`text-sm font-medium ${getRiskColor(deal.riskScore)}`}>
                                {Math.round(deal.riskScore)}%
                              </div>
                              <Progress 
                                value={deal.riskScore} 
                                className="w-16 h-1 mt-1 mx-auto"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}