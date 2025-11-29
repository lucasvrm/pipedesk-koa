import { useState, useEffect, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { useDeals } from '@/features/deals/hooks/useDeals'
import { Deal, DealStage } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { DealKanbanCard } from './DealKanbanCard'
import { DealPreviewSheet } from './DealPreviewSheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Funnel, 
  MagnifyingGlass, 
  Plus, 
  Kanban as KanbanIcon,
  SortAscending
} from '@phosphor-icons/react'
import { CreateDealDialog } from './CreateDealDialog'
import { toast } from 'sonner'

// --- Componente Utilitário para React 18 Strict Mode ---
// Necessário para evitar que o Drag&Drop quebre em desenvolvimento
export const StrictModeDroppable = ({ children, ...props }: any) => {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true))
    return () => {
      cancelAnimationFrame(animation)
      setEnabled(false)
    }
  }, [])
  if (!enabled) return null
  return <Droppable {...props}>{children}</Droppable>
}

interface MasterMatrixViewProps {
  currentUser: any // Tipagem pode ser ajustada conforme seu User type
}

// Estágios do Pipeline (Idealmente viriam de uma configuração)
const STAGES: { id: DealStage; label: string; color: string; probability: number }[] = [
  { id: 'nda', label: 'NDA / Prospecção', color: 'border-slate-400', probability: 0.1 },
  { id: 'analysis', label: 'Análise', color: 'border-blue-400', probability: 0.3 },
  { id: 'proposal', label: 'Proposta', color: 'border-yellow-400', probability: 0.6 },
  { id: 'negotiation', label: 'Negociação', color: 'border-orange-400', probability: 0.8 },
  { id: 'closing', label: 'Fechamento', color: 'border-emerald-400', probability: 0.95 },
]

export default function MasterMatrixView({ currentUser }: MasterMatrixViewProps) {
  const { data: rawDeals, isLoading } = useDeals()
  
  // Estado local para gerenciar a UI (optimistic updates)
  const [deals, setDeals] = useState<Deal[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Sincroniza dados da API com estado local quando carregam
  useEffect(() => {
    if (rawDeals) {
      setDeals(rawDeals.filter(d => d.status === 'active' && !d.deletedAt))
    }
  }, [rawDeals])

  // Filtragem local
  const filteredDeals = useMemo(() => {
    if (!searchQuery) return deals
    return deals.filter(d => 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [deals, searchQuery])

  // Manipulação do Drag & Drop
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Encontrar o deal movido
    const movedDeal = deals.find(d => d.id === draggableId)
    if (!movedDeal) return

    // Atualização Otimista
    const newStage = destination.droppableId as DealStage
    
    // Atualiza estado local imediatamente
    setDeals(prev => prev.map(d => 
      d.id === draggableId 
        ? { ...d, stage: newStage, updated_at: new Date().toISOString() } 
        : d
    ))

    // Aqui você chamaria sua mutation de API
    // updateDealMutation.mutate({ id: draggableId, stage: newStage })
    toast.success(`Deal movido para ${STAGES.find(s => s.id === newStage)?.label}`)
  }

  // Abrir Preview Drawer
  const handleCardClick = (deal: Deal) => {
    setSelectedDeal(deal)
    setIsSheetOpen(true)
  }

  // Cálculos de Totais por Coluna
  const getColumnStats = (stageId: string) => {
    const stageDeals = filteredDeals.filter(d => d.stage === stageId)
    const count = stageDeals.length
    const totalValue = stageDeals.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
    const stageConfig = STAGES.find(s => s.id === stageId)
    const weightedValue = totalValue * (stageConfig?.probability || 0)

    return { count, totalValue, weightedValue }
  }

  if (isLoading) {
    return (
        <div className="flex h-[calc(100vh-100px)] items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-50/50 dark:bg-background">
      
      {/* --- TOOLBAR --- */}
      <div className="px-6 py-4 border-b bg-background flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <KanbanIcon size={24} weight="duotone" />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight">Pipeline de Vendas</h1>
                <p className="text-xs text-muted-foreground">Gerencie suas oportunidades</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative w-64 hidden md:block">
                <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar deals..."
                    className="pl-9 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex">
                <SortAscending className="mr-2 h-4 w-4" /> Filtros
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Novo Deal
            </Button>
        </div>
      </div>

      {/* --- KANBAN BOARD --- */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-full flex px-6 py-6 gap-5 min-w-max">
            {STAGES.map((stage) => {
              const stats = getColumnStats(stage.id)
              
              return (
                <div key={stage.id} className="w-[320px] flex flex-col h-full rounded-xl bg-muted/20 border border-slate-200 dark:border-slate-800 shadow-sm">
                  
                  {/* STICKY HEADER DA COLUNA */}
                  <div className={`p-4 border-b rounded-t-xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-t-4 ${stage.color}`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-sm uppercase tracking-wider text-foreground/80">
                            {stage.label}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border">
                            {stats.count}
                        </span>
                    </div>

                    {/* Resumo Financeiro da Coluna */}
                    {stats.totalValue > 0 && (
                        <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] text-muted-foreground uppercase font-medium">Total</span>
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                    {formatCurrency(stats.totalValue)}
                                </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] text-muted-foreground uppercase font-medium">Ponderado</span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(stats.weightedValue)}
                                </span>
                            </div>
                            
                            {/* Barra de progresso visual do ponderado */}
                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500/50 transition-all duration-500" 
                                    style={{ width: `${Math.min((stats.weightedValue / stats.totalValue) * 100 * 1.5, 100)}%` }} 
                                />
                            </div>
                        </div>
                    )}
                  </div>

                  {/* AREA DE DROP (Cartões) */}
                  <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    <StrictModeDroppable droppableId={stage.id}>
                      {(provided: any, snapshot: any) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[150px] transition-colors rounded-lg p-1 ${
                            snapshot.isDraggingOver ? 'bg-primary/5 ring-2 ring-primary/10 ring-inset' : ''
                          }`}
                        >
                          {filteredDeals
                            .filter(d => d.stage === stage.id)
                            .map((deal, index) => (
                              <DealKanbanCard
                                key={deal.id}
                                deal={deal}
                                index={index}
                                onClick={handleCardClick}
                              />
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </StrictModeDroppable>
                  </div>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      {/* --- MODAIS E DRAWER --- */}
      
      {/* Drawer de Visualização Rápida */}
      <DealPreviewSheet 
        deal={selectedDeal}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onEdit={(updatedDeal) => {
            setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d))
            console.log('Deal atualizado via drawer', updatedDeal)
        }}
      />

      {/* Dialog de Criação */}
      <CreateDealDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
      />

    </div>
  )
}