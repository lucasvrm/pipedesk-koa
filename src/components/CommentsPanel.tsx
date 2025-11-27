import { useState, useRef, useMemo } from 'react'
import { useUsers } from '@/services/userService'
import { useComments, useCreateComment, useDeleteComment } from '@/services/commentService'
import { logActivity } from '@/services/activityService'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// Imports do Calendário e Popover para o filtro de data
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getInitials, formatDateTime } from '@/lib/helpers'
import { PaperPlaneRight, Trash, ArrowsDownUp, Funnel, CalendarBlank, X } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface CommentsPanelProps {
  entityId: string
  entityType: 'deal' | 'track' | 'task'
  currentUser: any
}

export default function CommentsPanel({ entityId, entityType, currentUser }: CommentsPanelProps) {
  const { data: comments, isLoading } = useComments(entityId, entityType)
  const { data: users } = useUsers()
  const createComment = useCreateComment()
  const deleteComment = useDeleteComment()
  
  // Estados para UX
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined) // Novo estado para data

  const [content, setContent] = useState('')
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionedUsersMap, setMentionedUsersMap] = useState<Map<string, string>>(new Map())
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Lógica de Processamento (Sort + Filter User + Filter Date)
  const processedComments = useMemo(() => {
    if (!comments) return []
    
    let result = [...comments]

    // 1. Filtro Usuário
    if (filterUser !== 'all') {
      result = result.filter(c => c.authorId === filterUser)
    }

    // 2. Filtro Data
    if (filterDate) {
      result = result.filter(c => isSameDay(new Date(c.createdAt), filterDate))
    }

    // 3. Ordenação
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

    return result
  }, [comments, sortOrder, filterUser, filterDate])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)

    const lastChar = value[value.length - 1]
    if (lastChar === '@') {
      setMentionOpen(true)
    } else if (mentionOpen && (lastChar === ' ' || value === '')) {
      setMentionOpen(false)
    }
  }

  const insertMention = (user: { id: string, name: string }) => {
    const newContent = content + user.name + ' '
    setContent(newContent)
    setMentionedUsersMap(prev => new Map(prev).set(user.name, user.id))
    setMentionOpen(false)
    textareaRef.current?.focus()
  }

  const handleSubmit = async () => {
    if (!content.trim()) return

    const finalMentions: string[] = []
    mentionedUsersMap.forEach((id, name) => {
      if (content.includes(name)) {
        finalMentions.push(id)
      }
    })

    try {
      await createComment.mutateAsync({
        entityId,
        entityType,
        content,
        authorId: currentUser.id,
        mentions: finalMentions
      })
      
      logActivity(entityId, entityType, 'Novo Comentário', currentUser.id, { content_preview: content.substring(0, 50) })

      setContent('')
      setMentionedUsersMap(new Map())
      toast.success('Comentário enviado')
    } catch (error) {
      toast.error('Erro ao enviar comentário')
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync(commentId)
      toast.success('Comentário excluído')
    } catch (error) {
      toast.error('Erro ao excluir')
    }
  }

  const renderContentWithMentions = (text: string) => {
    const parts = text.split(/(@[\w\u00C0-\u00FF]+(?:\s[\w\u00C0-\u00FF]+)?)/g)
    
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
         return <span key={index} className="text-red-600 font-bold">{part}</span>
      }
      return <span key={index} className="text-foreground">{part}</span>
    })
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-card relative overflow-hidden">
      {/* Header com Controles */}
      <div className="p-3 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          Comentários <span className="text-muted-foreground text-xs font-normal">({processedComments.length})</span>
        </h3>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro Data (Novo) */}
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  size="sm"
                  className={cn(
                    "h-8 text-xs justify-start text-left font-normal w-[130px]",
                    !filterDate && "text-muted-foreground"
                  )}
                >
                  <CalendarBlank className="mr-2 h-3 w-3" />
                  {filterDate ? format(filterDate, "P", { locale: ptBR }) : <span>Data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={setFilterDate}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            {filterDate && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground" 
                onClick={() => setFilterDate(undefined)} 
                title="Limpar Data"
              >
                <X size={12} />
              </Button>
            )}
          </div>

          {/* Filtro Usuário */}
          <div className="w-[120px]">
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="h-8 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Funnel className="h-3 w-3" />
                  <SelectValue placeholder="Usuário" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {users?.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ordenação */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            title={sortOrder === 'asc' ? 'Mais antigos primeiro' : 'Mais recentes primeiro'}
          >
            <ArrowsDownUp className={sortOrder === 'asc' ? 'rotate-180' : ''} />
          </Button>
        </div>
      </div>

      {/* Lista de Comentários */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <ScrollArea className="h-full w-full">
          <div className="p-4 space-y-4 pb-4">
            {isLoading ? (
              <div className="text-center text-sm text-muted-foreground pt-8">Carregando...</div>
            ) : processedComments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                {comments && comments.length > 0 
                  ? 'Nenhum comentário encontrado com os filtros atuais.' 
                  : 'Nenhum comentário ainda. Inicie a conversa!'}
              </div>
            ) : (
              processedComments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <Avatar className="h-8 w-8 mt-1 shrink-0">
                    <AvatarImage src={comment.author?.avatar_url} />
                    <AvatarFallback>{getInitials(comment.author?.name || '?')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted/30 p-3 rounded-lg border min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className="font-semibold text-xs text-blue-600 truncate">
                        {comment.author?.name || 'Usuário Desconhecido'}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs whitespace-pre-wrap leading-relaxed break-words">
                      {renderContentWithMentions(comment.content)}
                    </p>
                  </div>
                  {currentUser.id === comment.authorId && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive shrink-0 mt-1"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash size={14} />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-background relative shrink-0 z-10">
        {mentionOpen && (
          <div className="absolute bottom-full left-4 mb-2 w-64 bg-popover border rounded-md shadow-xl z-50 animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="text-xs font-medium p-2 bg-muted/50 text-muted-foreground border-b">
              Mencionar Usuário
            </div>
            <ScrollArea className="h-48">
              <div className="p-1">
                {(users || []).map(user => (
                  <button
                    key={user.id} 
                    className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-sm cursor-pointer text-sm text-left transition-colors"
                    onClick={() => insertMention({ id: user.id, name: user.name })}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{user.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="flex gap-2">
          <Textarea 
            ref={textareaRef}
            placeholder="Escreva um comentário... (Use @ para mencionar)" 
            value={content}
            onChange={handleInputChange}
            className="min-h-[80px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <Button 
            className="self-end h-[80px] w-[50px]" 
            onClick={handleSubmit} 
            disabled={createComment.isPending}
          >
            <PaperPlaneRight size={20} />
          </Button>
        </div>
      </div>
    </div>
  )
}