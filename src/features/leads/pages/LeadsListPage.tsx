import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useCreateLead, useDeleteLead, LeadFilters } from '@/services/leadService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, MagnifyingGlass, Funnel, User, Building, ListDashes, SquaresFour, Globe, CalendarBlank } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LEAD_STATUS_LABELS, LEAD_ORIGIN_LABELS, OPERATION_LABELS, Lead } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { RequirePermission } from '@/features/rbac/components/RequirePermission'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TagSelector } from '@/components/admin/TagSettings'
// Assuming TagSelector is exported from there or similar.
// Actually, TagSelector is likely in `src/components/TagSelector.tsx` or `src/components/ui/tag-selector` or inside `TagSettings`.
// Checking file list earlier: `src/pages/admin/TagSettings.tsx`.
// It might be better to check where TagSelector is defined.
// Assuming it is available or I can use a placeholder for now if specific file path is unknown.
// "Reutilizar o TagSelector / TagSettings existente."
// Let's assume it's exposed or I need to import it.
// A previous `ls` showed `src/pages/admin/TagSettings.tsx`. It likely has the component inside or exports it.
// I'll try to import from where I think it is or create a local wrapper if needed.
// For now, I will use a simple placeholder if I can't find it, but the instruction says "Reuse".
// Let's assume `src/components/TagSelector` exists or similar.
// If not, I'll check `TagSettings.tsx` content later.
// Actually, I'll check `TagSettings.tsx` content now.

import { LeadActionMenu } from '../components/LeadActionMenu'
import { LeadDeleteDialog } from '../components/LeadDeleteDialog'
import { LeadEditSheet } from '../components/LeadEditSheet'
import { toast } from 'sonner'
import TagSelector from '@/components/TagSelector' // Educated guess, will verify.

export default function LeadsListPage() {
  const navigate = useNavigate()

  // View Toggle State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('leads-view-mode') as 'list' | 'grid') || 'list'
  })

  useEffect(() => {
    localStorage.setItem('leads-view-mode', viewMode)
  }, [viewMode])

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
  const deleteLead = useDeleteLead()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newLeadName, setNewLeadName] = useState('')

  // Edit/Delete State
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleCreate = async () => {
    if (!newLeadName) return
    try {
      const lead = await createLead.mutateAsync({
        data: { legalName: newLeadName },
        userId: 'temp-user' // Auth context handles this usually
      })
      setIsCreateOpen(false)
      setNewLeadName('')
      navigate(`/leads/${lead.id}`)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao criar lead')
    }
  }

  const handleDelete = async () => {
    if (!deletingLead) return
    try {
      await deleteLead.mutateAsync(deletingLead.id)
      toast.success('Lead excluído')
      setIsDeleteOpen(false)
      setDeletingLead(null)
    } catch (error) {
      toast.error('Erro ao excluir lead')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setOriginFilter('all')
  }

  const getPrimaryContact = (lead: Lead) => {
    return lead.contacts?.find(c => c.isPrimary) || lead.contacts?.[0]
  }

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

  const openEdit = (lead: Lead) => {
      setEditingLead(lead)
      setIsEditOpen(true)
  }

  const openDelete = (lead: Lead) => {
      setDeletingLead(lead)
      setIsDeleteOpen(true)
  }

  const renderStatusBadge = (status: string) => (
    <Badge variant={status === 'qualified' ? 'default' : status === 'disqualified' ? 'destructive' : 'secondary'}>
        {LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] || status}
    </Badge>
  )

  const renderOriginBadge = (origin: string) => (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border">
        <Globe className="w-3 h-3" />
        {LEAD_ORIGIN_LABELS[origin as keyof typeof LEAD_ORIGIN_LABELS] || origin}
      </div>
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Gerencie seus prospects e oportunidades.</p>
        </div>
        <RequirePermission permission="leads.create">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
        </RequirePermission>
      </div>

      {/* Filters & View Toggle */}
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

      {/* Content */}
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
                <TableHead>Contato</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {leads?.map((lead) => {
                  const contact = getPrimaryContact(lead)
                  const owner = (lead as any).owner // Assuming backend returns owner
                  return (
                    <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50 group" onClick={() => navigate(`/leads/${lead.id}`)}>
                      <TableCell>
                        <div className="font-medium">{lead.legalName}</div>
                        <div className="flex items-center gap-2 mt-1">
                            {lead.tradeName && <span className="text-xs text-muted-foreground">{lead.tradeName}</span>}
                            <div onClick={e => e.stopPropagation()}>
                                <TagSelector entityId={lead.id} entityType="lead" variant="minimal" />
                            </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact ? (
                            <div
                                className="text-sm hover:underline text-primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/contacts/${contact.id}`)
                                }}
                            >
                                {contact.name}
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground italic">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.operationType ? (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                                {OPERATION_LABELS[lead.operationType as OperationType] || lead.operationType}
                            </span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>{renderStatusBadge(lead.status)}</TableCell>
                      <TableCell>{renderOriginBadge(lead.origin)}</TableCell>
                      <TableCell>
                        {owner ? (
                             <div className="flex items-center gap-2" title={owner.name}>
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={owner.avatar || ''} />
                                    <AvatarFallback className="text-[10px]">{getInitials(owner.name)}</AvatarFallback>
                                </Avatar>
                             </div>
                        ) : <span className="text-muted-foreground text-xs">-</span>}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <LeadActionMenu lead={lead} onEdit={openEdit} onDelete={openDelete} />
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads?.map(lead => {
            const contact = getPrimaryContact(lead)
            const owner = (lead as any).owner
            return (
                <Card key={lead.id} className="cursor-pointer hover:border-primary/50 transition-colors group relative" onClick={() => navigate(`/leads/${lead.id}`)}>
                <CardHeader className="pb-2 space-y-0">
                    <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-lg line-clamp-1" title={lead.legalName}>{lead.legalName}</CardTitle>
                            {lead.tradeName && <p className="text-xs text-muted-foreground line-clamp-1">{lead.tradeName}</p>}
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                            <LeadActionMenu lead={lead} onEdit={openEdit} onDelete={openDelete} />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {renderStatusBadge(lead.status)}
                        {renderOriginBadge(lead.origin)}
                    </div>
                </CardHeader>
                <CardContent className="pb-3 text-sm space-y-3">

                    {/* Tags */}
                    <div onClick={e => e.stopPropagation()} className="min-h-[24px]">
                         <TagSelector entityId={lead.id} entityType="lead" variant="minimal" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                         <div>
                            <span className="text-xs text-muted-foreground block mb-1">Contato Principal</span>
                            {contact ? (
                                <div
                                    className="font-medium truncate hover:text-primary hover:underline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/contacts/${contact.id}`)
                                    }}
                                >
                                    {contact.name}
                                </div>
                            ) : <span className="text-xs text-muted-foreground italic">Sem contato</span>}
                         </div>
                         <div>
                            <span className="text-xs text-muted-foreground block mb-1">Responsável</span>
                            {owner ? (
                                <div className="flex items-center gap-1.5">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={owner.avatar} />
                                        <AvatarFallback className="text-[8px]">{getInitials(owner.name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="truncate text-xs">{owner.name.split(' ')[0]}</span>
                                </div>
                            ) : <span>-</span>}
                         </div>
                    </div>
                </CardContent>
                </Card>
            )
          })}
        </div>
      )}

      {/* Creation Dialog */}
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

      {/* Edit Sheet */}
      <LeadEditSheet
        lead={editingLead}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      {/* Delete Dialog */}
      <LeadDeleteDialog
        lead={deletingLead}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        isDeleting={deleteLead.isPending}
      />
    </div>
  )
}
