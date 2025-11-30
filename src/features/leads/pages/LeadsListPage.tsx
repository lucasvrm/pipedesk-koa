import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useCreateLead, LeadFilters } from '@/services/leadService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, MagnifyingGlass, Funnel, User, Building, ListDashes, SquaresFour } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LEAD_STATUS_LABELS, LEAD_ORIGIN_LABELS } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function LeadsListPage() {
  const navigate = useNavigate()

  // View Toggle State (persist in localStorage could be added, simplifying here)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Filter State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [originFilter, setOriginFilter] = useState<string>('all')

  const filters: LeadFilters = {
    search: search || undefined,
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
    origin: originFilter !== 'all' ? [originFilter] : undefined
  }

  const { data: leads, isLoading } = useLeads(filters)
  const createLead = useCreateLead()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newLeadName, setNewLeadName] = useState('')

  const handleCreate = async () => {
    if (!newLeadName) return
    try {
      const lead = await createLead.mutateAsync({
        data: { legalName: newLeadName },
        userId: 'temp-user' // Auth handled in service/context ideally
      })
      setIsCreateOpen(false)
      setNewLeadName('')
      navigate(`/leads/${lead.id}`)
    } catch (error) {
      console.error(error)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setOriginFilter('all')
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Gerencie seus prospects e oportunidades.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
           <Select value={statusFilter} onValueChange={setStatusFilter}>
             <SelectTrigger className="w-[150px]">
               <SelectValue placeholder="Status" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Todos Status</SelectItem>
               {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                 <SelectItem key={key} value={key}>{label}</SelectItem>
               ))}
             </SelectContent>
           </Select>

           <Select value={originFilter} onValueChange={setOriginFilter}>
             <SelectTrigger className="w-[150px]">
               <SelectValue placeholder="Origem" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Todas Origens</SelectItem>
               {Object.entries(LEAD_ORIGIN_LABELS).map(([key, label]) => (
                 <SelectItem key={key} value={key}>{label}</SelectItem>
               ))}
             </SelectContent>
           </Select>

           {(statusFilter !== 'all' || originFilter !== 'all' || search) && (
             <Button variant="ghost" onClick={clearFilters}>Limpar</Button>
           )}
        </div>

        <div className="ml-auto flex items-center gap-1 border rounded-md p-1 bg-muted/20">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <ListDashes />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <SquaresFour />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : leads?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/10 p-8">
          Nenhum lead encontrado com os filtros atuais.
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {leads?.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/leads/${lead.id}`)}>
                    <TableCell>
                      <div className="font-medium">{lead.legalName}</div>
                      {lead.tradeName && <div className="text-xs text-muted-foreground">{lead.tradeName}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={lead.status === 'qualified' ? 'default' : lead.status === 'disqualified' ? 'destructive' : 'secondary'}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{LEAD_ORIGIN_LABELS[lead.origin]}</TableCell>
                    <TableCell>{format(new Date(lead.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Ver Detalhes</Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads?.map(lead => (
            <Card key={lead.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/leads/${lead.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{lead.legalName}</CardTitle>
                  <Badge variant={lead.status === 'qualified' ? 'default' : lead.status === 'disqualified' ? 'destructive' : 'secondary'}>
                    {LEAD_STATUS_LABELS[lead.status]}
                  </Badge>
                </div>
                {lead.tradeName && <p className="text-xs text-muted-foreground">{lead.tradeName}</p>}
              </CardHeader>
              <CardContent className="pb-2 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Origem:</span>
                  <span>{LEAD_ORIGIN_LABELS[lead.origin]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado:</span>
                  <span>{format(new Date(lead.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="ghost" size="sm" className="w-full">Ver Detalhes</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>Comece adicionando o nome da empresa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Razão Social / Nome</Label>
              <Input value={newLeadName} onChange={(e) => setNewLeadName(e.target.value)} placeholder="Ex: Acme Corp Ltda" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newLeadName}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
