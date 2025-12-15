import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LeadSalesRow, LeadSalesRowSkeleton } from '../components/LeadSalesRow'
import { ResizableSalesTableHeader } from '../components/ResizableSalesTableHeader'
import { ColumnWidthsProvider } from '../hooks/useResizableColumns'
import { LeadSalesViewItem, useLeadsSalesView } from '@/services/leadsSalesViewService'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ensureArray, safeString, safeStringOptional } from '@/lib/utils'
import { SALES_VIEW_MESSAGES, getSalesViewErrorMessages } from '../constants/salesViewMessages'
import { SquaresFour, Kanban } from '@phosphor-icons/react'
import { ApiError } from '@/lib/errors'

const PAGE_SIZE = 10

export default function LeadSalesViewPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [ownerFilter, setOwnerFilter] = useState<'me' | 'all' | undefined>(() => {
    const owner = searchParams.get('owner')
    if (owner === 'me' || owner === 'all') return owner
    return undefined
  })
  const [priorityBuckets, setPriorityBuckets] = useState<Array<'hot' | 'warm' | 'cold'>>(() => {
    const buckets = searchParams.get('bucket')?.split(',').filter(Boolean) ?? []
    return buckets.filter((bucket): bucket is 'hot' | 'warm' | 'cold' => ['hot', 'warm', 'cold'].includes(bucket))
  })
  const [statusFilters, setStatusFilters] = useState<string[]>(() => {
    const status = searchParams.get('status')
    if (!status) return []
    return status.split(',').filter(Boolean)
  })
  const [originFilters, setOriginFilters] = useState<string[]>(() => {
    const origin = searchParams.get('origem')
    if (!origin) return []
    return origin.split(',').filter(Boolean)
  })
  const [daysWithoutInteraction, setDaysWithoutInteraction] = useState<number | undefined>(() => {
    const days = searchParams.get('days_without_interaction')
    if (!days) return undefined
    const parsed = Number(days)
    return Number.isFinite(parsed) ? parsed : undefined
  })
  const [orderBy, setOrderBy] = useState<'priority' | 'last_interaction' | 'created_at' | undefined>(() => {
    const order = searchParams.get('order_by')
    if (order === 'priority' || order === 'last_interaction' || order === 'created_at') return order
    return undefined
  })
  const [hasShownErrorToast, setHasShownErrorToast] = useState(false)
  const navigate = useNavigate()
  const filters = useMemo(
    () => ({
      owner: ownerFilter,
      priority: priorityBuckets.length ? priorityBuckets : undefined,
      status: statusFilters.length ? statusFilters : undefined,
      origin: originFilters.length ? originFilters : undefined,
      daysWithoutInteraction,
      orderBy
    }),
    [daysWithoutInteraction, originFilters, orderBy, ownerFilter, priorityBuckets, statusFilters]
  )
  const { data, isLoading, isFetching, isError, error, refetch } = useLeadsSalesView({
    page,
    pageSize: PAGE_SIZE,
    ...filters
  })

  const totalPages = useMemo(() => {
    if (!data || data.pagination?.total === undefined) return 1
    return Math.max(1, Math.ceil(data.pagination.total / data.pagination.perPage))
  }, [data])

  // Ensure leads is always an array, even on error
  const leads = ensureArray<LeadSalesViewItem>(data?.data)
  const leadIds = useMemo(
    () => leads.map((lead) => lead.leadId ?? lead.lead_id ?? lead.id).filter(Boolean) as string[],
    [leads]
  )
  const allSelected = useMemo(
    () => leadIds.length > 0 && leadIds.every((id) => selectedIds.includes(id)),
    [leadIds, selectedIds]
  )

  const mapLeadToRow = (lead: LeadSalesViewItem) => {
    const priorityBucket = lead.priorityBucket ?? lead.priority_bucket ?? 'warm'
    const priorityScore = lead.priorityScore ?? lead.priority_score
    const priorityDescription = safeStringOptional(lead.priorityDescription ?? lead.priority_description)
    const legalName = safeString(lead.legalName ?? lead.legal_name, 'Lead sem nome')
    const tradeName = safeStringOptional(lead.tradeName ?? lead.trade_name)
    const primaryContactSource = lead.primaryContact ?? lead.primary_contact
    const primaryContact =
      primaryContactSource && typeof primaryContactSource === 'object'
        ? {
            ...primaryContactSource,
            name: safeString((primaryContactSource as any).name, 'Contato não informado'),
            role: safeStringOptional((primaryContactSource as any).role),
            avatar: safeStringOptional((primaryContactSource as any).avatar)
          }
        : undefined
    const lastInteractionAt = lead.lastInteractionAt ?? lead.last_interaction_at
    const lastInteractionType = lead.lastInteractionType ?? lead.last_interaction_type
    const nextActionRaw = lead.nextAction ?? lead.next_action
    const nextAction = (() => {
      if (!nextActionRaw || typeof nextActionRaw !== 'object') return undefined

      const safeLabel = safeStringOptional((nextActionRaw as any).label, '—') ?? '—'
      const safeReason = safeStringOptional((nextActionRaw as any).reason)

      return {
        ...(nextActionRaw as any),
        label: safeLabel,
        reason: safeReason
      }
    })()

    return {
      ...lead,
      priorityBucket,
      priorityScore,
      priorityDescription,
      legalName,
      tradeName,
      primaryContact,
      lastInteractionAt,
      lastInteractionType,
      nextAction,
      status: (lead as any).leadStatusId ?? (lead as any).lead_status_id ?? lead.status ?? lead.lead?.status ?? null
    }
  }

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : leadIds)
  }

  const toggleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      if (selected) {
        return [...new Set([...prev, id])]
      }
      return prev.filter((item) => item !== id)
    })
  }

  const goToPage = (nextPage: number) => {
    setPage(Math.max(1, Math.min(nextPage, totalPages)))
    setSelectedIds([])
  }

  const arraysEqual = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index])

  useEffect(() => {
    const owner = searchParams.get('owner')
    setOwnerFilter(owner === 'me' || owner === 'all' ? owner : undefined)

    const buckets = searchParams.get('bucket')?.split(',').filter(Boolean) ?? []
    const parsedBuckets = buckets.filter((bucket): bucket is 'hot' | 'warm' | 'cold' => ['hot', 'warm', 'cold'].includes(bucket))
    if (!arraysEqual(parsedBuckets, priorityBuckets)) setPriorityBuckets(parsedBuckets)

    const status = searchParams.get('status')?.split(',').filter(Boolean) ?? []
    if (!arraysEqual(status, statusFilters)) setStatusFilters(status)

    const origin = searchParams.get('origem')?.split(',').filter(Boolean) ?? []
    if (!arraysEqual(origin, originFilters)) setOriginFilters(origin)

    const days = searchParams.get('days_without_interaction')
    const parsedDays = days ? Number(days) : undefined
    const validDays = Number.isFinite(parsedDays ?? NaN) ? parsedDays : undefined
    if (validDays !== daysWithoutInteraction) setDaysWithoutInteraction(validDays)

    const order = searchParams.get('order_by')
    const validOrder = order === 'priority' || order === 'last_interaction' || order === 'created_at' ? order : undefined
    if (validOrder !== orderBy) setOrderBy(validOrder)
  }, [daysWithoutInteraction, orderBy, originFilters, priorityBuckets, searchParams, statusFilters])

  useEffect(() => {
    const params = new URLSearchParams()

    if (ownerFilter) params.set('owner', ownerFilter)
    if (priorityBuckets.length) params.set('bucket', priorityBuckets.join(','))
    if (statusFilters.length) params.set('status', statusFilters.join(','))
    if (originFilters.length) params.set('origem', originFilters.join(','))
    if (typeof daysWithoutInteraction === 'number') params.set('days_without_interaction', String(daysWithoutInteraction))
    if (orderBy) params.set('order_by', orderBy)

    const nextSearch = params.toString()
    if (nextSearch !== searchParams.toString()) {
      setSearchParams(params, { replace: true })
    }
  }, [daysWithoutInteraction, orderBy, originFilters, ownerFilter, priorityBuckets, searchParams, setSearchParams, statusFilters])

  useEffect(() => {
    setPage(1)
  }, [daysWithoutInteraction, orderBy, originFilters, ownerFilter, priorityBuckets, statusFilters])

  useEffect(() => {
    if (isError && !hasShownErrorToast) {
      // Get error code from ApiError if available
      const errorCode = error instanceof ApiError ? error.code : undefined
      const errorDetails = error instanceof ApiError ? error.details : undefined
      
      console.error(`${SALES_VIEW_MESSAGES.LOG_PREFIX} Error state detected in LeadSalesViewPage:`, {
        error,
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
              console.log(`${SALES_VIEW_MESSAGES.LOG_PREFIX} User initiated retry from toast`)
              setHasShownErrorToast(false)
              refetch()
            }
          }
        }
      )
      setHasShownErrorToast(true)
    } else if (!isError && hasShownErrorToast) {
      // Reset the flag when error is resolved
      setHasShownErrorToast(false)
    }
  }, [isError, error, refetch, hasShownErrorToast])

  // Compute error UI
  const errorUI = useMemo(() => {
    if (!isError || isLoading) return null
    
    const errorCode = error instanceof ApiError ? error.code : undefined
    const errorMessages = getSalesViewErrorMessages(errorCode)
    
    return (
      <tr className="border-b">
        <td colSpan={9} className="py-12">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
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
                onClick={() => navigate('/leads?view=grid')} 
                className="flex-1 text-base font-semibold"
              >
                <SquaresFour className="mr-2 h-5 w-5" />
                {SALES_VIEW_MESSAGES.BUTTON_SWITCH_TO_GRID}
              </Button>
              <Button 
                variant="default" 
                size="lg"
                onClick={() => navigate('/leads?view=kanban')} 
                className="flex-1 text-base font-semibold"
              >
                <Kanban className="mr-2 h-5 w-5" />
                {SALES_VIEW_MESSAGES.BUTTON_SWITCH_TO_KANBAN}
              </Button>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                console.log(`${SALES_VIEW_MESSAGES.LOG_PREFIX} User initiated retry from error UI`)
                refetch()
              }} 
              className="text-sm"
            >
              {SALES_VIEW_MESSAGES.BUTTON_RETRY}
            </Button>
          </div>
        </td>
      </tr>
    )
  }, [isError, isLoading, error, navigate, refetch])

  return (
    <ColumnWidthsProvider>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Sales View de Leads</h1>
          <p className="text-muted-foreground">
            Acompanhe os leads priorizados, próximas ações e responsáveis em uma visualização otimizada para vendas.
          </p>
        </div>

        <Card className="overflow-hidden border bg-card">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <ResizableSalesTableHeader
                allSelected={allSelected}
                toggleSelectAll={toggleSelectAll}
                isLoading={isLoading}
                leadIdsLength={leadIds.length}
              />

              <tbody data-slot="table-body" className="[&_tr:last-child]:border-0">
                {isLoading && (
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <LeadSalesRowSkeleton key={index} />
                    ))}
                  </>
                )}

                {errorUI}

                {!isLoading && !isError && leads.length === 0 && (
                  <tr className="border-b">
                    <td colSpan={9} className="py-12">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                          <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-semibold text-foreground">{SALES_VIEW_MESSAGES.NO_LEADS_FOUND}</p>
                          <p className="text-sm text-muted-foreground">
                            {SALES_VIEW_MESSAGES.NO_LEADS_DESCRIPTION}
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => navigate('/leads')}>Ver todos os leads</Button>
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && !isError &&
                  leads.map((lead) => {
                    const leadId = lead.leadId ?? lead.lead_id ?? lead.id
                    if (!leadId) return null
                    const rowData = mapLeadToRow(lead)
                    return (
                      <LeadSalesRow
                        key={leadId}
                        {...rowData}
                        selected={selectedIds.includes(leadId)}
                        onSelectChange={(checked) => toggleSelect(leadId, checked)}
                        onClick={() => navigate(`/leads/${leadId}`)}
                        onMenuClick={() => navigate(`/leads/${leadId}`)}
                        actions={[
                          {
                            id: 'view',
                            label: 'Detalhes',
                            onClick: () => navigate(`/leads/${leadId}`)
                          }
                        ]}
                      />
                    )
                  })}

                {isFetching && !isLoading && !isError && (
                  <tr className="border-b">
                    <td colSpan={9}>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                        <Skeleton className="h-4 w-4" /> Atualizando dados...
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                goToPage(page - 1)
              }}
              aria-disabled={page === 1}
              className={page === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1
            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={pageNumber === page}
                  onClick={(e) => {
                    e.preventDefault()
                    goToPage(pageNumber)
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            )
          })}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                goToPage(page + 1)
              }}
              aria-disabled={page === totalPages}
              className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      </div>
    </ColumnWidthsProvider>
  )
}
