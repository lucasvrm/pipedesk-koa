import { 
  PortfolioMatrix 
} from '@/features/analytics/components/charts/PortfolioMatrix'
import { 
  ConversionFunnel 
} from '@/features/analytics/components/charts/ConversionFunnel'
import { 
  WeightedForecastChart 
} from '@/features/analytics/components/charts/WeightedForecastChart'
import { 
  TeamWorkloadHeatmap 
} from '@/features/analytics/components/charts/TeamWorkloadHeatmap'

export function DealsAnalyticsDashboard() {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        {/* Linha 1: Estratégia e Funil */}
        <div className="h-[450px]">
          <PortfolioMatrix />
        </div>
        <div className="h-[450px]">
          <ConversionFunnel />
        </div>

        {/* Linha 2: Financeiro e Equipe */}
        <div className="h-[450px]">
          <WeightedForecastChart />
        </div>
        <div className="h-[450px]">
          <TeamWorkloadHeatmap />
        </div>
      </div>
    </div>
  )
}