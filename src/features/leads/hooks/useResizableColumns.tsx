import { useCallback, useEffect, useMemo, useState, createContext, useContext, ReactNode } from 'react'

export interface ColumnConfig {
  id: string
  label: string
  defaultSize: number  // percentage (0-100)
  minSize: number      // percentage (0-100)
  isFixed?: boolean
  fixedWidth?: number  // pixels (only for fixed columns)
}

const STORAGE_KEY = 'react-resizable-panels:leads-sales-view-columns'

// Column configuration for Sales View
// Fixed columns have pixel widths, resizable columns use percentages
export const SALES_VIEW_COLUMNS: ColumnConfig[] = [
  { id: 'checkbox', label: '', defaultSize: 0, minSize: 0, isFixed: true, fixedWidth: 40 },
  { id: 'empresa', label: 'Empresa', defaultSize: 22, minSize: 12 },
  { id: 'contato', label: 'Contato principal', defaultSize: 14, minSize: 10 },
  { id: 'status', label: 'Status', defaultSize: 10, minSize: 8 },
  { id: 'interacoes', label: 'Interações', defaultSize: 14, minSize: 10 },
  { id: 'proxima-acao', label: 'Próxima ação', defaultSize: 16, minSize: 10 },
  { id: 'tags', label: 'Tags', defaultSize: 10, minSize: 8 },
  { id: 'responsavel', label: 'Responsável', defaultSize: 14, minSize: 8 },
  { id: 'actions', label: '', defaultSize: 0, minSize: 0, isFixed: true, fixedWidth: 200 },
]

// Helper to get resizable columns only
export const getResizableColumns = () => SALES_VIEW_COLUMNS.filter((col) => !col.isFixed)

interface ColumnWidthsContextValue {
  sizes: number[]
  onLayoutChange: (sizes: number[]) => void
  resetSizes: () => void
  hasCustomSizes: boolean
}

const ColumnWidthsContext = createContext<ColumnWidthsContextValue | null>(null)

export function useColumnWidths() {
  const context = useContext(ColumnWidthsContext)
  if (!context) {
    throw new Error('useColumnWidths must be used within a ColumnWidthsProvider')
  }
  return context
}

interface ColumnWidthsProviderProps {
  children: ReactNode
}

/**
 * Provider component that manages resizable column widths with localStorage persistence.
 * Works with react-resizable-panels PanelGroup's onLayout callback.
 */
export function ColumnWidthsProvider({ children }: ColumnWidthsProviderProps) {
  const resizableColumns = getResizableColumns()
  
  const defaultSizes = useMemo(() => {
    return resizableColumns.map((col) => col.defaultSize)
  }, [])

  const [sizes, setSizes] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate that parsed data is an array with correct length
        if (Array.isArray(parsed) && parsed.length === resizableColumns.length) {
          if (parsed.every((val) => typeof val === 'number' && val > 0)) {
            return parsed
          }
        }
      }
    } catch (error) {
      console.warn(`[ColumnWidthsProvider] Failed to load saved sizes:`, error)
    }
    return defaultSizes
  })

  // Check if user has customized sizes
  const hasCustomSizes = useMemo(() => {
    return !sizes.every((size, index) => Math.abs(size - defaultSizes[index]) < 0.5)
  }, [sizes, defaultSizes])

  // Save to localStorage whenever sizes change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes))
    } catch (error) {
      console.warn(`[ColumnWidthsProvider] Failed to save sizes:`, error)
    }
  }, [sizes])

  // Handle layout change from PanelGroup
  const onLayoutChange = useCallback((newSizes: number[]) => {
    setSizes(newSizes)
  }, [])

  // Reset to default sizes
  const resetSizes = useCallback(() => {
    setSizes(defaultSizes)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn(`[ColumnWidthsProvider] Failed to remove saved sizes:`, error)
    }
  }, [defaultSizes])

  const value = useMemo(() => ({
    sizes,
    onLayoutChange,
    resetSizes,
    hasCustomSizes,
  }), [sizes, onLayoutChange, resetSizes, hasCustomSizes])

  return (
    <ColumnWidthsContext.Provider value={value}>
      {children}
    </ColumnWidthsContext.Provider>
  )
}

/**
 * Generate colgroup with column widths for table alignment.
 * Uses the sizes from ColumnWidthsProvider context.
 */
export function useColGroupWidths() {
  const { sizes } = useColumnWidths()
  const resizableColumns = getResizableColumns()

  // Build array of all column widths (fixed + resizable)
  const colWidths = useMemo(() => {
    const widths: Array<{ width: string }> = []
    let resizableIndex = 0

    for (const col of SALES_VIEW_COLUMNS) {
      if (col.isFixed) {
        widths.push({ width: `${col.fixedWidth}px` })
      } else {
        const size = sizes[resizableIndex] ?? col.defaultSize
        widths.push({ width: `${size}%` })
        resizableIndex++
      }
    }

    return widths
  }, [sizes])

  return colWidths
}
