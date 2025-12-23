import { useState, useEffect, useCallback, useRef } from 'react'

export interface ColumnDef {
  id: string
  label: string
  width: number
  minWidth: number
  maxWidth?: number
  visible?: boolean
}

interface UseResizableColumnsOptions {
  storageKey: string
  defaultColumns: ColumnDef[]
}

interface UseResizableColumnsReturn {
  columns: ColumnDef[]
  isResizing: boolean
  activeColumnId: string | null
  getColumnWidth: (id: string) => number
  handleResizeStart: (e: React.MouseEvent, columnId: string) => void
  resetToDefaults: () => void
  setColumnVisible: (id: string, visible: boolean) => void
}

export function useResizableColumns({
  storageKey,
  defaultColumns
}: UseResizableColumnsOptions): UseResizableColumnsReturn {
  // Load saved widths from localStorage
  const loadSavedColumns = (): ColumnDef[] => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return defaultColumns

      const savedWidths: Record<string, { width: number; visible?: boolean }> = JSON.parse(saved)
      
      return defaultColumns.map(col => ({
        ...col,
        width: savedWidths[col.id]?.width ?? col.width,
        visible: savedWidths[col.id]?.visible ?? col.visible ?? true
      }))
    } catch {
      return defaultColumns
    }
  }

  const [columns, setColumns] = useState<ColumnDef[]>(loadSavedColumns)
  const [isResizing, setIsResizing] = useState(false)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  
  const startX = useRef(0)
  const startWidth = useRef(0)

  // Save to localStorage whenever columns change
  useEffect(() => {
    const widthsToSave: Record<string, { width: number; visible?: boolean }> = {}
    columns.forEach(col => {
      widthsToSave[col.id] = { width: col.width, visible: col.visible }
    })
    localStorage.setItem(storageKey, JSON.stringify(widthsToSave))
  }, [columns, storageKey])

  const getColumnWidth = useCallback((id: string): number => {
    return columns.find(col => col.id === id)?.width ?? 100
  }, [columns])

  const handleResizeStart = useCallback((e: React.MouseEvent, columnId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const column = columns.find(col => col.id === columnId)
    if (!column) return

    startX.current = e.clientX
    startWidth.current = column.width
    setActiveColumnId(columnId)
    setIsResizing(true)
  }, [columns])

  useEffect(() => {
    if (!isResizing || !activeColumnId) return

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX.current
      
      setColumns(prevColumns => prevColumns.map(col => {
        if (col.id !== activeColumnId) return col
        
        // Use maxWidth if defined, otherwise allow up to 1200px
        const effectiveMaxWidth = col.maxWidth ?? 1200
        
        const newWidth = Math.max(
          col.minWidth,
          Math.min(effectiveMaxWidth, startWidth.current + diff)
        )
        
        return { ...col, width: newWidth }
      }))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setActiveColumnId(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    // Add cursor style to body during resize
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, activeColumnId])

  const resetToDefaults = useCallback(() => {
    setColumns(defaultColumns)
    localStorage.removeItem(storageKey)
  }, [defaultColumns, storageKey])

  const setColumnVisible = useCallback((id: string, visible: boolean) => {
    setColumns(prevColumns => prevColumns.map(col => 
      col.id === id ? { ...col, visible } : col
    ))
  }, [])

  return {
    columns,
    isResizing,
    activeColumnId,
    getColumnWidth,
    handleResizeStart,
    resetToDefaults,
    setColumnVisible
  }
}
