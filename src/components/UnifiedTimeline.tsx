import { useState } from 'react'
import { useUnifiedTimeline, TimelineItem } from '@/hooks/useUnifiedTimeline'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatCircle, Lightning, PaperPlaneRight, Funnel } from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface UnifiedTimelineProps {
  entityId: string
  entityType: 'deal' | 'lead' | 'company'
}

export function UnifiedTimeline({ entityId, entityType }: UnifiedTimelineProps) {
  const { items, isLoading } = useUnifiedTimeline(entityId, entityType)
  const [filter, setFilter] = useState<'all' | 'comment' | 'system'>('all')
  const [newComment, setNewComment] = useState('')

  const filteredItems = items.filter(i => filter === 'all' || i.type === filter || (filter === 'system' && i.type === 'activity'))

  const handleSendComment = () => {
    // Lógica de envio seria implementada aqui (usando commentService)
    console.log('Send', newComment)
    setNewComment('')
  }

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Carregando histórico...</div>

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-card">
      {/* Header / Filters */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/20">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <ClockCounterClockwise className="h-4 w-4" /> Timeline
        </h3>
        <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setFilter('all')}
            className="h-6 text-xs"
          >
            Tudo
          </Button>
          <Button
            variant={filter === 'comment' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setFilter('comment')}
            className="h-6 text-xs"
          >
            <ChatCircle className="mr-1 h-3 w-3" /> Comentários
          </Button>
          <Button
            variant={filter === 'system' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setFilter('system')}
            className="h-6 text-xs"
          >
            <Lightning className="mr-1 h-3 w-3" /> Sistema
          </Button>
        </div>
      </div>

      {/* Feed Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-border">
          {filteredItems.map((item) => (
            <div key={item.id} className="relative pl-8 group">
              {/* Connector Line/Icon */}
              <div className={cn(
                "absolute left-0 top-1 h-10 w-10 rounded-full border-4 border-background flex items-center justify-center z-10",
                item.type === 'comment' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
              )}>
                <div className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  item.type === 'comment' ? "bg-blue-600" : "bg-slate-500"
                )} />
              </div>

              {/* Content Card */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{item.author.name}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(item.date), { locale: ptBR, addSuffix: true })}</span>
                  </div>
                </div>

                <div className={cn(
                  "p-3 rounded-lg text-sm",
                  item.type === 'comment' ? "bg-muted/50 border" : "bg-transparent italic text-muted-foreground"
                )}>
                  {item.content}
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="pl-8 py-4 text-sm text-muted-foreground italic">
              Nenhum evento encontrado.
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            placeholder="Escreva um comentário..."
            className="min-h-[80px] resize-none"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
          />
          <div className="flex flex-col justify-end">
            <Button size="icon" onClick={handleSendComment} disabled={!newComment.trim()}>
              <PaperPlaneRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Ícone auxiliar que faltou no import
import { ClockCounterClockwise } from '@phosphor-icons/react'
