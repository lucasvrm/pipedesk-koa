import { ReactNode } from 'react'
import { useColumnWidths, getResizableColumns, SALES_VIEW_COLUMNS } from '../hooks/useResizableColumns'

interface ResizableSalesRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

/**
 * Wrapper component for table body rows that matches the resizable header column widths.
 * Uses flexbox layout to align with the header's PanelGroup.
 */
export function ResizableSalesRow({ children, className, onClick }: ResizableSalesRowProps) {
  return (
    <tr 
      className={`flex w-full hover:bg-muted/50 transition-colors border-b ${className ?? ''}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

interface ResizableSalesCellProps {
  columnId: string
  children: ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

/**
 * Table cell that uses the resizable column widths from context.
 */
export function ResizableSalesCell({ columnId, children, className, onClick }: ResizableSalesCellProps) {
  const { sizes } = useColumnWidths()
  const resizableColumns = getResizableColumns()
  
  // Find the column config
  const colConfig = SALES_VIEW_COLUMNS.find((c) => c.id === columnId)
  
  if (!colConfig) {
    console.warn(`[ResizableSalesCell] Unknown column: ${columnId}`)
    return null
  }

  // Calculate width based on column type
  let style: React.CSSProperties = {}
  
  if (colConfig.isFixed) {
    style = { 
      width: colConfig.fixedWidth, 
      minWidth: colConfig.fixedWidth,
      maxWidth: colConfig.fixedWidth,
      flexShrink: 0,
    }
  } else {
    // Find index in resizable columns array
    const resizableIndex = resizableColumns.findIndex((c) => c.id === columnId)
    if (resizableIndex !== -1) {
      const size = sizes[resizableIndex] ?? colConfig.defaultSize
      style = {
        flex: `0 0 ${size}%`,
        minWidth: `${colConfig.minSize}%`,
        overflow: 'hidden',
      }
    }
  }

  return (
    <td 
      className={`p-2 align-middle ${className ?? ''}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </td>
  )
}

/**
 * Hook to get inline styles for a specific column.
 * Useful for custom cell implementations.
 */
export function useColumnStyle(columnId: string): React.CSSProperties {
  const { sizes } = useColumnWidths()
  const resizableColumns = getResizableColumns()
  
  const colConfig = SALES_VIEW_COLUMNS.find((c) => c.id === columnId)
  
  if (!colConfig) {
    return {}
  }

  if (colConfig.isFixed) {
    return { 
      width: colConfig.fixedWidth, 
      minWidth: colConfig.fixedWidth,
      maxWidth: colConfig.fixedWidth,
      flexShrink: 0,
    }
  }

  const resizableIndex = resizableColumns.findIndex((c) => c.id === columnId)
  if (resizableIndex !== -1) {
    const size = sizes[resizableIndex] ?? colConfig.defaultSize
    return {
      flex: `0 0 ${size}%`,
      minWidth: `${colConfig.minSize}%`,
      overflow: 'hidden',
    }
  }

  return {}
}
