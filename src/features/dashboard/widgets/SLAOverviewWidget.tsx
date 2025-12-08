import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from '@phosphor-icons/react'
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics'
import { useDashboardFilters } from '@/contexts/DashboardFiltersContext'
import { PlayerStage } from '@/lib/types'

// Helper para labels de estágio (deveria ser compartilhado, mas duplicando para simplificar refatoração por enquanto)
const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      nda: 'NDA', analysis: 'Análise', proposal: 'Proposta', negotiation: 'Negociação', closing: 'Fechamento',
      tease: 'Teaser', offer: 'Oferta', diligence: 'Diligência'
    }
    return labels[stage] || stage
}

export function SLAOverviewWidget() {
    const { filters } = useDashboardFilters()
    const { data: metrics, isLoading } = useEnhancedAnalytics(
      filters.dateRangePreset,
      filters.selectedTeamMemberId,
      filters.selectedOperationTypeId
    )

    if (isLoading) return <Card className="h-full"><CardContent className="p-6">Carregando SLA...</CardContent></Card>
    if (!metrics) return null;

    return (
        <Card className="h-full">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" /> Violações de SLA
            </CardTitle>
        </CardHeader>
        <CardContent>
            {metrics.slaBreach.total > 0 ? (
            <div className="space-y-4">
                <div className="text-3xl font-bold text-destructive">{metrics.slaBreach.total} <span className="text-sm font-normal text-muted-foreground">violações</span></div>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {Object.entries(metrics.slaBreach.byStage).map(([stage, count]) => (
                    count > 0 && (
                    <div key={stage} className="flex items-center justify-between text-sm border-b py-2 last:border-0">
                        <span className="font-medium">{getStageLabel(stage)}</span>
                        <span className="text-destructive font-medium">{count}</span>
                    </div>
                    )
                ))}
                </div>
            </div>
            ) : (
            <div className="text-center py-12 flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">✓</div>
                <p className="text-sm text-muted-foreground">Tudo dentro do prazo.</p>
            </div>
            )}
        </CardContent>
        </Card>
    )
}
