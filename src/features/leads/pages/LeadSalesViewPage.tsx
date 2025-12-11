import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LeadSalesRow, LeadSalesRowSkeleton } from '../components/LeadSalesRow'
import { LeadSalesViewItem, useLeadsSalesView } from '@/services/leadsSalesViewService'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ensureArray } from '@/lib/utils'

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
  const { data, isLoading, isFetching, isError, error } = useLeadsSalesView({
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
    const priorityDescription = lead.priorityDescription ?? lead.priority_description
    const legalName = lead.legalName ?? lead.legal_name ?? 'Lead sem nome'
    const tradeName = lead.tradeName ?? lead.trade_name
    const primaryContact = lead.primaryContact ?? lead.primary_contact
    const lastInteractionAt = lead.lastInteractionAt ?? lead.last_interaction_at
    const lastInteractionType = lead.lastInteractionType ?? lead.last_interaction_type
    const nextAction = lead.nextAction ?? lead.next_action

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
      nextAction
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
    if (isError) {
      console.error('[SalesView] Error state detected in LeadSalesViewPage:', error)
      toast.error(
        'Não foi possível carregar a visão de vendas. Por favor, tente novamente.',
        {
          duration: 5000,
          action: {
            label: 'Tentar novamente',
            onClick: () => window.location.reload()
          }
        }
      )
    }
  }, [isError, error])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Sales View de Leads</h1>
        <p className="text-muted-foreground">
          Acompanhe os leads priorizados, próximas ações e responsáveis em uma visualização otimizada para vendas.
        </p>
      </div>

      <Card className="overflow-hidden border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  disabled={isLoading || leadIds.length === 0}
                />
              </TableHead>
              <TableHead className="w-[22%]">Empresa</TableHead>
              <TableHead className="w-[18%]">Contato principal</TableHead>
              <TableHead className="w-[18%]">Interações</TableHead>
              <TableHead className="w-[18%]">Próxima ação</TableHead>
              <TableHead className="w-[12%]">Tags</TableHead>
              <TableHead className="w-[10%]">Responsável</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <>
                {Array.from({ length: 5 }).map((_, index) => (
                  <LeadSalesRowSkeleton key={index} />
                ))}
              </>
            )}

            {!isLoading && isError && (
              <TableRow>
                <TableCell colSpan={8} className="py-12">
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                      <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="space-y-2 max-w-lg">
                      <h3 className="text-xl font-semibold text-foreground">Não foi possível carregar a visão de vendas</h3>
                      <p className="text-sm text-muted-foreground">
                        Ocorreu um erro ao buscar os dados da Sales View. Por favor, tente novamente ou retorne à lista principal de leads.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={() => navigate('/leads')} className="min-w-[180px]">
                        Voltar para a lista
                      </Button>
                      <Button onClick={() => window.location.reload()} className="min-w-[180px]">
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-foreground">Nenhum lead encontrado</p>
                      <p className="text-sm text-muted-foreground">
                        Ajuste os filtros ou retorne mais tarde para acompanhar novos leads.
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/leads')}>Ver todos os leads</Button>
                  </div>
                </TableCell>
              </TableRow>
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
                        label: 'Ver detalhes do lead',
                        onClick: () => navigate(`/leads/${leadId}`)
                      }
                    ]}
                  />
                )
              })}

            {isFetching && !isLoading && !isError && (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Skeleton className="h-4 w-4" /> Atualizando dados...
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
  )
}
