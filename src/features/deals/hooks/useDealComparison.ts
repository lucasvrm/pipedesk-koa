import { useState, useMemo } from 'react'
import { MasterDeal, PlayerTrack } from '@/lib/types'

export interface ComparisonCriteria {
  id: string
  name: string
  weight: number
  type: 'higher_better' | 'lower_better' | 'target_value'
  targetValue?: number
  description?: string
}

export interface DealMetrics extends MasterDeal {
  avgProbability: number
  daysToDeadline: number
  tracksCount: number
  totalTrackVolume: number
  expectedValue: number // volume * avgProbability
  riskScore: number
}

export interface DealScore {
  dealId: string
  totalScore: number
  criteriaScores: Record<string, number>
  rank: number
}

const DEFAULT_CRITERIA: ComparisonCriteria[] = [
  { 
    id: 'volume', 
    name: 'Volume', 
    weight: 25, 
    type: 'higher_better',
    description: 'Valor total do deal'
  },
  { 
    id: 'probability', 
    name: 'Probabilidade Média', 
    weight: 25, 
    type: 'higher_better',
    description: 'Média das probabilidades dos player tracks'
  },
  { 
    id: 'expectedValue', 
    name: 'Valor Esperado', 
    weight: 20, 
    type: 'higher_better',
    description: 'Volume × Probabilidade média'
  },
  { 
    id: 'timeline', 
    name: 'Prazo', 
    weight: 15, 
    type: 'lower_better',
    description: 'Dias até o deadline (menor é melhor)'
  },
  { 
    id: 'fee', 
    name: 'Fee (%)', 
    weight: 10, 
    type: 'higher_better',
    description: 'Percentual de fee'
  },
  { 
    id: 'tracks', 
    name: 'Diversificação', 
    weight: 5, 
    type: 'higher_better',
    description: 'Número de player tracks'
  },
]

export function useDealComparison(deals: MasterDeal[], playerTracks: PlayerTrack[]) {
  const [selectedDeals, setSelectedDeals] = useState<string[]>([])
  const [criteria, setCriteria] = useState<ComparisonCriteria[]>(DEFAULT_CRITERIA)
  const [sortBy, setSortBy] = useState<'score' | 'volume' | 'probability' | 'expectedValue'>('score')

  // Calcular métricas enriquecidas para cada deal
  const dealMetrics = useMemo((): DealMetrics[] => {
    return deals.map(deal => {
      const tracks = playerTracks.filter(track => track.masterDealId === deal.id)
      const avgProbability = tracks.length > 0 
        ? tracks.reduce((sum, track) => sum + track.probability, 0) / tracks.length 
        : 0
      
      const daysToDeadline = Math.ceil(
        (new Date(deal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      const totalTrackVolume = tracks.reduce((sum, track) => sum + track.trackVolume, 0)
      const expectedValue = (deal.volume * avgProbability) / 100

      // Calcular risk score baseado em diversos fatores
      let riskScore = 0
      if (daysToDeadline < 30) riskScore += 30 // Prazo apertado
      if (avgProbability < 50) riskScore += 25 // Baixa probabilidade
      if (tracks.length < 2) riskScore += 20 // Poucos players
      if (deal.volume > 100000000) riskScore += 15 // Deal muito grande
      if (tracks.some(t => t.currentStage === 'nda')) riskScore += 10 // Ainda em NDA

      return {
        ...deal,
        avgProbability,
        daysToDeadline,
        tracksCount: tracks.length,
        totalTrackVolume,
        expectedValue,
        riskScore: Math.min(riskScore, 100)
      }
    })
  }, [deals, playerTracks])

  // Calcular scores de comparação
  const dealScores = useMemo((): DealScore[] => {
    if (selectedDeals.length === 0) return []

    const selectedDealMetrics = dealMetrics.filter(deal => selectedDeals.includes(deal.id))
    
    const scores = selectedDealMetrics.map(deal => {
      let totalScore = 0
      const criteriaScores: Record<string, number> = {}

      criteria.forEach(criterion => {
        let value = 0
        let maxValue = 1
        let minValue = 0

        // Obter valores para normalização
        const values = selectedDealMetrics.map(d => {
          switch (criterion.id) {
            case 'volume': return d.volume
            case 'probability': return d.avgProbability
            case 'expectedValue': return d.expectedValue
            case 'timeline': return d.daysToDeadline
            case 'fee': return d.feePercentage || 0
            case 'tracks': return d.tracksCount
            case 'risk': return 100 - d.riskScore // Inverter para que menor risco = melhor score
            default: return 0
          }
        })

        maxValue = Math.max(...values)
        minValue = Math.min(...values)

        // Obter valor atual
        switch (criterion.id) {
          case 'volume': value = deal.volume; break
          case 'probability': value = deal.avgProbability; break
          case 'expectedValue': value = deal.expectedValue; break
          case 'timeline': value = deal.daysToDeadline; break
          case 'fee': value = deal.feePercentage || 0; break
          case 'tracks': value = deal.tracksCount; break
          case 'risk': value = 100 - deal.riskScore; break
        }

        // Normalizar score (0-100)
        let normalizedScore = 50 // Valor padrão quando todos são iguais
        
        if (maxValue !== minValue) {
          if (criterion.type === 'higher_better') {
            normalizedScore = ((value - minValue) / (maxValue - minValue)) * 100
          } else if (criterion.type === 'lower_better') {
            normalizedScore = ((maxValue - value) / (maxValue - minValue)) * 100
          } else if (criterion.type === 'target_value' && criterion.targetValue) {
            // Para valores alvo, calcular proximidade
            const distance = Math.abs(value - criterion.targetValue)
            const maxDistance = Math.max(
              Math.abs(maxValue - criterion.targetValue),
              Math.abs(minValue - criterion.targetValue)
            )
            normalizedScore = maxDistance > 0 ? ((maxDistance - distance) / maxDistance) * 100 : 100
          }
        }

        criteriaScores[criterion.id] = Math.max(0, Math.min(100, normalizedScore))
        totalScore += (criteriaScores[criterion.id] * criterion.weight) / 100
      })

      return {
        dealId: deal.id,
        totalScore: Math.max(0, Math.min(100, totalScore)),
        criteriaScores,
        rank: 0 // Será calculado depois
      }
    })

    // Calcular rankings
    const sortedScores = [...scores].sort((a, b) => b.totalScore - a.totalScore)
    sortedScores.forEach((score, index) => {
      score.rank = index + 1
    })

    return scores
  }, [selectedDeals, dealMetrics, criteria])

  // Deals ordenados
  const sortedDeals = useMemo(() => {
    const selected = dealMetrics.filter(deal => selectedDeals.includes(deal.id))
    
    return selected.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          const scoreA = dealScores.find(s => s.dealId === a.id)?.totalScore || 0
          const scoreB = dealScores.find(s => s.dealId === b.id)?.totalScore || 0
          return scoreB - scoreA
        case 'volume':
          return b.volume - a.volume
        case 'probability':
          return b.avgProbability - a.avgProbability
        case 'expectedValue':
          return b.expectedValue - a.expectedValue
        default:
          return 0
      }
    })
  }, [dealMetrics, selectedDeals, dealScores, sortBy])

  // Funções de controle
  const toggleDealSelection = (dealId: string) => {
    setSelectedDeals(prev => 
      prev.includes(dealId) 
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    )
  }

  const selectAllDeals = () => {
    setSelectedDeals(deals.map(d => d.id))
  }

  const clearSelection = () => {
    setSelectedDeals([])
  }

  const updateCriteriaWeight = (criteriaId: string, weight: number) => {
    setCriteria(prev => prev.map(c => 
      c.id === criteriaId ? { ...c, weight } : c
    ))
  }

  const addCustomCriteria = (criteria: Omit<ComparisonCriteria, 'id'>) => {
    const id = criteria.name.toLowerCase().replace(/\s+/g, '_')
    setCriteria(prev => [...prev, { ...criteria, id }])
  }

  const removeCriteria = (criteriaId: string) => {
    setCriteria(prev => prev.filter(c => c.id !== criteriaId))
  }

  const resetCriteria = () => {
    setCriteria(DEFAULT_CRITERIA)
  }

  // Estatísticas da comparação
  const comparisonStats = useMemo(() => {
    if (selectedDeals.length === 0) return null

    const selectedMetrics = dealMetrics.filter(d => selectedDeals.includes(d.id))
    const totalVolume = selectedMetrics.reduce((sum, d) => sum + d.volume, 0)
    const totalExpectedValue = selectedMetrics.reduce((sum, d) => sum + d.expectedValue, 0)
    const avgProbability = selectedMetrics.reduce((sum, d) => sum + d.avgProbability, 0) / selectedMetrics.length
    const avgRiskScore = selectedMetrics.reduce((sum, d) => sum + d.riskScore, 0) / selectedMetrics.length

    return {
      totalVolume,
      totalExpectedValue,
      avgProbability,
      avgRiskScore,
      dealCount: selectedDeals.length
    }
  }, [selectedDeals, dealMetrics])

  return {
    // Data
    dealMetrics,
    dealScores,
    sortedDeals,
    comparisonStats,
    
    // State
    selectedDeals,
    criteria,
    sortBy,
    
    // Actions
    toggleDealSelection,
    selectAllDeals,
    clearSelection,
    setSortBy,
    updateCriteriaWeight,
    addCustomCriteria,
    removeCriteria,
    resetCriteria,
    
    // Computed
    hasSelection: selectedDeals.length > 0,
    canCompare: selectedDeals.length >= 2,
  }
}