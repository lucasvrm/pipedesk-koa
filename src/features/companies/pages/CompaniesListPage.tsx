import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCompanies, useDeleteCompany, useDeleteCompanies, useCompanyActiveDeals } from '@/services/companyService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { 
  Buildings, 
  MagnifyingGlass, 
  Plus, 
  Trash, 
  CaretUp, 
  CaretDown, 
  CaretUpDown, 
  CaretLeft,
  CaretRight,
  Funnel, 
  PencilSimple,
  Briefcase,
  ArrowSquareOut
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  COMPANY_TYPE_LABELS, 
  CompanyType, 
  RELATIONSHIP_LEVEL_LABELS,
  RelationshipLevel 
} from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'

// Configuração de Ordenação
type SortKey = 'name' | 'primaryContact' | 'type' | 'dealsCount' | 'relationshipLevel' | 'site';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function CompaniesListPage() {
  const navigate = useNavigate()
  
  // Hooks de Dados e Mutação
  const { data: companies, isLoading } = useCompanies()
  const deleteCompanyMutation = useDeleteCompany()
  const deleteCompaniesMutation = useDeleteCompanies()

  // Estados de Controle
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' })
  
  // Filtros
  const [typeFilter, setTypeFilter] = useState<CompanyType[]>([])
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipLevel[]>([]) // NOVO FILTRO

  // Estados dos Modais
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  
  // Estado Modal Deals
  const [dealsModalOpen, setDealsModalOpen] = useState(false)
  const [selectedCompanyIdForDeals, setSelectedCompanyIdForDeals] = useState<string | null>(null)

  // --- Lógica de Ordenação ---
  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <CaretUpDown className="ml-1 h-3 w-3 text-muted-foreground opacity-50" />
    return sortConfig.direction === 'asc' 
      ? <CaretUp className="ml-1 h-3 w-3 text-primary" weight="bold" />
      : <CaretDown className="ml-1 h-3 w-3 text-primary" weight="bold" />
  }

  // --- Processamento de Dados (Filtro + Ordenação) ---
  const processedCompanies = useMemo(() => {
    if (!companies) return []

    // 1. Filtragem
    let result = companies.filter(company => {
      const matchesSearch = 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.cnpj?.includes(searchTerm) ||
        false;
      
      const matchesType = typeFilter.length === 0 || typeFilter.includes(company.type);
      const matchesRelationship = relationshipFilter.length === 0 || relationshipFilter.includes(company.relationshipLevel);

      return matchesSearch && matchesType && matchesRelationship;
    })

    // 2. Ordenação
    result.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'primaryContact':
          aValue = (a.primaryContactName || '').toLowerCase();
          bValue = (b.primaryContactName || '').toLowerCase();
          break;
        case 'type':
          aValue = COMPANY_TYPE_LABELS[a.type] || '';
          bValue = COMPANY_TYPE_LABELS[b.type] || '';
          break;
        case 'dealsCount':
          aValue = a.dealsCount || 0;
          bValue = b.dealsCount || 0;
          break;
        case 'relationshipLevel':
          const relOrder: Record<string, number> = { 'none': 0, 'basic': 1, 'intermediate': 2, 'close': 3 };
          aValue = relOrder[a.relationshipLevel] || 0;
          bValue = relOrder[b.relationshipLevel] || 0;
          break;
        case 'site':
          aValue = (a.site || '').toLowerCase();
          bValue = (b.site || '').toLowerCase();
          break;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [companies, searchTerm, typeFilter, relationshipFilter, sortConfig]);

  // --- Paginação ---
  const totalPages = Math.ceil(processedCompanies.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCompanies = processedCompanies.slice(startIndex, endIndex)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage)
  }

  // --- Handlers de Seleção ---
  const toggleSelectAll = () => {
    if (selectedIds.length === currentCompanies.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(currentCompanies.map(c => c.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // --- Handlers de Ação ---
  const handleDeleteSingle = async () => {
    if (itemToDelete) {
      try {
        await deleteCompanyMutation.mutateAsync(itemToDelete)
        toast.success('Empresa excluída')
        setIsDeleteAlertOpen(false)
        setItemToDelete(null)
        setSelectedIds(prev => prev.filter(id => id !== itemToDelete))
      } catch (error) {
        toast.error('Erro ao excluir empresa')
      }
    }
  }

  const handleDeleteBulk = async () => {
    try {
      await deleteCompaniesMutation.mutateAsync(selectedIds)
      toast.success(`${selectedIds.length} empresas excluídas`)
      setIsBulkDeleteAlertOpen(false)
      setSelectedIds([])
    } catch (error) {
      toast.error('Erro ao excluir empresas')
    }
  }

  // --- Componente Interno do Modal de Deals ---
  const CompanyDealsModal = () => {
    const { data: activeDeals, isLoading: isLoadingDeals } = useCompanyActiveDeals(
      selectedCompanyIdForDeals, 
      dealsModalOpen
    );

    const companyName = companies?.find(c => c.id === selectedCompanyIdForDeals)?.name;

    return (
      <Dialog open={dealsModalOpen} onOpenChange={setDealsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deals Ativos - {companyName}</DialogTitle>
            <DialogDescription>
              Lista de oportunidades em andamento para esta empresa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[300px] overflow-y-auto pr-2 mt-4 space-y-3">
            {isLoadingDeals ? (
              <div className="text-center py-4 text-sm text-muted-foreground">Carregando deals...</div>
            ) : activeDeals && activeDeals.length > 0 ? (
              activeDeals.map(deal => (
                <div key={deal.id} className="p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors flex justify-between items-center group">
                  <div>
                    <p className="font-medium text-sm">{deal.clientName}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(deal.volume)} • {formatDate(deal.createdAt)}</p>
                  </div>
                  <Link to={`/deals/${deal.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowSquareOut className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-md">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum deal ativo encontrado.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl pb-24">
      {/* Cabeçalho da Página */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Buildings className="text-primary" />
            Base de Empresas
          </h1>
          <p className="text-muted-foreground">Diretório de clientes e parceiros.</p>
        </div>
        
        {/* Botão Nova Empresa */}
        <Button onClick={() => navigate('/companies/new')}>
          <Plus className="mr-2 h-4 w-4" /> Nova Empresa
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4 space-y-4">
          
          {/* Layout Unificado: Busca + Filtros + Ações */}
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
            
            {/* Grupo Esquerda: Busca e Filtros */}
            <div className="flex flex-1 flex-col md:flex-row gap-3 w-full">
              <div className="relative w-full md:w-80 lg:w-96">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou site..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Filtro de Tipo */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={typeFilter.length > 0 ? 'bg-primary/10 border-primary text-primary' : ''}>
                      <Funnel className="mr-2 h-4 w-4" />
                      Tipo {typeFilter.length > 0 && `(${typeFilter.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filtrar por Tipo</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(COMPANY_TYPE_LABELS).map(([key, label]) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={typeFilter.includes(key as CompanyType)}
                        onCheckedChange={(checked) => {
                          setTypeFilter(prev => 
                            checked ? [...prev, key as CompanyType] : prev.filter(t => t !== key)
                          )
                          setCurrentPage(1)
                        }}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Filtro de Relacionamento (NOVO) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={relationshipFilter.length > 0 ? 'bg-primary/10 border-primary text-primary' : ''}>
                      <Funnel className="mr-2 h-4 w-4" />
                      Relacionamento {relationshipFilter.length > 0 && `(${relationshipFilter.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filtrar por Nível</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(RELATIONSHIP_LEVEL_LABELS).map(([key, label]) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={relationshipFilter.includes(key as RelationshipLevel)}
                        onCheckedChange={(checked) => {
                          setRelationshipFilter(prev => 
                            checked ? [...prev, key as RelationshipLevel] : prev.filter(t => t !== key)
                          )
                          setCurrentPage(1)
                        }}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Grupo Direita: Ações em Massa e Paginação */}
            <div className="flex items-center gap-3 shrink-0">
              
              {/* Botão Excluir em Massa */}
              {selectedIds.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="animate-in fade-in slide-in-from-right-5"
                  onClick={() => setIsBulkDeleteAlertOpen(true)}
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
            <div className="text-center py-8">Carregando empresas...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={currentCompanies.length > 0 && selectedIds.length === currentCompanies.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                        <div className="flex items-center">Nome <SortIcon columnKey="name" /></div>
                      </TableHead>
                      
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('primaryContact')}>
                        <div className="flex items-center">Contato Principal <SortIcon columnKey="primaryContact" /></div>
                      </TableHead>

                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('type')}>
                        <div className="flex items-center">Tipo <SortIcon columnKey="type" /></div>
                      </TableHead>

                      <TableHead className="cursor-pointer hover:bg-muted/50 text-center" onClick={() => handleSort('dealsCount')}>
                        <div className="flex items-center justify-center">Deals <SortIcon columnKey="dealsCount" /></div>
                      </TableHead>

                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('relationshipLevel')}>
                        <div className="flex items-center">Relacionamento <SortIcon columnKey="relationshipLevel" /></div>
                      </TableHead>

                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('site')}>
                        <div className="flex items-center">Site <SortIcon columnKey="site" /></div>
                      </TableHead>

                      <TableHead className="w-[80px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentCompanies.length > 0 ? currentCompanies.map(company => {
                      const isSelected = selectedIds.includes(company.id);
                      // Encontra o ID do contato principal, se existir
                      const primaryContactId = company.contacts?.find(c => c.isPrimary)?.id || company.contacts?.[0]?.id;

                      return (
                        <TableRow key={company.id} className="group hover:bg-muted/50">
                          <TableCell>
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectOne(company.id)}
                            />
                          </TableCell>
                          
                          <TableCell className="font-medium cursor-pointer" onClick={() => navigate(`/companies/${company.id}`)}>
                            {company.name}
                          </TableCell>
                          
                          {/* Contato Principal Clicável */}
                          <TableCell className="text-sm">
                            {primaryContactId ? (
                              <Link 
                                to={`/contacts/company/${primaryContactId}`} 
                                className="text-muted-foreground hover:text-primary hover:underline transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {company.primaryContactName}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">
                              {COMPANY_TYPE_LABELS[company.type] || company.type}
                            </Badge>
                          </TableCell>
                          
                          {/* Deals Count Clicável (Abre Modal) */}
                          <TableCell className="text-center">
                            {company.dealsCount && company.dealsCount > 0 ? (
                              <Badge 
                                variant="secondary" 
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCompanyIdForDeals(company.id);
                                  setDealsModalOpen(true);
                                }}
                              >
                                {company.dealsCount}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className={
                              company.relationshipLevel === 'close' ? 'bg-green-50 text-green-700 border-green-200' :
                              company.relationshipLevel === 'intermediate' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'text-muted-foreground border-border'
                            }>
                              {RELATIONSHIP_LEVEL_LABELS[company.relationshipLevel]}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                            {company.site ? (
                              <a 
                                href={company.site.startsWith('http') ? company.site : `https://${company.site}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="hover:underline hover:text-primary"
                                title={company.site}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {company.site.replace(/^https?:\/\//, '')}
                              </a>
                            ) : '-'}
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => navigate(`/companies/${company.id}`)}
                              >
                                <PencilSimple className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-8 w-8 ${isSelected ? 'text-destructive hover:text-destructive/90' : 'text-muted-foreground/30 cursor-not-allowed'}`}
                                disabled={!isSelected}
                                onClick={() => {
                                  setItemToDelete(company.id)
                                  setIsDeleteAlertOpen(true)
                                }}
                                title={isSelected ? "Excluir Empresa" : "Selecione para excluir"}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhuma empresa encontrada com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Controles de Paginação */}
              {processedCompanies.length > 0 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, processedCompanies.length)} de {processedCompanies.length} empresas
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

      {/* Modais de Exclusão */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e todos os vínculos serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSingle} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.length} Empresas?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir as <b>{selectedIds.length}</b> empresas selecionadas? Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBulk} className="bg-destructive hover:bg-destructive/90">
              Excluir Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Deals Ativos */}
      <CompanyDealsModal />
    </div>
  )
}