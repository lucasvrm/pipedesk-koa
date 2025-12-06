import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeals, useDeleteDeal, useDeleteDeals } from '@/services/dealService'
import { useTracks } from '@/services/trackService'
import { useUsers } from '@/services/userService'
import { useStages } from '@/services/pipelineService'
import { useTags } from '@/services/tagService'
import { useSettings } from '@/services/systemSettingsService'

// Componentes UI
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { dealStatusMap } from '@/lib/statusMaps'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label'

// Ícones
import { MagnifyingGlass, Trash, CaretUp, CaretDown, CaretUpDown, CaretLeft, CaretRight, Funnel, PencilSimple, Buildings, ListDashes, SquaresFour, Plus, Tag as TagIcon } from '@phosphor-icons/react'

// Types e Helpers
import { DealStatus, STATUS_LABELS, OPERATION_LABELS, OperationType, MasterDeal, PipelineStage } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import { toast } from 'sonner'

// Componentes Internos
import { SharedListLayout } from '@/components/layouts/SharedListLayout'
import { SharedListToolbar } from '@/components/layouts/SharedListToolbar'
import { SmartTagSelector } from '@/components/SmartTagSelector'
import { EditDealDialog } from './EditDealDialog'
import { CreateDealDialog } from './CreateDealDialog'
import { DealsMetrics } from './DealsMetrics'
import { DealPreviewSheet } from './DealPreviewSheet'
import DealsList from './DealsList'
import { PageContainer } from '@/components/PageContainer'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'
import { useDealQuickActions } from '@/hooks/useQuickActions'

// --- Tipos Locais ---
type SortKey = 'clientName' | 'companyName' | 'volume' | 'status' | 'operationType' | 'trackStatus';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface FilterState {
  status: DealStatus | 'all';
  type: OperationType | 'all';
  responsible: string;
  minVolume: string;
  maxVolume: string;
  tags: string[]; // NEW
}

const INITIAL_FILTERS: FilterState = {
  status: 'all', type: 'all', responsible: 'all', minVolume: '', maxVolume: '', tags: []
}

export default function DealsView() {
  const navigate = useNavigate()
  
  // Hooks
  const { data: users } = useUsers()
  const { data: stages = [] } = useStages()
  const { data: tags = [] } = useTags('deal')
  const { data: settings } = useSettings()

  // State for filters
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [tempFilters, setTempFilters] = useState<FilterState>(INITIAL_FILTERS)

  // Main Data Hook with Filters
  const { data: masterDeals, isLoading: dealsLoading } = useDeals(filters.tags.length > 0 ? filters.tags : undefined)
  const { data: allTracks, isLoading: tracksLoading } = useTracks()
  
  const deleteSingleMutation = useDeleteDeal()
  const deleteBulkMutation = useDeleteDeals()

  const isLoading = dealsLoading || tracksLoading

  // Feature Flag Logic
  const tagsConfig = settings?.find(s => s.key === 'tags_config')?.value;
  const tagsEnabled = tagsConfig?.global && tagsConfig?.modules?.deals !== false;

  // Estados de UI
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'clientName', direction: 'asc' })
  
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Estados de Modais
  const [createDealOpen, setCreateDealOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | 'bulk' | null>(null)
  
  // Estados de Edição/Preview
  const [selectedDeal, setSelectedDeal] = useState<MasterDeal | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [editDealOpen, setEditDealOpen] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)

  const getStageInfo = (stageKey: string): PipelineStage | undefined => {
    if (!stageKey) return undefined;
    return stages.find(s => s.id === stageKey) || 
           stages.find(s => s.name.toLowerCase().replace(/\s/g, '_') === stageKey) ||
           stages.find(s => s.isDefault);
  }

  const tracksByDealId = useMemo(() => {
    if (!allTracks) return {} as Record<string, any[]>;
    return allTracks.reduce((acc, track) => {
        if (!acc[track.masterDealId]) acc[track.masterDealId] = []
        if (track.status === 'active') acc[track.masterDealId].push(track)
        return acc
    }, {} as Record<string, any[]>)
  }, [allTracks])

  const getAdvancedTrackInfo = (dealId: string) => {
    const tracks = tracksByDealId[dealId] || []
    if (tracks.length === 0) return null
    const sorted = [...tracks].sort((a, b) => {
      const stageA = getStageInfo(a.currentStage);
      const stageB = getStageInfo(b.currentStage);
      const orderA = stageA ? stageA.stageOrder : -1;
      const orderB = stageB ? stageB.stageOrder : -1;
      return orderB - orderA;
    })
    const bestTrack = sorted[0]
    const bestStage = getStageInfo(bestTrack.currentStage)
    return {
      bestTrack,
      extraCount: tracks.length - 1,
      stageLabel: bestStage ? bestStage.name : bestTrack.currentStage,
      stageColor: bestStage ? bestStage.color : '#64748b',
      playerName: bestTrack.playerName,
      progress: bestStage ? bestStage.probability : 0
    }
  }

  const processedDeals = useMemo(() => {
    if (!masterDeals) return []
    const result = masterDeals.filter(deal => {
      if (searchQuery) {
        const term = searchQuery.toLowerCase()
        if (!deal.clientName.toLowerCase().includes(term) && !deal.company?.name?.toLowerCase().includes(term)) return false
      }
      if (filters.status !== 'all' && deal.status !== filters.status) return false
      if (filters.type !== 'all' && deal.operationType !== filters.type) return false
      if (filters.responsible !== 'all') {
        const isResponsible = deal.responsibles?.some(u => u.id === filters.responsible)
        if (!isResponsible) return false
      }
      const vol = Number(deal.volume || 0)
      if (filters.minVolume && vol < Number(filters.minVolume)) return false
      if (filters.maxVolume && vol > Number(filters.maxVolume)) return false
      return true
    })

    result.sort((a, b) => {
      let aValue: any = '', bValue: any = ''
      switch (sortConfig.key) {
        case 'clientName': aValue = a.clientName.toLowerCase(); bValue = b.clientName.toLowerCase(); break;
        case 'companyName': aValue = (a.company?.name || '').toLowerCase(); bValue = (b.company?.name || '').toLowerCase(); break;
        case 'volume': aValue = Number(a.volume || 0); bValue = Number(b.volume || 0); break;
        case 'status': aValue = a.status; bValue = b.status; break;
        case 'operationType': aValue = a.operationType; bValue = b.operationType; break;
        case 'trackStatus':
            const infoA = getAdvancedTrackInfo(a.id); const infoB = getAdvancedTrackInfo(b.id);
            aValue = infoA ? infoA.progress : -1; bValue = infoB ? infoB.progress : -1;
            break;
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    })
    return result
  }, [masterDeals, searchQuery, filters, sortConfig, tracksByDealId, stages])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.status !== 'all') count++
    if (filters.type !== 'all') count++
    if (filters.responsible !== 'all') count++
    if (filters.minVolume || filters.maxVolume) count++
    if (filters.tags.length > 0) count++
    return count
  }, [filters])

  const totalPages = Math.max(1, Math.ceil(processedDeals.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentDeals = processedDeals.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (key: SortKey) => setSortConfig(c => ({ key, direction: c.key === key && c.direction === 'asc' ? 'desc' : 'asc' }))
  
  // Alteração: Clique no card/linha vai direto para detalhes
  const handlePreview = (deal: MasterDeal) => {
    navigate(`/deals/${deal.id}`)
  }

  const handleEdit = (deal: MasterDeal) => { setSelectedDeal(deal); setEditDealOpen(true); }

  const handleDelete = async () => {
    if (!itemToDelete) return
    try {
        if (itemToDelete === 'bulk') {
            await deleteBulkMutation.mutateAsync(selectedIds)
            toast.success(`${selectedIds.length} negócios excluídos`)
            setSelectedIds([])
        } else {
            await deleteSingleMutation.mutateAsync(itemToDelete)
            toast.success('Negócio excluído')
        }
    } catch { toast.error('Erro ao excluir') }
    setDeleteDialogOpen(false); setItemToDelete(null);
  }

  const applyFilters = () => { setFilters(tempFilters); setIsFilterOpen(false); setCurrentPage(1); }
  const clearFilters = () => { setFilters(INITIAL_FILTERS); setTempFilters(INITIAL_FILTERS); setSearchQuery(''); }
  
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <CaretUpDown className="ml-1 h-3 w-3 opacity-50" />
    return sortConfig.direction === 'asc' ? <CaretUp className="ml-1 h-3 w-3" /> : <CaretDown className="ml-1 h-3 w-3" />
  }

  const toggleTagFilter = (tagId: string) => {
    setTempFilters(prev => {
        const current = prev.tags || [];
        const newTags = current.includes(tagId) ? current.filter(id => id !== tagId) : [...current, tagId];
        return { ...prev, tags: newTags };
    });
  }

  const rangeStart = processedDeals.length === 0 ? 0 : startIndex + 1
  const rangeEnd = Math.min(startIndex + itemsPerPage, processedDeals.length)

  
  return (
    <PageContainer>
      <SharedListLayout
        title="Negócios"
        description="Visão geral e gestão de oportunidades."
        primaryAction={<Button onClick={() => setCreateDealOpen(true)} className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Novo Negócio</Button>}
        metrics={!isLoading && masterDeals && <DealsMetrics deals={masterDeals} tracks={allTracks || []} />}
        filtersBar={
          <SharedListToolbar
            searchField={
              <div className="relative w-full md:w-80">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar cliente ou empresa..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9 h-9"
                />
              </div>
            }
            filters={
              <div className="flex flex-wrap gap-2 items-center">
                {/* Filtros rápidos fora do Popover para acesso direto */}
                <Select value={filters.status} onValueChange={(v) => { setFilters({ ...filters, status: v as any }); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-[130px] border-dashed"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="concluded">Concluídos</SelectItem>
                    <SelectItem value="cancelled">Cancelados</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.responsible} onValueChange={(v) => { setFilters({ ...filters, responsible: v }); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-[150px] border-dashed"><SelectValue placeholder="Responsável" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Resp.</SelectItem>
                    {users?.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                {tagsEnabled && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={`h-9 border-dashed ${filters.tags.length > 0 ? 'bg-primary/5 border-primary text-primary' : ''}`}>
                        <TagIcon className="mr-2 h-4 w-4" /> Tags {filters.tags.length > 0 && `(${filters.tags.length})`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Filtrar por Tags</Label>
                          <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                            {tags.map(tag => (
                              <Badge
                                key={tag.id}
                                variant={filters.tags.includes(tag.id) ? 'default' : 'outline'}
                                className="cursor-pointer hover:opacity-80"
                                onClick={() => {
                                    const newTags = filters.tags.includes(tag.id)
                                        ? filters.tags.filter(t => t !== tag.id)
                                        : [...filters.tags, tag.id];
                                    setFilters({ ...filters, tags: newTags });
                                    setCurrentPage(1);
                                }}
                                style={filters.tags.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : { color: tag.color, borderColor: tag.color + '40' }}
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {tags.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma tag encontrada.</span>}
                          </div>
                          {filters.tags.length > 0 && (
                            <Button variant="ghost" size="xs" className="w-full h-6 mt-2 text-xs" onClick={() => setFilters(prev => ({...prev, tags: []}))}>
                                Limpar Tags
                            </Button>
                          )}
                        </div>
                    </PopoverContent>
                  </Popover>
                )}

                {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
                        <Trash className="mr-2 h-3.5 w-3.5" /> Limpar
                    </Button>
                )}
              </div>
            }
            viewToggle={
              <div className="flex items-center bg-muted p-1 rounded-md border">
                <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('table')} title="Lista"><ListDashes /></Button>
                <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('grid')} title="Cards"><SquaresFour /></Button>
              </div>
            }
            rightContent={
              selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { setItemToDelete('bulk'); setDeleteDialogOpen(true); }}
                >
                  <Trash className="mr-2" /> ({selectedIds.length})
                </Button>
              )
            }
          />
        }
        footer={
          processedDeals.length > 0 && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-3 flex-wrap">
                <span>Mostrando {rangeStart}–{rangeEnd} de {processedDeals.length}</span>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">Linhas:</span>
                  <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[80px] h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <CaretLeft className="mr-1" /> Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                  Próximo <CaretRight className="ml-1" />
                </Button>
              </div>
            </div>
          )
        }
      >
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Carregando dados...</div>
        ) : viewMode === 'grid' ? (
          <DealsList deals={currentDeals} tracks={allTracks || []} stages={stages} onDealClick={handlePreview} />
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox checked={currentDeals.length > 0 && selectedIds.length === currentDeals.length} onCheckedChange={() => setSelectedIds(selectedIds.length === currentDeals.length ? [] : currentDeals.map(d => d.id))} />
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('clientName')}><div className="flex items-center gap-1">Cliente / Empresa <SortIcon columnKey="clientName" /></div></TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 w-[25%]" onClick={() => handleSort('trackStatus')}><div className="flex items-center gap-1">Progresso (Visual) <SortIcon columnKey="trackStatus" /></div></TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('operationType')}><div className="flex items-center gap-1">Tipo <SortIcon columnKey="operationType" /></div></TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('volume')}><div className="flex items-center gap-1">Volume <SortIcon columnKey="volume" /></div></TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}><div className="flex items-center gap-1">Status <SortIcon columnKey="status" /></div></TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDeals.map((deal) => {
                  const trackInfo = getAdvancedTrackInfo(deal.id)
                  const isSelected = selectedIds.includes(deal.id)
                  return (
                    <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handlePreview(deal)}>
                      <TableCell onClick={e => e.stopPropagation()} className="align-top">
                        <Checkbox checked={isSelected} onCheckedChange={() => setSelectedIds(prev => prev.includes(deal.id) ? prev.filter(id => id !== deal.id) : [...prev, deal.id])} />
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-foreground">{deal.clientName}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Buildings size={10} />{deal.company?.name || '-'}</span>
                          {tagsEnabled && deal.tags && deal.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {deal.tags.slice(0, 3).map(tag => (
                                <div key={tag.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} title={tag.name} />
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {trackInfo ? (
                          <div className="space-y-1.5 pr-4">
                            <div className="flex justify-between text-xs items-center">
                              <Badge variant="outline" className="h-5 px-1.5 font-normal text-[10px] bg-primary/5 border-primary/20 text-primary">{trackInfo.stageLabel}</Badge>
                              <span className="text-muted-foreground font-mono text-[10px]">{trackInfo.progress}%</span>
                            </div>
                            <Progress value={trackInfo.progress} className="h-1.5" />
                            <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1"><span className="font-medium text-foreground">{trackInfo.playerName}</span>{trackInfo.extraCount > 0 && <span className="text-muted-foreground">+{trackInfo.extraCount} outros</span>}</div>
                          </div>
                        ) : (<span className="text-xs text-muted-foreground italic pl-2">Sem players ativos</span>)}
                      </TableCell>
                      <TableCell className="align-top"><Badge variant="outline" className="font-normal text-muted-foreground border-slate-200">{OPERATION_LABELS[deal.operationType]}</Badge></TableCell>
                      <TableCell className="align-top font-medium text-slate-700 dark:text-slate-200">{formatCurrency(deal.volume)}</TableCell>
                      <TableCell className="align-top">
                        <StatusBadge
                          semanticStatus={dealStatusMap(deal.status)}
                          label={STATUS_LABELS[deal.status]}
                          className="font-normal rounded-full px-2"
                        />
                      </TableCell>
                      <TableCell className="text-right align-top" onClick={e => e.stopPropagation()}>
                        <QuickActionsMenu
                          actions={useDealQuickActions({
                            deal,
                            onEdit: () => handleEdit(deal),
                            onManageTags: () => { setTagsOpen(true); setSelectedDeal(deal); },
                          })}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
                {currentDeals.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum negócio encontrado.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </SharedListLayout>

      <DealPreviewSheet deal={selectedDeal} tracks={allTracks || []} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} onEdit={handleEdit} />
      <CreateDealDialog open={createDealOpen} onOpenChange={setCreateDealOpen} />
      {selectedDeal && <EditDealDialog deal={selectedDeal} open={editDealOpen} onOpenChange={setEditDealOpen} />}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
           <AlertDialogHeader><AlertDialogTitle>Tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação excluirá permanentemente o(s) negócio(s) selecionado(s).</AlertDialogDescription></AlertDialogHeader>
           <AlertDialogFooter><AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setItemToDelete(null); }}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim, excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {selectedDeal && <SmartTagSelector entityType="deal" entityId={selectedDeal.id} selectedTagIds={selectedDeal.tags?.map(t => t.id) || []} open={tagsOpen} onOpenChange={setTagsOpen} />}
    </PageContainer>
  )
}

