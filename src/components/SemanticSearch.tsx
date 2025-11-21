import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { MagnifyingGlass, Sparkle, FileText, Briefcase, CheckSquare } from '@phosphor-icons/react'
import { MasterDeal, PlayerTrack, Task, Comment } from '../lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '../lib/utils'

interface SearchResult {
  id: string
  type: 'deal' | 'track' | 'task' | 'comment'
  title: string
  description: string
  relevanceScore: number
  metadata?: Record<string, any>
  entityId: string
}

interface SemanticSearchProps {
  onSelectResult?: (result: SearchResult) => void
  placeholder?: string
}

export function SemanticSearch({ onSelectResult, placeholder = 'Buscar negócios, players, tarefas...' }: SemanticSearchProps) {
  const [masterDeals] = useKV<MasterDeal[]>('master_deals', [])
  const [playerTracks] = useKV<PlayerTrack[]>('player_tracks', [])
  const [tasks] = useKV<Task[]>('tasks', [])
  const [comments] = useKV<Comment[]>('comments', [])

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'all' | 'deals' | 'tracks' | 'tasks' | 'comments'>('all')

  // Enhanced search algorithm with fuzzy matching and relevance scoring
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const normalizedQuery = query.toLowerCase().trim();
    const queryTerms = normalizedQuery.split(/\s+/);

    const results: SearchResult[] = [];

    // Search in master deals
    ;(masterDeals ?? [])
      .filter(d => !d.deletedAt)
      .forEach(deal => {
        let score = 0
        const searchableText = `${deal.clientName} ${deal.observations} ${deal.operationType}`.toLowerCase()
        
        // Exact match bonus
        if (searchableText.includes(normalizedQuery)) {
          score += 100
        }
        
        // Term matching with position weight
        queryTerms.forEach((term, index) => {
          if (searchableText.includes(term)) {
            score += 10 - (index * 0.5) // Earlier terms weighted higher
          }
          
          // Bonus for matches in title
          if (deal.clientName.toLowerCase().includes(term)) {
            score += 20
          }
        })

        // Fuzzy matching for typos
        queryTerms.forEach(term => {
          const words = searchableText.split(/\s+/)
          words.forEach(word => {
            if (levenshteinDistance(term, word) <= 2 && term.length > 3) {
              score += 5
            }
          })
        })

        if (score > 0) {
          results.push({
            id: deal.id,
            type: 'deal',
            title: deal.clientName,
            description: `${deal.operationType} • ${deal.observations || 'Sem descrição'}`,
            relevanceScore: score,
            metadata: {
              volume: deal.volume,
              status: deal.status,
              deadline: deal.deadline,
            },
            entityId: deal.id,
          })
        }
      })

    // Search in player tracks
    ;(playerTracks ?? [])
      .filter(p => p.status !== 'cancelled')
      .forEach(track => {
        let score = 0
        const searchableText = `${track.playerName} ${track.notes}`.toLowerCase()
        
        if (searchableText.includes(normalizedQuery)) {
          score += 100
        }
        
        queryTerms.forEach((term, index) => {
          if (searchableText.includes(term)) {
            score += 10 - (index * 0.5)
          }
          
          if (track.playerName.toLowerCase().includes(term)) {
            score += 20
          }
        })

        // Fuzzy matching
        queryTerms.forEach(term => {
          const words = searchableText.split(/\s+/)
          words.forEach(word => {
            if (levenshteinDistance(term, word) <= 2 && term.length > 3) {
              score += 5
            }
          })
        })

        if (score > 0) {
          const deal = (masterDeals ?? []).find(d => d.id === track.masterDealId)
          results.push({
            id: track.id,
            type: 'track',
            title: track.playerName,
            description: `${deal?.clientName || 'Deal'} • ${track.currentStage}`,
            relevanceScore: score,
            metadata: {
              stage: track.currentStage,
              probability: track.probability,
              volume: track.trackVolume,
            },
            entityId: track.id,
          })
        }
      })

    // Search in tasks
    ;(tasks ?? []).forEach(task => {
      let score = 0
      const searchableText = `${task.title} ${task.description}`.toLowerCase()
      
      if (searchableText.includes(normalizedQuery)) {
        score += 100
      }
      
      queryTerms.forEach((term, index) => {
        if (searchableText.includes(term)) {
          score += 10 - (index * 0.5)
        }
        
        if (task.title.toLowerCase().includes(term)) {
          score += 20
        }
      })

      // Fuzzy matching
      queryTerms.forEach(term => {
        const words = searchableText.split(/\s+/)
        words.forEach(word => {
          if (levenshteinDistance(term, word) <= 2 && term.length > 3) {
            score += 5
          }
        })
      })

      if (score > 0) {
        const track = (playerTracks ?? []).find(p => p.id === task.playerTrackId)
        results.push({
          id: task.id,
          type: 'task',
          title: task.title,
          description: `${track?.playerName || 'Player'} • ${task.status || 'todo'}`,
          relevanceScore: score,
          metadata: {
            completed: task.completed,
            dueDate: task.dueDate,
            priority: task.priority,
          },
          entityId: task.id,
          })
        }
    })

    // Search in comments
    ;(comments ?? []).forEach(comment => {
      let score = 0
      const searchableText = comment.content.toLowerCase()
      
      if (searchableText.includes(normalizedQuery)) {
        score += 80 // Lower than exact matches in titles
      }
      
      queryTerms.forEach((term, index) => {
        if (searchableText.includes(term)) {
          score += 8 - (index * 0.5)
        }
      })

      // Fuzzy matching
      queryTerms.forEach(term => {
        const words = searchableText.split(/\s+/)
        words.forEach(word => {
          if (levenshteinDistance(term, word) <= 2 && term.length > 3) {
            score += 3
          }
        })
      })

      if (score > 0) {
        results.push({
          id: comment.id,
          type: 'comment',
          title: comment.content.slice(0, 80) + (comment.content.length > 80 ? '...' : ''),
          description: `Comentário • ${format(new Date(comment.createdAt), 'dd/MM/yyyy', { locale: ptBR })}`,
          relevanceScore: score,
          metadata: {
            entityType: comment.entityType,
            entityId: comment.entityId,
          },
          entityId: comment.entityId,
        })
      }
    })

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore)
    
    setSearchResults(results)
    setIsSearching(false)
  }

  // Simple Levenshtein distance for fuzzy matching
  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = []

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[b.length][a.length]
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, masterDeals, playerTracks, tasks, comments])

  const getFilteredResults = () => {
    if (selectedTab === 'all') return searchResults
    
    // Explicit mapping of tab values to entity types
    const tabToEntityType: Record<string, string> = {
      'deals': 'deal',
      'tracks': 'track',
      'tasks': 'task',
      'comments': 'comment',
    }
    
    const entityType = tabToEntityType[selectedTab]
    return entityType ? searchResults.filter(r => r.type === entityType) : searchResults
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'deal': return <Briefcase className="h-5 w-5" />
      case 'track': return <Briefcase className="h-5 w-5" />
      case 'task': return <CheckSquare className="h-5 w-5" />
      case 'comment': return <FileText className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getResultColor = (type: string) => {
    switch (type) {
      case 'deal': return 'text-blue-600'
      case 'track': return 'text-purple-600'
      case 'task': return 'text-green-600'
      case 'comment': return 'text-amber-600'
      default: return 'text-gray-600'
    }
  }

  const filteredResults = getFilteredResults()

  const resultCounts = {
    all: searchResults.length,
    deals: searchResults.filter(r => r.type === 'deal').length,
    tracks: searchResults.filter(r => r.type === 'track').length,
    tasks: searchResults.filter(r => r.type === 'task').length,
    comments: searchResults.filter(r => r.type === 'comment').length,
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {isSearching && (
          <Sparkle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 animate-pulse" weight="fill" />
        )}
      </div>

      {searchQuery && (
        <>
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">
                Todos
                {resultCounts.all > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {resultCounts.all}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="deals">
                Deals
                {resultCounts.deals > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {resultCounts.deals}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tracks">
                Players
                {resultCounts.tracks > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {resultCounts.tracks}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tasks">
                Tarefas
                {resultCounts.tasks > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {resultCounts.tasks}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="comments">
                Comentários
                {resultCounts.comments > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {resultCounts.comments}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-4">
              <ScrollArea className="h-[500px] pr-4">
                {filteredResults.length > 0 ? (
                  <div className="space-y-2">
                    {filteredResults.map((result) => (
                      <Card
                        key={result.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onSelectResult?.(result)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <span className={cn('mt-1', getResultColor(result.type))}>
                              {getResultIcon(result.type)}
                            </span>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base">{result.title}</CardTitle>
                                <Badge variant="outline" className="text-xs">
                                  {result.type === 'deal' ? 'Deal' : result.type === 'track' ? 'Player' : result.type === 'task' ? 'Tarefa' : 'Comentário'}
                                </Badge>
                              </div>
                              <CardDescription className="text-sm">
                                {result.description}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(result.relevanceScore)}% match
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <MagnifyingGlass className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        Nenhum resultado encontrado para "{searchQuery}"
                      </p>
                    </CardContent>
                  </Card>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
