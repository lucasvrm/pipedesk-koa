import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Comment, User, Notification } from '@/lib/types'
import { getInitials, formatDateTime } from '@/lib/helpers'
import { 
  PaperPlaneRight, 
  DotsThree, 
  Trash,
  Sparkle,
  At,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface CommentsPanelProps {
  entityId: string
  entityType: 'deal' | 'track' | 'task'
  currentUser: User
}

export default function CommentsPanel({ entityId, entityType, currentUser }: CommentsPanelProps) {
  const [comments, setComments] = useKV<Comment[]>('comments', [])
  const [users] = useKV<User[]>('users', [])
  const [notifications, setNotifications] = useKV<Notification[]>('notifications', [])
  const [newComment, setNewComment] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [commentSummary, setCommentSummary] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const entityComments = (comments || [])
    .filter(c => c.entityId === entityId && c.entityType === entityType)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const matches = text.match(mentionRegex)
    return matches ? matches.map(m => m.slice(1)) : []
  }

  const handleTextChange = (value: string) => {
    setNewComment(value)
    
    const cursorPos = textareaRef.current?.selectionStart || 0
    setCursorPosition(cursorPos)
    
    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtSymbol !== -1 && lastAtSymbol === cursorPos - 1) {
      setShowMentions(true)
      setMentionSearch('')
    } else if (lastAtSymbol !== -1) {
      const searchTerm = textBeforeCursor.slice(lastAtSymbol + 1)
      if (searchTerm.includes(' ')) {
        setShowMentions(false)
      } else {
        setShowMentions(true)
        setMentionSearch(searchTerm.toLowerCase())
      }
    } else {
      setShowMentions(false)
    }
  }

  const insertMention = (user: User) => {
    const textBeforeCursor = newComment.slice(0, cursorPosition)
    const textAfterCursor = newComment.slice(cursorPosition)
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@')
    
    const beforeAt = newComment.slice(0, lastAtSymbol)
    const mention = `@${user.name.split(' ')[0]} `
    const newText = beforeAt + mention + textAfterCursor
    
    setNewComment(newText)
    setShowMentions(false)
    textareaRef.current?.focus()
  }

  const filteredUsers = (users || []).filter(u => 
    u.id !== currentUser.id &&
    (u.name.toLowerCase().includes(mentionSearch) || 
     u.email.toLowerCase().includes(mentionSearch))
  )

  const createNotifications = (mentions: string[], commentId: string) => {
    const mentionedUsers = (users || []).filter(u => 
      mentions.some(mention => 
        u.name.toLowerCase().includes(mention.toLowerCase())
      )
    )

    const newNotifications: Notification[] = mentionedUsers.map(user => ({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'mention',
      title: 'Menção em comentário',
      message: `${currentUser.name} mencionou você em um comentário`,
      link: `#comment-${commentId}`,
      read: false,
      createdAt: new Date().toISOString(),
    }))

    setNotifications(current => [...(current || []), ...newNotifications])
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    const mentions = extractMentions(newComment)
    
    const comment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityId,
      entityType,
      authorId: currentUser.id,
      content: newComment,
      createdAt: new Date().toISOString(),
      mentions,
    }

    setComments(current => [...(current || []), comment])
    
    if (mentions.length > 0) {
      createNotifications(mentions, comment.id)
      toast.success(`Comentário adicionado com ${mentions.length} menção(ões)`)
    } else {
      toast.success('Comentário adicionado')
    }

    setNewComment('')
    setCommentSummary('')
  }

  const handleDeleteComment = (commentId: string) => {
    setComments(current => (current || []).filter(c => c.id !== commentId))
    toast.success('Comentário excluído')
  }

  const handleGenerateSummary = async () => {
    if (entityComments.length === 0) {
      toast.error('Nenhum comentário para resumir')
      return
    }

    setIsGeneratingSummary(true)
    
    try {
      const commentsText = entityComments.map(c => {
        const author = (users || []).find(u => u.id === c.authorId)
        return `${author?.name || 'Usuário'}: ${c.content}`
      }).join('\n')

      const entityTypeLabel = entityType === 'deal' ? 'negócio' : entityType === 'track' ? 'player track' : 'tarefa'

      const promptText = `Você é um assistente de negócios especializado em M&A e investment banking. 

Analise os seguintes comentários de um ${entityTypeLabel} e forneça um resumo executivo conciso destacando:
1. Principais decisões tomadas
2. Próximos passos acordados
3. Questões em aberto ou preocupações levantadas
4. Prazos mencionados

Comentários:
${commentsText}

Forneça um resumo em português brasileiro em formato de bullet points, sendo objetivo e focado no que é acionável.`

      const summary = await window.spark.llm(promptText, 'gpt-4o-mini')
      setCommentSummary(summary)
      toast.success('Resumo gerado com IA')
    } catch (error) {
      toast.error('Erro ao gerar resumo')
      console.error(error)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@\w+)/)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-primary font-medium bg-primary/10 px-1 rounded">
            {part}
          </span>
        )
      }
      return part
    })
  }

  const getAuthor = (authorId: string) => {
    return (users || []).find(u => u.id === authorId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Comentários ({entityComments.length})
        </h3>
        {entityComments.length > 2 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
          >
            <Sparkle className="mr-2" />
            {isGeneratingSummary ? 'Gerando...' : 'Resumir com IA'}
          </Button>
        )}
      </div>

      {commentSummary && (
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 mb-2">
              <Sparkle className="text-accent mt-1 flex-shrink-0" />
              <h4 className="font-semibold text-sm">Resumo Executivo (IA)</h4>
            </div>
            <div className="text-sm whitespace-pre-wrap">{commentSummary}</div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {entityComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </div>
        ) : (
          entityComments.map(comment => {
            const author = getAuthor(comment.authorId)
            const isAuthor = comment.authorId === currentUser.id
            
            return (
              <Card key={comment.id} id={`comment-${comment.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(author?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {author?.name || 'Usuário'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        
                        {isAuthor && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                                <DotsThree />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-destructive"
                              >
                                <Trash className="mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      <p className="text-sm break-words">
                        {renderCommentContent(comment.content)}
                      </p>
                      
                      {comment.mentions.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <At className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {comment.mentions.length} menção(ões)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Separator />

      <div className="relative">
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            placeholder="Adicione um comentário... Use @ para mencionar alguém"
            value={newComment}
            onChange={(e) => handleTextChange(e.target.value)}
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmitComment()
              }
            }}
          />
          
          {showMentions && filteredUsers.length > 0 && (
            <Card className="absolute bottom-full mb-2 w-full z-50 max-h-48 overflow-y-auto">
              <CardContent className="p-2">
                <div className="space-y-1">
                  {filteredUsers.slice(0, 5).map(user => (
                    <button
                      key={user.id}
                      onClick={() => insertMention(user)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded text-left"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Pressione Ctrl+Enter para enviar
            </span>
            <Button onClick={handleSubmitComment} size="sm" disabled={!newComment.trim()}>
              <PaperPlaneRight className="mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
