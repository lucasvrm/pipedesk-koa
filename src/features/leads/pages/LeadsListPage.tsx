import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLeads, useDeleteLead, LeadFilters, useUpdateLead } from '@/services/leadService'
import { ensureArray } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Columns3, Globe } from 'lucide-react'
import { Lead, LeadPriorityBucket, LeadStatus, LEAD_STATUS_PROGRESS, LEAD_STATUS_COLORS } from '@/lib/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { leadStatusMap } from '@/lib/statusMaps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LeadDeleteDialog } from '../components/LeadDeleteDialog'
import { LeadEditSheet } from '../components/LeadEditSheet'
import { CreateLeadModal } from '../components/CreateLeadModal'
import { toast } from 'sonner'
import TagSelector from '@/components/TagSelector'
import { SharedListSkeleton } from '@/components/layouts/SharedListSkeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { LeadsKanban } from '../components/LeadsKanban'
import { LeadsSalesList } from '../components/LeadsSalesList'
import { LeadSalesViewItem, useLeadsSalesView } from '@/services/leadsSalesViewService'
import { Progress } from '@/components/ui/progress'
import { QuickActionsMenu, QuickAction } from '@/components/QuickActionsMenu'
import { getLeadQuickActions } from '@/hooks/useQuickActions'
import { useTags } from '@/services/tagService'
import { useSettings } from '@/services/systemSettingsService'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { useUsers } from '@/services/userService'
import { safeString } from '@/lib/utils'
import { SALES_VIEW_MESSAGES, getSalesViewErrorMessages } from '../constants/salesViewMessages'
import { ApiError } from '@/lib/errors'
import {
  hasPersistentFailures,
  getPreferredFallback,
  setPreferredFallback,
  recordSalesViewFailure,
  recordSalesViewSuccess
} from '../utils/salesViewFailureTracker'
import { getSalesErrorKey, SALES_VIEW_ERROR_GUARD_LIMIT } from '../utils/salesViewErrorGuard'
import { ScheduleMeetingDialog } from '@/features/calendar/components/ScheduleMeetingDialog'
import { useLeadsFiltersSearchParams } from '../hooks/useLeadsFiltersSearchParams'
import { LeadsFilterPanel } from '../components/LeadsFilterPanel'
import { LeadsFiltersSidebar } from '../components/LeadsFiltersSidebar'
import { LeadsListControls } from '../components/LeadsListControls'
import { useIsMobile } from '@/hooks/use-mobile'
import type { LeadOrderBy } from '../components/LeadsSmartFilters'

// View types used internally
type InternalViewMode = 'grid' | 'kanban' | 'sales'

const PRIORITY_OPTIONS: LeadPriorityBucket[] = ['hot', 'warm', 'cold']
const arraysEqual = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((value, index) => value === b[index])

export default function LeadsListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuth()
  const { leadStatuses, leadOrigins, getLeadStatusById, getLeadOriginById } = useSystemMetadata()
  const { data: users = [] } = useUsers()
  const isMobile = useIsMobile()
  
  // Filter panel state (only used for mobile Sheet)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  
  // Desktop sidebar visibility state (default: closed)
  const [isDesktopFiltersOpen, setIsDesktopFiltersOpen] = useState(false)

  // Toggle handler for "Filtros" button - works for both mobile and desktop
  const handleToggleFilters = useCallback(() => {
    if (isMobile) {
      setIsFilterPanelOpen(prev => !prev)
    } else {
      setIsDesktopFiltersOpen(prev => !prev)
    }
  }, [isMobile])

  // Computed filters open state - reflects current open state across mobile/desktop
  const isFiltersOpen = isMobile ? isFilterPanelOpen : isDesktopFiltersOpen

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

  // URL-first state management: viewMode is derived from URL params
  const currentView = useMemo((): InternalViewMode => {
    const viewParam = searchParams.get('view')
    const validViews = ['grid', 'kanban', 'sales', 'list'] as const
    if (viewParam && validViews.includes(viewParam as any)) {
      // Map 'list' to 'sales' for backward compatibility
      if (viewParam === 'list') return 'sales'
      return viewParam as InternalViewMode
    }
    
    const saved = savedPreferences?.viewMode
    // Force 'sales' if 'list' was saved previously
    if (saved === 'list') {
      // Check if Sales View has been failing persistently
      if (hasPersistentFailures()) {
        const fallback = getPreferredFallback()
        console.log(`[SalesView] Persistent failures detected, falling back to: ${fallback}`)
        return fallback
      }
      return 'sales'
    }
    
    // If user explicitly chose sales view but it's failing persistently, use fallback
    if (saved === 'sales' && hasPersistentFailures()) {
      const fallback = getPreferredFallback()
      console.log(`[SalesView] Persistent failures detected, falling back to: ${fallback}`)
      return fallback
    }
    
    return (saved as InternalViewMode) || 'sales'
  }, [searchParams, savedPreferences])

  // Handler to update view in URL
  const handleViewChange = useCallback((view: InternalViewMode) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      newParams.set('view', view)
      return newParams
    }, { replace: true })
  }, [setSearchParams])

  // URL-first state management: search is derived from URL params
  const searchTerm = searchParams.get('q') || ''

  // Handler to update search in URL
  const handleSearchChange = useCallback((value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (value) {
        newParams.set('q', value)
      } else {
        newParams.delete('q')
      }
      return newParams
    }, { replace: true })
  }, [setSearchParams])
  
  const normalizeSalesOrderBy = useCallback(
    (value: string | null): LeadOrderBy => {
      if (value === 'last_interaction' || value === 'created_at' || 
          value === 'status' || value === 'next_action' || value === 'owner') return value
      return 'priority'
    },
    []
  )

  // URL-first filter management for Sales view
  // This hook parses filters from URL and provides actions to update them
  const { appliedFilters, actions: filterActions, activeFiltersCount, hasActiveFilters } = useLeadsFiltersSearchParams()

  // Grid/Kanban view filters (kept as useState for backward compatibility)
  const [statusFilter, setStatusFilter] = useState<string>(() => savedPreferences?.statusFilter || 'all')
  const [originFilter, setOriginFilter] = useState<string>(() => savedPreferences?.originFilter || 'all')
  const [tagFilter, setTagFilter] = useState<string[]>(() => savedPreferences?.tagFilter || [])

  // Pagination and UI state
  const [itemsPerPage, setItemsPerPage] = useState(() => savedPreferences?.itemsPerPage || 10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hasSalesShownErrorToast, setHasSalesShownErrorToast] = useState(false)
  const [hasSalesRecordedSuccess, setHasSalesRecordedSuccess] = useState(false)
  const [hasAppliedPersistentFallback, setHasAppliedPersistentFallback] = useState(false)
  const salesErrorGuardRef = useRef<{ key: string | null; count: number }>({ key: null, count: 0 })

  // Grid/Kanban pagination state (not URL-based)
  const [gridCurrentPage, setGridCurrentPage] = useState(1)

  const { data: tags = [] } = useTags('lead')
  const { data: settings } = useSettings()

  const activeStatusIds = useMemo(
    () => leadStatuses.filter(status => status.isActive).map(status => status.id),
    [leadStatuses]
  )

  const activeOriginIds = useMemo(
    () => leadOrigins.filter(origin => origin.isActive).map(origin => origin.id),
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

  const normalizedStatusFilter = statusFilter !== 'all' && activeStatusIds.includes(statusFilter) ? statusFilter : 'all'
  const normalizedOriginFilter = originFilter !== 'all' && activeOriginIds.includes(originFilter) ? originFilter : 'all'
  const normalizedTagFilter = useMemo(
    () => tagFilter.filter(tagId => activeTagIds.includes(tagId)),
    [activeTagIds, tagFilter]
  )

  // Validate grid/kanban filters against metadata only when metadata loads or changes
  useEffect(() => {
    if (leadStatuses.length === 0 && leadOrigins.length === 0) return

    // Standard view validation
    const validStatus = statusFilter !== 'all' && activeStatusIds.includes(statusFilter) ? statusFilter : 'all'
    const validOrigin = originFilter !== 'all' && activeOriginIds.includes(originFilter) ? originFilter : 'all'

    if (validStatus !== statusFilter) setStatusFilter(validStatus)
    if (validOrigin !== originFilter) setOriginFilter(validOrigin)
  }, [leadStatuses.length, leadOrigins.length, activeStatusIds, activeOriginIds])
  // Intentionally omitting 'statusFilter', 'originFilter' from dependency array to avoid cycles.

  const [hasCheckedEmptyInitial, setHasCheckedEmptyInitial] = useState(false)
  const [showPreferencesResetPrompt, setShowPreferencesResetPrompt] = useState(false)

  const filters = useMemo<LeadFilters>(() => ({
    search: searchTerm || undefined,
    status: normalizedStatusFilter !== 'all' ? [normalizedStatusFilter] : undefined,
    origin: normalizedOriginFilter !== 'all' ? [normalizedOriginFilter] : undefined,
    tags: normalizedTagFilter.length > 0 ? normalizedTagFilter : undefined
  }), [normalizedOriginFilter, normalizedStatusFilter, normalizedTagFilter, searchTerm])

  const { data: leads, isLoading } = useLeads(filters)
  
  // Sales view filters - derived directly from URL via hook (single source of truth)
  const salesFilters = useMemo(() => {
    return {
      owner: appliedFilters.ownerMode === 'me' ? 'me' : undefined,
      ownerIds: appliedFilters.ownerMode === 'custom' && appliedFilters.ownerIds.length > 0 ? appliedFilters.ownerIds : undefined,
      priority: appliedFilters.priority.length > 0 ? appliedFilters.priority : undefined,
      status: appliedFilters.status.length > 0 ? appliedFilters.status : undefined,
      origin: appliedFilters.origin.length > 0 ? appliedFilters.origin : undefined,
      daysWithoutInteraction: appliedFilters.daysWithoutInteraction ?? undefined,
      orderBy: appliedFilters.orderBy,
      search: appliedFilters.search || undefined,
      tags: appliedFilters.tags.length > 0 ? appliedFilters.tags : undefined,
      nextAction: appliedFilters.nextAction.length > 0 ? appliedFilters.nextAction : undefined
    }
  }, [appliedFilters])
  
  const salesViewQuery = useMemo(
    () => ({
      ...salesFilters,
      page: appliedFilters.page,
      pageSize: itemsPerPage
    }),
    [appliedFilters.page, itemsPerPage, salesFilters]
  )
  const { data: salesViewData, isLoading: isSalesLoading, isFetching: isSalesFetching, isError: isSalesError, error: salesError, refetch: refetchSalesView } = useLeadsSalesView(salesViewQuery, {
    enabled: currentView === 'sales'
  })

  // Wrapper to track preferred fallback when user switches views during Sales View errors
  const setViewMode = useCallback((mode: InternalViewMode) => {
    // If switching away from sales while it's in error, save this as preferred fallback
    if (currentView === 'sales' && isSalesError && (mode === 'grid' || mode === 'kanban')) {
      setPreferredFallback(mode)
      console.log(`[SalesView] User switched to ${mode} during error, saving as preferred fallback`)
    }
    handleViewChange(mode)
  }, [currentView, isSalesError, handleViewChange])
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

  // Ensure salesLeads is always an array, even on error
  const salesLeads = ensureArray<LeadSalesViewItem>(salesViewData?.data)
  const activeLeads = (currentView === 'sales' ? salesLeads : leads) || []
  const isActiveLoading = currentView === 'sales' ? isSalesLoading || isSalesFetching : isLoading

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds([])
  }, [currentView, appliedFilters])

  useEffect(() => {
    const payload = {
      viewMode: currentView,
      search: searchTerm,
      statusFilter: normalizedStatusFilter !== 'all' ? normalizedStatusFilter : 'all',
      originFilter: normalizedOriginFilter !== 'all' ? normalizedOriginFilter : 'all',
      tagFilter: normalizedTagFilter,
      itemsPerPage
    }
    localStorage.setItem('leads-list-preferences', JSON.stringify(payload))
  }, [itemsPerPage, normalizedOriginFilter, normalizedStatusFilter, normalizedTagFilter, searchTerm, currentView])

  useEffect(() => {
    if (currentView === 'sales') return
    if (isLoading || hasCheckedEmptyInitial) return

    setHasCheckedEmptyInitial(true)

    if ((leads?.length || 0) === 0 && (searchTerm || normalizedStatusFilter !== 'all' || normalizedOriginFilter !== 'all' || normalizedTagFilter.length > 0)) {
      if (savedPreferences) {
        setShowPreferencesResetPrompt(true)
      } else {
        clearFilters()
      }
    }
  }, [hasCheckedEmptyInitial, isLoading, leads?.length, normalizedOriginFilter, normalizedStatusFilter, normalizedTagFilter.length, savedPreferences, searchTerm, currentView])

  // Handle Sales View errors with logging and user feedback
  useEffect(() => {
    const currentErrorKey = isSalesError ? getSalesErrorKey(salesError) : null

    if (currentView !== 'sales') {
      salesErrorGuardRef.current = { key: null, count: 0 }
      // Reset flags when switching away from sales view
      if (hasSalesShownErrorToast) setHasSalesShownErrorToast(false)
      if (hasSalesRecordedSuccess) setHasSalesRecordedSuccess(false)
      return
    }
    if (!isSalesError) {
      salesErrorGuardRef.current = { key: null, count: 0 }
      // Reset the error flag when error is resolved
      if (hasSalesShownErrorToast) setHasSalesShownErrorToast(false)
      // Record success to reset failure counter (only once per successful load)
      if (!isSalesLoading && !isSalesFetching && !hasSalesRecordedSuccess) {
        recordSalesViewSuccess()
        setHasSalesRecordedSuccess(true)
      }
      return
    }

    if (currentErrorKey) {
      const nextCount = salesErrorGuardRef.current.key === currentErrorKey
        ? salesErrorGuardRef.current.count + 1
        : 1

      if (nextCount >= SALES_VIEW_ERROR_GUARD_LIMIT) {
        if (!import.meta.env.PROD) {
          console.warn(`${SALES_VIEW_MESSAGES.LOG_PREFIX} Error handler suppressed to prevent render loop`, {
            currentErrorKey,
            count: nextCount
          })
        }
        return
      }

      salesErrorGuardRef.current = { key: currentErrorKey, count: nextCount }
    }

    if (hasSalesShownErrorToast) return
    
    // Reset success flag when error occurs
    if (hasSalesRecordedSuccess) setHasSalesRecordedSuccess(false)
    
    // Record this failure for tracking persistent issues
    recordSalesViewFailure()
    if (!hasAppliedPersistentFallback && hasPersistentFailures()) {
      const fallback = getPreferredFallback()
      console.warn(`${SALES_VIEW_MESSAGES.LOG_PREFIX} Persistent failures detected, auto-switching to ${fallback}`)
      setHasAppliedPersistentFallback(true)
      setViewMode(fallback)
      // Avoid triggering downstream toast/error UI when we immediately move to a fallback view
      return
    }
    
    // Get error code from ApiError if available
    const errorCode = salesError instanceof ApiError ? salesError.code : undefined
    const errorDetails = salesError instanceof ApiError ? salesError.details : undefined
    
    console.error(`${SALES_VIEW_MESSAGES.LOG_PREFIX} Error state detected in LeadsListPage:`, {
      error: salesError,
      code: errorCode,
      details: errorDetails
    })
    
    // Log details to console for debugging (without exposing to user)
    if (errorDetails) {
      console.debug(`${SALES_VIEW_MESSAGES.LOG_PREFIX} Error details:`, errorDetails)
    }
    
    // Get appropriate error messages based on code
    const errorMessages = getSalesViewErrorMessages(errorCode)
    
    toast.error(
      errorMessages.toast,
      {
        duration: 5000,
        action: {
          label: SALES_VIEW_MESSAGES.BUTTON_RETRY,
          onClick: () => {
            console.log(`${SALES_VIEW_MESSAGES.LOG_PREFIX} User initiated retry from toast in LeadsListPage`)
            setHasSalesShownErrorToast(false)
            refetchSalesView()
          }
        }
      }
    )
    setHasSalesShownErrorToast(true)
  }, [hasAppliedPersistentFallback, hasSalesRecordedSuccess, hasSalesShownErrorToast, isSalesError, isSalesFetching, isSalesLoading, refetchSalesView, salesError, currentView])

  useEffect(() => {
    if (currentView !== 'sales' && hasAppliedPersistentFallback) {
      setHasAppliedPersistentFallback(false)
    }
  }, [hasAppliedPersistentFallback, currentView])

  const totalLeads = currentView === 'sales' ? salesViewData?.pagination?.total ?? 0 : activeLeads.length
  const currentPage = currentView === 'sales' ? appliedFilters.page : gridCurrentPage
  const totalPages = Math.max(
    1,
    Math.ceil(totalLeads / (currentView === 'sales' ? salesViewData?.pagination?.perPage || itemsPerPage : itemsPerPage))
  )
  const currentPageSize = currentView === 'sales' ? salesViewData?.pagination?.perPage || itemsPerPage : itemsPerPage

  const paginatedLeads = useMemo<Lead[] | LeadSalesViewItem[]>(() => {
    if (currentView === 'sales') return salesLeads
    if (!activeLeads) return []
    const start = (gridCurrentPage - 1) * itemsPerPage
    return activeLeads.slice(start, start + itemsPerPage)
  }, [activeLeads, gridCurrentPage, itemsPerPage, salesLeads, currentView])
  const currentLeads = paginatedLeads as Array<Lead | LeadSalesViewItem>

  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [leadToSchedule, setLeadToSchedule] = useState<Lead | null>(null)

  const getLeadId = (lead: Lead | LeadSalesViewItem) => {
    const raw = lead as any
    return raw.leadId ?? raw.lead_id ?? raw.id ?? raw.lead?.id
  }

  const handleScheduleClick = (lead: Lead) => {
    setLeadToSchedule(lead)
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

  const clearFilters = useCallback(() => {
    handleSearchChange('')
    setStatusFilter('all')
    setOriginFilter('all')
    setTagFilter([])
    setGridCurrentPage(1)
  }, [handleSearchChange])

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

  const hasFilters = normalizedStatusFilter !== 'all' || normalizedOriginFilter !== 'all' || searchTerm || normalizedTagFilter.length > 0 || hasActiveFilters

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
      <Button variant="secondary" onClick={() => { filterActions.clearAll(); clearFilters(); }}>
        Limpar filtros
      </Button>
    </div>
  ) : null

  const handlePageChange = useCallback((page: number) => {
    if (currentView === 'sales') {
      filterActions.setPage(page)
    }
  }, [currentView, filterActions])

  const handleItemsPerPageChange = useCallback((pageSize: number) => {
    setItemsPerPage(pageSize)
    if (currentView === 'sales') {
      filterActions.setPage(1)
    }
  }, [currentView, filterActions])

  const activeLeadStatuses = useMemo(() => leadStatuses.filter(s => s.isActive), [leadStatuses])
  const activeLeadOrigins = useMemo(() => leadOrigins.filter(o => o.isActive), [leadOrigins])

  // Compute error UI for Sales View
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
            onClick={() => setViewMode('grid')} 
            className="flex-1 text-base font-semibold"
          >
            <LayoutGrid className="mr-2 h-5 w-5" />
            {SALES_VIEW_MESSAGES.BUTTON_SWITCH_TO_GRID}
          </Button>
          <Button 
            variant="default" 
            size="lg"
            onClick={() => setViewMode('kanban')} 
            className="flex-1 text-base font-semibold"
          >
            <Columns3 className="mr-2 h-5 w-5" />
            {SALES_VIEW_MESSAGES.BUTTON_SWITCH_TO_KANBAN}
          </Button>
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => {
            console.log(`${SALES_VIEW_MESSAGES.LOG_PREFIX} User initiated retry from error UI in LeadsListPage`)
            refetchSalesView()
          }} 
          className="text-sm"
        >
          {SALES_VIEW_MESSAGES.BUTTON_RETRY}
        </Button>
      </div>
    )
  }, [currentView, isSalesError, salesError, setViewMode, refetchSalesView])

  const showPagination = currentView !== 'kanban' && totalLeads > 0

  // Calculate pagination range
  const safePageSize = currentPageSize || itemsPerPage
  const startItem = Math.min((currentPage - 1) * safePageSize + 1, totalLeads)
  const endItem = Math.min(currentPage * safePageSize, totalLeads)

  return (
    <div className="h-[calc(100vh-4rem)] min-h-0 overflow-hidden p-6 bg-background flex flex-col">
      {/* Main container with optional sidebar layout */}
      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden items-stretch">
        {/* Desktop Sidebar - controlled by toggle, only on non-mobile */}
        {!isMobile && (
          <LeadsFiltersSidebar
            appliedFilters={appliedFilters}
            actions={filterActions}
            users={users}
            leadStatuses={activeLeadStatuses}
            leadOrigins={activeLeadOrigins}
            availableTags={tags}
            showNextActionFilter={currentView === 'sales'}
            isOpen={isDesktopFiltersOpen}
          />
        )}

        {/* Main content area */}
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
          {/* Container Unificado (Card Principal) */}
          <div 
            className="flex-1 min-h-0 border rounded-xl bg-card shadow-sm overflow-hidden flex flex-col"
            data-testid="leads-list-panel"
          >
            
            {/* Top Controls (non-sticky) */}
            <LeadsListControls
              position="top"
              currentView={currentView}
              onViewChange={handleViewChange}
              activeFiltersCount={activeFiltersCount}
              onOpenFilterPanel={handleToggleFilters}
              isFiltersOpen={isFiltersOpen}
              selectedIds={selectedIds}
              onBulkDelete={() => setIsBulkDeleteOpen(true)}
              onCreateLead={() => setIsCreateOpen(true)}
              totalLeads={totalLeads}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              showPagination={showPagination}
              startItem={startItem}
              endItem={endItem}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

        {/* Conteúdo da Lista dentro do Card - área rolável */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"> 
          {isActiveLoading ? (
            <div className="p-6 space-y-4">
              <SharedListSkeleton columns={["", "Empresa", "Contato", "Operação", "Progresso", "Tags", "Origem", "Responsável", "Ações"]} />
            </div>
          ) : salesErrorUI ? (
            <div className="p-6">
              {salesErrorUI}
            </div>
          ) : filtersEmptyState ? (
            <div className="p-12">
              {filtersEmptyState}
            </div>
          ) : paginatedLeads.length === 0 ? (
            <div className="p-12">
              <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/10 p-8">
                Nenhum lead encontrado.
                {hasFilters && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
                    <Button variant="outline" size="sm" onClick={() => { filterActions.clearAll(); clearFilters(); }}>
                      Limpar filtros
                    </Button>
                    {currentView !== 'grid' && (
                      <Button variant="ghost" size="sm" onClick={() => setViewMode('grid')}>
                        Ir para grade
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              {currentView === 'sales' ? (
                <LeadsSalesList
                  leads={paginatedLeads as LeadSalesViewItem[]}
                  isLoading={isActiveLoading}
                  orderBy={appliedFilters.orderBy}
                  selectedIds={selectedIds}
                  onSelectAll={toggleSelectAll}
                  onSelectOne={toggleSelectOne}
                  onNavigate={(id) => navigate(`/leads/${id}`)}
                  onScheduleClick={handleScheduleClick}
                  getLeadActions={(lead): QuickAction[] => {
                    const id = lead.leadId ?? lead.lead_id ?? lead.id
                    if (!id) return []

                    return [
                      {
                        id: 'view',
                        label: 'Detalhes',
                        onClick: () => navigate(`/leads/${id}`)
                      }
                    ]
                  }}
                />
              ) : currentView === 'kanban' ? (
                <LeadsKanban leads={activeLeads as Lead[] || []} isLoading={isLoading} />
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedLeads.map(lead => {
                      const contact = getPrimaryContact(lead)
                      const owner = (lead as any).owner
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
                                <span className="font-semibold text-foreground">{LEAD_STATUS_PROGRESS[getLeadStatusById(lead.leadStatusId)?.code as any] || 0}%</span>
                              </div>
                              <Progress value={LEAD_STATUS_PROGRESS[getLeadStatusById(lead.leadStatusId)?.code as any] || 0} indicatorClassName={LEAD_STATUS_COLORS[getLeadStatusById(lead.leadStatusId)?.code as any] || 'bg-gray-500'} />
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
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Controls Bar - after content, same as top bar */}
        <LeadsListControls
          position="bottom"
          currentView={currentView}
          onViewChange={handleViewChange}
          activeFiltersCount={activeFiltersCount}
          onOpenFilterPanel={handleToggleFilters}
          isFiltersOpen={isFiltersOpen}
          selectedIds={selectedIds}
          onBulkDelete={() => setIsBulkDeleteOpen(true)}
          onCreateLead={() => setIsCreateOpen(true)}
          totalLeads={totalLeads}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          showPagination={showPagination}
          startItem={startItem}
          endItem={endItem}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
          </div>
        </div>
      </div>

      {/* Mobile Filter Panel (Sheet/Drawer) - only rendered on mobile */}
      {isMobile && (
        <LeadsFilterPanel
          isOpen={isFilterPanelOpen}
          onOpenChange={setIsFilterPanelOpen}
          appliedFilters={appliedFilters}
          actions={filterActions}
          users={users}
          leadStatuses={activeLeadStatuses}
          leadOrigins={activeLeadOrigins}
          availableTags={tags}
          showNextActionFilter={currentView === 'sales'}
        />
      )}

      {/* Dialogs - Outside the card container */}
      <CreateLeadModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

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

      {leadToSchedule && (
        <ScheduleMeetingDialog 
          open={true} 
          onOpenChange={(open) => !open && setLeadToSchedule(null)}
          lead={leadToSchedule}
        />
      )}
    </div>
  )
}
