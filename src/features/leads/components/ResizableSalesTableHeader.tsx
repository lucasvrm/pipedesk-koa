import { useCallback, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useColumnWidths, 
  getResizableColumns,
  SALES_VIEW_COLUMNS,
} from '../hooks/useResizableColumns'

interface ResizableSalesTableHeaderProps {
  allSelected: boolean
  toggleSelectAll: () => void
  isLoading: boolean
  leadIdsLength: number
}

/**
 * Resizable table header for Sales View.
 * Uses react-resizable-panels to capture resize events.
 * Column widths are synchronized with colgroup via ColumnWidthsProvider context.
 */
export function ResizableSalesTableHeader({
  allSelected,
  toggleSelectAll,
  isLoading,
  leadIdsLength,
}: ResizableSalesTableHeaderProps) {
  const { sizes, onLayoutChange, resetSizes, hasCustomSizes } = useColumnWidths()
  const resizableColumns = getResizableColumns()
  const [key, setKey] = useState(0) // Key to force re-mount PanelGroup on reset

  // Handle reset with PanelGroup re-mount
  const handleReset = useCallback(() => {
    resetSizes()
    // Force PanelGroup to re-mount with default sizes
    setKey((k) => k + 1)
  }, [resetSizes])

  // Get fixed column widths
  const checkboxCol = SALES_VIEW_COLUMNS.find((c) => c.id === 'checkbox')
  const actionsCol = SALES_VIEW_COLUMNS.find((c) => c.id === 'actions')

  return (
    <thead
      data-slot="table-header"
      className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 [&_tr]:border-b"
    >
      <tr className="hover:bg-transparent flex w-full">
        {/* Fixed checkbox column */}
        <th
          className="text-foreground h-10 px-2 flex items-center font-medium whitespace-nowrap shrink-0"
          style={{ width: checkboxCol?.fixedWidth ?? 40 }}
        >
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            disabled={isLoading || leadIdsLength === 0}
          />
        </th>

        {/* Resizable columns using PanelGroup */}
        <th className="flex-1 p-0 h-10 min-w-0">
          <PanelGroup
            key={key}
            direction="horizontal"
            onLayout={onLayoutChange}
            className="h-full"
          >
            {resizableColumns.map((col, index) => (
              <div key={col.id} className="contents">
                <Panel
                  id={col.id}
                  defaultSize={sizes[index] ?? col.defaultSize}
                  minSize={col.minSize}
                  className="flex items-center px-2 overflow-hidden"
                >
                  <span className="text-foreground font-medium whitespace-nowrap text-sm truncate">
                    {col.label}
                  </span>
                </Panel>
                {index < resizableColumns.length - 1 && (
                  <PanelResizeHandle
                    className={cn(
                      'group relative w-1 bg-transparent cursor-col-resize transition-colors',
                      'hover:bg-primary/40 data-[resize-handle-state=drag]:bg-primary/60'
                    )}
                    aria-label={`Redimensionar coluna ${col.label}`}
                  >
                    <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-border group-hover:bg-primary transition-colors" />
                  </PanelResizeHandle>
                )}
              </div>
            ))}
          </PanelGroup>
        </th>

        {/* Fixed actions column with reset button */}
        <th
          className="text-foreground h-10 px-2 flex items-center justify-end font-medium whitespace-nowrap shrink-0"
          style={{ width: actionsCol?.fixedWidth ?? 200 }}
        >
          {hasCustomSizes && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReset()
                      }}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resetar larguras das colunas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </th>
      </tr>
    </thead>
  )
}
