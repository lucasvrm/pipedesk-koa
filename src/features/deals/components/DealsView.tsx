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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  MagnifyingGlass, 
  Trash, 
  Kanban, 
  CaretUp, 
  CaretDown, 
  CaretUpDown,
  CaretLeft,
  CaretRight,
  Funnel,
  PencilSimple,
  Buildings,
  User as UserIcon,
  X
} from '@phosphor-icons/react'
import { DealStatus, STATUS_LABELS, OPERATION_LABELS, OperationType } from '@/lib/types'
import { formatCurrency, getInitials } from '@/lib/helpers'
import { toast } from 'sonner'

// Configuração de Ordenação
type SortKey = 'clientName' | 'companyName' | 'volume' | 'status' | 'operationType';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

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

  // Estados dos Filtros
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<OperationType | 'all'>('all')
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all')
  const [volumeRange, setVolumeRange] = useState<{ min: string, max: string }>({ min: '', max: '' })

  // Modais
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | 'bulk' | null>(null)

  // --- Processamento de Dados ---
  const processedDeals = useMemo(() => {
    if (!masterDeals) return []

    // 1. Filtragem
    let result = masterDeals.filter(deal => {
      // REGRA 3b: Lógica de Busca: Somente pelo nome da empresa (Company)
      if (searchQuery) {
        const companyName = deal.company?.name?.toLowerCase() || ''
        // Se não tem empresa ou o nome não bate, remove
        if (!companyName.includes(searchQuery.toLowerCase())) return false
      }

      // Filtro de Status
      if (statusFilter !== 'all' && deal.status !== statusFilter) return false

      // Filtro de Tipo
      if (typeFilter !== 'all' && deal.operationType !== typeFilter) return false

      // REGRA 5: Filtro de Responsável (Verifica se o ID está na lista de responsibles)
      if (responsibleFilter !== 'all') {
        const isResponsible = deal.responsibles?.some(u => u.id === responsibleFilter)
        if (!isResponsible) return false
      }

      // REGRA 5: Filtro de Volume
      const dealVolume = deal.volume || 0
      const minVol = volumeRange.min ? parseFloat(volumeRange.min) : 0
      const maxVol = volumeRange.max ? parseFloat(volumeRange.max) : Infinity
      
      if (dealVolume < minVol) return false
      if (volumeRange.max && dealVolume > maxVol) return false

      return true
    })

    // 2. Ordenação
    result.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (sortConfig.key) {
        case 'clientName': // REGRA 1: Coluna Negócio (era Título)
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
        case 'companyName':
          aValue = (a.company?.name || '').toLowerCase();
          bValue = (b.company?.name || '').toLowerCase();
          break;
        case 'volume':
          aValue = a.volume;
          bValue = b.volume;
          break;
        case 'status':
          aValue = STATUS_LABELS[a.status];
          bValue = STATUS_LABELS[b.status];
          break;
        case 'operationType':
          aValue = OPERATION_LABELS[a.operationType];
          bValue = OPERATION_LABELS[b.operationType];
          break;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [masterDeals, searchQuery, statusFilter, typeFilter, responsibleFilter, volumeRange, sortConfig]);

  // --- Paginação ---
  const totalPages = Math.ceil(processedDeals.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDeals = processedDeals.slice(startIndex, endIndex)

  // --- Handlers ---
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
        toast.success(`${selectedIds.length} negócios excluídos`)
        setSelectedIds([])
      } else {
        await deleteSingleMutation.mutateAsync(itemToDelete)
        toast.success('Negócio excluído')
        setSelectedIds(prev => prev.filter(id => id !== itemToDelete))
      }
    } catch (error) {
      toast.error('Erro ao excluir')
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setTypeFilter('all')
    setResponsibleFilter('all')
    setVolumeRange({ min: '', max: '' })
    setCurrentPage(1)
  }

  // --- UI Helpers ---
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
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Kanban className="text-primary" />
            Diretório de Master Deals
          </h1>
          {/* REGRA 6: Subtítulo alterado */}
          <p className="text-muted-foreground">Diretório de Master Deals</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 space-y-4">
          
          {/* Barra de Ferramentas */}
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
            
            {/* Grupo Esquerda: Busca e Filtros */}
            <div className="flex flex-1 flex-col md:flex-row gap-3 w-full">
              
              {/* Busca */}
              <div className="relative w-full md:w-72">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                {/* REGRA 3a: Máscara "Buscar por cliente" */}
                <Input
                  placeholder="Buscar por cliente..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-2">
                
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as DealStatus | 'all'); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status: Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="concluded">Concluídos</SelectItem>
                    <SelectItem value="cancelled">Cancelados</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as OperationType | 'all'); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tipo: Todos</SelectItem>
                    {Object.entries(OPERATION_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* REGRA 5: Filtro por Responsável */}
                <Select value={responsibleFilter} onValueChange={(v) => { setResponsibleFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[150px] h-9">
                    <UserIcon className="mr-2 h-3 w-3 text-muted-foreground" />
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Resp: Todos</SelectItem>
                    {(users || []).map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* REGRA 5: Filtro de Volume */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 border-dashed text-muted-foreground">
                      <Funnel className="mr-2 h-3 w-3" />
                      Volume
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Faixa de Volume</h4>
                      <p className="text-sm text-muted-foreground">Filtrar por valor estimado.</p>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="space-y-1">
                          <span className="text-xs">Mínimo</span>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            value={volumeRange.min}
                            onChange={e => setVolumeRange({...volumeRange, min: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs">Máximo</span>
                          <Input 
                            type="number" 
                            placeholder="∞" 
                            value={volumeRange.max}
                            onChange={e => setVolumeRange({...volumeRange, max: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Botão Limpar Filtros */}
                {(statusFilter !== 'all' || typeFilter !== 'all' || responsibleFilter !== 'all' || searchQuery || volumeRange.min || volumeRange.max) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-muted-foreground">
                    <X className="mr-1 h-3 w-3" /> Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Grupo Direita: Ações em Massa e Paginação */}
            <div className="flex items-center gap-3 shrink-0">
              {/* REGRA 1: Botão de Excluir em Massa (Igual /players) */}
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
            <div className="text-center py-12 text-muted-foreground">Carregando negócios...</div>
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
                      
                      {/* REGRA 1: Título -> Negócio */}
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 w-[25%]" 
                        onClick={() => handleSort('clientName')}
                      >
                        <div className="flex items-center">Negócio <SortIcon columnKey="clientName" /></div>
                      </TableHead>

                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort('companyName')}
                      >
                        <div className="flex items-center">Empresa <SortIcon columnKey="companyName" /></div>
                      </TableHead>

                      {/* REGRA 4: Coluna Responsável */}
                      <TableHead className="cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center">Responsável</div>
                      </TableHead>

                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort('operationType')}
                      >
                        <div className="flex items-center">Tipo <SortIcon columnKey="operationType" /></div>
                      </TableHead>

                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 text-right" 
                        onClick={() => handleSort('volume')}
                      >
                        <div className="flex items-center justify-end">Volume <SortIcon columnKey="volume" /></div>
                      </TableHead>

                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 text-center" 
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center">Status <SortIcon columnKey="status" /></div>
                      </TableHead>

                      {/* REGRA 2: Coluna Data removida */}

                      <TableHead className="text-right w-[80px]">Ações</TableHead>
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
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectOne(deal.id)}
                            />
                          </TableCell>
                          
                          <TableCell className="font-medium">
                            {deal.clientName}
                          </TableCell>

                          <TableCell>
                            {deal.company ? (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Buildings className="h-3 w-3" />
                                {deal.company.name}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">-</span>
                            )}
                          </TableCell>

                          {/* Coluna Responsável (Avatar Group se múltiplos, mas aqui mostramos o principal e +X) */}
                          <TableCell>
                            <div className="flex -space-x-2 overflow-hidden">
                              {deal.responsibles && deal.responsibles.length > 0 ? (
                                deal.responsibles.slice(0, 3).map((user, i) => (
                                  <Avatar key={i} className="inline-block h-6 w-6 ring-2 ring-background" title={user.name}>
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-bold">
                                      {getInitials(user.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                              {(deal.responsibles?.length || 0) > 3 && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-background bg-muted text-[9px] font-medium">
                                  +{(deal.responsibles?.length || 0) - 3}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {OPERATION_LABELS[deal.operationType]}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right font-medium">
                            {formatCurrency(deal.volume)}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge className={`${getStatusBadge(deal.status)} font-normal`}>
                              {STATUS_LABELS[deal.status]}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Editar"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/deals/${deal.id}`);
                                }}
                              >
                                <PencilSimple className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={!isSelected} 
                                className={`
                                  h-8 w-8 
                                  ${isSelected ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : 'text-muted-foreground/30 cursor-not-allowed'}
                                `}
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
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum negócio encontrado com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {processedDeals.length > 0 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, processedDeals.length)} de {processedDeals.length} negócios
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage - 1;
                        if (newPage >= 1) setCurrentPage(newPage);
                      }}
                      disabled={currentPage === 1}
                    >
                      <CaretLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage + 1;
                        if (newPage <= totalPages) setCurrentPage(newPage);
                      }}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                      <CaretRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. 
              {itemToDelete === 'bulk' 
                ? ` Você está prestes a excluir permanentemente ${selectedIds.length} negócios selecionados.`
                : " Você está prestes a excluir este negócio permanentemente."
              }
              <br /><br />
              O histórico de interações com players vinculado a este deal também será perdido (Soft Delete).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setItemToDelete(null); }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Deleção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}