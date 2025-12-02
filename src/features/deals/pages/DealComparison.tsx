import React from 'react'
import { DealComparisonMatrix } from '@/features/deals/components/DealComparisonMatrix'
import { useDeals } from '@/services/dealService'
import { usePlayerTracks } from '@/features/deals/hooks/usePlayerTracks'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'

export default function DealComparison() {
  const { data: deals, loading: dealsLoading, error: dealsError } = useDeals()
  const { data: playerTracks, loading: tracksLoading, error: tracksError } = usePlayerTracks()

  const loading = dealsLoading || tracksLoading
  const error = dealsError || tracksError

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dados dos deals...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">Erro ao carregar dados</p>
            <p className="text-muted-foreground text-sm">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!deals || deals.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium mb-2">Nenhum deal encontrado</p>
            <p className="text-muted-foreground text-sm">
              Crie alguns deals primeiro para usar a funcionalidade de comparação
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <DealComparisonMatrix 
        deals={deals} 
        playerTracks={playerTracks || []} 
      />
    </div>
  )
}