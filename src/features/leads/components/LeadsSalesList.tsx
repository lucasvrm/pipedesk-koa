import { useMemo } from 'react'
import { LeadSalesRow, LeadSalesRowSkeleton } from './LeadSalesRow'
import { LeadSalesViewItem } from '@/services/leadsSalesViewService'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'

interface LeadsSalesListProps {
  leads: LeadSalesViewItem[]
  isLoading: boolean
  selectedIds: string[]
  onSelectAll: () => void
  onSelectOne: (id: string, selected: boolean) => void
  onNavigate: (leadId: string) => void
}

export function LeadsSalesList({
  leads,
  isLoading,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onNavigate
}: LeadsSalesListProps) {
  const allSelected = useMemo(() => leads.length > 0 && selectedIds.length === leads.length, [leads.length, selectedIds.length])

  const handleSelectChange = (lead: LeadSalesViewItem, selected: boolean) => {
    const id = lead.leadId ?? lead.id
    onSelectOne(id, selected)
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px]">
              <Checkbox checked={allSelected} onCheckedChange={() => onSelectAll()} disabled={isLoading || leads.length === 0} />
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

          {!isLoading &&
            leads.map((lead) => {
              const id = lead.leadId ?? lead.id
              return (
                <LeadSalesRow
                  key={id}
                  {...lead}
                  selected={selectedIds.includes(id)}
                  onSelectChange={(checked) => handleSelectChange(lead, checked)}
                  onClick={() => onNavigate(id)}
                  onMenuClick={() => onNavigate(id)}
                />
              )
            })}
        </TableBody>
      </Table>
    </div>
  )
}
