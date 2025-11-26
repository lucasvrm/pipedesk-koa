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
  Plus, MagnifyingGlass, Trash, Buildings, CaretLeft, CaretRight, 
  PencilSimple, User, Phone, Funnel, X 
} from '@phosphor-icons/react'
import { 
  PLAYER_TYPE_LABELS, RELATIONSHIP_LEVEL_LABELS, Player, PlayerType, RelationshipLevel,
  CREDIT_SUBTYPE_LABELS, EQUITY_SUBTYPE_LABELS, BARTER_SUBTYPE_LABELS
} from '@/lib/types'
import { toast } from 'sonner'
import { formatDate } from '@/lib/helpers'

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
  
  // Estado do Modal de Deleção (Dupla Confirmação)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | 'bulk' | null>(null)

  // Estados dos Filtros Avançados
  const [typeFilters, setTypeFilters] = useState<PlayerType[]>([])
  const [relFilters, setRelFilters] = useState<RelationshipLevel[]>([])
  const [productFilters, setProductFilters] = useState<string[]>([]) // 'credit', 'equity', 'barter'

  // --- LÓGICA DE FILTRAGEM (POWER FILTER) ---
  const filteredPlayers = useMemo(() => {
    if (!players) return []

    return players.filter(p => {
      // 1. Busca Textual (Nome, Tipo, Contato)
      const searchLower = search.toLowerCase()
      const matchesSearch = 
        p.name.toLowerCase().includes(searchLower) ||
        p.type.toLowerCase().includes(searchLower) ||
        (p.primaryContact?.name || '').toLowerCase().includes(searchLower)

      if (!matchesSearch) return false

      // 2. Filtro de Tipo
      if (typeFilters.length > 0 && !typeFilters.includes(p.type)) return false

      // 3. Filtro de Relacionamento
      if (relFilters.length > 0 && !relFilters.includes(p.relationshipLevel)) return false

      // 4. Filtro de Produtos (Atuação)
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
  }, [players, search, typeFilters, relFilters, productFilters])

  // --- PAGINAÇÃO ---
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPlayers = filteredPlayers.slice(startIndex, endIndex)

  // --- HANDLERS DE SELEÇÃO ---
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

  // --- HANDLERS DE DELEÇÃO ---
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

  // --- HELPERS VISUAIS (COM TOOLTIP) ---
  const renderProductTags = (products: Player['products']) => {
    if (!products) return <span className="text-muted-foreground">-</span>;
    
    const groups = [];
    
    // Helper interno para gerar o Badge com Tooltip
    const renderBadgeWithTooltip = (
      key: string, 
      label: string, 
      subtypes: string[], 
      labelsMap: Record<string, string>,
      badgeClass: string
    ) => {
      const badge = (
        <Badge variant="outline" className={`${badgeClass} font-normal mr-1 mb-1 cursor-help`}>
          {label}
          {subtypes.length > 0 && <span className="ml-1 text-[10px] opacity-70">({subtypes.length})</span>}
        </Badge>
      );

      if (!subtypes || subtypes.length === 0) return badge;

      return (
        <TooltipProvider key={key}>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              {badge}
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground border shadow-md p-2">
              <p className="font-semibold text-xs mb-1 border-b pb-1">{label} - Detalhes:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {subtypes.map(sub => (
                  <li key={sub}>{labelsMap[sub] || sub}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    };

    // Azul para Crédito
    if (products.credit?.length > 0) {
      groups.push(renderBadgeWithTooltip(
        'credit', 
        'Crédito', 
        products.credit, 
        CREDIT_SUBTYPE_LABELS,
        "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
      ));
    }
    
    // Verde para Equity
    if (products.equity?.length > 0) {
      groups.push(renderBadgeWithTooltip(
        'equity', 
        'Equity', 
        products.equity, 
        EQUITY_SUBTYPE_LABELS,
        "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
      ));
    }
    
    // Roxo para Permuta
    if (products.barter?.length > 0) {
      groups.push(renderBadgeWithTooltip(
        'barter', 
        'Permuta', 
        products.barter, 
        BARTER_SUBTYPE_LABELS,
        "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
      ));
    }

    if (groups.length === 0) return <span className="text-muted-foreground text-xs">Sem produtos</span>;
    
    return <div className="flex flex-wrap items-center">{groups}</div>;
  }

  const getRelationshipBadgeVariant = (level: string) => {
    switch (level) {
      case 'close': return 'default'
      case 'intermediate': return 'secondary'
      case 'basic': return 'outline'
      default: return 'outline'
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

  return (
    <div className="container mx-auto p-6 max-w-7xl pb-24">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Buildings className="text-primary" />
            Base de Players
          </h1>
          <p className="text-muted-foreground">Diretório de fundos, empresas e investidores</p>
        </div>
        <Button onClick={() => navigate('/players/new')}>
          <Plus className="mr-2" /> Novo Player
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4 space-y-4">
          
          {/* Linha 1: Busca e Paginação */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-96">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome, contato..." 
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Itens por página:</span>
              <Select 
                value={String(itemsPerPage)} 
                onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
              >
                <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 2: Filtros Avançados */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
              <Funnel /> Filtros:
            </div>

            {/* Filtro de Tipo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={typeFilters.length > 0 ? 'bg-primary/10 border-primary text-primary' : ''}>
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

            {/* Filtro de Atuação/Produto */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={productFilters.length > 0 ? 'bg-primary/10 border-primary text-primary' : ''}>
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

            {/* Filtro de Relacionamento */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={relFilters.length > 0 ? 'bg-primary/10 border-primary text-primary' : ''}>
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
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="mr-1" /> Limpar
              </Button>
            )}
          </div>

          {/* Barra de Ações em Massa */}
          {selectedIds.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-2 rounded-md flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <span className="text-sm font-medium ml-2">
                {selectedIds.length} player(s) selecionado(s)
              </span>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => confirmDelete('bulk')}
              >
                <Trash className="mr-2" /> Excluir Selecionados
              </Button>
            </div>
          )}

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
                      <TableHead className="w-[250px]">Nome</TableHead>
                      <TableHead>Contato Principal</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Atuação</TableHead>
                      <TableHead>Relacionamento</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPlayers.map((player) => (
                      <TableRow 
                        key={player.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/players/${player.id}`)} 
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedIds.includes(player.id)}
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
                            <Badge variant={getRelationshipBadgeVariant(player.relationshipLevel)}>
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
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                    ))}
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
              {filteredPlayers.length > 0 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredPlayers.length)} de {filteredPlayers.length} players
                  </div>
                  <div className="space-x-2">
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

    </div>
  )
}