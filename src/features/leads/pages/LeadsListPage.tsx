import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLeads, useCreateLead, useDeleteLead, LeadFilters, useUpdateLead } from '@/services/leadService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, MagnifyingGlass, SquaresFour, Globe, CaretLeft, CaretRight, ChartBar, CalendarBlank, Funnel, Trash, Kanban, Target, Tag as TagIcon } from '@phosphor-icons/react'
import { Lead, LeadPriorityBucket, LeadStatus, LEAD_STATUS_PROGRESS, LEAD_STATUS_COLORS } from '@/lib/types'
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { LeadsKanban } from '../components/LeadsKanban'
import { LeadsSalesList } from '../components/LeadsSalesList'
import { LeadSalesViewItem, useLeadsSalesView } from '@/services/leadsSalesViewService'
import { Progress } from '@/components/ui/progress'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'
import { getLeadQuickActions } from '@/hooks/useQuickActions'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTags } from '@/services/tagService'
import { useSettings } from '@/services/systemSettingsService'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { LeadsSalesFiltersBar } from '../components/LeadsSalesFiltersBar'
import { useUsers } from '@/services/userService'

const PRIORITY_OPTIONS: LeadPriorityBucket[] = ['hot', 'warm', 'cold']
const arraysEqual = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((value, index) => value === b[index])

export default function LeadsListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuth()
  const { leadStatuses, leadOrigins, getLeadStatusByCode, getLeadOriginByCode } = useSystemMetadata()
  const { data: users = [] } = useUsers()

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

  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'sales'>(() => {
    const saved = savedPreferences?.viewMode
    // Force 'sales' if 'list' was saved previously
    if (saved === 'list') return 'sales'
    return (saved as 'grid' | 'kanban' | 'sales') || 'sales'
  })

  const [search, setSearch] = useState(() => savedPreferences?.search || '')
  const [statusFilter, setStatusFilter] = useState<string>(() => savedPreferences?.statusFilter || 'all')
  const [originFilter, setOriginFilter] = useState<string>(() => savedPreferences?.originFilter || 'all')
  const [tagFilter, setTagFilter] = useState<string[]>(() => savedPreferences?.tagFilter || [])
  const [salesOwnerMode, setSalesOwnerMode] = useState<'me' | 'all' | 'custom'>(() => {
    const ownerParam = searchParams.get('owner')
    if (ownerParam === 'me') return 'me'
    if (searchParams.get('owners')) return 'custom'
    return 'all'
  })
  const [salesOwnerIds, setSalesOwnerIds] = useState<string[]>(() => searchParams.get('owners')?.split(',').filter(Boolean) || [])
  const [salesPriority, setSalesPriority] = useState<LeadPriorityBucket[]>(() =>
    (searchParams.get('priority')?.split(',').filter(Boolean) as LeadPriorityBucket[]) || []
  )
  const [salesStatusFilter, setSalesStatusFilter] = useState<string[]>(() => searchParams.get('status')?.split(',').filter(Boolean) || [])
  const [salesOriginFilter, setSalesOriginFilter] = useState<string[]>(() => searchParams.get('origin')?.split(',').filter(Boolean) || [])
  const [salesDaysWithoutInteraction, setSalesDaysWithoutInteraction] = useState<number | null>(() => {
    const value = searchParams.get('days_without_interaction')
    return value ? Number(value) : null
  })
  const [salesOrderBy, setSalesOrderBy] = useState<'priority' | 'last_interaction' | 'created_at'>(() =>
    (searchParams.get('order_by') as 'priority' | 'last_interaction' | 'created_at') || 'priority'
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(() => savedPreferences?.itemsPerPage || 10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])

  const { data: tags = [] } = useTags('lead')
  const { data: settings } = useSettings()

  const activeStatusCodes = useMemo(
    () => leadStatuses.filter(status => status.isActive).map(status => status.code),
    [leadStatuses]
  )

  const activeOriginCodes = useMemo(
    () => leadOrigins.filter(origin => origin.isActive).map(origin => origin.code),
    [leadOrigins]
  )

  const activeTagIds = useMemo(() => {
    return tags
      .filter(tag => {
        const anyTag = tag as any
        if (typeof anyTag.isActive === 'boolean') return anyTag.isActive
        if (typeof anyTag.is_active === 'boolean') return anyTag.is_active
        return true
      })
      .map(tag => tag.id)
  }, [tags])

  const normalizedStatusFilter = statusFilter !== 'all' && activeStatusCodes.includes(statusFilter) ? statusFilter : 'all'
  const normalizedOriginFilter = originFilter !== 'all' && activeOriginCodes.includes(originFilter) ? originFilter : 'all'
  const normalizedTagFilter = tagFilter.filter(tagId => activeTagIds.includes(tagId))

  useEffect(() => {
    if (!leadStatuses.length && !leadOrigins.length && !tags.length) return

    const validStatus = normalizedStatusFilter !== 'all' ? normalizedStatusFilter : 'all'
    const validOrigin = normalizedOriginFilter !== 'all' ? normalizedOriginFilter : 'all'
    const validTags = normalizedTagFilter

    if (validStatus !== statusFilter) setStatusFilter(validStatus)
    if (validOrigin !== originFilter) setOriginFilter(validOrigin)
    if (JSON.stringify(validTags) !== JSON.stringify(tagFilter)) setTagFilter(validTags)
  }, [leadStatuses.length, leadOrigins.length, tags.length, normalizedOriginFilter, normalizedStatusFilter, normalizedTagFilter, originFilter, statusFilter, tagFilter])

  useEffect(() => {
    if (!leadStatuses.length && !leadOrigins.length) return

    const validSalesStatus = salesStatusFilter.filter(code => activeStatusCodes.includes(code))
    const validSalesOrigin = salesOriginFilter.filter(code => activeOriginCodes.includes(code))
    const validPriority = salesPriority.filter(priority => PRIORITY_OPTIONS.includes(priority))

    if (!arraysEqual(validSalesStatus, salesStatusFilter)) setSalesStatusFilter(validSalesStatus)
    if (!arraysEqual(validSalesOrigin, salesOriginFilter)) setSalesOriginFilter(validSalesOrigin)
    if (!arraysEqual(validPriority, salesPriority)) setSalesPriority(validPriority)
  }, [activeOriginCodes, activeStatusCodes, salesOriginFilter, salesPriority, salesStatusFilter])

  const [hasCheckedEmptyInitial, setHasCheckedEmptyInitial] = useState(false)
  const [showPreferencesResetPrompt, setShowPreferencesResetPrompt] = useState(false)

  const filters: LeadFilters = {
    search: search || undefined,
    status: normalizedStatusFilter !== 'all' ? [normalizedStatusFilter] : undefined,
    origin: normalizedOriginFilter !== 'all' ? [normalizedOriginFilter] : undefined,
    tags: normalizedTagFilter.length > 0 ? normalizedTagFilter : undefined
  }

  const { data: leads, isLoading } = useLeads(filters)
  const salesFilters = useMemo(() => ({
    owner: salesOwnerMode === 'me' ? 'me' : undefined,
    ownerIds: salesOwnerMode === 'custom' ? salesOwnerIds : undefined,
    priority: salesPriority.length > 0 ? salesPriority : undefined,
    status: salesStatusFilter.length > 0 ? salesStatusFilter : undefined,
    origin: salesOriginFilter.length > 0 ? salesOriginFilter : undefined,
    daysWithoutInteraction: salesDaysWithoutInteraction ?? undefined,
    orderBy: salesOrderBy
  }), [salesDaysWithoutInteraction, salesOriginFilter, salesOrderBy, salesOwnerIds, salesOwnerMode, salesPriority, salesStatusFilter])
  const salesViewQuery = useMemo(
    () => ({
      ...salesFilters,
      page: currentPage,
      pageSize: itemsPerPage
    }),
    [currentPage, itemsPerPage, salesFilters]
  )
  const { data: salesViewData, isLoading: isSalesLoading, isFetching: isSalesFetching } = useLeadsSalesView(salesViewQuery, {
    enabled: viewMode === 'sales'
  })
  const createLead = useCreateLead()
  const deleteLead = useDeleteLead()
  const updateLead = useUpdateLead()

  // Feature Flag Logic
  const tagsConfig = settings?.find(s => s.key === 'tags_config')?.value;
  const tagsEnabled = tagsConfig?.global && tagsConfig?.modules?.leads !== false;

  // Adapter for quick actions type compatibility
  const updateLeadAdapter = {
    ...updateLead,
    mutate: (vars: { leadId: string; updates: any }, options?: any) => {
      updateLead.mutate({ id: vars.leadId, data: vars.updates }, options)
    }
  } as any

  const salesLeads = salesViewData?.data || []
  const activeLeads = (viewMode === 'sales' ? salesLeads : leads) || []
  const isActiveLoading = viewMode === 'sales' ? isSalesLoading || isSalesFetching : isLoading

  const leadMetrics = useMemo(() => {
    if (viewMode === 'sales') {
      const total = salesViewData?.pagination.total ?? salesLeads.length
      return { openLeads: total, createdThisMonth: 0, qualifiedThisMonth: 0 }
    }

    const dataset = (leads || []) as Lead[]
    const openLeads = dataset.filter(l => !['qualified', 'disqualified'].includes(l.status)).length || 0
    const createdThisMonth = dataset.filter(l => new Date(l.createdAt) >= monthStart).length || 0
    const qualifiedThisMonth = dataset.filter(
      l => l.status === 'qualified' && l.qualifiedAt && new Date(l.qualifiedAt) >= monthStart
    ).length || 0

    return { openLeads, createdThisMonth, qualifiedThisMonth }
  }, [leads, monthStart, salesLeads.length, salesViewData?.pagination.total, viewMode])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, normalizedStatusFilter, normalizedOriginFilter, normalizedTagFilter])

  useEffect(() => {
    if (viewMode !== 'sales') return
    setCurrentPage(1)
  }, [salesOwnerMode, salesOwnerIds, salesPriority, salesStatusFilter, salesOriginFilter, salesDaysWithoutInteraction, viewMode])

  useEffect(() => {
    setSelectedIds([])
  }, [viewMode, search, normalizedStatusFilter, normalizedOriginFilter, normalizedTagFilter, currentPage, salesOwnerMode, salesOwnerIds, salesPriority, salesStatusFilter, salesOriginFilter, salesDaysWithoutInteraction])

  useEffect(() => {
    const payload = {
      viewMode,
      search,
      statusFilter: normalizedStatusFilter !== 'all' ? normalizedStatusFilter : 'all',
      originFilter: normalizedOriginFilter !== 'all' ? normalizedOriginFilter : 'all',
      tagFilter: normalizedTagFilter,
      itemsPerPage
    }
    localStorage.setItem('leads-list-preferences', JSON.stringify(payload))
  }, [itemsPerPage, normalizedOriginFilter, normalizedStatusFilter, normalizedTagFilter, search, viewMode])

  useEffect(() => {
    if (viewMode === 'sales') return
    if (isLoading || hasCheckedEmptyInitial) return

    setHasCheckedEmptyInitial(true)

    if ((leads?.length || 0) === 0 && (search || normalizedStatusFilter !== 'all' || normalizedOriginFilter !== 'all' || normalizedTagFilter.length > 0)) {
      if (savedPreferences) {
        setShowPreferencesResetPrompt(true)
      } else {
        clearFilters()
      }
    }
  }, [hasCheckedEmptyInitial, isLoading, leads?.length, normalizedOriginFilter, normalizedStatusFilter, normalizedTagFilter.length, savedPreferences, search, viewMode])

  useEffect(() => {
    if (viewMode !== 'sales') return

    const params = new URLSearchParams()

    if (salesOwnerMode === 'me') {
      params.set('owner', 'me')
    } else if (salesOwnerMode === 'custom' && salesOwnerIds.length > 0) {
      params.set('owners', salesOwnerIds.join(','))
    }

    if (salesPriority.length > 0) params.set('priority', salesPriority.join(','))
    if (salesStatusFilter.length > 0) params.set('status', salesStatusFilter.join(','))
    if (salesOriginFilter.length > 0) params.set('origin', salesOriginFilter.join(','))
    if (salesDaysWithoutInteraction) params.set('days_without_interaction', String(salesDaysWithoutInteraction))
    if (salesOrderBy) params.set('order_by', salesOrderBy)

    setSearchParams(params, { replace: true })
  }, [salesDaysWithoutInteraction, salesOrderBy, salesOriginFilter, salesOwnerIds, salesOwnerMode, salesPriority, salesStatusFilter, setSearchParams, viewMode])

  const totalLeads = viewMode === 'sales' ? salesViewData?.pagination.total ?? 0 : activeLeads.length
  const totalPages = Math.max(
    1,
    Math.ceil(totalLeads / (viewMode === 'sales' ? salesViewData?.pagination.perPage || itemsPerPage : itemsPerPage))
  )
  const currentPageSize = viewMode === 'sales' ? salesViewData?.pagination.perPage || itemsPerPage : itemsPerPage

  const paginatedLeads = useMemo<Lead[] | LeadSalesViewItem[]>(() => {
    if (viewMode === 'sales') return salesLeads
    if (!activeLeads) return []
    const start = (currentPage - 1) * itemsPerPage
    return activeLeads.slice(start, start + itemsPerPage)
  }, [activeLeads, currentPage, itemsPerPage, salesLeads, viewMode])
  const currentLeads = paginatedLeads as Array<Lead | LeadSalesViewItem>

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newLeadName, setNewLeadName] = useState('')

  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

  const getLeadId = (lead: Lead | LeadSalesViewItem) => {
    const raw = lead as any
    return raw.leadId ?? raw.lead_id ?? raw.id ?? raw.lead?.id
  }

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
    const leadIds = currentLeads.map(lead => getLeadId(lead)).filter(Boolean) as string[]
    if (leadIds.length > 0 && selectedIds.length === leadIds.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(Array.from(new Set(leadIds)))
    }
  }

  const toggleSelectOne = (id: string, selected: boolean) => {
    setSelectedIds(prev => (selected ? [...new Set([...prev, id])] : prev.filter(item => item !== id)))
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
    setTagFilter([])
    setCurrentPage(1)
  }

  const handleResetPreferences = () => {
    clearFilters()
    localStorage.removeItem('leads-list-preferences')
    setShowPreferencesResetPrompt(false)
    toast.info('Filtros e preferências foram limpos para mostrar resultados.')
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

  const renderStatusBadge = (status: string) => {
    const statusMeta = getLeadStatusByCode(status);
    return (
      <StatusBadge
        semanticStatus={leadStatusMap(status as LeadStatus)}
        label={statusMeta?.label || status}
      />
    );
  }

  const renderOriginBadge = (origin: string) => {
    const originMeta = getLeadOriginByCode(origin);
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border">
        <Globe className="w-3 h-3" />
        {originMeta?.label || origin}
      </div>
    );
  }

  // --- Layout Sections ---

  const actions = (
    <RequirePermission permission="leads.create">
      <Button onClick={() => setIsCreateOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Lead
      </Button>
    </RequirePermission>
  )

  const hasFilters = normalizedStatusFilter !== 'all' || normalizedOriginFilter !== 'all' || search || normalizedTagFilter.length > 0

  const showFiltersEmptyState =
    viewMode !== 'kanban' && hasFilters && !isActiveLoading && activeLeads.length === 0

  const filtersEmptyState = showFiltersEmptyState ? (
    <div className="flex flex-col items-center gap-3 text-center py-10 border border-dashed rounded-lg bg-muted/30">
      <div className="space-y-2 max-w-xl">
        <p className="text-lg font-semibold text-foreground">Nenhum lead encontrado</p>
        <p className="text-sm text-muted-foreground">
          Seus filtros podem estar ocultando resultados. Tente limpar os filtros para visualizar todos os leads novamente.
        </p>
      </div>
      <Button variant="secondary" onClick={clearFilters}>
        Limpar filtros
      </Button>
    </div>
  ) : null

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

  const viewToggleControl = (
    <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/20">
      <Button
        variant={viewMode === 'sales' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => setViewMode('sales')}
        title="Visualização Sales"
      >
        <Target />
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => setViewMode('grid')}
        title="Grade"
      >
        <SquaresFour />
      </Button>
      <Button
        variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => setViewMode('kanban')}
        title="Kanban"
      >
        <Kanban />
      </Button>
    </div>
  )

  const bulkActions = selectedIds.length > 0 && (
    <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>
      <Trash className="mr-2 h-4 w-4" /> Excluir ({selectedIds.length})
    </Button>
  )

  const resetSalesFilters = () => {
    setSalesOwnerMode('me')
    setSalesOwnerIds([])
    setSalesPriority([])
    setSalesStatusFilter([])
    setSalesOriginFilter([])
    setSalesDaysWithoutInteraction(null)
    setSalesOrderBy('priority')
  }

  const salesFiltersBar = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {viewToggleControl}
        {bulkActions}
      </div>
      <LeadsSalesFiltersBar
        ownerMode={salesOwnerMode}
        onOwnerModeChange={(mode) => {
          setSalesOwnerMode(mode)
          if (mode !== 'custom') {
            setSalesOwnerIds([])
          }
        }}
        selectedOwners={salesOwnerIds}
        onSelectedOwnersChange={setSalesOwnerIds}
        priority={salesPriority}
        onPriorityChange={(values) => setSalesPriority(values)}
        statuses={salesStatusFilter}
        onStatusesChange={setSalesStatusFilter}
        origins={salesOriginFilter}
        onOriginsChange={setSalesOriginFilter}
        daysWithoutInteraction={salesDaysWithoutInteraction}
        onDaysWithoutInteractionChange={setSalesDaysWithoutInteraction}
        orderBy={salesOrderBy}
        onOrderByChange={setSalesOrderBy}
        users={users}
        leadStatuses={leadStatuses.filter(s => s.isActive)}
        leadOrigins={leadOrigins.filter(o => o.isActive)}
        onClear={resetSalesFilters}
      />
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
              {leadStatuses.filter(s => s.isActive).map((status) => (
                <SelectItem key={status.code} value={status.code}>{status.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={originFilter} onValueChange={setOriginFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Origens</SelectItem>
              {leadOrigins.filter(o => o.isActive).map((origin) => (
                <SelectItem key={origin.code} value={origin.code}>{origin.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {tagsEnabled && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={`h-9 border-dashed ${tagFilter.length > 0 ? 'bg-primary/5 border-primary text-primary' : ''}`}>
                  <TagIcon className="mr-2 h-4 w-4" /> Tags {tagFilter.length > 0 && `(${tagFilter.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start" side="bottom" sideOffset={8} alignOffset={0} avoidCollisions={true} collisionPadding={8}>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Filtrar por Tags</Label>
                  <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                    {tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant={tagFilter.includes(tag.id) ? 'default' : 'outline'}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => {
                          const newTags = tagFilter.includes(tag.id)
                            ? tagFilter.filter(t => t !== tag.id)
                            : [...tagFilter, tag.id];
                          setTagFilter(newTags);
                          setCurrentPage(1);
                        }}
                        style={tagFilter.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : { color: tag.color, borderColor: tag.color + '40' }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {tags.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma tag encontrada.</span>}
                  </div>
                  {tagFilter.length > 0 && (
                    <Button variant="ghost" size="sm" className="w-full h-6 mt-2 text-xs" onClick={() => { setTagFilter([]); setCurrentPage(1); }}>
                      Limpar Tags
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters}>Limpar</Button>
          )}
        </div>
      }
      viewToggle={
        viewToggleControl
      }
      rightContent={
        bulkActions
      }
    />
  )

  const activeFiltersBar = viewMode === 'sales' ? salesFiltersBar : filtersBar

  const pagination = totalLeads > 0 && (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
      <div className="flex items-center gap-3 flex-wrap">
        <span>
          Mostrando {Math.min((currentPage - 1) * currentPageSize + 1, totalLeads)}–
          {Math.min(currentPage * currentPageSize, totalLeads)} de {totalLeads} leads
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
        filtersBar={activeFiltersBar}
        emptyState={filtersEmptyState}
        footer={viewMode === 'kanban' ? null : pagination}
      >
        {isActiveLoading ? (
          <SharedListSkeleton columns={["", "Empresa", "Contato", "Operação", "Progresso", "Tags", "Origem", "Responsável", "Ações"]} />
        ) : paginatedLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/10 p-8">
            Nenhum lead encontrado.
            {hasFilters && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpar filtros
                </Button>
                {viewMode !== 'grid' && (
                  <Button variant="ghost" size="sm" onClick={() => setViewMode('grid')}>
                    Ir para grade
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : viewMode === 'sales' ? (
          <LeadsSalesList
            leads={paginatedLeads as LeadSalesViewItem[]}
            isLoading={isActiveLoading}
            selectedIds={selectedIds}
            onSelectAll={toggleSelectAll}
            onSelectOne={toggleSelectOne}
            onNavigate={(id) => navigate(`/leads/${id}`)}
          />
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
                            updateLead: updateLeadAdapter,
                            deleteLead,
                            profileId: profile?.id,
                            onEdit: () => openEdit(lead),
                            getLeadStatusLabel: (code) => getLeadStatusByCode(code)?.label || code,
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
                        <span>{getLeadStatusByCode(lead.status)?.label || lead.status}</span>
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
          <LeadsKanban leads={activeLeads || []} isLoading={isLoading} />
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

        <AlertDialog open={showPreferencesResetPrompt} onOpenChange={setShowPreferencesResetPrompt}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Filtros podem estar desatualizados</AlertDialogTitle>
              <AlertDialogDescription>
                Não encontramos leads com as preferências salvas. Deseja limpar filtros e redefinir suas preferências para ver
                resultados novamente?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Manter filtros</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetPreferences}>Limpar filtros e preferências</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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