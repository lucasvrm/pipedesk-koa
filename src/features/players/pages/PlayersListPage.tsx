import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers, useDeletePlayer, useDeletePlayers } from '@/services/playerService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { 
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Plus, MagnifyingGlass, Trash, Buildings, PencilSimple, User, Phone, Funnel, X,
  CaretUp, CaretDown, CaretUpDown, CaretLeft, CaretRight
} from '@phosphor-icons/react'
import { 
  PLAYER_TYPE_LABELS, RELATIONSHIP_LEVEL_LABELS, Player, PlayerType, RelationshipLevel,
  CREDIT_SUBTYPE_LABELS, EQUITY_SUBTYPE_LABELS, BARTER_SUBTYPE_LABELS
} from '@/lib/types'
import { toast } from 'sonner'
import { PageContainer } from '@/components/PageContainer'

// Tipagem para ordenação
type SortKey = 'name' | 'primaryContact' | 'type' | 'relationshipLevel';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function PlayersListPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: players, isLoading } = usePlayers()
  
  // Mutations
  const deleteSingleMutation = useDeletePlayer()
  const deleteBulkMutation = useDeletePlayers()

  // Estados de Controle
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Estado de Ordenação
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  
  // Estado do Modal
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | 'bulk' | null>(null)

  // Filtros
  const [typeFilters, setTypeFilters] = useState<PlayerType[]>([])
  const [relFilters, setRelFilters] = useState<RelationshipLevel[]>([])
  const [productFilters, setProductFilters] = useState<string[]>([])

  // --- ORDENAÇÃO ---
  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // --- FILTRAGEM E ORDENAÇÃO ---
  const processedPlayers = useMemo(() => {
    if (!players) return []

    // 1. Filtragem
    let result = players.filter(p => {
      const searchLower = search.toLowerCase()
      const matchesSearch = 
        p.name.toLowerCase().includes(searchLower) ||
        p.type.toLowerCase().includes(searchLower) ||
        (p.primaryContact?.name || '').toLowerCase().includes(searchLower)

      if (!matchesSearch) return false
      if (typeFilters.length > 0 && !typeFilters.includes(p.type)) return false
      if (relFilters.length > 0 && !relFilters.includes(p.relationshipLevel)) return false
      if (productFilters.length > 0) {
        const hasSelectedProduct = productFilters.some(prod => {
          if (prod === 'credit') return p.products.credit && p.products.credit.length > 0
          if (prod === 'equity') return p.products.equity && p.products.equity.length > 0
          if (prod === 'barter') return p.products.barter && p.products.barter.length > 0
          return false
        })
        if (!hasSelectedProduct) return false
      }
      return true
    })

    // 2. Ordenação
    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        // Extração de valores para comparação
        switch (sortConfig.key) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'primaryContact':
            aValue = (a.primaryContact?.name || '').toLowerCase();
            bValue = (b.primaryContact?.name || '').toLowerCase();
            break;
          case 'type':
            // Ordena pelo Label (ex: "Banco" em vez de "bank")
            aValue = (PLAYER_TYPE_LABELS[a.type] || a.type).toLowerCase();
            bValue = (PLAYER_TYPE_LABELS[b.type] || b.type).toLowerCase();
            break;
          case 'relationshipLevel':
            // Ordem lógica customizada
            const relOrder: Record<string, number> = { 'none': 0, 'basic': 1, 'intermediate': 2, 'close': 3 };
            aValue = relOrder[a.relationshipLevel] || -1;
            bValue = relOrder[b.relationshipLevel] || -1;
            break;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [players, search, typeFilters, relFilters, productFilters, sortConfig])

  // --- PAGINAÇÃO ---
  const totalPages = Math.ceil(processedPlayers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPlayers = processedPlayers.slice(startIndex, endIndex)

  // --- HANDLERS ---
  const toggleSelectAll = () => {
    if (selectedIds.length === currentPlayers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(currentPlayers.map(p => p.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id))
    } else {
      setSelectedIds(prev => [...prev, id])
    }
  }

  const confirmDelete = (target: string | 'bulk') => {
    setItemToDelete(target)
    setDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!profile || !itemToDelete) return
    try {
      if (itemToDelete === 'bulk') {
        await deleteBulkMutation.mutateAsync({ ids: selectedIds, userId: profile.id })
        toast.success(`${selectedIds.length} players excluídos`)
        setSelectedIds([])
      } else {
        await deleteSingleMutation.mutateAsync({ id: itemToDelete, userId: profile.id })
        toast.success('Player excluído')
      }
    } catch (error) {
      toast.error('Erro ao excluir')
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage)
  }

  const clearFilters = () => {
    setSearch('')
    setTypeFilters([])
    setRelFilters([])
    setProductFilters([])
    setCurrentPage(1)
  }

  // --- HELPERS VISUAIS ---
  
  // Cores do Relacionamento
  const getRelationshipBadgeClass = (level: string) => {
    switch (level) {
      case 'close': // Próximo -> Verde
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'intermediate': // Intermediário -> Azul
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'basic': // Básico -> Cinza
        return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
      default: // Nenhum -> Branco/Outline
        return 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50';
    }
  }

  // Helper para renderizar ícone de ordenação
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <CaretUpDown className="ml-1 h-3 w-3 text-muted-foreground opacity-50" weight="bold" />;
    return sortConfig.direction === 'asc' 
      ? <CaretUp className="ml-1 h-3 w-3 text-primary" weight="bold" />
      : <CaretDown className="ml-1 h-3 w-3 text-primary" weight="bold" />;
  };

  const renderProductTags = (products: Player['products']) => {
    if (!products) return <span className="text-muted-foreground">-</span>;
    
    const groups = [];
    const renderBadgeWithTooltip = (key: string, label: string, subtypes: string[], labelsMap: Record<string, string>, badgeClass: string) => {
      const badge = (
        <Badge variant="outline" className={`${badgeClass} font-normal mr-1 mb-1 cursor-help`}>
          {label}
          {subtypes && subtypes.length > 0 && <span className="ml-1 text-[10px] opacity-70">({subtypes.length})</span>}
        </Badge>
      );
      if (!subtypes || subtypes.length === 0) return badge;
      return (
        <TooltipProvider key={key}>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>{badge}</TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground border shadow-md p-2">
              <p className="font-semibold text-xs mb-1 border-b pb-1">{label} - Detalhes:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {subtypes.map(sub => <li key={sub}>{labelsMap[sub] || sub}</li>)}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    };

    if (products.credit && products.credit.length > 0) {
      groups.push(renderBadgeWithTooltip('credit', 'Crédito', products.credit as string[], CREDIT_SUBTYPE_LABELS, "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"));
    }
    if (products.equity && products.equity.length > 0) {
      groups.push(renderBadgeWithTooltip('equity', 'Equity', products.equity as string[], EQUITY_SUBTYPE_LABELS, "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"));
    }
    if (products.barter && products.barter.length > 0) {
      groups.push(renderBadgeWithTooltip('barter', 'Permuta', products.barter as string[], BARTER_SUBTYPE_LABELS, "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"));
    }

    if (groups.length === 0) return <span className="text-muted-foreground text-xs">Sem produtos</span>;
    return <div className="flex flex-wrap items-center">{groups}</div>;
  }

  return (
    <PageContainer>
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Buildings className="text-primary" />
            Base de Players
          </h1>
          <p className="text-muted-foreground">Diretório de Bancos, Gestoras, Family Offices, SECs</p>
        </div>
        <Button onClick={() => navigate('/players/new')}>
          <Plus className="mr-2" /> Novo Player
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4 space-y-4">
          
          {/* Layout Unificado: Busca + Filtros + Ações */}
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
            
            {/* Grupo de Busca e Filtros */}
            <div className="flex flex-1 flex-col md:flex-row gap-3 w-full">
              <div className="relative w-full md:w-80 lg:w-96">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome, contato..." 
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>

              {/* Filtros Dropdown */}
              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={typeFilters.length > 0 ? 'bg-primary/10 border-primary text-primary' : 'text-muted-foreground'}>
                      <Funnel className="mr-2 h-3 w-3" />
                      Tipo {typeFilters.length > 0 && `(${typeFilters.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Tipos de Player</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(PLAYER_TYPE_LABELS).map(([key, label]) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={typeFilters.includes(key as PlayerType)}
                        onCheckedChange={(checked) => {
                          setTypeFilters(prev => checked ? [...prev, key as PlayerType] : prev.filter(k => k !== key))
                          setCurrentPage(1)
                        }}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={productFilters.length > 0 ? 'bg-primary/10 border-primary text-primary' : 'text-muted-foreground'}>
                      Atuação {productFilters.length > 0 && `(${productFilters.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Produtos</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {['credit', 'equity', 'barter'].map(key => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={productFilters.includes(key)}
                        onCheckedChange={(checked) => {
                          setProductFilters(prev => checked ? [...prev, key] : prev.filter(k => k !== key))
                          setCurrentPage(1)
                        }}
                      >
                        {key === 'credit' ? 'Crédito' : key === 'equity' ? 'Equity' : 'Permuta'}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={relFilters.length > 0 ? 'bg-primary/10 border-primary text-primary' : 'text-muted-foreground'}>
                      Relacionamento {relFilters.length > 0 && `(${relFilters.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Nível de Relacionamento</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(RELATIONSHIP_LEVEL_LABELS).map(([key, label]) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={relFilters.includes(key as RelationshipLevel)}
                        onCheckedChange={(checked) => {
                          setRelFilters(prev => checked ? [...prev, key as RelationshipLevel] : prev.filter(k => k !== key))
                          setCurrentPage(1)
                        }}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {(typeFilters.length > 0 || relFilters.length > 0 || productFilters.length > 0 || search) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-8 px-2">
                    <X className="mr-1 h-3 w-3" /> Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Barra Lateral (Paginação + Ação em Massa) */}
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
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={currentPlayers.length > 0 && selectedIds.length === currentPlayers.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      
                      <TableHead 
                        className="w-[250px] cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">Nome <SortIcon columnKey="name" /></div>
                      </TableHead>
                      
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('primaryContact')}
                      >
                        <div className="flex items-center">Contato Principal <SortIcon columnKey="primaryContact" /></div>
                      </TableHead>
                      
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center">Tipo <SortIcon columnKey="type" /></div>
                      </TableHead>
                      
                      <TableHead>Atuação</TableHead>
                      
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('relationshipLevel')}
                      >
                        <div className="flex items-center">Relacionamento <SortIcon columnKey="relationshipLevel" /></div>
                      </TableHead>
                      
                      <TableHead>Website</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPlayers.map((player) => {
                      const isSelected = selectedIds.includes(player.id);
                      return (
                        <TableRow 
                          key={player.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/players/${player.id}`)} 
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectOne(player.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                              <div className="flex flex-col">
                                  <span>{player.name}</span>
                                  {player.cnpj && <span className="text-xs text-muted-foreground">{player.cnpj}</span>}
                              </div>
                          </TableCell>
                          
                          <TableCell>
                            {player.primaryContact ? (
                              <div className="flex flex-col text-sm">
                                <div className="flex items-center gap-1 font-medium">
                                  <User size={14} className="text-muted-foreground" />
                                  {player.primaryContact.name}
                                </div>
                                {player.primaryContact.phone && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                    <Phone size={12} />
                                    {player.primaryContact.phone}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">Sem contato principal</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary">{PLAYER_TYPE_LABELS[player.type] || player.type}</Badge>
                          </TableCell>
                          
                          <TableCell>
                            {renderProductTags(player.products)}
                          </TableCell>

                          <TableCell>
                              <Badge className={`${getRelationshipBadgeClass(player.relationshipLevel)} font-normal`}>
                                  {RELATIONSHIP_LEVEL_LABELS[player.relationshipLevel]}
                              </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {player.site ? (
                              <a href={player.site} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                                Link
                              </a>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Editar"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/players/${player.id}`, { state: { startEditing: true } });
                                }}
                              >
                                <PencilSimple />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={!isSelected} // Botão desabilitado se não selecionado
                                className={`
                                  ${isSelected ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : 'text-muted-foreground/30'}
                                `}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(player.id);
                                }}
                              >
                                <Trash />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {currentPlayers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum player encontrado com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {processedPlayers.length > 0 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, processedPlayers.length)} de {processedPlayers.length} players
                  </div>
                  {/* CORREÇÃO AQUI */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <CaretLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
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

      {/* MODAL DE CONFIRMAÇÃO DUPLA (IRREVERSÍVEL) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. 
              {itemToDelete === 'bulk' 
                ? ` Você está prestes a excluir permanentemente ${selectedIds.length} players selecionados.`
                : " Você está prestes a excluir este player permanentemente."
              }
              <br /><br />
              Todos os dados associados, incluindo contatos e histórico, serão perdidos ou arquivados.
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

    </PageContainer>
  )
}
