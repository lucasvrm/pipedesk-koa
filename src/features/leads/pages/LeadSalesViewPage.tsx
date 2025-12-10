import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LeadSalesRow, LeadSalesRowSkeleton } from '../components/LeadSalesRow'
import { LeadSalesViewItem, useLeadsSalesView } from '@/services/leadsSalesViewService'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const PAGE_SIZE = 10

export default function LeadSalesViewPage() {
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const navigate = useNavigate()
  const { data, isLoading, isFetching, isError } = useLeadsSalesView({ page, pageSize: PAGE_SIZE })

  const totalPages = useMemo(() => {
    if (!data || !data.pagination.total) return 1
    return Math.max(1, Math.ceil(data.pagination.total / data.pagination.perPage))
  }, [data])

  const leads = data?.data || []
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

  useEffect(() => {
    if (isError) {
      toast.error(
        'Erro ao carregar leads. Não foi possível carregar a Sales View. Tente novamente em instantes.'
      )
    }
  }, [isError])

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

            {!isLoading && leads.length === 0 && (
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

            {!isLoading &&
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
                  />
                )
              })}

            {isFetching && !isLoading && (
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
