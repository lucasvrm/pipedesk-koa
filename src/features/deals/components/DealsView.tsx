import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeals, useDeleteDeal, useDeleteDeals } from '@/services/dealService'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
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
  Buildings
} from '@phosphor-icons/react'
import { DealStatus, STATUS_LABELS, OPERATION_LABELS, Deal } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { toast } from 'sonner'

// Ordenação
type SortKey = 'clientName' | 'volume' | 'status' | 'createdAt' | 'operationType' | 'companyName';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function DealsView() {
  const navigate = useNavigate()
  const { data: masterDeals, isLoading } = useDeals()
  
  const deleteSingleMutation = useDeleteDeal()
  const deleteBulkMutation = useDeleteDeals()

  // Estados
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' })

  // Modais
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | 'bulk' | null>(null)

  // --- Processamento ---
  const processedDeals = useMemo(() => {
    if (!masterDeals) return []

    // 1. Filtragem
    let result = masterDeals.filter(deal => {
      const matchesSearch = deal.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (deal.company?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || deal.status === statusFilter
      return matchesSearch && matchesStatus
    })

    // 2. Ordenação
    result.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (sortConfig.key) {
        case 'clientName':
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
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [masterDeals, searchQuery, statusFilter, sortConfig]);

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
            Negócios
          </h1>
          <p className="text-muted-foreground">Gerencie todos os seus Master Deals</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 space-y-4">
          
          {/* Barra de Ferramentas */}
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
            
            {/* Busca e Filtro */}
            <div className="flex flex-1 flex-col md:flex-row gap-3 w-full">
              <div className="relative w-full md:w-80 lg:w-96">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente ou empresa..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as DealStatus | 'all'); setCurrentPage(1); }}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Funnel className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="concluded">Concluídos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ações em Massa e Paginação */}
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
                      
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 w-[30%]" 
                        onClick={() => handleSort('clientName')}
                      >
                        <div className="flex items-center">Título <SortIcon columnKey="clientName" /></div>
                      </TableHead>

                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort('companyName')}
                      >
                        <div className="flex items-center">Empresa <SortIcon columnKey="companyName" /></div>
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

                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">Data <SortIcon columnKey="createdAt" /></div>
                      </TableHead>

                      <TableHead className="text-right">Ações</TableHead>
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

                          <TableCell>
                            <span className="text-sm text-muted-foreground">{OPERATION_LABELS[deal.operationType]}</span>
                          </TableCell>

                          <TableCell className="text-right font-medium">
                            {formatCurrency(deal.volume)}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge className={`${getStatusBadge(deal.status)} font-normal`}>
                              {STATUS_LABELS[deal.status]}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(deal.createdAt)}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Editar"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/deals/${deal.id}`);
                                }}
                              >
                                <PencilSimple />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={!isSelected} 
                                className={`
                                  ${isSelected ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : 'text-muted-foreground/30'}
                                `}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(deal.id);
                                }}
                              >
                                <Trash />
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

      {/* MODAL DE CONFIRMAÇÃO */}
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
              <br />
              O histórico de interações com players vinculado a este deal também será perdido.
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