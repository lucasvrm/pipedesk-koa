import { useMemo, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLeads, useCreateLead, useDeleteLead, LeadFilters, useUpdateLead } from '@/services/leadService'
import { ensureArray } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Globe, ChartBar, CalendarBlank, Funnel, Trash, Kanban, SquaresFour } from '@phosphor-icons/react'
import { Lead, LeadPriorityBucket, LEAD_STATUS_PROGRESS, LEAD_STATUS_COLORS } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { leadStatusMap } from '@/lib/statusMaps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequirePermission } from '@/features/rbac/components/RequirePermission'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LeadDeleteDialog } from '../components/LeadDeleteDialog'
import { LeadEditSheet } from '../components/LeadEditSheet'
import { toast } from 'sonner'
import TagSelector from '@/components/TagSelector'
import { PageContainer } from '@/components/PageContainer'
import { SharedListLayout } from '@/components/layouts/SharedListLayout'
import { SharedListSkeleton } from '@/components/layouts/SharedListSkeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { LeadsKanban } from '../components/LeadsKanban'
import { LeadsSalesList } from '../components/LeadsSalesList'
import { LeadSalesViewItem, LeadSalesViewQuery, useLeadsSalesView } from '@/services/leadsSalesViewService'
import { Progress } from '@/components/ui/progress'
import { QuickActionsMenu, QuickAction } from '@/components/QuickActionsMenu'
import { getLeadQuickActions } from '@/hooks/useQuickActions'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { LeadsPaginationControls } from '../components/LeadsPaginationControls'
import { safeString } from '@/lib/utils'
import { SALES_VIEW_MESSAGES, getSalesViewErrorMessages } from '../constants/salesViewMessages'
import { ApiError } from '@/lib/errors'
import { DataToolbar } from '@/components/DataToolbar'
import { LeadsPrimitiveFilters } from '../components/LeadsPrimitiveFilters'

// View types used by DataToolbar and internal view management
type DataToolbarView = 'list' | 'cards' | 'kanban'
type InternalViewMode = 'grid' | 'kanban' | 'sales'

export default function LeadsListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuth()
  const { leadStatuses, leadOrigins, getLeadStatusById, getLeadOriginById } = useSystemMetadata()

  // ========================================
  // URL-DRIVEN STATE (No useState for filters)
  // All filter values are derived directly from searchParams
  // ========================================
  
  // View mode - derived from URL
  const currentView = useMemo((): InternalViewMode => {
    const viewParam = searchParams.get('view')
    if (viewParam === 'grid' || viewParam === 'cards') return 'grid'
    if (viewParam === 'kanban') return 'kanban'
    if (viewParam === 'list' || viewParam === 'sales') return 'sales'
    return 'sales' // default
  }, [searchParams])

  // Search term - derived from URL
  const searchTerm = searchParams.get('q') || ''

  // Status filter - derived from URL
  const statusFilter = searchParams.get('status') || 'all'

  // Origin filter - derived from URL
  const originFilter = searchParams.get('origin') || 'all'

  // Priority filter - derived from URL (for sales view)
  const priorityParam = searchParams.get('priority')
  const priorityFilter: LeadPriorityBucket | 'all' = 
    priorityParam === 'hot' || priorityParam === 'warm' || priorityParam === 'cold' 
      ? priorityParam 
      : 'all'

  // Order by - derived from URL
  const orderByParam = searchParams.get('order_by')
  const salesOrderBy: 'priority' | 'last_interaction' | 'created_at' = 
    orderByParam === 'last_interaction' || orderByParam === 'created_at' 
      ? orderByParam 
      : 'priority'

  // Owner mode - derived from URL
  const ownerModeParam = searchParams.get('owner')
  const salesOwnerMode: 'me' | 'all' = ownerModeParam === 'me' ? 'me' : 'all'

  // Page - derived from URL
  const pageParam = searchParams.get('page')
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1

  // Items per page - local state (not critical for render loop)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Selection state - local state (ephemeral UI state)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])

  // ========================================
  // SIMPLE HANDLERS - Only update URL
  // ========================================
  
  const handleViewChange = useCallback((view: InternalViewMode) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      newParams.set('view', view)
      newParams.delete('page') // Reset page on view change
      return newParams
    }, { replace: true })
  }, [setSearchParams])

  const handleSearchChange = useCallback((value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (value) {
        newParams.set('q', value)
      } else {
        newParams.delete('q')
      }
      newParams.delete('page') // Reset page on search
      return newParams
    }, { replace: true })
  }, [setSearchParams])

  const handleStatusChange = useCallback((value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (value && value !== 'all') {
        newParams.set('status', value)
      } else {
        newParams.delete('status')
      }
      newParams.delete('page')
      return newParams
    }, { replace: true })
  }, [setSearchParams])

  const handleOriginChange = useCallback((value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (value && value !== 'all') {
        newParams.set('origin', value)
      } else {
        newParams.delete('origin')
      }
      newParams.delete('page')
      return newParams
    }, { replace: true })
  }, [setSearchParams])

  const handlePriorityChange = useCallback((value: LeadPriorityBucket | 'all') => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (value && value !== 'all') {
        newParams.set('priority', value)
      } else {
        newParams.delete('priority')
      }
      newParams.delete('page')
      return newParams
    }, { replace: true })
  }, [setSearchParams])

  const handleOrderByChange = useCallback((value: 'priority' | 'last_interaction' | 'created_at') => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (value && value !== 'priority') {
        newParams.set('order_by', value)
      } else {
        newParams.delete('order_by')
      }
      return newParams
    }, { replace: true })
  }, [setSearchParams])

  const handleOwnerModeChange = useCallback((value: 'me' | 'all') => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (value === 'me') {
        newParams.set('owner', 'me')
      } else {
        newParams.delete('owner')
      }
      newParams.delete('page')
      return newParams
    }, { replace: true })
  }, [setSearchParams])

  const handlePageChange = useCallback((page: number) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (page > 1) {
        newParams.set('page', String(page))
      } else {
        newParams.delete('page')
      }
      return newParams
    }, { replace: true })
  }, [setSearchParams])

  const handleItemsPerPageChange = useCallback((pageSize: number) => {
    setItemsPerPage(pageSize)
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      newParams.delete('page') // Reset to first page
      return newParams
    }, { replace: true })
  }, [setSearchParams])

  const clearFilters = useCallback(() => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams()
      // Keep only the view
      const view = prev.get('view')
      if (view) newParams.set('view', view)
      return newParams
    }, { replace: true })
  }, [setSearchParams])

  // ========================================
  // DATA FETCHING
  // ========================================

  const activeLeadStatuses = useMemo(() => leadStatuses.filter(s => s.isActive), [leadStatuses])
  const activeLeadOrigins = useMemo(() => leadOrigins.filter(o => o.isActive), [leadOrigins])

  // Filters for standard leads API
  const filters = useMemo<LeadFilters>(() => ({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
    origin: originFilter !== 'all' ? [originFilter] : undefined,
  }), [searchTerm, statusFilter, originFilter])

  const { data: leads, isLoading } = useLeads(filters)

  // Filters for sales view API
  const salesFilters = useMemo((): Partial<LeadSalesViewQuery> => ({
    owner: salesOwnerMode === 'me' ? 'me' : undefined,
    priority: priorityFilter !== 'all' ? [priorityFilter] : undefined,
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
    origin: originFilter !== 'all' ? [originFilter] : undefined,
    orderBy: salesOrderBy
  }), [salesOwnerMode, priorityFilter, statusFilter, originFilter, salesOrderBy])

  const salesViewQuery = useMemo((): LeadSalesViewQuery => ({
    ...salesFilters,
    page: currentPage,
    pageSize: itemsPerPage
  }), [currentPage, itemsPerPage, salesFilters])

  const { 
    data: salesViewData, 
    isLoading: isSalesLoading, 
    isFetching: isSalesFetching, 
    isError: isSalesError, 
    error: salesError, 
    refetch: refetchSalesView 
  } = useLeadsSalesView(salesViewQuery, {
    enabled: currentView === 'sales'
  })

  const createLead = useCreateLead()
  const deleteLead = useDeleteLead()
  const updateLead = useUpdateLead()

  // Adapter for quick actions type compatibility
  const updateLeadAdapter = {
    ...updateLead,
    mutate: (vars: { leadId: string; updates: any }, options?: any) => {
      updateLead.mutate({ id: vars.leadId, data: vars.updates }, options)
    }
  } as any

  // Ensure salesLeads is always an array, even on error
  const salesLeads = ensureArray<LeadSalesViewItem>(salesViewData?.data)
  const activeLeads = (currentView === 'sales' ? salesLeads : leads) || []
  const isActiveLoading = currentView === 'sales' ? isSalesLoading || isSalesFetching : isLoading

  const leadMetrics = useMemo(() => {
    if (currentView === 'sales') {
      const total = salesViewData?.pagination?.total ?? salesLeads.length
      return { openLeads: total, createdThisMonth: 0, qualifiedThisMonth: 0 }
    }

    const dataset = (leads || []) as Lead[]
    // Get status codes for qualified and disqualified
    const qualifiedStatus = leadStatuses.find(s => s.code === 'qualified')
    const disqualifiedStatus = leadStatuses.find(s => s.code === 'disqualified')
    const closedStatusIds = [qualifiedStatus?.id, disqualifiedStatus?.id].filter(Boolean)
    
    const openLeads = dataset.filter(l => !closedStatusIds.includes(l.leadStatusId)).length || 0
    const createdThisMonth = dataset.filter(l => new Date(l.createdAt) >= monthStart).length || 0
    const qualifiedThisMonth = dataset.filter(
      l => l.leadStatusId === qualifiedStatus?.id && l.qualifiedAt && new Date(l.qualifiedAt) >= monthStart
    ).length || 0

    return { openLeads, createdThisMonth, qualifiedThisMonth }
  }, [leads, monthStart, salesLeads.length, salesViewData?.pagination?.total, currentView, leadStatuses])

  // ========================================
  // PAGINATION
  // ========================================

  const totalLeads = currentView === 'sales' ? salesViewData?.pagination?.total ?? 0 : activeLeads.length
  const totalPages = Math.max(
    1,
    Math.ceil(totalLeads / (currentView === 'sales' ? salesViewData?.pagination?.perPage || itemsPerPage : itemsPerPage))
  )
  const currentPageSize = currentView === 'sales' ? salesViewData?.pagination?.perPage || itemsPerPage : itemsPerPage

  const paginatedLeads = useMemo<Lead[] | LeadSalesViewItem[]>(() => {
    if (currentView === 'sales') return salesLeads
    if (!activeLeads) return []
    const start = (currentPage - 1) * itemsPerPage
    return activeLeads.slice(start, start + itemsPerPage)
  }, [activeLeads, currentPage, itemsPerPage, salesLeads, currentView])

  const currentLeads = paginatedLeads as Array<Lead | LeadSalesViewItem>

  // ========================================
  // DIALOG STATES (Local UI state - safe)
  // ========================================

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

  const getPrimaryContact = (lead: Lead) => {
    return lead.contacts?.find(c => c.isPrimary) || lead.contacts?.[0]
  }

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

  const openEdit = (lead: Lead) => {
    setEditingLead(lead)
    setIsEditOpen(true)
  }

  const renderStatusBadge = (statusId: string) => {
    const statusMeta = getLeadStatusById(statusId);
    return (
      <StatusBadge
        semanticStatus={leadStatusMap(statusMeta?.code as any)}
        label={safeString(statusMeta?.label, statusId)}
      />
    );
  }

  const renderOriginBadge = (originId: string) => {
    const originMeta = getLeadOriginById(originId);
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border">
        <Globe className="w-3 h-3" />
        {safeString(originMeta?.label, originId)}
      </div>
    );
  }

  // Map internal viewMode to DataToolbar's expected values
  const dataToolbarView: DataToolbarView = useMemo(() => {
    if (currentView === 'sales') return 'list'
    if (currentView === 'grid') return 'cards'
    return 'kanban'
  }, [currentView])

  const handleDataToolbarViewChange = useCallback((view: string) => {
    if (view === 'list') handleViewChange('sales')
    else if (view === 'cards') handleViewChange('grid')
    else if (view === 'kanban') handleViewChange('kanban')
  }, [handleViewChange])

  // --- Layout Sections ---

  const hasFilters = statusFilter !== 'all' || originFilter !== 'all' || Boolean(searchTerm) || priorityFilter !== 'all'

  const showFiltersEmptyState =
    currentView !== 'kanban' && hasFilters && !isActiveLoading && activeLeads.length === 0

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

  // Unified toolbar with primitive filters (no Radix/Shadcn components to avoid render loops)
  const unifiedToolbar = useMemo(() => {
    const newLeadButton = (
      <RequirePermission permission="leads.create">
        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </RequirePermission>
    )

    const bulkDeleteButton = selectedIds.length > 0 ? (
      <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>
        <Trash className="mr-2 h-4 w-4" /> Excluir ({selectedIds.length})
      </Button>
    ) : null

    return (
      <DataToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        currentView={dataToolbarView}
        onViewChange={handleDataToolbarViewChange}
        actions={
          <>
            {bulkDeleteButton}
            {newLeadButton}
          </>
        }
      >
        <LeadsPrimitiveFilters
          currentSearch={searchTerm}
          onSearchChange={handleSearchChange}
          currentStatus={statusFilter}
          onStatusChange={handleStatusChange}
          leadStatuses={activeLeadStatuses.map(s => ({ id: s.id, code: s.code, label: s.label }))}
          currentOrigin={originFilter}
          onOriginChange={handleOriginChange}
          leadOrigins={activeLeadOrigins.map(o => ({ id: o.id, code: o.code, label: o.label }))}
          currentPriority={currentView === 'sales' ? priorityFilter : undefined}
          onPriorityChange={currentView === 'sales' ? handlePriorityChange : undefined}
          currentOrderBy={currentView === 'sales' ? salesOrderBy : undefined}
          onOrderByChange={currentView === 'sales' ? handleOrderByChange : undefined}
          currentOwnerMode={currentView === 'sales' ? salesOwnerMode : undefined}
          onOwnerModeChange={currentView === 'sales' ? handleOwnerModeChange : undefined}
          onClear={clearFilters}
          hasActiveFilters={hasFilters}
        />
      </DataToolbar>
    )
  }, [
    searchTerm,
    handleSearchChange,
    dataToolbarView,
    handleDataToolbarViewChange,
    selectedIds.length,
    statusFilter,
    handleStatusChange,
    activeLeadStatuses,
    originFilter,
    handleOriginChange,
    activeLeadOrigins,
    currentView,
    priorityFilter,
    handlePriorityChange,
    salesOrderBy,
    handleOrderByChange,
    salesOwnerMode,
    handleOwnerModeChange,
    clearFilters,
    hasFilters
  ])

  // Simple error UI for Sales View (no complex retry/fallback logic)
  const salesErrorUI = useMemo(() => {
    if (currentView !== 'sales' || !isSalesError) return null
    
    const errorCode = salesError instanceof ApiError ? salesError.code : undefined
    const errorMessages = getSalesViewErrorMessages(errorCode)
    
    return (
      <div className="flex flex-col items-center justify-center gap-6 text-center border-2 border-dashed border-destructive/30 rounded-lg bg-destructive/5 p-12">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center ring-4 ring-destructive/10">
          <svg className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-3 max-w-2xl">
          <h3 className="text-2xl font-bold text-foreground">{errorMessages.title}</h3>
          <p className="text-base text-muted-foreground leading-relaxed">
            {errorMessages.description}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Button 
            variant="default" 
            size="lg"
            onClick={() => handleViewChange('grid')} 
            className="flex-1 text-base font-semibold"
          >
            <SquaresFour className="mr-2 h-5 w-5" />
            {SALES_VIEW_MESSAGES.BUTTON_SWITCH_TO_GRID}
          </Button>
          <Button 
            variant="default" 
            size="lg"
            onClick={() => handleViewChange('kanban')} 
            className="flex-1 text-base font-semibold"
          >
            <Kanban className="mr-2 h-5 w-5" />
            {SALES_VIEW_MESSAGES.BUTTON_SWITCH_TO_KANBAN}
          </Button>
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => refetchSalesView()} 
          className="text-sm"
        >
          {SALES_VIEW_MESSAGES.BUTTON_RETRY}
        </Button>
      </div>
    )
  }, [currentView, isSalesError, salesError, handleViewChange, refetchSalesView])

  const showPagination = currentView !== 'kanban' && totalLeads > 0
  const paginationProps = {
    currentPage,
    totalPages,
    currentPageSize,
    totalLeads,
    itemsPerPage,
    onPageChange: handlePageChange,
    onItemsPerPageChange: handleItemsPerPageChange
  }

  return (
    <PageContainer>
      <SharedListLayout
        title="Leads"
        description="Gerencie seus prospects e oportunidades."
        primaryAction={null}
         metrics={metrics}
         filtersBar={unifiedToolbar}
         emptyState={filtersEmptyState}
         footer={showPagination ? <LeadsPaginationControls {...paginationProps} /> : null}
       >
         {showPagination && (
           <LeadsPaginationControls {...paginationProps} />
         )}
         {isActiveLoading ? (
           <SharedListSkeleton columns={["", "Empresa", "Contato", "Operação", "Progresso", "Tags", "Origem", "Responsável", "Ações"]} />
         ) : salesErrorUI ? (
           salesErrorUI
         ) : paginatedLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/10 p-8">
            Nenhum lead encontrado.
            {hasFilters && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpar filtros
                </Button>
                {currentView !== 'grid' && (
                  <Button variant="ghost" size="sm" onClick={() => handleViewChange('grid')}>
                    Ir para grade
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : currentView === 'sales' ? (
          <LeadsSalesList
            leads={paginatedLeads as LeadSalesViewItem[]}
            isLoading={isActiveLoading}
            orderBy={salesOrderBy}
            selectedIds={selectedIds}
            onSelectAll={toggleSelectAll}
            onSelectOne={toggleSelectOne}
            onNavigate={(id) => navigate(`/leads/${id}`)}
            getLeadActions={(lead): QuickAction[] => {
              const id = lead.leadId ?? lead.lead_id ?? lead.id
              if (!id) return []

              // Return actions that conform to the QuickAction type.
              // IMPORTANT: Each action MUST have 'id' (string) and 'label' (string).
              // Never return the entire object or pass non-string values as label.
              return [
                {
                  id: 'view',
                  label: 'Ver detalhes do lead',
                  onClick: () => navigate(`/leads/${id}`)
                }
              ]
            }}
          />
        ) : currentView === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(paginatedLeads as Lead[]).map(lead => {
              const contact = getPrimaryContact(lead)
              const owner = lead.owner
              const safeLegalName = safeString(lead.legalName, 'Lead sem nome')
              return (
                <Card key={lead.id} className="cursor-pointer hover:border-primary/50 transition-colors group relative" onClick={() => navigate(`/leads/${lead.id}`)}>
                  <CardHeader className="pb-2 space-y-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-lg line-clamp-1" title={safeLegalName}>{safeLegalName}</CardTitle>
                        {lead.tradeName && <p className="text-xs text-muted-foreground line-clamp-1">{safeString(lead.tradeName, '')}</p>}
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
                            getLeadStatusLabel: (id) => safeString(getLeadStatusById(id)?.label, id),
                            statusOptions: leadStatuses.filter(s => s.isActive).map(s => ({ id: s.id, label: safeString(s.label, s.code), code: s.code }))
                          })}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {renderStatusBadge(lead.leadStatusId)}
                      {renderOriginBadge(lead.leadOriginId)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 text-sm space-y-3">
                    <div onClick={e => e.stopPropagation()} className="min-h-[24px]">
                      <TagSelector entityId={lead.id} entityType="lead" variant="minimal" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{safeString(getLeadStatusById(lead.leadStatusId)?.label, lead.leadStatusId)}</span>
                        <span className="font-semibold text-foreground">{LEAD_STATUS_PROGRESS[getLeadStatusById(lead.leadStatusId)?.code as keyof typeof LEAD_STATUS_PROGRESS] || 0}%</span>
                      </div>
                      <Progress value={LEAD_STATUS_PROGRESS[getLeadStatusById(lead.leadStatusId)?.code as keyof typeof LEAD_STATUS_PROGRESS] || 0} indicatorClassName={LEAD_STATUS_COLORS[getLeadStatusById(lead.leadStatusId)?.code as keyof typeof LEAD_STATUS_COLORS] || 'bg-gray-500'} />
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
                            {safeString(contact.name, 'Contato')}
                          </div>
                        ) : <span className="text-xs text-muted-foreground italic">Sem contato</span>}
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Responsável</span>
                        {owner ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={owner.avatar} />
                              <AvatarFallback className="text-[8px]">{getInitials(safeString(owner.name, '??'))}</AvatarFallback>
                            </Avatar>
                            <span className="truncate text-xs">{safeString(owner.name, 'N/A').split(' ')[0]}</span>
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
          <LeadsKanban leads={activeLeads as Lead[] || []} isLoading={isLoading} />
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
