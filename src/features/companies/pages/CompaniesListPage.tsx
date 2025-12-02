import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCompanies, useDeleteCompany, useDeleteCompanies, useCompanyActiveDeals } from '@/services/companyService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { MagnifyingGlass, Plus, Trash, CaretUp, CaretDown, CaretUpDown, CaretLeft, CaretRight, Funnel, PencilSimple, Briefcase, ArrowSquareOut, Buildings } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { COMPANY_TYPE_LABELS, CompanyType, RELATIONSHIP_LEVEL_LABELS, RelationshipLevel } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { PageContainer } from '@/components/PageContainer'
import { SharedListLayout } from '@/components/layouts/SharedListLayout'
import { SharedListFiltersBar } from '@/components/layouts/SharedListFiltersBar'

type SortKey = 'name' | 'primaryContact' | 'type' | 'dealsCount' | 'relationshipLevel' | 'site';
type SortDirection = 'asc' | 'desc';
interface SortConfig { key: SortKey; direction: SortDirection; }

export default function CompaniesListPage() {
  const navigate = useNavigate()
  const { data: companies, isLoading } = useCompanies()
  const deleteCompanyMutation = useDeleteCompany()
  const deleteCompaniesMutation = useDeleteCompanies()

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' })
  const [typeFilter, setTypeFilter] = useState<CompanyType[]>([])
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipLevel[]>([])
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [dealsModalOpen, setDealsModalOpen] = useState(false)
  const [selectedCompanyIdForDeals, setSelectedCompanyIdForDeals] = useState<string | null>(null)

  const handleSort = (key: SortKey) => setSortConfig(c => ({ key, direction: c.key === key && c.direction === 'asc' ? 'desc' : 'asc' }))
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => sortConfig.key !== columnKey ? <CaretUpDown className="ml-1 h-3 w-3 opacity-50" /> : sortConfig.direction === 'asc' ? <CaretUp className="ml-1 h-3 w-3 text-primary" weight="bold" /> : <CaretDown className="ml-1 h-3 w-3 text-primary" weight="bold" />

  const processedCompanies = useMemo(() => {
    if (!companies) return []
    const result = companies.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj?.includes(searchTerm) || false;
      const matchesType = typeFilter.length === 0 || typeFilter.includes(c.type);
      const matchesRel = relationshipFilter.length === 0 || relationshipFilter.includes(c.relationshipLevel);
      return matchesSearch && matchesType && matchesRel;
    })
    result.sort((a, b) => {
      let aV: any = '', bV: any = '';
      if (sortConfig.key === 'name') { aV = a.name.toLowerCase(); bV = b.name.toLowerCase(); }
      else if (sortConfig.key === 'dealsCount') { aV = a.dealsCount || 0; bV = b.dealsCount || 0; }
      else { aV = a[sortConfig.key] || ''; bV = b[sortConfig.key] || ''; }
      return sortConfig.direction === 'asc' ? (aV < bV ? -1 : 1) : (aV > bV ? -1 : 1);
    });
    return result;
  }, [companies, searchTerm, typeFilter, relationshipFilter, sortConfig]);

  const totalPages = Math.ceil(processedCompanies.length / itemsPerPage)
  const currentCompanies = processedCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const toggleSelectAll = () => setSelectedIds(selectedIds.length === currentCompanies.length ? [] : currentCompanies.map(c => c.id))
  const toggleSelectOne = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const handleDeleteSingle = async () => { if (itemToDelete) { await deleteCompanyMutation.mutateAsync(itemToDelete); setIsDeleteAlertOpen(false); setItemToDelete(null); } }
  const handleDeleteBulk = async () => { await deleteCompaniesMutation.mutateAsync(selectedIds); setIsBulkDeleteAlertOpen(false); setSelectedIds([]); }

  const CompanyDealsModal = () => {
    const { data: activeDeals, isLoading: isLoadingDeals } = useCompanyActiveDeals(selectedCompanyIdForDeals, dealsModalOpen);
    return (
      <Dialog open={dealsModalOpen} onOpenChange={setDealsModalOpen}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle className="flex gap-2"><Briefcase /> Deals Ativos</DialogTitle></DialogHeader>
          <div className="py-4">
            {isLoadingDeals ? "Carregando..." : !activeDeals?.length ? "Nenhum deal ativo." : (
              <Table><TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Valor</TableHead><TableHead>Fase</TableHead></TableRow></TableHeader><TableBody>{activeDeals.map((d: any) => (<TableRow key={d.id}><TableCell>{d.title}</TableCell><TableCell>{formatCurrency(d.value)}</TableCell><TableCell><Badge variant="secondary">{d.stage?.name}</Badge></TableCell></TableRow>))}</TableBody></Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <PageContainer>
      <SharedListLayout
        title="Base de Empresas"
        description="Diretório de clientes e parceiros."
        isLoading={isLoading}
        isEmpty={!isLoading && processedCompanies.length === 0}
        emptyState={{
          title: "Nenhuma empresa encontrada",
          description: "Ajuste os filtros ou cadastre uma nova empresa.",
          actionLabel: "Nova Empresa",
          onAction: () => navigate('/companies/new'),
          icon: <Buildings size={48} />
        }}
        primaryAction={<Button onClick={() => navigate('/companies/new')}><Plus className="mr-2 h-4 w-4" /> Nova Empresa</Button>}
        filtersBar={
          <SharedListFiltersBar
            leftContent={
              <>
                <div className="relative w-full md:w-80">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar por nome, CNPJ..." className="pl-10" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                </div>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className={typeFilter.length ? 'border-primary text-primary' : ''}><Funnel className="mr-2 h-4 w-4" /> Tipo {typeFilter.length > 0 && `(${typeFilter.length})`}</Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel>Filtrar por Tipo</DropdownMenuLabel><DropdownMenuSeparator />{Object.entries(COMPANY_TYPE_LABELS).map(([key, label]) => (<DropdownMenuCheckboxItem key={key} checked={typeFilter.includes(key as CompanyType)} onCheckedChange={(checked) => { setTypeFilter(prev => checked ? [...prev, key as CompanyType] : prev.filter(t => t !== key)); setCurrentPage(1); }}>{label}</DropdownMenuCheckboxItem>))}</DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className={relationshipFilter.length ? 'border-primary text-primary' : ''}><Funnel className="mr-2 h-4 w-4" /> Relacionamento {relationshipFilter.length > 0 && `(${relationshipFilter.length})`}</Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel>Filtrar por Nível</DropdownMenuLabel><DropdownMenuSeparator />{Object.entries(RELATIONSHIP_LEVEL_LABELS).map(([key, label]) => (<DropdownMenuCheckboxItem key={key} checked={relationshipFilter.includes(key as RelationshipLevel)} onCheckedChange={(checked) => { setRelationshipFilter(prev => checked ? [...prev, key as RelationshipLevel] : prev.filter(t => t !== key)); setCurrentPage(1); }}>{label}</DropdownMenuCheckboxItem>))}</DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            }
            rightContent={selectedIds.length > 0 && <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteAlertOpen(true)}><Trash className="mr-2" /> Excluir ({selectedIds.length})</Button>}
          />
        }
        footer={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, processedCompanies.length)}–{Math.min(currentPage * itemsPerPage, processedCompanies.length)} de {processedCompanies.length}</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}><SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent></Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><CaretLeft className="mr-2 h-4 w-4" /> Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Próximo <CaretRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        }
      >
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[40px] sticky top-0 bg-muted/50 z-10"><Checkbox checked={currentCompanies.length > 0 && selectedIds.length === currentCompanies.length} onCheckedChange={toggleSelectAll} /></TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/60 sticky top-0 bg-muted/50 z-10" onClick={() => handleSort('name')}>Nome <SortIcon columnKey="name" /></TableHead>
              <TableHead className="sticky top-0 bg-muted/50 z-10">Contato Principal</TableHead>
              <TableHead className="sticky top-0 bg-muted/50 z-10">Tipo</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/60 sticky top-0 bg-muted/50 z-10" onClick={() => handleSort('dealsCount')}>Deals <SortIcon columnKey="dealsCount" /></TableHead>
              <TableHead className="sticky top-0 bg-muted/50 z-10">Relacionamento</TableHead>
              <TableHead className="sticky top-0 bg-muted/50 z-10">Site</TableHead>
              <TableHead className="w-[80px] text-right sticky top-0 bg-muted/50 z-10">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCompanies.map(company => (
              <TableRow key={company.id} className="group hover:bg-muted/50">
                <TableCell><Checkbox checked={selectedIds.includes(company.id)} onCheckedChange={() => toggleSelectOne(company.id)} /></TableCell>
                <TableCell className="font-medium cursor-pointer" onClick={() => navigate(`/companies/${company.id}`)}>{company.name}</TableCell>
                <TableCell className="text-sm">{company.primaryContactName ? <Link to={`/contacts/company/${company.contacts?.[0]?.id}`} className="hover:underline text-primary">{company.primaryContactName}</Link> : '-'}</TableCell>
                <TableCell><Badge variant="outline">{COMPANY_TYPE_LABELS[company.type] || company.type}</Badge></TableCell>
                <TableCell>{company.dealsCount > 0 ? <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20" onClick={(e) => { e.stopPropagation(); setSelectedCompanyIdForDeals(company.id); setDealsModalOpen(true); }}>{company.dealsCount}</Badge> : '-'}</TableCell>
                <TableCell><Badge variant="outline">{RELATIONSHIP_LEVEL_LABELS[company.relationshipLevel]}</Badge></TableCell>
                <TableCell className="max-w-[150px] truncate">{company.site ? <a href={company.site.startsWith('http') ? company.site : `https://${company.site}`} target="_blank" rel="noreferrer" className="hover:underline text-primary" onClick={e => e.stopPropagation()}>{company.site.replace(/^https?:\/\//, '')}</a> : '-'}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/companies/${company.id}`)}><PencilSimple className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setItemToDelete(company.id); setIsDeleteAlertOpen(true); }}><Trash className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SharedListLayout>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSingle}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir {selectedIds.length}?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteBulk}>Excluir Tudo</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <CompanyDealsModal />
    </PageContainer>
  )
}