import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompanies, useDeleteCompany, useDeleteCompanies } from '@/services/companyService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  Buildings, 
  MagnifyingGlass, 
  Plus, 
  Trash, 
  CaretUp, 
  CaretDown, 
  CaretUpDown, 
  Funnel, 
  PencilSimple 
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  Company, 
  COMPANY_TYPE_LABELS, 
  CompanyType, 
  RELATIONSHIP_LEVEL_LABELS,
  RelationshipLevel 
} from '@/lib/types'

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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' })
  
  // Filtros
  const [typeFilter, setTypeFilter] = useState<CompanyType[]>([])

  // Estados dos Modais
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

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

      return matchesSearch && matchesType;
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
  }, [companies, searchTerm, typeFilter, sortConfig]);

  // --- Handlers de Seleção ---
  const toggleSelectAll = () => {
    if (selectedIds.length === processedCompanies.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(processedCompanies.map(c => c.id))
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
        // Remove da seleção se estiver selecionado
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

  return (
    <div className="container mx-auto p-6 max-w-7xl pb-24">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Buildings className="text-primary" />
            Base de Empresas
          </h1>
          <p className="text-muted-foreground">Diretório de clientes e parceiros.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão de Lixeira em Massa */}
          <Button
            variant="destructive"
            size="icon"
            disabled={selectedIds.length === 0}
            onClick={() => setIsBulkDeleteAlertOpen(true)}
            className="transition-opacity"
            title="Excluir Selecionados"
          >
            <Trash size={18} />
          </Button>

          <Button onClick={() => navigate('/companies/new')}>
            <Plus className="mr-2 h-4 w-4" /> Nova Empresa
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou site..."
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtros Avançados */}
            <div className="flex items-center gap-2 w-full md:w-auto">
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
                      }}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando empresas...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={processedCompanies.length > 0 && selectedIds.length === processedCompanies.length}
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

                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedCompanies.length > 0 ? processedCompanies.map(company => (
                    <TableRow key={company.id} className="group hover:bg-muted/50">
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(company.id)}
                          onCheckedChange={() => toggleSelectOne(company.id)}
                        />
                      </TableCell>
                      
                      <TableCell className="font-medium cursor-pointer" onClick={() => navigate(`/companies/${company.id}`)}>
                        {company.name}
                      </TableCell>
                      
                      <TableCell className="text-sm text-muted-foreground">
                        {company.primaryContactName || '-'}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {COMPANY_TYPE_LABELS[company.type] || company.type}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        {company.dealsCount && company.dealsCount > 0 ? (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
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
                          >
                            {company.site.replace(/^https?:\/\//, '')}
                          </a>
                        ) : '-'}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => navigate(`/companies/${company.id}`)}
                          >
                            <PencilSimple className="h-4 w-4" />
                          </Button>
                          
                          {/* Ícone de Lixeira Bloqueado até Seleção */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive/90 disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={!selectedIds.includes(company.id)}
                            onClick={() => {
                              setItemToDelete(company.id)
                              setIsDeleteAlertOpen(true)
                            }}
                            title={selectedIds.includes(company.id) ? "Excluir Empresa" : "Selecione para excluir"}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma empresa encontrada com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Exclusão Simples */}
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

      {/* Modal de Exclusão em Massa */}
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
    </div>
  )
}