import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MasterDeal, 
  PlayerTrack, 
  OPERATION_LABELS, 
  STATUS_LABELS 
} from '@/lib/types'
import { formatCurrency, formatDate, getInitials } from '@/lib/helpers'
import { 
  ArrowSquareOut, 
  PencilSimple, 
  Buildings, 
  CalendarBlank, 
  Money, 
  TrendUp,
  X,
  Percent,
  ChatText,
  Clock
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useComments } from '@/services/commentService' 
import { useStages } from '@/services/pipelineService'

interface DealPreviewSheetProps {
  deal: MasterDeal | null
  tracks: PlayerTrack[]
  isOpen: boolean
  onClose: () => void
  onEdit: (deal: MasterDeal) => void
}

export function DealPreviewSheet({ deal, tracks, isOpen, onClose, onEdit }: DealPreviewSheetProps) {
  const navigate = useNavigate()
  const { data: comments, isLoading: isLoadingComments } = useComments(deal?.id, 'deal')
  const { data: stages = [] } = useStages()

  if (!deal) return null

  const activeTracks = tracks.filter(t => t.masterDealId === deal.id && t.status === 'active')
  const sortedTracks = [...activeTracks].sort((a, b) => (b.probability || 0) - (a.probability || 0))

  const feePercentage = deal.feePercentage || 0
  const feeValue = (Number(deal.volume || 0) * feePercentage) / 100

  // Adaptação para tipos: garantir que data é string para new Date()
  const recentComments = comments ? [...comments].sort((a, b) => {
    const dateA = a.created_at || a.createdAt || '';
    const dateB = b.created_at || b.createdAt || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  }).slice(0, 4) : []

  const handleOpenFullDetails = () => {
    onClose()
    navigate(`/deals/${deal.id}`)
  }

  const handleCompanyClick = () => {
    if (deal.company?.id) {
        onClose()
        navigate(`/companies/${deal.company.id}`)
    }
  }

  const handleTrackClick = (trackId: string) => {
      onClose()
      navigate(`/tracks/${trackId}`)
  }

  // Helper para recuperar nome e cor do estágio
  const getStageInfo = (stageId: string) => {
    return stages.find(s => s.id === stageId) || { name: stageId, color: '#94a3b8', probability: 0 }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-background border-l shadow-2xl">
        
        <div className="relative px-6 py-6 border-b bg-muted/5">
          <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </SheetClose>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={deal.status === 'active' ? 'default' : 'secondary'} 
                className="rounded-full px-3 font-medium capitalize"
              >
                {STATUS_LABELS[deal.status]}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 font-normal text-muted-foreground bg-background">
                {OPERATION_LABELS[deal.operationType]}
              </Badge>
            </div>

            <div className="space-y-1">
              <SheetTitle className="text-2xl font-bold tracking-tight text-foreground leading-tight break-words">
                {deal.clientName}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                <Buildings className="h-4 w-4 shrink-0" />
                <span 
                    className={cn(
                        "truncate transition-colors", 
                        deal.company?.id ? "cursor-pointer hover:text-primary hover:underline" : ""
                    )}
                    onClick={handleCompanyClick}
                    title={deal.company?.id ? "Ver detalhes da empresa" : ""}
                >
                    {deal.company?.name || 'Empresa não vinculada'}
                </span>
              </SheetDescription>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-6 p-6">
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Money className="h-3 w-3" /> Volume
                </span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
                  {formatCurrency(deal.volume)}
                </span>
              </div>

              <div className="flex flex-col p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                  <CalendarBlank className="h-3 w-3" /> Prazo Final
                </span>
                <span className="text-lg font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  {formatDate(deal.deadline)}
                </span>
              </div>

              <div className="flex flex-col p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <span className="text-[10px] font-bold text-blue-600/80 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Percent className="h-3 w-3" /> Fee %
                </span>
                <span className="text-base font-semibold text-blue-700 dark:text-blue-300">
                  {feePercentage > 0 ? `${feePercentage.toFixed(2)}%` : '-'}
                </span>
              </div>

              <div className="flex flex-col p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                <span className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Money className="h-3 w-3" /> Fee Projetado
                </span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-300 truncate">
                  {formatCurrency(feeValue)}
                </span>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="players">Players ({activeTracks.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-6">
                
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sobre o Negócio</h3>
                  <div className="text-sm text-foreground leading-relaxed p-3 bg-muted/30 rounded-md border border-border/50">
                    {deal.dealProduct || deal.observations || "Sem descrição."}
                  </div>
                  
                  {deal.tags && deal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {deal.tags.map(tag => (
                        <span 
                          key={tag.id} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ring-1 ring-inset"
                          style={{ 
                            backgroundColor: `${tag.color}15`, 
                            color: tag.color,
                            // @ts-ignore - CSS properties not in React types
                            '--ring-color': `${tag.color}30`
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 py-2">
                    <Button variant="outline" onClick={() => onEdit(deal)} className="w-full h-9">
                    <PencilSimple className="mr-2 h-4 w-4" />
                    Editar
                    </Button>
                    <Button onClick={handleOpenFullDetails} className="w-full h-9">
                    Ver Detalhes
                    <ArrowSquareOut className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <ChatText size={14} /> Últimas Interações
                    </h3>
                  </div>

                  {isLoadingComments ? (
                    <div className="text-center py-4 text-muted-foreground text-xs">Carregando comentários...</div>
                  ) : recentComments.length > 0 ? (
                    <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
                      {recentComments.map((comment) => (
                        <div key={comment.id} className="relative pl-8 text-sm group">
                          <div className="absolute left-0 top-1 w-6 h-6 bg-background border rounded-full flex items-center justify-center z-10">
                            <Avatar className="h-4 w-4">
                                <AvatarImage src={comment.author?.avatar} />
                                <AvatarFallback className="text-[8px]">{getInitials(comment.author?.name || '?')}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="bg-muted/20 p-2.5 rounded-lg border border-transparent group-hover:border-border transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-xs">{comment.author?.name}</span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock size={10} />
                                    {new Date(comment.created_at || comment.createdAt || '').toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed rounded-lg bg-slate-50/50">
                      <p className="text-xs text-muted-foreground">Nenhuma interação recente.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="players" className="mt-4 space-y-3">
                {sortedTracks.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {sortedTracks.map(track => {
                      const stageInfo = getStageInfo(track.currentStage);
                      return (
                        <div 
                          key={track.id} 
                          onClick={() => handleTrackClick(track.id)}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar className="h-8 w-8 border bg-muted">
                              <AvatarFallback className="text-xs font-bold text-muted-foreground">
                                {getInitials(track.playerName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate group-hover:text-primary transition-colors" title={track.playerName}>
                                {track.playerName}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <TrendUp size={10} />
                                {track.probability || stageInfo.probability || 0}% Probabilidade
                              </span>
                            </div>
                          </div>

                          <Badge variant="outline" className="text-[10px] font-medium border capitalize whitespace-nowrap" style={{ borderColor: stageInfo.color, color: stageInfo.color }}>
                            {stageInfo.name}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50/50">
                    <p className="text-sm text-muted-foreground">Nenhum player ativo.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
