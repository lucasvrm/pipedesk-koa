import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import { Sparkle, CalendarBlank, Download, ArrowsClockwise } from '@phosphor-icons/react'
import { Comment, Task, StageHistory, PlayerTrack, MasterDeal } from '../lib/types'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'

interface ActivitySummary {
  id: string
  entityId: string
  entityType: 'deal' | 'track'
  summaryType: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  periodStart: string
  periodEnd: string
  generatedAt: string
  content: string
  tokensUsed?: number
}

interface ActivitySummarizerProps {
  entityId: string
  entityType: 'deal' | 'track'
}

export function ActivitySummarizer({ entityId, entityType }: ActivitySummarizerProps) {
  const [summaries, setSummaries] = useKV<ActivitySummary[]>('activity_summaries', [])
  const [comments] = useKV<Comment[]>('comments', [])
  const [tasks] = useKV<Task[]>('tasks', [])
  const [stageHistory] = useKV<StageHistory[]>('stage_history', [])
  const [playerTracks] = useKV<PlayerTrack[]>('player_tracks', [])
  const [masterDeals] = useKV<MasterDeal[]>('master_deals', [])
  
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeSummary, setActiveSummary] = useState<ActivitySummary | null>(null)

  const getPeriodDates = () => {
    const end = endOfDay(new Date())
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 }
    const start = startOfDay(subDays(end, daysMap[selectedPeriod]))
    return { start, end }
  }

  const collectActivities = () => {
    const { start, end } = getPeriodDates()
    
    // Collect relevant activities
    const relevantComments = (comments ?? []).filter(c => {
      if (c.entityId !== entityId) return false
      const createdAt = new Date(c.createdAt)
      return createdAt >= start && createdAt <= end
    })

    const relevantTasks = (tasks ?? []).filter(t => {
      if (entityType === 'track') {
        return t.playerTrackId === entityId
      } else {
        // For deals, get all tasks from related player tracks
        const track = (playerTracks ?? []).find(p => p.id === t.playerTrackId)
        return track?.masterDealId === entityId
      }
    }).filter(t => {
      const createdAt = new Date(t.createdAt)
      return createdAt >= start && createdAt <= end
    })

    const relevantStageChanges = (stageHistory ?? []).filter(h => {
      if (entityType === 'track') {
        return h.playerTrackId === entityId
      } else {
        const track = (playerTracks ?? []).find(p => p.id === h.playerTrackId)
        return track?.masterDealId === entityId
      }
    }).filter(h => {
      const enteredAt = new Date(h.enteredAt)
      return enteredAt >= start && enteredAt <= end
    })

    return {
      comments: relevantComments,
      tasks: relevantTasks,
      stageChanges: relevantStageChanges,
    }
  }

  const generateSummaryText = async () => {
    const { start, end } = getPeriodDates()
    const activities = collectActivities()

    // Determine summary type based on period
    const getSummaryType = (): 'daily' | 'weekly' | 'monthly' | 'quarterly' => {
      if (selectedPeriod === '7d') return 'weekly'
      if (selectedPeriod === '30d') return 'monthly'
      return 'quarterly' // 90d
    }

    // Build context for AI
    const context = {
      period: `${format(start, 'dd/MM/yyyy', { locale: ptBR })} até ${format(end, 'dd/MM/yyyy', { locale: ptBR })}`,
      commentsCount: activities.comments.length,
      tasksCreated: activities.tasks.filter(t => new Date(t.createdAt) >= start).length,
      tasksCompleted: activities.tasks.filter(t => t.completed && t.updatedAt && new Date(t.updatedAt) >= start).length,
      stageChanges: activities.stageChanges.length,
    }

    // Format activities for summarization
    const activityText = `
# Resumo de Atividades - ${context.period}

## Estatísticas Gerais
- Comentários: ${context.commentsCount}
- Tarefas criadas: ${context.tasksCreated}
- Tarefas concluídas: ${context.tasksCompleted}
- Mudanças de etapa: ${context.stageChanges}

## Comentários Recentes
${activities.comments.slice(0, 10).map(c => `- ${format(new Date(c.createdAt), 'dd/MM HH:mm')}: ${c.content.slice(0, 100)}${c.content.length > 100 ? '...' : ''}`).join('\n')}

## Tarefas Criadas
${activities.tasks.slice(0, 10).map(t => `- ${t.title}${t.completed ? ' ✓' : ''}`).join('\n')}

## Mudanças de Etapa
${activities.stageChanges.map(s => `- ${s.stage} (${format(new Date(s.enteredAt), 'dd/MM HH:mm')})`).join('\n')}

**Análise**: 
${context.tasksCompleted > 0 ? `✓ ${context.tasksCompleted} tarefa(s) concluída(s) no período. ` : ''}
${context.stageChanges > 0 ? `📊 ${context.stageChanges} mudança(s) de etapa. ` : ''}
${context.commentsCount > 5 ? `💬 Alta atividade de comunicação (${context.commentsCount} comentários). ` : ''}
${context.commentsCount === 0 && context.tasksCompleted === 0 ? '⚠️ Baixa atividade no período. ' : ''}

**Próximos Passos Sugeridos**:
${activities.tasks.filter(t => !t.completed).length > 0 ? `- Concluir ${activities.tasks.filter(t => !t.completed).length} tarefa(s) pendente(s)` : ''}
${activities.tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length > 0 ? `\n- ⚠️ ${activities.tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length} tarefa(s) atrasada(s)` : ''}
`

    return { activityText, summaryType: getSummaryType() }
  }

  const handleGenerateSummary = async () => {
    setIsGenerating(true)
    try {
      const { activityText, summaryType } = await generateSummaryText()
      const { start, end } = getPeriodDates()

      const newSummary: ActivitySummary = {
        id: crypto.randomUUID(),
        entityId,
        entityType,
        summaryType,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        generatedAt: new Date().toISOString(),
        content: activityText,
        tokensUsed: Math.floor(activityText.length / 4), // Rough estimate
      }

      setSummaries([...(summaries ?? []), newSummary])
      setActiveSummary(newSummary)
      toast.success('Sumário gerado com sucesso!')
    } catch (error) {
      console.error('Error generating summary:', error)
      toast.error('Erro ao gerar sumário')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportSummary = () => {
    if (!activeSummary) return

    const blob = new Blob([activeSummary.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resumo-atividades-${format(new Date(activeSummary.periodStart), 'yyyy-MM-dd')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Sumário exportado!')
  }

  // Load existing summaries for this entity
  const existingSummaries = (summaries ?? [])
    .filter(s => s.entityId === entityId && s.entityType === entityType)
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())

  const latestSummary = existingSummaries[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">
                <div className="flex items-center gap-2">
                  <CalendarBlank className="h-4 w-4" />
                  <span>Últimos 7 dias</span>
                </div>
              </SelectItem>
              <SelectItem value="30d">
                <div className="flex items-center gap-2">
                  <CalendarBlank className="h-4 w-4" />
                  <span>Últimos 30 dias</span>
                </div>
              </SelectItem>
              <SelectItem value="90d">
                <div className="flex items-center gap-2">
                  <CalendarBlank className="h-4 w-4" />
                  <span>Últimos 90 dias</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            size="sm"
          >
            <Sparkle className="mr-2 h-4 w-4" weight="fill" />
            {isGenerating ? 'Gerando...' : 'Gerar Sumário'}
          </Button>
        </div>

        {activeSummary && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSummary}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        )}
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList>
          <TabsTrigger value="current">Sumário Atual</TabsTrigger>
          <TabsTrigger value="history">
            Histórico
            {existingSummaries.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {existingSummaries.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {activeSummary || latestSummary ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Sumário de Atividades</CardTitle>
                    <CardDescription>
                      Gerado em {format(new Date((activeSummary || latestSummary)!.generatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  {(activeSummary || latestSummary)!.tokensUsed && (
                    <Badge variant="outline">
                      ~{(activeSummary || latestSummary)!.tokensUsed} tokens
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{(activeSummary || latestSummary)!.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhum sumário gerado ainda.
                  <br />
                  Selecione um período e clique em "Gerar Sumário".
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {existingSummaries.length > 0 ? (
            existingSummaries.map((summary) => (
              <Card 
                key={summary.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setActiveSummary(summary)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {format(new Date(summary.periodStart), 'dd/MM/yyyy')} - {format(new Date(summary.periodEnd), 'dd/MM/yyyy')}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(summary.generatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {summary.summaryType === 'daily' ? 'Diário' : 
                         summary.summaryType === 'weekly' ? 'Semanal' : 
                         summary.summaryType === 'monthly' ? 'Mensal' : 
                         'Trimestral'}
                      </Badge>
                      {summary.tokensUsed && (
                        <Badge variant="outline">
                          {summary.tokensUsed} tokens
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowsClockwise className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum sumário salvo ainda
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
