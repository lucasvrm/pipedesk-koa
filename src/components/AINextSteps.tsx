import { useState } from 'react'
import { useKV } from '@/hooks/useKV'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkle, CheckCircle, Clock } from '@phosphor-icons/react'
import { MasterDeal, PlayerTrack, Task, Comment } from '@/lib/types'
import { toast } from 'sonner'

interface AINextStepsProps {
  dealId?: string
  trackId?: string
  currentStage?: string
}

interface Suggestion {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'task' | 'milestone' | 'decision'
}

export default function AINextSteps({ dealId, trackId, currentStage }: AINextStepsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [masterDeals] = useKV<MasterDeal[]>('masterDeals', [])
  const [playerTracks] = useKV<PlayerTrack[]>('playerTracks', [])
  const [tasks] = useKV<Task[]>('tasks', [])
  const [comments] = useKV<Comment[]>('comments', [])

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true)
    
    try {
      let contextInfo = ''
      
      if (dealId) {
        const deal = (masterDeals || []).find(d => d.id === dealId)
        const relatedTracks = (playerTracks || []).filter(t => t.masterDealId === dealId)
        const dealComments = (comments || []).filter(c => c.entityId === dealId && c.entityType === 'deal')
        
        if (deal) {
          contextInfo = `Tipo de negócio: ${deal.operationType}
Status: ${deal.status}
Volume: R$ ${deal.volume}
Prazo: ${deal.deadline}
Player tracks ativos: ${relatedTracks.filter(t => t.status === 'active').length}
Observações: ${deal.observations || 'Nenhuma'}
Últimos comentários: ${dealComments.slice(-3).map(c => c.content).join('; ')}`
        }
      } else if (trackId) {
        const track = (playerTracks || []).find(t => t.id === trackId)
        const trackTasks = (tasks || []).filter(t => t.playerTrackId === trackId)
        const trackComments = (comments || []).filter(c => c.entityId === trackId && c.entityType === 'track')
        
        if (track) {
          const deal = (masterDeals || []).find(d => d.id === track.masterDealId)
          contextInfo = `Player: ${track.playerName}
Estágio atual: ${track.currentStage}
Probabilidade: ${track.probability}%
Volume: R$ ${track.trackVolume}
Status: ${track.status}
Notas: ${track.notes || 'Nenhuma'}
Tarefas pendentes: ${trackTasks.filter(t => !t.completed).length}
Tipo do negócio master: ${deal?.operationType || 'N/A'}
Últimos comentários: ${trackComments.slice(-3).map(c => c.content).join('; ')}`
        }
      }

      const promptText = `Você é um consultor especializado em M&A e investment banking.

Com base nas seguintes informações de um ${dealId ? 'negócio master' : 'player track'}, sugira os próximos 3-5 passos mais importantes e acionáveis:

${contextInfo}

${currentStage ? `Estágio atual: ${currentStage}` : ''}

Para cada sugestão, forneça:
1. Um título conciso e acionável
2. Uma descrição breve (1-2 frases)
3. Prioridade (high, medium, low)
4. Categoria (task, milestone, decision)

Retorne APENAS um JSON válido no seguinte formato:
{
  "suggestions": [
    {
      "title": "Título da ação",
      "description": "Descrição detalhada",
      "priority": "high",
      "category": "task"
    }
  ]
}`

      const response = await window.spark.llm(promptText, 'gpt-4o-mini', true)
      const parsed = JSON.parse(response)
      
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        setSuggestions(parsed.suggestions)
        toast.success(`${parsed.suggestions.length} sugestões geradas`)
      } else {
        toast.error('Formato de resposta inválido')
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
      toast.error('Erro ao gerar sugestões')
    } finally {
      setIsGenerating(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      case 'medium':
        return 'bg-accent/10 text-accent border-accent/20'
      case 'low':
        return 'bg-muted text-muted-foreground border-border'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'milestone':
        return <CheckCircle className="h-4 w-4" />
      case 'decision':
        return <Sparkle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkle className="text-accent" />
            Próximos Passos Sugeridos (IA)
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSuggestions}
            disabled={isGenerating}
          >
            {isGenerating ? 'Gerando...' : 'Gerar Sugestões'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Sparkle className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Clique em "Gerar Sugestões" para receber recomendações personalizadas com IA</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="border-l-4" style={{
                borderLeftColor: suggestion.priority === 'high' ? 'hsl(var(--destructive))' :
                                 suggestion.priority === 'medium' ? 'hsl(var(--accent))' :
                                 'hsl(var(--muted-foreground))'
              }}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getCategoryIcon(suggestion.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                        <Badge className={getPriorityColor(suggestion.priority)} variant="outline">
                          {suggestion.priority === 'high' ? 'Alta' :
                           suggestion.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.category === 'task' ? 'Tarefa' :
                           suggestion.category === 'milestone' ? 'Marco' : 'Decisão'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
