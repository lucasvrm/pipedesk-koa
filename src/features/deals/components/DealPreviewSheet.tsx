import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MasterDeal, PlayerTrack, STAGE_LABELS, OPERATION_LABELS, STATUS_LABELS } from '@/lib/types'
import { formatCurrency, formatDate, getInitials } from '@/lib/helpers'
import { ArrowSquareOut, PencilSimple, Buildings, CalendarBlank, Tag as TagIcon, ChartBar } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

interface DealPreviewSheetProps {
  deal: MasterDeal | null
  tracks: PlayerTrack[]
  isOpen: boolean
  onClose: () => void
  onEdit: (deal: MasterDeal) => void
}

export function DealPreviewSheet({ deal, tracks, isOpen, onClose, onEdit }: DealPreviewSheetProps) {
  const navigate = useNavigate()

  if (!deal) return null

  // Filtra tracks ativos deste deal
  const activeTracks = tracks.filter(t => t.masterDealId === deal.id && t.status === 'active')

  const handleOpenFullDetails = () => {
    onClose()
    navigate(`/deals/${deal.id}`)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
        
        {/* Header Fixo */}
        <SheetHeader className="p-6 bg-background border-b">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={deal.status === 'active' ? 'default' : 'secondary'}>
              {STATUS_LABELS[deal.status]}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {OPERATION_LABELS[deal.operationType]}
            </Badge>
          </div>
          <SheetTitle className="text-2xl font-bold text-foreground">
            {deal.clientName}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Buildings size={16} />
            {deal.company?.name || 'Empresa não vinculada'}
          </SheetDescription>
        </SheetHeader>

        {/* Conteúdo com Scroll */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            
            {/* Seção de Valores */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background p-4 rounded-lg border shadow-sm">
                <Label className="text-xs text-muted-foreground uppercase">Volume</Label>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {formatCurrency(deal.volume)}
                </div>
              </div>
              <div className="bg-background p-4 rounded-lg border shadow-sm">
                <Label className="text-xs text-muted-foreground uppercase">Prazo</Label>
                <div className="text-lg font-medium mt-1 flex items-center gap-2">
                  <CalendarBlank className="text-muted-foreground" />
                  {formatDate(deal.deadline)}
                </div>
              </div>
            </div>

            {/* Abas de Informação */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="overview">Resumo</TabsTrigger>
                <TabsTrigger value="players">Players ({activeTracks.length})</TabsTrigger>
                <TabsTrigger value="team">Equipa</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="bg-background p-4 rounded-lg border space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Produto / Descrição</Label>
                    <p className="text-sm mt-1 leading-relaxed">
                      {deal.dealProduct || deal.observations || "Sem descrição disponível."}
                    </p>
                  </div>
                  
                  {deal.tags && deal.tags.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {deal.tags.map(tag => (
                          <Badge 
                            key={tag.id} 
                            variant="outline" 
                            style={{ borderColor: tag.color, color: tag.color, backgroundColor: `${tag.color}10` }}
                            className="flex items-center gap-1"
                          >
                            <TagIcon size={12} /> {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="players" className="mt-4">
                <div className="space-y-3">
                  {activeTracks.length > 0 ? (
                    activeTracks.map(track => (
                      <div key={track.id} className="flex items-center justify-between p-3 bg-background border rounded-lg hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-md border">
                            <AvatarFallback>{getInitials(track.playerName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{track.playerName}</p>
                            <p className="text-xs text-muted-foreground">{STAGE_LABELS[track.currentStage]}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {track.probability}%
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                      <ChartBar size={32} className="mx-auto mb-2 opacity-50" />
                      <p>Nenhum player ativo</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="team" className="mt-4">
                <div className="space-y-3">
                    <Label>Responsáveis</Label>
                    {deal.responsibles && deal.responsibles.length > 0 ? (
                        deal.responsibles.map(user => (
                            <div key={user.id} className="flex items-center gap-3 p-2 rounded-md bg-background border">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{user.name}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Nenhum responsável atribuído.</p>
                    )}
                </div>
              </TabsContent>
            </Tabs>

          </div>
        </ScrollArea>

        {/* Footer com Ações */}
        <SheetFooter className="p-6 border-t bg-background flex-row gap-3 sm:justify-between">
            <Button variant="outline" className="flex-1" onClick={() => onEdit(deal)}>
                <PencilSimple className="mr-2 h-4 w-4" /> Editar
            </Button>
            <Button className="flex-1" onClick={handleOpenFullDetails}>
                Detalhes Completos <ArrowSquareOut className="ml-2 h-4 w-4" />
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}