import { useMemo } from 'react'
import { LeadSalesRow, LeadSalesRowSkeleton } from './LeadSalesRow'
import { LeadSalesViewItem } from '@/services/leadsSalesViewService'
import { QuickAction } from '@/components/QuickActionsMenu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowsDownUp } from '@phosphor-icons/react'
import { safeStringOptional, ensureArray } from '@/lib/utils'

interface LeadsSalesListProps {
  leads: LeadSalesViewItem[]
  isLoading: boolean
  orderBy?: 'priority' | 'last_interaction' | 'created_at'
  selectedIds: string[]
  onSelectAll: () => void
  onSelectOne: (id: string, selected: boolean) => void
  onNavigate: (leadId: string) => void
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
  getLeadActions
}: LeadsSalesListProps) {
  // Ensure leads is always an array to prevent React Error #185
  const safeLeads = ensureArray<LeadSalesViewItem>(leads)

  const { validLeads, invalidLeadCount } = useMemo(() => {
    const valid = [] as LeadSalesViewItem[]
    const invalid = [] as LeadSalesViewItem[]

    safeLeads.forEach((lead) => {
      const id = lead.leadId ?? lead.lead_id ?? lead.id
      if (id) {
        valid.push(lead)
      } else {
        invalid.push(lead)
      }
    })

    if (invalid.length > 0) {
      console.warn('LeadsSalesList: ignorando leads sem identificador', invalid)
    }

    return { validLeads: valid, invalidLeadCount: invalid.length }
  }, [safeLeads])

  const selectableLeadIds = useMemo(
    () => validLeads.map((lead) => lead.leadId ?? lead.lead_id ?? lead.id).filter(Boolean) as string[],
    [validLeads]
  )

  const allSelected = useMemo(
    () => selectableLeadIds.length > 0 && selectableLeadIds.every((id) => selectedIds.includes(id)),
    [selectableLeadIds, selectedIds]
  )

  const toRowData = (lead: LeadSalesViewItem) => {
    const priorityBucketRaw = lead.priorityBucket ?? lead.priority_bucket
    const priorityBucket = priorityBucketRaw === 'hot' || priorityBucketRaw === 'cold' ? priorityBucketRaw : 'warm'
    const priorityScore = lead.priorityScore ?? lead.priority_score
    const priorityDescription = lead.priorityDescription ?? lead.priority_description
    const legalName = safeStringOptional(lead.legalName ?? lead.legal_name, 'Lead sem nome') ?? 'Lead sem nome'
    const tradeName = safeStringOptional(lead.tradeName ?? lead.trade_name)
    const primaryContactData = lead.primaryContact ?? lead.primary_contact
    const primaryContact = primaryContactData
      ? { ...primaryContactData, name: safeStringOptional(primaryContactData.name, 'Contato não informado') ?? 'Contato não informado' }
      : undefined
    const lastInteractionAt = lead.lastInteractionAt ?? lead.last_interaction_at
    const lastInteractionTypeRaw = lead.lastInteractionType ?? lead.last_interaction_type
    const lastInteractionType = lastInteractionTypeRaw === 'email' || lastInteractionTypeRaw === 'event'
      ? lastInteractionTypeRaw
      : null
    const nextActionRaw = lead.nextAction ?? lead.next_action
    const normalizedNextAction =
      nextActionRaw && typeof nextActionRaw.label === 'string'
        ? {
            ...nextActionRaw,
            label: safeStringOptional(nextActionRaw.label, '—') ?? '—',
            reason: safeStringOptional(nextActionRaw.reason)
          }
        : undefined
    const ownerData = lead.owner
    const owner = ownerData
      ? {
          ...ownerData,
          name: safeStringOptional(ownerData.name, 'Responsável não informado') ?? 'Responsável não informado'
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
      priorityBucket,
      priorityScore,
      priorityDescription,
      legalName,
      tradeName,
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
    if (orderBy === 'last_interaction') return 'Última interação'
    if (orderBy === 'created_at') return 'Data de criação'
    return 'Prioridade'
  }, [orderBy])

  const renderLeadRowSafely = (lead: LeadSalesViewItem) => {
    const id = lead.leadId ?? lead.lead_id ?? lead.id
    if (!id) return null

    const rowData = toRowData(lead)
    const actions = getLeadActions?.(lead)

    return (
      <LeadSalesRow
        key={id}
        {...rowData}
        selected={selectedIds.includes(id)}
        onSelectChange={(checked) => handleSelectChange(lead, checked)}
        onClick={() => onNavigate(id)}
        onMenuClick={() => onNavigate(id)}
        actions={actions}
      />
    )
  }

  const shouldLogRenderError = !import.meta.env.PROD || import.meta.env.VITE_VERCEL_ENV === 'preview'

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          <ArrowsDownUp className="h-4 w-4" />
          <span className="text-muted-foreground">Ordenado por</span>
          <span className="text-foreground font-semibold">{orderLabel}</span>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px]">
              <Checkbox checked={allSelected} onCheckedChange={() => onSelectAll()} disabled={isLoading || safeLeads.length === 0} />
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

          {!isLoading && safeLeads.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
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
              <TableCell colSpan={8} className="py-10">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
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
                  console.error('LeadSalesRow render failed', id, lead, error)
                }

                return null
              }
            })}

          {!isLoading && invalidLeadCount > 0 && validLeads.length > 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-4 text-xs text-muted-foreground">
                Alguns registros retornados pelo servidor foram ignorados por estarem sem identificador.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
