import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface ResizableTableHeadProps {
  columnId: string
  width: number
  isResizing: boolean
  isActive: boolean
  onResizeStart: (e: React.MouseEvent, columnId: string) => void
  children: React.ReactNode
  className?: string
}

export function ResizableTableHead({
  columnId,
  width,
  isResizing,
  isActive,
  onResizeStart,
  children,
  className
}: ResizableTableHeadProps) {
  return (
    <TableHead
      className={cn('relative group select-none', className)}
      style={{ width, minWidth: width, maxWidth: width }}
    >
      <div className="truncate pr-2">{children}</div>
      
      {/* Resize Handle */}
      <div
        className={cn(
          'absolute right-0 top-0 h-full w-1.5 cursor-col-resize z-10',
          'flex items-center justify-center',
          'transition-colors duration-150',
          isActive
            ? 'bg-primary'
            : 'bg-transparent hover:bg-primary/50 group-hover:bg-border'
        )}
        onMouseDown={(e) => onResizeStart(e, columnId)}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            'w-0.5 h-4 rounded-full transition-colors',
            isActive ? 'bg-primary-foreground' : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/50'
          )}
        />
      </div>
    </TableHead>
  )
}
