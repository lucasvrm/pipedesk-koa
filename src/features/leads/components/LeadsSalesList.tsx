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
    const priorityBucketRaw = lead.priorityBucket ?? lead.priority_bucket
    const priorityBucket = priorityBucketRaw === 'hot' || priorityBucketRaw === 'cold' ? priorityBucketRaw : 'warm'
    const priorityScore = lead.priorityScore ?? lead.priority_score
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
            avatar: safeStringOptional((primaryContactSource as any).avatar)
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
      priorityBucket,
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
    if (orderBy === 'last_interaction') return 'Última interação'
    if (orderBy === 'created_at') return 'Data de criação'
    return 'Prioridade'
  }, [orderBy])

  const renderLeadRowSafely = (lead: LeadSalesViewItem) => {
    const id = lead.leadId ?? lead.lead_id ?? lead.id ?? lead.lead?.id
    if (!id) return null

    try {
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
    } catch (error) {
      if (shouldLogRenderError) {
        console.error('[SalesView] LeadSalesRow render failed', id, lead, error)
      }

      throw error
    }
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
              <TableCell colSpan={8} className="py-10">
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
