import { useState, useMemo } from 'react'
import { useUnifiedTimeline, TimelineItem } from '@/hooks/useUnifiedTimeline'
import { useCreateComment } from '@/services/commentService'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  ChatCircle,
  Lightning,
  PaperPlaneRight,
  ClockCounterClockwise,
  Plus,
  PencilSimple,
  Trash,
  ArrowRight,
  FileArrowUp,
  CheckCircle,
  XCircle,
  WarningCircle,
  Sparkle,
  ArrowsDownUp
} from '@phosphor-icons/react'
import { format, formatDistanceToNow, isToday, isYesterday, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/helpers'
import { toast } from 'sonner'

interface UnifiedTimelineProps {
  entityId: string
  entityType: 'deal' | 'lead' | 'company'
}

// Group items by date
function groupItemsByDate(items: TimelineItem[]): Map<string, TimelineItem[]> {
  const groups = new Map<string, TimelineItem[]>()

  items.forEach(item => {
    const date = new Date(item.date)
    let dateKey: string

    if (isToday(date)) {
      dateKey = 'Hoje'
    } else if (isYesterday(date)) {
      dateKey = 'Ontem'
    } else {
      dateKey = format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(item)
  })

  return groups
}

export function UnifiedTimeline({ entityId, entityType }: UnifiedTimelineProps) {
  const { profile } = useAuth()
  const { items, isLoading, error, refetch } = useUnifiedTimeline(entityId, entityType)
  const createComment = useCreateComment()
  const [filter, setFilter] = useState<'all' | 'comment' | 'system'>('all')
  const [newComment, setNewComment] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredItems = useMemo(() => {
    return items.filter(i => filter === 'all' || i.type === filter || (filter === 'system' && i.type !== 'comment'))
  }, [items, filter])

  const groupedItems = useMemo(() => {
    return groupItemsByDate(filteredItems)
  }, [filteredItems])

  // Helper to get activity properties efficiently
  const getActivityProperties = useMemo(() => {
    return (item: TimelineItem) => {
      const lowerContent = item.content.toLowerCase()
      
      let icon, color
      
      if (item.type === 'comment') {
        icon = <ChatCircle className="h-4 w-4" weight="fill" />
        color = 'bg-blue-500 text-white'
      } else if (lowerContent.includes('status') || lowerContent.includes('fase') || lowerContent.includes('stage')) {
        icon = <ArrowRight className="h-4 w-4" weight="bold" />
        color = 'bg-amber-500 text-white'
      } else if (lowerContent.includes('criou') || lowerContent.includes('criado') || lowerContent.includes('adicionou')) {
        icon = <Plus className="h-4 w-4" weight="bold" />
        color = 'bg-emerald-500 text-white'
      } else if (lowerContent.includes('edit') || lowerContent.includes('atualiz')) {
        icon = <PencilSimple className="h-4 w-4" weight="bold" />
        color = 'bg-blue-500 text-white'
      } else if (lowerContent.includes('exclu') || lowerContent.includes('delet') || lowerContent.includes('removeu')) {
        icon = <Trash className="h-4 w-4" weight="bold" />
        color = 'bg-red-500 text-white'
      } else if (lowerContent.includes('arquivo') || lowerContent.includes('upload') || lowerContent.includes('documento')) {
        icon = <FileArrowUp className="h-4 w-4" weight="bold" />
        color = 'bg-indigo-500 text-white'
      } else if (lowerContent.includes('conclu') || lowerContent.includes('finaliz') || lowerContent.includes('completou')) {
        icon = <CheckCircle className="h-4 w-4" weight="bold" />
        color = 'bg-green-600 text-white'
      } else if (lowerContent.includes('cancel') || lowerContent.includes('rejeit')) {
        icon = <XCircle className="h-4 w-4" weight="bold" />
        color = 'bg-red-600 text-white'
      } else {
        icon = <Lightning className="h-4 w-4" weight="fill" />
        color = 'bg-slate-500 text-white'
      }
      
      const isImportant = (
        lowerContent.includes('fechou') ||
        lowerContent.includes('concluiu') ||
        lowerContent.includes('ganhou') ||
        lowerContent.includes('perdeu') ||
        lowerContent.includes('qualificou') ||
        (lowerContent.includes('status') && (lowerContent.includes('fechado') || lowerContent.includes('ganho') || lowerContent.includes('perdido')))
      )
      
      return { icon, color, isImportant }
    }
  }, [])

  const handleSendComment = async () => {
    if (!profile || !newComment.trim()) return

    setIsSubmitting(true)
    try {
      await createComment.mutateAsync({
        entityId,
        entityType,
        content: newComment.trim(),
        authorId: profile.id,
        mentions: []
      })
      setNewComment('')
      toast.success('Comentário adicionado')
    } catch (error) {
      console.error('Error creating comment:', error)
      toast.error('Erro ao adicionar comentário')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return { text, isTruncated: false }
    return { text: text.slice(0, maxLength) + '...', isTruncated: true }
  }

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col h-[600px] border rounded-lg bg-card">
        <div className="flex items-center justify-between p-3 border-b bg-muted/20">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-48" />
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="relative pl-12">
                <Skeleton className="absolute left-0 top-1 h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 border-t">
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-[600px] border rounded-lg bg-card">
        <div className="flex items-center justify-between p-3 border-b bg-muted/20">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <ClockCounterClockwise className="h-4 w-4" /> Timeline
          </h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <WarningCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-sm font-medium text-foreground mb-2">Erro ao carregar atividades</p>
          <p className="text-xs text-muted-foreground mb-4">
            Não foi possível carregar o histórico de atividades.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-card shadow-sm">
      {/* Header / Filters */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/20">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <ClockCounterClockwise className="h-4 w-4" /> Timeline
        </h3>
        <div className="flex items-center gap-1 bg-background p-0.5 rounded-md border">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="h-7 text-xs px-3"
          >
            Tudo
          </Button>
          <Button
            variant={filter === 'comment' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('comment')}
            className="h-7 text-xs px-3"
          >
            <ChatCircle className="mr-1.5 h-3.5 w-3.5" /> Comentários
          </Button>
          <Button
            variant={filter === 'system' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('system')}
            className="h-7 text-xs px-3"
          >
            <Lightning className="mr-1.5 h-3.5 w-3.5" /> Sistema
          </Button>
        </div>
      </div>

      {/* Feed Area */}
      <ScrollArea className="flex-1 p-4">
        {groupedItems.size === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ClockCounterClockwise className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Nenhuma atividade registrada ainda</p>
            <p className="text-xs text-muted-foreground">
              Comece adicionando um comentário ou realize alguma ação.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(groupedItems.entries()).map(([dateLabel, dateItems]) => (
              <div key={dateLabel} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <Badge variant="secondary" className="text-xs font-semibold px-3 py-1">
                    {dateLabel}
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Items for this date */}
                <div className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-0.5 before:bg-border">
                  {dateItems.map((item, idx) => {
                    const { icon, color, isImportant } = getActivityProperties(item)
                    const { text: truncatedContent, isTruncated } = truncateText(item.content, 200)
                    const isExpanded = expandedItems.has(item.id)
                    const displayContent = isExpanded || !isTruncated ? item.content : truncatedContent

                    return (
                      <div key={item.id} className="relative pl-12 group">
                        {/* Timeline Icon */}
                        <div className={cn(
                          "absolute left-0 top-1 h-8 w-8 rounded-full border-2 border-background flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                          color,
                          isImportant && "ring-2 ring-offset-2 ring-amber-400"
                        )}>
                          {icon}
                        </div>

                        {/* Content Card */}
                        <div className={cn(
                          "rounded-lg border transition-all",
                          item.type === 'comment' 
                            ? "bg-muted/30 border-muted-foreground/20 p-3" 
                            : "bg-card border-border/50 p-3 hover:border-primary/20"
                        )}>
                          {/* Header: Author, Type, Time */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Avatar className="h-6 w-6 border">
                                <AvatarImage src={item.author.avatar} />
                                <AvatarFallback className="text-[10px] bg-muted">
                                  {getInitials(item.author.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {item.author.name}
                                </span>
                                {item.type === 'comment' && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                    comentário
                                  </Badge>
                                )}
                                {isImportant && (
                                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-500">
                                    <Sparkle className="h-2.5 w-2.5 mr-0.5" weight="fill" />
                                    importante
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                              {format(new Date(item.date), 'HH:mm', { locale: ptBR })}
                            </span>
                          </div>

                          {/* Main Content */}
                          <div className="space-y-2">
                            <p className={cn(
                              "text-sm leading-relaxed",
                              item.type === 'comment' ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {displayContent}
                            </p>

                            {/* Show more/less button */}
                            {isTruncated && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-primary hover:text-primary"
                                onClick={() => toggleExpanded(item.id)}
                              >
                                {isExpanded ? 'ver menos' : 'ver mais'}
                              </Button>
                            )}

                            {/* Metadata - show if exists */}
                            {item.metadata && Object.keys(item.metadata).length > 0 && (
                              <div className="mt-2 p-2 rounded bg-muted/50 border border-border/50 space-y-1">
                                {Object.entries(item.metadata)
                                  .filter(([key, value]) => value && key !== 'updated_at')
                                  .map(([key, value]) => (
                                    <div key={key} className="flex gap-2 text-[11px]">
                                      <span className="font-semibold text-foreground/80 capitalize">
                                        {key.replace(/_/g, ' ')}:
                                      </span>
                                      <span className="text-muted-foreground break-all">
                                        {String(value)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            placeholder="Escreva um comentário..."
            className="min-h-[80px] resize-none text-sm"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && newComment.trim()) {
                handleSendComment()
              }
            }}
          />
          <div className="flex flex-col justify-end">
            <Button
              size="icon"
              onClick={handleSendComment}
              disabled={!newComment.trim() || isSubmitting}
              className="h-9 w-9"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <PaperPlaneRight className="h-4 w-4" weight="fill" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
          Pressione Ctrl+Enter para enviar
        </p>
      </div>
    </div>
  )
}
