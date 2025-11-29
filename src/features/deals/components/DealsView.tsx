import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeals, useDeleteDeal, useDeleteDeals } from '@/services/dealService'
import { useUsers } from '@/services/userService'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  MagnifyingGlass, Trash, Kanban, CaretUp, CaretDown, CaretUpDown, 
  CaretLeft, CaretRight, Funnel, PencilSimple, Buildings, X, Tag as TagIcon
} from '@phosphor-icons/react'
import { DealStatus, STATUS_LABELS, OPERATION_LABELS, OperationType, MasterDeal } from '@/lib/types'
import { formatCurrency, getInitials } from '@/lib/helpers'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { EditDealDialog } from './EditDealDialog' // Importado
import { DealTagsDialog } from './DealTagsDialog' // Importado

// Tipos
type SortKey = 'clientName' | 'companyName' | 'volume' | 'status' | 'operationType';
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
}

const INITIAL_FILTERS: FilterState = {
  status: 'all',
  type: 'all',
  responsible: 'all',
  minVolume: '',
  maxVolume: ''
}

const getOperationBadgeColor = (type: OperationType) => {
  switch (type) {
    case 'ccb':
    case 'cri_land':
    case 'cri_construction':
    case 'cri_corporate':
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
    case 'debt_construction':
    case 'receivables_advance':
    case 'working_capital':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100';
    case 'built_to_suit':
    case 'sale_and_lease_back':
    case 'inventory_purchase':
    case 'repurchase':
      return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
    case 'preferred_equity':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    case 'financial_swap':
    case 'physical_swap':
    case 'hybrid_swap':
      return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export default function DealsView() {
  const navigate = useNavigate()
  const { data: masterDeals, isLoading } = useDeals()
  const { data: users } = useUsers()
  
  const deleteSingleMutation = useDeleteDeal()
  const deleteBulkMutation = useDeleteDeals()

  // Estados de Controle
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'clientName', direction: 'asc' })

  // Estado Unificado de Filtros
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [tempFilters, setTempFilters] = useState<FilterState>(INITIAL_FILTERS) 
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Modais
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | 'bulk' | null>(null)
  
  // Estados de Edição e Tags
  const [editDealOpen, setEditDealOpen] = useState(false)
  const [tagsDealOpen, setTagsDealOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<MasterDeal | null>(null)

  // --- Helpers de Filtros Ativos ---
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.status !== 'all') count++
    if (filters.type !== 'all') count++
    if (filters.responsible !== 'all') count++
    if (filters.minVolume || filters.maxVolume) count++
    return count
  }, [filters])

  const hasActiveFilters = activeFilterCount > 0 || searchQuery.length > 0

  const applyFilters = () => {
    setFilters(tempFilters)
    setIsFilterOpen(false)
    setCurrentPage(1)
  }

  const clearFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters }
    if (key === 'minVolume' || key === 'maxVolume') {
      newFilters.minVolume = ''
      newFilters.maxVolume = ''
    } else {
      // @ts-ignore
      newFilters[key] = INITIAL_FILTERS[key]
    }
    setFilters(newFilters)
    setTempFilters(newFilters)
  }

  const resetAllFilters = () => {
    setFilters(INITIAL_FILTERS)
    setTempFilters(INITIAL_FILTERS)
    setSearchQuery('')
    setCurrentPage(1)
  }

  // --- Processamento de Dados ---
  const processedDeals = useMemo(() => {
    if (!masterDeals) return []

    let result = masterDeals.filter(deal => {
      if (searchQuery) {
        const companyName = deal.company?.name?.toLowerCase() || ''
        const clientName = deal.clientName?.toLowerCase() || ''
        if (!companyName.includes(searchQuery.toLowerCase()) && !clientName.includes(searchQuery.toLowerCase())) return false
      }

      if (filters.status !== 'all' && deal.status !== filters.status) return false
      if (filters.type !== 'all' && deal.operationType !== filters.type) return false
      
      if (filters.responsible !== 'all') {
        const isResponsible = deal.responsibles?.some(u => u.id === filters.responsible)
        if (!isResponsible) return false
      }

      const dealVolume = deal.volume || 0
      const min = filters.minVolume ? parseFloat(filters.minVolume) : 0
      const max = filters.maxVolume ? parseFloat(filters.maxVolume) : Infinity
      
      if (dealVolume < min) return false
      if (filters.maxVolume && dealVolume > max) return false

      return true
    })

    result.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (sortConfig.key) {
        case 'clientName': aValue = a.clientName.toLowerCase(); bValue = b.clientName.toLowerCase(); break;
        case 'companyName': aValue = (a.company?.name || '').toLowerCase(); bValue = (b.company?.name || '').toLowerCase(); break;
        case 'volume': aValue = a.volume; bValue = b.volume; break;
        case 'status': aValue = STATUS_LABELS[a.status]; bValue = STATUS_LABELS[b.status]; break;
        case 'operationType': aValue = OPERATION_LABELS[a.operationType]; bValue = OPERATION_LABELS[b.operationType]; break;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [masterDeals, searchQuery, filters, sortConfig]);

  const totalPages = Math.ceil(processedDeals.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDeals = processedDeals.slice(startIndex, endIndex)

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === currentDeals.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(currentDeals.map(d => d.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const confirmDelete = (target: string | 'bulk') => {
    setItemToDelete(target)
    setDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!itemToDelete) return
    try {
      if (itemToDelete === 'bulk') {
        await deleteBulkMutation.mutateAsync(selectedIds)
        toast.success(`${selectedIds.length} deals excluídos`)
        setSelectedIds([])
      } else {
        await deleteSingleMutation.mutateAsync(itemToDelete)
        toast.success('Deal excluído')
        setSelectedIds(prev => prev.filter(id => id !== itemToDelete))
      }
    } catch (error) {
      toast.error('Erro ao excluir')
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <CaretUpDown className="ml-1 h-3 w-3 text-muted-foreground opacity-50" />
    return sortConfig.direction === 'asc' 
      ? <CaretUp className="ml-1 h-3 w-3 text-primary" weight="bold" />
      : <CaretDown className="ml-1 h-3 w-3 text-primary" weight="bold" />
  }

  const getStatusBadge = (status: DealStatus) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'concluded': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case 'on_hold': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Kanban className="text-primary" />
            Diretório de Deals
          </h1>
          <p className="text-muted-foreground">Gerencie as oportunidades e mandatos da casa.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 space-y-4">
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
            <div className="flex flex-1 flex-col md:flex-row gap-3 w-full items-center">
              <div className="relative w-full md:w-96">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente (Empresa)..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>

              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`border-dashed ${activeFilterCount > 0 ? 'bg-primary/5 border-primary text-primary' : ''}`}>
                    <Funnel className="mr-2 h-4 w-4" />
                    Filtros
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                   {/* Conteúdo do Popover de Filtros (Mantido igual) */}
                   <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium leading-none">Filtros Avançados</h4>
                      {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={resetAllFilters} className="h-auto p-0 text-xs text-muted-foreground hover:text-primary">
                          Limpar
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Status</Label>
                      <Select value={tempFilters.status} onValueChange={(v) => setTempFilters({...tempFilters, status: v as DealStatus | 'all'})}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="active">Ativos</SelectItem>
                          <SelectItem value="on_hold">Em Espera</SelectItem>
                          <SelectItem value="concluded">Concluídos</SelectItem>
                          <SelectItem value="cancelled">Cancelados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* ... Outros filtros ... */}
                    <Button className="w-full" size="sm" onClick={applyFilters}>
                      Aplicar Filtros
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Badges de Filtros Ativos (Mantido) */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* ... Badges ... */}
                  <Button variant="ghost" size="sm" onClick={resetAllFilters} className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive">
                    Limpar tudo
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {selectedIds.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="animate-in fade-in slide-in-from-right-5"
                  onClick={() => confirmDelete('bulk')}
                >
                  <Trash className="mr-2" /> Excluir ({selectedIds.length})
                </Button>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Linhas:</span>
                <Select 
                  value={String(itemsPerPage)} 
                  onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
                >
                  <SelectTrigger className="w-[70px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando deals...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={currentDeals.length > 0 && selectedIds.length === currentDeals.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('companyName')}>
                        <div className="flex items-center">Empresa <SortIcon columnKey="companyName" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 w-[25%]" onClick={() => handleSort('clientName')}>
                        <div className="flex items-center">Deal <SortIcon columnKey="clientName" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('operationType')}>
                        <div className="flex items-center">Tipo <SortIcon columnKey="operationType" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleSort('volume')}>
                        <div className="flex items-center justify-end">Volume <SortIcon columnKey="volume" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 text-center" onClick={() => handleSort('status')}>
                        <div className="flex items-center justify-center">Status <SortIcon columnKey="status" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center justify-center">Responsável</div>
                      </TableHead>
                      <TableHead className="text-right w-[110px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentDeals.length > 0 ? currentDeals.map((deal) => {
                      const isSelected = selectedIds.includes(deal.id)
                      return (
                        <TableRow 
                          key={deal.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/deals/${deal.id}`)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelectOne(deal.id)} />
                          </TableCell>
                          <TableCell>
                            {deal.company ? (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Buildings className="h-3 w-3" />
                                {deal.company.name}
                              </div>
                            ) : <span className="text-xs text-muted-foreground italic">-</span>}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col gap-1">
                              <span>{deal.clientName}</span>
                              {/* TAGS NA LISTAGEM */}
                              {deal.tags && deal.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {deal.tags.map(tag => (
                                    <Badge 
                                      key={tag.id} 
                                      variant="outline" 
                                      style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40', fontSize: '10px', height: '18px', padding: '0 6px' }}
                                    >
                                      {tag.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-normal whitespace-nowrap border ${getOperationBadgeColor(deal.operationType)}`}>
                              {OPERATION_LABELS[deal.operationType] || deal.operationType || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(deal.volume)}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${getStatusBadge(deal.status)} font-normal`}>{STATUS_LABELS[deal.status]}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex -space-x-2 overflow-hidden justify-center">
                              {deal.responsibles && deal.responsibles.length > 0 ? (
                                deal.responsibles.slice(0, 3).map((user, i) => (
                                  <Avatar key={i} className="inline-block h-6 w-6 ring-2 ring-background" title={user.name}>
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-bold">{getInitials(user.name)}</AvatarFallback>
                                  </Avatar>
                                ))
                              ) : <span className="text-xs text-muted-foreground">-</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {/* Botão de Tags na Linha */}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Gerenciar Tags"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDeal(deal);
                                  setTagsDealOpen(true);
                                }}
                              >
                                <TagIcon className="h-4 w-4" />
                              </Button>
                              
                              {/* Botão de Editar Corrigido */}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Editar"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDeal(deal);
                                  setEditDealOpen(true);
                                }}
                              >
                                <PencilSimple className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={!isSelected} 
                                className={`h-8 w-8 ${isSelected ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : 'text-muted-foreground/30 cursor-not-allowed'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(deal.id);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }) : (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum deal encontrado.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {processedDeals.length > 0 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, processedDeals.length)} de {processedDeals.length} deals
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { const newPage = currentPage - 1; if (newPage >= 1) setCurrentPage(newPage); }} disabled={currentPage === 1}><CaretLeft className="mr-2 h-4 w-4" /> Anterior</Button>
                    <Button variant="outline" size="sm" onClick={() => { const newPage = currentPage + 1; if (newPage <= totalPages) setCurrentPage(newPage); }} disabled={currentPage === totalPages}>Próximo <CaretRight className="ml-2 h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o deal selecionado e todo o histórico vinculado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setItemToDelete(null); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar Deleção</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedDeal && (
        <>
          <EditDealDialog 
            deal={selectedDeal} 
            open={editDealOpen} 
            onOpenChange={setEditDealOpen} 
          />
          <DealTagsDialog 
            deal={selectedDeal} 
            open={tagsDealOpen} 
            onOpenChange={setTagsDealOpen} 
          />
        </>
      )}

    </div>
  )
}