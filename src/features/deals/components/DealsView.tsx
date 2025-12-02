import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeals, useDeleteDeal, useDeleteDeals } from '@/services/dealService'
import { useTracks } from '@/services/trackService'
import { useUsers } from '@/services/userService'
import { useStages } from '@/services/pipelineService'
import { useTags } from '@/services/tagService'
import { useSettings } from '@/services/systemSettingsService'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label'
import { MagnifyingGlass, Trash, CaretUp, CaretDown, CaretUpDown, CaretLeft, CaretRight, Funnel, PencilSimple, Buildings, ListDashes, SquaresFour, Plus, Tag as TagIcon, Briefcase } from '@phosphor-icons/react'
import { DealStatus, STATUS_LABELS, OPERATION_LABELS, OperationType, MasterDeal, PipelineStage } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import { toast } from 'sonner'
import { SharedListLayout } from '@/components/layouts/SharedListLayout'
import { SharedListFiltersBar } from '@/components/layouts/SharedListFiltersBar'
import { PageContainer } from '@/components/PageContainer'
import { SmartTagSelector } from '@/components/SmartTagSelector'
import { EditDealDialog } from './EditDealDialog'
import { CreateDealDialog } from './CreateDealDialog'
import { DealsMetrics } from './DealsMetrics'
import { DealPreviewSheet } from './DealPreviewSheet'
import DealsList from './DealsList'

type SortKey = 'clientName' | 'companyName' | 'volume' | 'status' | 'operationType' | 'trackStatus';
type SortDirection = 'asc' | 'desc';
interface SortConfig { key: SortKey; direction: SortDirection; }
interface FilterState { status: DealStatus | 'all'; type: OperationType | 'all'; responsible: string; minVolume: string; maxVolume: string; tags: string[]; }
const INITIAL_FILTERS: FilterState = { status: 'all', type: 'all', responsible: 'all', minVolume: '', maxVolume: '', tags: [] }

const getStatusBadgeClass = (status: DealStatus) => {
    switch (status) {
        case 'active': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
        case 'concluded': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
        case 'cancelled': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
        case 'on_hold': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

export default function DealsView() {
  const navigate = useNavigate()
  const { data: users } = useUsers()
  const { data: stages = [] } = useStages()
  const { data: tags = [] } = useTags('deal')
  const { data: settings } = useSettings()
  
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [tempFilters, setTempFilters] = useState<FilterState>(INITIAL_FILTERS)
  const { data: masterDeals, isLoading: dealsLoading } = useDeals(filters.tags.length > 0 ? filters.tags : undefined)
  const { data: allTracks, isLoading: tracksLoading } = useTracks()
  const deleteSingleMutation = useDeleteDeal()
  const deleteBulkMutation = useDeleteDeals()
  const isLoading = dealsLoading || tracksLoading
  const tagsEnabled = settings?.find(s => s.key === 'tags_config')?.value?.global && settings?.find(s => s.key === 'tags_config')?.value?.modules?.deals !== false;

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'clientName', direction: 'asc' })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [createDealOpen, setCreateDealOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | 'bulk' | null>(null)
  const [selectedDeal, setSelectedDeal] = useState<MasterDeal | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [editDealOpen, setEditDealOpen] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)

  const getStageInfo = (stageKey: string) => stages.find(s => s.id === stageKey) || stages.find(s => s.name.toLowerCase().replace(/\s/g, '_') === stageKey) || stages.find(s => s.isDefault);
  const tracksByDealId = useMemo(() => allTracks?.reduce((acc: any, t) => { if (!acc[t.masterDealId]) acc[t.masterDealId] = []; if (t.status === 'active') acc[t.masterDealId].push(t); return acc }, {}) || {}, [allTracks])
  
  const getAdvancedTrackInfo = (dealId: string) => {
    const tracks = tracksByDealId[dealId] || []
    if (tracks.length === 0) return null
    const bestTrack = [...tracks].sort((a: any, b: any) => (getStageInfo(b.currentStage)?.stageOrder || 0) - (getStageInfo(a.currentStage)?.stageOrder || 0))[0]
    const bestStage = getStageInfo(bestTrack.currentStage)
    return { bestTrack, extraCount: tracks.length - 1, stageLabel: bestStage?.name || bestTrack.currentStage, stageColor: bestStage?.color || '#64748b', playerName: bestTrack.playerName, progress: bestStage?.probability || 0 }
  }

  const processedDeals = useMemo(() => {
    if (!masterDeals) return []
    const result = masterDeals.filter(deal => {
      if (searchQuery && !deal.clientName.toLowerCase().includes(searchQuery.toLowerCase()) && !deal.company?.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filters.status !== 'all' && deal.status !== filters.status) return false
      if (filters.type !== 'all' && deal.operationType !== filters.type) return false
      if (filters.responsible !== 'all' && !deal.responsibles?.some(u => u.id === filters.responsible)) return false
      if ((filters.minVolume && Number(deal.volume) < Number(filters.minVolume)) || (filters.maxVolume && Number(deal.volume) > Number(filters.maxVolume))) return false
      return true
    })
    result.sort((a, b) => {
      let aV: any = '', bV: any = '';
      if (sortConfig.key === 'clientName') { aV = a.clientName.toLowerCase(); bV = b.clientName.toLowerCase(); }
      else if (sortConfig.key === 'volume') { aV = Number(a.volume || 0); bV = Number(b.volume || 0); }
      else { aV = a[sortConfig.key] || ''; bV = b[sortConfig.key] || ''; }
      return sortConfig.direction === 'asc' ? (aV < bV ? -1 : 1) : (aV > bV ? -1 : 1);
    })
    return result
  }, [masterDeals, searchQuery, filters, sortConfig])

  const totalPages = Math.max(1, Math.ceil(processedDeals.length / itemsPerPage))
  const currentDeals = processedDeals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const activeFilterCount = (filters.status !== 'all' ? 1 : 0) + (filters.type !== 'all' ? 1 : 0) + (filters.responsible !== 'all' ? 1 : 0) + (filters.minVolume || filters.maxVolume ? 1 : 0) + (filters.tags.length > 0 ? 1 : 0)

  const handleDelete = async () => {
    try {
        if (itemToDelete === 'bulk') { await deleteBulkMutation.mutateAsync(selectedIds); setSelectedIds([]); }
        else if (itemToDelete) { await deleteSingleMutation.mutateAsync(itemToDelete); }
        toast.success('Excluído'); setDeleteDialogOpen(false); setItemToDelete(null);
    } catch { toast.error('Erro'); }
  }

  const applyFilters = () => { setFilters(tempFilters); setIsFilterOpen(false); setCurrentPage(1); }
  const clearFilters = () => { setFilters(INITIAL_FILTERS); setTempFilters(INITIAL_FILTERS); setSearchQuery(''); }
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => sortConfig.key !== columnKey ? <CaretUpDown className="ml-1 h-3 w-3 opacity-50" /> : sortConfig.direction === 'asc' ? <CaretUp className="ml-1 h-3 w-3" /> : <CaretDown className="ml-1 h-3 w-3" />

  return (
    <PageContainer>
      <SharedListLayout
        title="Negócios"
        description="Gestão de oportunidades."
        isLoading={isLoading}
        isEmpty={!isLoading && processedDeals.length === 0}
        emptyState={{ title: "Nenhum negócio", description: "Crie um novo negócio para começar.", actionLabel: "Novo Negócio", onAction: () => setCreateDealOpen(true), icon: <Briefcase size={48} /> }}
        metrics={!isLoading && masterDeals && <DealsMetrics deals={masterDeals} tracks={allTracks || []} />}
        primaryAction={<Button onClick={() => setCreateDealOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo Negócio</Button>}
        filtersBar={
          <SharedListFiltersBar
            leftContent={
              <>
                <div className="relative w-full md:w-80">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input placeholder="Buscar cliente..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-9 h-9" />
                </div>
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild><Button variant="outline" size="sm" className={`h-9 border-dashed ${activeFilterCount > 0 ? 'bg-primary/5 border-primary text-primary' : ''}`}><Funnel className="mr-2 h-4 w-4" /> Filtros {activeFilterCount > 0 && <Badge className="ml-2 h-5 px-1">{activeFilterCount}</Badge>}</Button></PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-4">
                      <h4 className="font-medium">Filtros Avançados</h4>
                      <div className="space-y-2"><Label>Status</Label><Select value={tempFilters.status} onValueChange={(v) => setTempFilters({ ...tempFilters, status: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="active">Ativos</SelectItem><SelectItem value="concluded">Concluídos</SelectItem><SelectItem value="cancelled">Cancelados</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Responsável</Label><Select value={tempFilters.responsible} onValueChange={(v) => setTempFilters({ ...tempFilters, responsible: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{users?.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select></div>
                      <Button className="w-full" size="sm" onClick={applyFilters}>Aplicar</Button>
                      {activeFilterCount > 0 && <Button variant="ghost" size="sm" className="w-full h-6" onClick={clearFilters}>Limpar</Button>}
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex items-center bg-muted p-1 rounded-md border">
                  <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('table')}><ListDashes /></Button>
                  <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('grid')}><SquaresFour /></Button>
                </div>
              </>
            }
            rightContent={selectedIds.length > 0 && <Button variant="destructive" size="sm" onClick={() => { setItemToDelete('bulk'); setDeleteDialogOpen(true); }}><Trash className="mr-2" /> ({selectedIds.length})</Button>}
          />
        }
        footer={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, processedDeals.length)}–{Math.min(currentPage * itemsPerPage, processedDeals.length)} de {processedDeals.length}</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}><SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent></Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><CaretLeft className="mr-1" /> Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Próximo <CaretRight className="ml-1" /></Button>
            </div>
          </div>
        }
      >
        {viewMode === 'grid' ? <DealsList deals={currentDeals} tracks={allTracks || []} stages={stages} onDealClick={(d) => { setSelectedDeal(d); setIsPreviewOpen(true); }} /> : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[40px] sticky top-0 bg-muted/50 z-10"><Checkbox checked={currentDeals.length > 0 && selectedIds.length === currentDeals.length} onCheckedChange={() => setSelectedIds(selectedIds.length === currentDeals.length ? [] : currentDeals.map(d => d.id))} /></TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/60 sticky top-0 bg-muted/50 z-10" onClick={() => setSortConfig({ key: 'clientName', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>Cliente / Empresa <SortIcon columnKey="clientName" /></TableHead>
                <TableHead className="w-[25%] sticky top-0 bg-muted/50 z-10">Progresso</TableHead>
                <TableHead className="sticky top-0 bg-muted/50 z-10">Tipo</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/60 sticky top-0 bg-muted/50 z-10" onClick={() => setSortConfig({ key: 'volume', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>Volume <SortIcon columnKey="volume" /></TableHead>
                <TableHead className="sticky top-0 bg-muted/50 z-10">Status</TableHead>
                <TableHead className="text-right sticky top-0 bg-muted/50 z-10">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDeals.map((deal) => {
                const trackInfo = getAdvancedTrackInfo(deal.id)
                return (
                  <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedDeal(deal); setIsPreviewOpen(true); }}>
                    <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.includes(deal.id)} onCheckedChange={() => setSelectedIds(p => p.includes(deal.id) ? p.filter(i => i !== deal.id) : [...p, deal.id])} /></TableCell>
                    <TableCell>
                      <div className="flex flex-col"><span className="font-medium text-sm">{deal.clientName}</span><span className="text-xs text-muted-foreground flex items-center gap-1"><Buildings size={10} />{deal.company?.name || '-'}</span>{tagsEnabled && deal.tags?.length > 0 && (<div className="flex gap-1 mt-1">{deal.tags.slice(0, 3).map(t => <div key={t.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} title={t.name} />)}</div>)}</div>
                    </TableCell>
                    <TableCell>
                      {trackInfo ? (<div className="space-y-1.5 pr-4"><div className="flex justify-between text-xs items-center"><Badge variant="outline" className="h-5 px-1.5 font-normal text-[10px] bg-primary/5">{trackInfo.stageLabel}</Badge><span className="text-muted-foreground font-mono text-[10px]">{trackInfo.progress}%</span></div><Progress value={trackInfo.progress} className="h-1.5" /><div className="text-[10px] text-muted-foreground truncate">{trackInfo.playerName}{trackInfo.extraCount > 0 && ` +${trackInfo.extraCount}`}</div></div>) : <span className="text-xs text-muted-foreground italic">Sem players</span>}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="font-normal border-slate-200">{OPERATION_LABELS[deal.operationType]}</Badge></TableCell>
                    <TableCell className="font-medium">{formatCurrency(deal.volume)}</TableCell>
                    <TableCell><Badge className={`font-normal rounded-full px-2 ${getStatusBadgeClass(deal.status)}`}>{STATUS_LABELS[deal.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setTagsOpen(true); setSelectedDeal(deal); }}><TagIcon size={16} /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedDeal(deal); setEditDealOpen(true); }}><PencilSimple size={16} /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); setItemToDelete(deal.id); setDeleteDialogOpen(true); }}><Trash size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </SharedListLayout>
      <DealPreviewSheet deal={selectedDeal} tracks={allTracks || []} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} onEdit={() => { setIsPreviewOpen(false); setEditDealOpen(true); }} />
      <CreateDealDialog open={createDealOpen} onOpenChange={setCreateDealOpen} />
      {selectedDeal && <EditDealDialog deal={selectedDeal} open={editDealOpen} onOpenChange={setEditDealOpen} />}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      {selectedDeal && <SmartTagSelector entityType="deal" entityId={selectedDeal.id} selectedTagIds={selectedDeal.tags?.map(t => t.id) || []} open={tagsOpen} onOpenChange={setTagsOpen} />}
    </PageContainer>
  )
}