import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LeadSalesRow, LeadSalesRowSkeleton } from './LeadSalesRow'
import { LeadSalesViewItem, LeadPriorityBucket } from '@/services/leadsSalesViewService'
import { QuickAction } from '@/components/QuickActionsMenu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowDownUp, RotateCcw } from 'lucide-react'
import { safeStringOptional, ensureArray } from '@/lib/utils'
import { Lead } from '@/lib/types'
import { useResizableColumns, ColumnDef } from '@/hooks/useResizableColumns'
import { ResizableTableHead } from './ResizableTableHead'
import { Button } from '@/components/ui/button'

const LEADS_TABLE_COLUMNS: ColumnDef[] = [
  { id: 'checkbox', label: '', width: 40, minWidth: 40, maxWidth: 40 },
  { id: 'empresa', label: 'Empresa', width: 200, minWidth: 120, maxWidth: 800 },
  { id: 'contato', label: 'Contato principal', width: 190, minWidth: 120, maxWidth: 600 },
  { id: 'status', label: 'Status', width: 130, minWidth: 80, maxWidth: 400 },
  { id: 'interacoes', label: 'Interações', width: 140, minWidth: 100, maxWidth: 400 },
  { id: 'proxima_acao', label: 'Próxima ação', width: 180, minWidth: 120, maxWidth: 600 },
  { id: 'tags', label: 'Tags', width: 220, minWidth: 100, maxWidth: 800 },
  { id: 'responsavel', label: 'Responsável', width: 160, minWidth: 100, maxWidth: 500 },
  { id: 'acoes', label: 'Ações', width: 60, minWidth: 60, maxWidth: 60 }
]

interface LeadsSalesListProps {
  leads: LeadSalesViewItem[]
  isLoading: boolean
  orderBy?: 'priority' | 'last_interaction' | 'created_at' | 'status' | 'next_action' | 'owner'
  selectedIds: string[]
  onSelectAll: () => void
  onSelectOne: (id: string, selected: boolean) => void
  onNavigate: (leadId: string) => void
  onScheduleClick?: (lead: Lead) => void
  getLeadActions?: (lead: LeadSalesViewItem) => QuickAction[] | undefined
}

export function LeadsSalesList({
  leads,
  isLoading,
  orderBy = 'priority',
  selectedIds,
  onSelectAll,
  onSelectOne,
  onNavigate,
  onScheduleClick,
  getLeadActions
}: LeadsSalesListProps) {
  // Ensure leads is always an array to prevent React Error #185
  const safeLeads = ensureArray<LeadSalesViewItem>(leads)

  // Add resizable columns hook
  const {
    columns,
    isResizing,
    activeColumnId,
    getColumnWidth,
    handleResizeStart,
    resetToDefaults
  } = useResizableColumns({
    storageKey: 'leads-table-columns',
    defaultColumns: LEADS_TABLE_COLUMNS
  })
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const mirrorScrollRef = useRef<HTMLDivElement | null>(null)
  const mirrorContentRef = useRef<HTMLDivElement | null>(null)
  const [showMirrorScrollbar, setShowMirrorScrollbar] = useState(false)

  const syncMirrorWidth = useCallback(() => {
    const container = scrollContainerRef.current

    if (!container) {
      setShowMirrorScrollbar(false)
      return
    }

    const needsMirror = container.scrollWidth > container.clientWidth + 1
    setShowMirrorScrollbar(needsMirror)

    if (mirrorContentRef.current) {
      mirrorContentRef.current.style.width = `${container.scrollWidth}px`
    }
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    const mirror = mirrorScrollRef.current

    syncMirrorWidth()

    if (!container || !mirror) {
      return
    }

    const handleContainerScroll = () => {
      if (mirror.scrollLeft !== container.scrollLeft) {
        mirror.scrollLeft = container.scrollLeft
      }
    }

    const handleMirrorScroll = () => {
      if (container.scrollLeft !== mirror.scrollLeft) {
        container.scrollLeft = mirror.scrollLeft
      }
    }

    handleContainerScroll()

    container.addEventListener('scroll', handleContainerScroll)
    mirror.addEventListener('scroll', handleMirrorScroll)
    window.addEventListener('resize', syncMirrorWidth)

    return () => {
      container.removeEventListener('scroll', handleContainerScroll)
      mirror.removeEventListener('scroll', handleMirrorScroll)
      window.removeEventListener('resize', syncMirrorWidth)
    }
  }, [columns, syncMirrorWidth])

  useEffect(() => {
    syncMirrorWidth()
  }, [columns, safeLeads.length, syncMirrorWidth])

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const container = scrollContainerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => syncMirrorWidth())
    observer.observe(container)

    return () => observer.disconnect()
  }, [syncMirrorWidth])

  // Helper to get column width by id
  const colWidth = (id: string) => getColumnWidth(id)

  // Calculate total table width
  const totalTableWidth = useMemo(
    () => columns.reduce((sum, col) => sum + col.width, 0),
    [columns]
  )

  const { validLeads, invalidLeadCount } = useMemo(() => {
    const valid = [] as LeadSalesViewItem[]
    const invalid = [] as LeadSalesViewItem[]

    safeLeads.forEach((lead) => {
      const id = lead.leadId ?? lead.lead_id ?? lead.id ?? lead.lead?.id
      if (id) {
        valid.push(lead)
      } else {
        invalid.push(lead)
      }
    })

    if (invalid.length > 0) {
      console.warn('[SalesView] LeadsSalesList: ignorando leads sem identificador', invalid)
    }

    return { validLeads: valid, invalidLeadCount: invalid.length }
  }, [safeLeads])

  const selectableLeadIds = useMemo(
    () => validLeads.map((lead) => lead.leadId ?? lead.lead_id ?? lead.id ?? lead.lead?.id).filter(Boolean) as string[],
    [validLeads]
  )

  const allSelected = useMemo(
    () => selectableLeadIds.length > 0 && selectableLeadIds.every((id) => selectedIds.includes(id)),
    [selectableLeadIds, selectedIds]
  )

  const toRowData = (lead: LeadSalesViewItem) => {
    // Extract raw values without normalization - let calculateLeadPriority handle consistency
    const priorityBucketRaw = lead.priorityBucket ?? lead.priority_bucket
    const priorityScoreRaw = lead.priorityScore ?? lead.priority_score
    const priorityScore = typeof priorityScoreRaw === 'number' && Number.isFinite(priorityScoreRaw) ? priorityScoreRaw : null
    const priorityDescription = safeStringOptional(lead.priorityDescription ?? lead.priority_description)
    const legalName =
      safeStringOptional(lead.legalName ?? lead.legal_name ?? lead.lead?.legal_name, 'Lead sem nome') ?? 'Lead sem nome'
    const tradeName = safeStringOptional(lead.tradeName ?? lead.trade_name ?? lead.lead?.trade_name)
    const primaryContactSource = lead.primaryContact ?? lead.primary_contact
    const primaryContact =
      primaryContactSource && typeof primaryContactSource === 'object'
        ? {
            ...primaryContactSource,
            name: safeStringOptional((primaryContactSource as any).name, 'Contato não informado') ?? 'Contato não informado',
            role: safeStringOptional((primaryContactSource as any).role),
            avatar: safeStringOptional((primaryContactSource as any).avatar),
            email: safeStringOptional((primaryContactSource as any).email),
            phone: safeStringOptional((primaryContactSource as any).phone)
          }
        : undefined
    // Mapped to use new metadata IDs
    const status = (lead as any).leadStatusId ?? (lead as any).lead_status_id ?? lead.status ?? lead.lead?.status ?? null
    const origin = (lead as any).leadOriginId ?? (lead as any).lead_origin_id ?? lead.origin ?? lead.lead?.origin ?? null
    const createdAt = lead.createdAt ?? lead.created_at ?? lead.lead?.created_at ?? null
    const lastInteractionAt = lead.lastInteractionAt ?? lead.last_interaction_at
    const lastInteractionTypeRaw = lead.lastInteractionType ?? lead.last_interaction_type
    const lastInteractionType = lastInteractionTypeRaw === 'email' || lastInteractionTypeRaw === 'event'
      ? lastInteractionTypeRaw
      : null
    const nextActionRaw = lead.nextAction ?? lead.next_action
    const normalizedNextAction = (() => {
      if (!nextActionRaw || typeof nextActionRaw !== 'object') return undefined

      const safeLabel = safeStringOptional((nextActionRaw as any).label, '—') ?? '—'
      const safeReason = safeStringOptional((nextActionRaw as any).reason)

      return {
        ...(nextActionRaw as any),
        label: safeLabel,
        reason: safeReason
      }
    })()

    const ownerData = lead.owner ??
      (lead.lead?.owner
        ? {
            name: lead.lead.owner.name,
            avatar: lead.lead.owner.avatar_url ?? undefined
          }
        : undefined)
    const owner = ownerData && typeof ownerData === 'object'
      ? {
          ...ownerData,
          name: safeStringOptional((ownerData as any).name, 'Responsável não informado') ?? 'Responsável não informado',
          avatar: safeStringOptional((ownerData as any).avatar)
        }
      : undefined
    const tags = Array.isArray(lead.tags)
      ? lead.tags
          .filter((tag): tag is NonNullable<LeadSalesViewItem['tags']>[number] => !!tag && typeof tag === 'object')
          .map((tag) => {
            const name = safeStringOptional(tag.name, 'Tag') ?? 'Tag'
            const color = safeStringOptional(tag.color)
            const id = typeof tag.id === 'string' ? tag.id : undefined

            return { id, name, color }
          })
      : []

    return {
      ...lead,
      priorityBucket: priorityBucketRaw,
      priorityScore,
      priorityDescription,
      legalName,
      tradeName,
      status,
      origin,
      createdAt,
      primaryContact,
      lastInteractionAt,
      lastInteractionType,
      nextAction: normalizedNextAction,
      owner,
      tags
    }
  }

  const handleSelectChange = (lead: LeadSalesViewItem, selected: boolean) => {
    const id = lead.leadId ?? lead.lead_id ?? lead.id
    if (!id) return
    onSelectOne(id, selected)
  }

  const orderLabel = useMemo(() => {
    switch (orderBy) {
      case 'last_interaction':
        return 'Última interação'
      case 'created_at':
        return 'Data de criação'
      case 'status':
        return 'Status'
      case 'next_action':
        return 'Próxima ação'
      case 'owner':
        return 'Responsável'
      case 'priority':
      default:
        return 'Prioridade'
    }
  }, [orderBy])

  const renderLeadRowSafely = (lead: LeadSalesViewItem) => {
    const id = lead.leadId ?? lead.lead_id ?? lead.id ?? lead.lead?.id
    if (!id) return null

    try {
      const rowData = toRowData(lead)
      const actions = getLeadActions?.(lead)

      // Create object of column widths to pass to Row
      const columnWidths = {
        checkbox: colWidth('checkbox'),
        empresa: colWidth('empresa'),
        contato: colWidth('contato'),
        status: colWidth('status'),
        interacoes: colWidth('interacoes'),
        proxima_acao: colWidth('proxima_acao'),
        tags: colWidth('tags'),
        responsavel: colWidth('responsavel'),
        acoes: colWidth('acoes')
      }

      return (
        <LeadSalesRow
          key={id}
          {...rowData}
          columnWidths={columnWidths}
          selected={selectedIds.includes(id)}
          onSelectChange={(checked) => handleSelectChange(lead, checked)}
          onClick={() => onNavigate(id)}
          onMenuClick={() => onNavigate(id)}
          onScheduleClick={onScheduleClick}
          actions={actions}
        />
      )
    } catch (error) {
      if (shouldLogRenderError) {
        console.error('[SalesView] LeadSalesRow render failed', id, lead, error)
      }

      throw error
    }
  }

  const shouldLogRenderError = !import.meta.env.PROD || import.meta.env.VITE_VERCEL_ENV === 'preview'

  // Create column widths object for skeleton
  const skeletonColumnWidths = {
    checkbox: colWidth('checkbox'),
    empresa: colWidth('empresa'),
    contato: colWidth('contato'),
    status: colWidth('status'),
    interacoes: colWidth('interacoes'),
    proxima_acao: colWidth('proxima_acao'),
    tags: colWidth('tags'),
    responsavel: colWidth('responsavel'),
    acoes: colWidth('acoes')
  }

  return (
    <div className="relative rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          <ArrowDownUp className="h-4 w-4" />
          <span className="text-muted-foreground">Ordenado por</span>
          <span className="text-foreground font-semibold">{orderLabel}</span>
        </div>
        
        {/* Reset columns button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={resetToDefaults}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Resetar colunas
        </Button>
      </div>

      {/* Mirror scrollbar - positioned at TOP for immediate visibility */}
      {showMirrorScrollbar && (
        <div
          className="sticky top-0 left-0 right-0 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 z-10"
          data-testid="leads-sales-scrollbar-mirror"
        >
          <div ref={mirrorScrollRef} className="overflow-x-auto">
            <div ref={mirrorContentRef} className="h-3" />
          </div>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="overflow-x-auto pb-3"
        data-testid="leads-sales-scroll"
      >
        <Table style={{ tableLayout: 'fixed', minWidth: totalTableWidth, width: '100%' }}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* Checkbox - fixed width, no resize */}
              <TableHead className="shrink-0" style={{ width: colWidth('checkbox') }}>
                <Checkbox 
                  checked={allSelected} 
                  onCheckedChange={() => onSelectAll()} 
                  disabled={isLoading || safeLeads.length === 0} 
                />
              </TableHead>
              
              {/* Resizable columns */}
              <ResizableTableHead
                columnId="empresa"
                width={colWidth('empresa')}
                isResizing={isResizing}
                isActive={activeColumnId === 'empresa'}
                onResizeStart={handleResizeStart}
              >
                Empresa
              </ResizableTableHead>
              
              <ResizableTableHead
                columnId="contato"
                width={colWidth('contato')}
                isResizing={isResizing}
                isActive={activeColumnId === 'contato'}
                onResizeStart={handleResizeStart}
              >
                Contato principal
              </ResizableTableHead>
              
              <ResizableTableHead
                columnId="status"
                width={colWidth('status')}
                isResizing={isResizing}
                isActive={activeColumnId === 'status'}
                onResizeStart={handleResizeStart}
              >
                Status
              </ResizableTableHead>
              
              <ResizableTableHead
                columnId="interacoes"
                width={colWidth('interacoes')}
                isResizing={isResizing}
                isActive={activeColumnId === 'interacoes'}
                onResizeStart={handleResizeStart}
              >
                Interações
              </ResizableTableHead>
              
              <ResizableTableHead
                columnId="proxima_acao"
                width={colWidth('proxima_acao')}
                isResizing={isResizing}
                isActive={activeColumnId === 'proxima_acao'}
                onResizeStart={handleResizeStart}
              >
                Próxima ação
              </ResizableTableHead>
              
              <ResizableTableHead
                columnId="tags"
                width={colWidth('tags')}
                isResizing={isResizing}
                isActive={activeColumnId === 'tags'}
                onResizeStart={handleResizeStart}
              >
                Tags
              </ResizableTableHead>
              
              <ResizableTableHead
                columnId="responsavel"
                width={colWidth('responsavel')}
                isResizing={isResizing}
                isActive={activeColumnId === 'responsavel'}
                onResizeStart={handleResizeStart}
              >
                Responsável
              </ResizableTableHead>
              
              {/* Actions - fixed width, no resize */}
              <TableHead className="shrink-0 whitespace-nowrap" style={{ width: colWidth('acoes') }}>
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <>
                {Array.from({ length: 5 }).map((_, index) => (
                  <LeadSalesRowSkeleton key={index} columnWidths={skeletonColumnWidths} />
                ))}
              </>
            )}

            {!isLoading && safeLeads.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                      <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-foreground">Nenhum lead encontrado</p>
                      <p className="text-sm text-muted-foreground">Ajuste os filtros ou retorne mais tarde.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && safeLeads.length > 0 && validLeads.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-foreground">Não foi possível exibir os leads</p>
                      <p className="text-sm text-muted-foreground">
                        Os dados retornados estão incompletos. Tente novamente mais tarde ou contate o suporte.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              validLeads.map((lead) => {
                try {
                  return renderLeadRowSafely(lead)
                } catch (error) {
                  const id = lead.leadId ?? lead.lead_id ?? lead.id

                  if (shouldLogRenderError) {
                    console.error('[SalesView] LeadSalesRow render failed', id, lead, error)
                  }

                  return null
                }
              })}

            {!isLoading && invalidLeadCount > 0 && validLeads.length > 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-4 text-xs text-muted-foreground">
                  Alguns registros retornados pelo servidor foram ignorados por estarem sem identificador.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
