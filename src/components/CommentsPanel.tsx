import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUsers } from '@/services/userService'
import { useComments, useCreateComment, useDeleteComment } from '@/services/commentService'
import { logActivity } from '@/services/activityService'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getInitials, formatDate } from '@/lib/helpers'
import { PaperPlaneRight, Trash } from '@phosphor-icons/react'
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
  
  const [content, setContent] = useState('')
  const [mentionOpen, setMentionOpen] = useState(false)
  
  // Armazena usuários que foram selecionados via @: { id: '...', name: 'Lucas' }
  const [mentionedUsersMap, setMentionedUsersMap] = useState<Map<string, string>>(new Map())
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    // Insere o nome no texto
    const newContent = content + user.name + ' '
    setContent(newContent)
    
    // Guarda o ID do usuário mencionado
    setMentionedUsersMap(prev => new Map(prev).set(user.name, user.id))
    
    setMentionOpen(false)
    textareaRef.current?.focus()
  }

  const handleSubmit = async () => {
    if (!content.trim()) return

    // Filtra IDs: Só envia se o nome do usuário ainda estiver no texto final
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
        mentions: finalMentions // Agora enviamos os IDs reais!
      })
      
      logActivity(entityId, entityType, 'Novo Comentário', currentUser.id, { content_preview: content.substring(0, 50) })

      setContent('')
      setMentionedUsersMap(new Map()) // Limpa mapa
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

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-card">
      <div className="p-4 border-b bg-muted/20">
        <h3 className="font-semibold flex items-center gap-2">
          Comentários <span className="text-muted-foreground text-xs font-normal">({comments?.length || 0})</span>
        </h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground">Carregando...</div>
        ) : comments?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum comentário ainda. Inicie a conversa!
          </div>
        ) : (
          <div className="space-y-4">
            {comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={comment.author?.avatar_url} />
                  <AvatarFallback>{getInitials(comment.author?.name || '?')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted/30 p-3 rounded-lg border">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">{comment.author?.name || 'Usuário'}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                  </div>
                  {/* Destaque visual simples para menções (opcional) */}
                  <p className="text-sm whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
                {currentUser.id === comment.authorId && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-background relative">
        {/* Popover de Menção */}
        {mentionOpen && (
          <div className="absolute bottom-20 left-4 w-64 bg-popover border rounded-md shadow-lg p-1 z-50 animate-in fade-in zoom-in-95">
            <div className="text-xs font-medium p-2 text-muted-foreground">Mencionar:</div>
            <ScrollArea className="h-40">
              {users?.map(user => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-sm cursor-pointer text-sm"
                  onClick={() => insertMention({ id: user.id, name: user.name })}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  {user.name}
                </div>
              ))}
            </ScrollArea>
          </div>
        )}

        <div className="flex gap-2">
          <Textarea 
            ref={textareaRef}
            placeholder="Escreva um comentário... (Use @ para mencionar)" 
            value={content}
            onChange={handleInputChange}
            className="min-h-[80px] resize-none"
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