import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MasterDeal, PlayerTrack, Task, User, Comment } from '@/lib/types'
import { MagnifyingGlass, Briefcase, Users, ListChecks, ChatCircle } from '@phosphor-icons/react'
import { formatCurrency, formatDate, anonymizePlayerName } from '@/lib/helpers'
import { canViewPlayerName } from '@/features/rbac'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
  onSelectDeal?: (dealId: string) => void
  onSelectTrack?: (trackId: string) => void
  onSelectTask?: (taskId: string) => void
}

interface SearchResult {
  id: string
  type: 'deal' | 'track' | 'task' | 'comment'
  title: string
  subtitle: string
  metadata: string
  entityId: string
}

export default function GlobalSearch({
  open,
  onOpenChange,
  currentUser,
  onSelectDeal,
  onSelectTrack,
  onSelectTask,
}: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [masterDeals] = useKV<MasterDeal[]>('masterDeals', [])
  const [playerTracks] = useKV<PlayerTrack[]>('playerTracks', [])
  const [tasks] = useKV<Task[]>('tasks', [])
  const [comments] = useKV<Comment[]>('comments', [])
  const [users] = useKV<User[]>('users', [])

  const canSeePlayerNames = canViewPlayerName(currentUser.role)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const searchResults: SearchResult[] = []

    ;(masterDeals || [])
      .filter(d => !d.deletedAt)
      .forEach(deal => {
        const matches = 
          deal.clientName.toLowerCase().includes(query) ||
          deal.observations.toLowerCase().includes(query) ||
          deal.operationType.toLowerCase().includes(query)

        if (matches) {
          searchResults.push({
            id: deal.id,
            type: 'deal',
            title: deal.clientName,
            subtitle: deal.observations || 'Sem observações',
            metadata: `${formatCurrency(deal.volume)} • ${formatDate(deal.deadline)}`,
            entityId: deal.id,
          })
        }
      })

    ;(playerTracks || []).forEach((track, index) => {
      const playerName = canSeePlayerNames 
        ? track.playerName 
        : anonymizePlayerName(track.playerName, track.id, true)

      const matches =
        track.playerName.toLowerCase().includes(query) ||
        playerName.toLowerCase().includes(query) ||
        track.notes.toLowerCase().includes(query) ||
        track.currentStage.toLowerCase().includes(query)

      if (matches) {
        const deal = (masterDeals || []).find(d => d.id === track.masterDealId)
        searchResults.push({
          id: track.id,
          type: 'track',
          title: playerName,
          subtitle: deal?.clientName || 'Negócio não encontrado',
          metadata: `${track.currentStage} • ${track.probability}% • ${formatCurrency(track.trackVolume)}`,
          entityId: track.id,
        })
      }
    })

    ;(tasks || []).forEach(task => {
      const matches =
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)

      if (matches) {
        const track = (playerTracks || []).find(t => t.id === task.playerTrackId)
        const playerName = track
          ? (canSeePlayerNames ? track.playerName : anonymizePlayerName(track.playerName, track.id, true))
          : 'Track não encontrado'

        searchResults.push({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: playerName,
          metadata: task.dueDate ? formatDate(task.dueDate) : 'Sem prazo',
          entityId: task.playerTrackId,
        })
      }
    })

    ;(comments || []).forEach(comment => {
      const matches = comment.content.toLowerCase().includes(query)

      if (matches) {
        const author = (users || []).find(u => u.id === comment.authorId)
        const entityLabel = 
          comment.entityType === 'deal' ? 'Negócio' :
          comment.entityType === 'track' ? 'Player Track' :
          'Tarefa'

        searchResults.push({
          id: comment.id,
          type: 'comment',
          title: comment.content.slice(0, 100),
          subtitle: `${author?.name || 'Usuário'} comentou em ${entityLabel}`,
          metadata: formatDate(comment.createdAt),
          entityId: comment.entityId,
        })
      }
    })

    setResults(searchResults)
  }, [searchQuery, masterDeals, playerTracks, tasks, comments, users, canSeePlayerNames])

  const handleSelectResult = (result: SearchResult) => {
    switch (result.type) {
      case 'deal':
        onSelectDeal?.(result.id)
        break
      case 'track':
        onSelectTrack?.(result.id)
        break
      case 'task':
      case 'comment':
        onSelectTask?.(result.entityId)
        break
    }
    onOpenChange(false)
    setSearchQuery('')
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'deal':
        return <Briefcase className="text-primary" />
      case 'track':
        return <Users className="text-accent" />
      case 'task':
        return <ListChecks className="text-success" />
      case 'comment':
        return <ChatCircle className="text-muted-foreground" />
      default:
        return <MagnifyingGlass />
    }
  }

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'deal':
        return 'Negócio'
      case 'track':
        return 'Player Track'
      case 'task':
        return 'Tarefa'
      case 'comment':
        return 'Comentário'
      default:
        return type
    }
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Busca Global</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar negócios, players, tarefas, comentários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-[500px] pr-4">
          {!searchQuery.trim() ? (
            <div className="text-center py-12 text-muted-foreground">
              <MagnifyingGlass className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Digite para buscar em todos os negócios, players, tarefas e comentários</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Nenhum resultado encontrado para "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedResults).map(([type, typeResults]) => (
                <div key={type}>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    {getResultIcon(type)}
                    {getResultTypeLabel(type)} ({typeResults.length})
                  </h3>
                  <div className="space-y-1">
                    {typeResults.map(result => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectResult(result)}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm mb-1 truncate">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                            <p className="text-xs text-muted-foreground mt-1">{result.metadata}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {getResultTypeLabel(result.type)}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="text-xs text-muted-foreground">
          {results.length > 0 && `${results.length} resultado(s) encontrado(s)`}
        </div>
      </DialogContent>
    </Dialog>
  )
}
