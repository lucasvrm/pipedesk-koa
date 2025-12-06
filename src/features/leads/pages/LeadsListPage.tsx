import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useCreateLead, useDeleteLead, LeadFilters, useUpdateLead } from '@/services/leadService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, MagnifyingGlass, ListDashes, SquaresFour, Globe, CaretLeft, CaretRight, ChartBar, CalendarBlank, Funnel, PencilSimple, Trash, Kanban } from '@phosphor-icons/react'
import { LEAD_STATUS_LABELS, LEAD_ORIGIN_LABELS, OPERATION_LABELS, Lead, OperationType, LEAD_STATUS_PROGRESS, LEAD_STATUS_COLORS } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { leadStatusMap } from '@/lib/statusMaps'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequirePermission } from '@/features/rbac/components/RequirePermission'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LeadDeleteDialog } from '../components/LeadDeleteDialog'
import { LeadEditSheet } from '../components/LeadEditSheet'
import { toast } from 'sonner'
import TagSelector from '@/components/TagSelector'
import { PageContainer } from '@/components/PageContainer'
import { SharedListLayout } from '@/components/layouts/SharedListLayout'
import { SharedListToolbar } from '@/components/layouts/SharedListToolbar'
import { SharedListSkeleton } from '@/components/layouts/SharedListSkeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { LeadsKanban } from '../components/LeadsKanban'
import { Progress } from '@/components/ui/progress'
import { useEntityTags } from '@/services/tagService'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'
import { getLeadQuickActions } from '@/hooks/useQuickActions'

function LeadTagsCell({ leadId }: { leadId: string }) {
  const { data: tags, isLoading } = useEntityTags(leadId, 'lead')

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">Carregando...</span>
  }

  if (!tags || tags.length === 0) {
    return <span className="text-xs text-muted-foreground">Sem tags</span>
  }

  return (
    <div className="flex flex-wrap gap-1 max-w-[200px]">
      {tags.map(tag => (
        <Badge
          key={tag.id}
          variant="outline"
          className="text-xs"
          style={{
            borderColor: tag.color,
            color: tag.color,
            backgroundColor: `${tag.color}15`
          }}
        >
          {tag.name}
        </Badge>
      ))}
    </div>
  )
}

export default function LeadsListPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const savedPreferences = useMemo(() => {
    const saved = localStorage.getItem('leads-list-preferences')
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch (error) {
      console.error('Erro ao carregar preferências de leads', error)
      return null
    }
  }, [])

  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>(() => {
    return (savedPreferences?.viewMode as 'list' | 'grid' | 'kanban') || 'list'
  })

  const [search, setSearch] = useState(() => savedPreferences?.search || '')
  const [statusFilter, setStatusFilter] = useState<string>(() => savedPreferences?.statusFilter || 'all')
  const [originFilter, setOriginFilter] = useState<string>(() => savedPreferences?.originFilter || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(() => savedPreferences?.itemsPerPage || 10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])

  const filters: LeadFilters = {
    search: search || undefined,
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
    origin: originFilter !== 'all' ? [originFilter] : undefined
  }

  const { data: leads, isLoading } = useLeads(filters)
  const createLead = useCreateLead()
  const deleteLead = useDeleteLead()
  const updateLead = useUpdateLead()

  const leadMetrics = useMemo(() => {
    const openLeads = leads?.filter(l => !['qualified', 'disqualified'].includes(l.status)).length || 0
    const createdThisMonth = leads?.filter(l => new Date(l.createdAt) >= monthStart).length || 0
    const qualifiedThisMonth = leads?.filter(
      l => l.status === 'qualified' && l.qualifiedAt && new Date(l.qualifiedAt) >= monthStart
    ).length || 0

    return { openLeads, createdThisMonth, qualifiedThisMonth }
  }, [leads, monthStart])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, originFilter])

  useEffect(() => {
    setSelectedIds([])
  }, [viewMode, search, statusFilter, originFilter, currentPage])

  useEffect(() => {
    const payload = {
      viewMode,
      search,
      statusFilter,
      originFilter,
      itemsPerPage
    }
    localStorage.setItem('leads-list-preferences', JSON.stringify(payload))
  }, [itemsPerPage, originFilter, search, statusFilter, viewMode])

  const totalLeads = leads?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalLeads / itemsPerPage))

  const paginatedLeads = useMemo(() => {
    if (!leads) return []
    const start = (currentPage - 1) * itemsPerPage
    return leads.slice(start, start + itemsPerPage)
  }, [currentPage, itemsPerPage, leads])
  const currentLeads = paginatedLeads

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newLeadName, setNewLeadName] = useState('')

  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

  const handleCreate = async () => {
    if (!newLeadName) return
    if (!profile?.id) {
      toast.error('Usuário não autenticado')
      return
    }
    try {
      const lead = await createLead.mutateAsync({
        data: { legalName: newLeadName },
        userId: profile.id
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

  const toggleSelectAll = () => {
    if (selectedIds.length === currentLeads.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(currentLeads.map(lead => lead.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]))
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      for (const id of selectedIds) {
        await deleteLead.mutateAsync(id)
      }
      toast.success(`${selectedIds.length} leads excluídos`)
      setSelectedIds([])
    } catch (error) {
      toast.error('Erro ao excluir leads selecionados')
    } finally {
      setIsBulkDeleteOpen(false)
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
    <StatusBadge
      semanticStatus={leadStatusMap(status as LeadStatus)}
      label={LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] || status}
    />
  )

  const renderOriginBadge = (origin: string) => (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border">
      <Globe className="w-3 h-3" />
      {LEAD_ORIGIN_LABELS[origin as keyof typeof LEAD_ORIGIN_LABELS] || origin}
    </div>
  )

  // --- Layout Sections ---

  const actions = (
    <RequirePermission permission="leads.create">
      <Button onClick={() => setIsCreateOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Lead
      </Button>
    </RequirePermission>
  )

  const hasFilters = statusFilter !== 'all' || originFilter !== 'all' || search

  const metrics = (
    <div className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-top-4 duration-500">
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Leads em Aberto</p>
            <p className="text-2xl font-bold">{leadMetrics.openLeads}</p>
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Funnel size={32} weight="duotone" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500 shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Criados no Mês</p>
            <p className="text-2xl font-bold">{leadMetrics.createdThisMonth}</p>
          </div>
          <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600">
            <CalendarBlank size={32} weight="duotone" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-emerald-500 shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Qualificados no Mês</p>
            <p className="text-2xl font-bold">{leadMetrics.qualifiedThisMonth}</p>
          </div>
          <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
            <ChartBar size={32} weight="duotone" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const filtersBar = (
    <SharedListToolbar
      searchField={
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      }
      filters={
        <div className="flex flex-wrap items-center gap-2">
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

          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters}>Limpar</Button>
          )}
        </div>
      }
      viewToggle={
        <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/20">
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
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('kanban')}
          >
            <Kanban />
          </Button>
        </div>
      }
      rightContent={
        selectedIds.length > 0 && (
          <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>
            <Trash className="mr-2 h-4 w-4" /> Excluir ({selectedIds.length})
          </Button>
        )
      }
    />
  )

  const pagination = totalLeads > 0 && (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
      <div className="flex items-center gap-3 flex-wrap">
        <span>
          Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalLeads)}–{Math.min(currentPage * itemsPerPage, totalLeads)} de {totalLeads} leads
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Linhas:</span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[80px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <CaretLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Próximo
          <CaretRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <PageContainer>
      <SharedListLayout
        title="Leads"
        description="Gerencie seus prospects e oportunidades."
        primaryAction={actions}
        metrics={metrics}
        filtersBar={filtersBar}
        footer={viewMode === 'kanban' ? null : pagination}
      >
        {isLoading ? (
          <SharedListSkeleton columns={["", "Empresa", "Contato", "Operação", "Progresso", "Tags", "Origem", "Responsável", "Ações"]} />
        ) : paginatedLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/10 p-8">
            Nenhum lead encontrado com os filtros atuais.
          </div>
        ) : viewMode === 'list' ? (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={currentLeads.length > 0 && selectedIds.length === currentLeads.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Operação</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="w-[140px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => {
                  const contact = getPrimaryContact(lead)
                  const owner = (lead as any).owner
                  const isSelected = selectedIds.includes(lead.id)
                  return (
                    <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/leads/${lead.id}`)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelectOne(lead.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{lead.legalName}</div>
                        {lead.tradeName && <div className="text-xs text-muted-foreground mt-1">{lead.tradeName}</div>}
                      </TableCell>
                      <TableCell>
                        {contact ? (
                          <div
                            className="text-sm hover:underline text-primary"
                            onClick={(e) => {
                              e.stopPropagation()
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
                      <TableCell>
                        <div className="space-y-1 min-w-[140px]">
                          <Progress value={LEAD_STATUS_PROGRESS[lead.status]} indicatorClassName={LEAD_STATUS_COLORS[lead.status]} />
                          <div className="flex items-center justify-end text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground">{LEAD_STATUS_PROGRESS[lead.status]}%</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <LeadTagsCell leadId={lead.id} />
                      </TableCell>
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
                      <TableCell onClick={e => e.stopPropagation()} className="text-right">
                        <QuickActionsMenu
                          actions={getLeadQuickActions({
                            lead,
                            navigate,
                            updateLead,
                            deleteLead,
                            profileId: profile?.id,
                            onEdit: () => openEdit(lead),
                          })}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedLeads.map(lead => {
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
                      <div onClick={e => e.stopPropagation()} className="flex gap-1">
                        <QuickActionsMenu
                          actions={getLeadQuickActions({
                            lead,
                            navigate,
                            updateLead,
                            deleteLead,
                            profileId: profile?.id,
                            onEdit: () => openEdit(lead),
                          })}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {renderStatusBadge(lead.status)}
                      {renderOriginBadge(lead.origin)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 text-sm space-y-3">
                    <div onClick={e => e.stopPropagation()} className="min-h-[24px]">
                      <TagSelector entityId={lead.id} entityType="lead" variant="minimal" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{LEAD_STATUS_LABELS[lead.status]}</span>
                        <span className="font-semibold text-foreground">{LEAD_STATUS_PROGRESS[lead.status]}%</span>
                      </div>
                      <Progress value={LEAD_STATUS_PROGRESS[lead.status]} indicatorClassName={LEAD_STATUS_COLORS[lead.status]} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Contato Principal</span>
                        {contact ? (
                          <div
                            className="font-medium truncate hover:text-primary hover:underline"
                            onClick={(e) => {
                              e.stopPropagation()
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
        ) : (
          <LeadsKanban leads={leads || []} isLoading={isLoading} />
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

        <LeadEditSheet
          lead={editingLead}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />

        <LeadDeleteDialog
          lead={deletingLead}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleDelete}
          isDeleting={deleteLead.isPending}
        />

        <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir {selectedIds.length} leads?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação removerá todos os leads selecionados e não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SharedListLayout>
    </PageContainer>
  )
}