import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Filter, Calendar, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const STORAGE_KEY = 'leads.summaryCards.collapsed'

export interface LeadsSummaryCardsProps {
  openLeads: number
  createdThisMonth: number
  qualifiedThisMonth: number
  isLoading?: boolean
  isMetricsLoading?: boolean
  isMetricsError?: boolean
}

/**
 * Summary cards for leads page showing key metrics.
 * Supports minimize/maximize with localStorage persistence.
 */
export function LeadsSummaryCards({
  openLeads,
  createdThisMonth,
  qualifiedThisMonth,
  isLoading = false,
  isMetricsLoading = false,
  isMetricsError = false
}: LeadsSummaryCardsProps) {
  // Initialize collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  // Persist collapsed state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isCollapsed ? '1' : '0')
    } catch {
      // Ignore localStorage errors
    }
  }, [isCollapsed])

  const handleToggle = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  // Render metric value with loading/error states
  const renderMetricValue = (value: number, isMetricLoading: boolean, isError: boolean) => {
    if (isLoading || isMetricLoading) {
      return <Skeleton className="h-8 w-16" data-testid="metric-skeleton" />
    }
    if (isError) {
      return <span className="text-2xl font-bold text-muted-foreground">—</span>
    }
    return <p className="text-2xl font-bold">{value}</p>
  }

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
      <div className="flex items-center justify-between mb-2">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-muted-foreground hover:text-foreground"
            aria-expanded={!isCollapsed}
            aria-controls="leads-summary-cards-content"
            data-testid="leads-summary-toggle"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="h-4 w-4" />
                Mostrar resumo
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4" />
                Minimizar
              </>
            )}
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent
        id="leads-summary-cards-content"
        className="animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <div 
          className="grid gap-4 md:grid-cols-3"
          data-testid="leads-summary-cards"
        >
          {/* Leads em Aberto */}
          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Leads em Aberto
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" data-testid="metric-skeleton" />
                ) : (
                  <p className="text-2xl font-bold">{openLeads}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Filter className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          {/* Criados no Mês */}
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Criados no Mês
                </p>
                {renderMetricValue(createdThisMonth, isMetricsLoading, isMetricsError)}
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600">
                <Calendar className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          {/* Qualificados no Mês */}
          <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Qualificados no Mês
                </p>
                {renderMetricValue(qualifiedThisMonth, isMetricsLoading, isMetricsError)}
              </div>
              <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
                <BarChart3 className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleContent>

      {/* Minimized state indicator */}
      {isCollapsed && (
        <div 
          className="bg-muted/30 border border-dashed rounded-lg py-3 px-4 text-center text-sm text-muted-foreground"
          data-testid="leads-summary-collapsed"
        >
          <span>Resumo oculto</span>
          <span className="mx-2">•</span>
          <span>{openLeads} leads em aberto</span>
          {!isMetricsLoading && !isMetricsError && (
            <>
              <span className="mx-2">•</span>
              <span>{createdThisMonth} criados</span>
              <span className="mx-2">•</span>
              <span>{qualifiedThisMonth} qualificados</span>
            </>
          )}
        </div>
      )}
    </Collapsible>
  )
}
