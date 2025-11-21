import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Question as QuestionIcon, ChatCircle, Warning, CheckCircle, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Question, Answer, User } from '@/lib/types'
import { formatDateTime } from '@/lib/helpers'
import { hasPermission } from '@/lib/permissions'
import { toast } from 'sonner'
import { useImpersonation } from '@/contexts/ImpersonationContext'

interface QAPanelProps {
  entityId: string
  entityType: 'deal' | 'track'
  currentUser: User
}

export default function QAPanel({ entityId, entityType, currentUser }: QAPanelProps) {
  const { isImpersonating } = useImpersonation()
  const [questions, setQuestions] = useKV<Question[]>('questions', [])
  const [answers, setAnswers] = useKV<Answer[]>('answers', [])
  const [users] = useKV<User[]>('users', [])
  const [askDialogOpen, setAskDialogOpen] = useState(false)
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  
  // Form states
  const [newQuestionTitle, setNewQuestionTitle] = useState('')
  const [newQuestionContent, setNewQuestionContent] = useState('')
  const [newQuestionPriority, setNewQuestionPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [newQuestionCategory, setNewQuestionCategory] = useState('')
  const [newAnswerContent, setNewAnswerContent] = useState('')
  const [answerIsInternal, setAnswerIsInternal] = useState(false)

  // Get effective role based on impersonation
  const effectiveRole = isImpersonating ? 'client' : currentUser.role
  const canViewInternal = hasPermission(effectiveRole, 'VIEW_ALL_DEALS')
  const canAnswer = hasPermission(effectiveRole, 'EDIT_DEAL')

  // Filter questions for this entity
  const entityQuestions = (questions || []).filter(
    q => q.entityId === entityId && q.entityType === entityType
  )

  // Get answers for a question
  const getQuestionAnswers = (questionId: string) => {
    return (answers || []).filter(a => a.questionId === questionId)
  }

  // Get user by ID
  const getUserById = (userId: string) => {
    return (users ?? []).find(u => u.id === userId)
  }

  const handleAskQuestion = () => {
    if (!newQuestionTitle.trim() || !newQuestionContent.trim()) {
      toast.error('Por favor, preencha o título e o conteúdo da pergunta')
      return
    }

    const newQuestion: Question = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityId,
      entityType,
      title: newQuestionTitle,
      content: newQuestionContent,
      category: newQuestionCategory || undefined,
      priority: newQuestionPriority,
      status: 'open',
      askedBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setQuestions([...(questions || []), newQuestion])
    
    // Reset form
    setNewQuestionTitle('')
    setNewQuestionContent('')
    setNewQuestionPriority('medium')
    setNewQuestionCategory('')
    setAskDialogOpen(false)
    
    toast.success('Pergunta enviada com sucesso')
  }

  const handleAnswerQuestion = () => {
    if (!selectedQuestion || !newAnswerContent.trim()) {
      toast.error('Por favor, preencha o conteúdo da resposta')
      return
    }

    const newAnswer: Answer = {
      id: `a-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      questionId: selectedQuestion.id,
      content: newAnswerContent,
      isInternal: answerIsInternal,
      answeredBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setAnswers([...(answers || []), newAnswer])

    // Update question status
    const updatedQuestions = (questions || []).map(q =>
      q.id === selectedQuestion.id
        ? { ...q, status: 'answered' as const, updatedAt: new Date().toISOString() }
        : q
    )
    setQuestions(updatedQuestions)

    // Reset form
    setNewAnswerContent('')
    setAnswerIsInternal(false)
    setAnswerDialogOpen(false)
    setSelectedQuestion(null)

    toast.success('Resposta enviada com sucesso')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default'
      case 'answered': return 'secondary'
      case 'closed': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QuestionIcon size={20} className="text-primary" />
          <h3 className="text-lg font-semibold">Perguntas & Respostas</h3>
        </div>
        <Button onClick={() => setAskDialogOpen(true)} size="sm">
          <QuestionIcon className="mr-2" size={16} />
          Fazer Pergunta
        </Button>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          {entityQuestions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <QuestionIcon size={48} className="mx-auto mb-2 opacity-50" />
                <p>Nenhuma pergunta ainda</p>
                <p className="text-sm">Clique em "Fazer Pergunta" para começar</p>
              </CardContent>
            </Card>
          ) : (
            entityQuestions.map(question => {
              const questionAnswers = getQuestionAnswers(question.id).filter(
                a => canViewInternal || !a.isInternal
              )
              const askedByUser = getUserById(question.askedBy)

              return (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getPriorityColor(question.priority)}>
                            {question.priority.toUpperCase()}
                          </Badge>
                          <Badge variant={getStatusColor(question.status)}>
                            {question.status === 'open' ? 'Aberta' : 
                             question.status === 'answered' ? 'Respondida' : 'Fechada'}
                          </Badge>
                          {question.category && (
                            <Badge variant="outline">{question.category}</Badge>
                          )}
                        </div>
                        <CardTitle className="text-base">{question.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Por {askedByUser?.name || 'Usuário'} em {formatDateTime(question.createdAt)}
                        </CardDescription>
                      </div>
                      {canAnswer && question.status === 'open' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedQuestion(question)
                            setAnswerDialogOpen(true)
                          }}
                        >
                          <ChatCircle className="mr-2" size={16} />
                          Responder
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{question.content}</p>
                    
                    {questionAnswers.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-3">
                          {questionAnswers.map(answer => {
                            const answeredByUser = getUserById(answer.answeredBy)
                            return (
                              <div key={answer.id} className="bg-muted p-3 rounded-md">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle size={16} className="text-green-600" />
                                  <span className="text-sm font-medium">
                                    {answeredByUser?.name || 'Analista'}
                                  </span>
                                  {answer.isInternal && canViewInternal && (
                                    <Badge variant="destructive" className="text-xs">
                                      Interno
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {formatDateTime(answer.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm">{answer.content}</p>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Ask Question Dialog */}
      <Dialog open={askDialogOpen} onOpenChange={setAskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fazer uma Pergunta</DialogTitle>
            <DialogDescription>
              Faça uma pergunta sobre este {entityType === 'deal' ? 'negócio' : 'player'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question-title">Título *</Label>
              <Input
                id="question-title"
                placeholder="Digite um título breve para sua pergunta"
                value={newQuestionTitle}
                onChange={(e) => setNewQuestionTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question-content">Conteúdo *</Label>
              <Textarea
                id="question-content"
                placeholder="Descreva sua pergunta em detalhes"
                rows={5}
                value={newQuestionContent}
                onChange={(e) => setNewQuestionContent(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question-priority">Prioridade</Label>
                <Select
                  value={newQuestionPriority}
                  onValueChange={(value: any) => setNewQuestionPriority(value)}
                >
                  <SelectTrigger id="question-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="question-category">Categoria (opcional)</Label>
                <Input
                  id="question-category"
                  placeholder="ex: Financeiro, Legal, Técnico"
                  value={newQuestionCategory}
                  onChange={(e) => setNewQuestionCategory(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAskDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAskQuestion}>
              Enviar Pergunta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Answer Question Dialog */}
      <Dialog open={answerDialogOpen} onOpenChange={setAnswerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Pergunta</DialogTitle>
            <DialogDescription>
              {selectedQuestion?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">{selectedQuestion?.content}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer-content">Sua Resposta *</Label>
              <Textarea
                id="answer-content"
                placeholder="Digite sua resposta"
                rows={5}
                value={newAnswerContent}
                onChange={(e) => setNewAnswerContent(e.target.value)}
              />
            </div>
            {canViewInternal && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="answer-internal"
                  checked={answerIsInternal}
                  onChange={(e) => setAnswerIsInternal(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="answer-internal" className="cursor-pointer">
                  Marcar como resposta interna (visível apenas para analistas)
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAnswerDialogOpen(false)
                setSelectedQuestion(null)
                setNewAnswerContent('')
                setAnswerIsInternal(false)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAnswerQuestion}>
              Enviar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
