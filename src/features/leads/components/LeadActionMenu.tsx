import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DotsThreeVertical, PencilSimple, Trash } from '@phosphor-icons/react'
import { Lead } from '@/lib/types'
import { RequirePermission } from '@/features/rbac/components/RequirePermission'

interface LeadActionMenuProps {
  lead: Lead
  onEdit: (lead: Lead) => void
  onDelete: (lead: Lead) => void
}

export function LeadActionMenu({ lead, onEdit, onDelete }: LeadActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <DotsThreeVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <RequirePermission permission="leads.update">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(lead) }}>
            <PencilSimple className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        </RequirePermission>
        <RequirePermission permission="leads.delete">
            <DropdownMenuSeparator />
            <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(lead) }}
                className="text-destructive focus:text-destructive"
            >
                <Trash className="mr-2 h-4 w-4" />
                Excluir
            </DropdownMenuItem>
        </RequirePermission>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
