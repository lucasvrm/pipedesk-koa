import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react'

interface LeadsPaginationControlsProps {
  currentPage: number
  totalPages: number
  currentPageSize: number
  totalLeads: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (pageSize: number) => void
}

export function LeadsPaginationControls({
  currentPage,
  totalPages,
  currentPageSize,
  totalLeads,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}: LeadsPaginationControlsProps) {
  const safePageSize = currentPageSize || itemsPerPage
  const start = Math.min((currentPage - 1) * safePageSize + 1, totalLeads)
  const end = Math.min(currentPage * safePageSize, totalLeads)

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
      <div className="flex items-center gap-3 flex-wrap">
        <span>
          Mostrando {start}–{end} de {totalLeads} leads
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Linhas:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[100px] h-9 justify-between">
                <span>{itemsPerPage}</span>
                <CaretDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[140px]">
              <DropdownMenuRadioGroup
                value={String(itemsPerPage)}
                onValueChange={(value) => onItemsPerPageChange(Number(value))}
              >
                <DropdownMenuRadioItem value="10">10</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="20">20</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="50">50</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          <CaretLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Próximo
          <CaretRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
