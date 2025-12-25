import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, FileJson, FileText, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Lead } from '@/lib/types'
import {
  type ExportFormat,
  EXPORT_COLUMNS,
  exportLeads,
} from '../utils/exportHelpers'

// ============================================================================
// Types
// ============================================================================

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leads: Lead[]
  filterDescription?: string
}

// ============================================================================
// Constants
// ============================================================================

const formatButtons: Array<{ format: ExportFormat; label: string; icon: typeof FileText }> = [
  { format: 'csv', label: 'CSV', icon: FileText },
  { format: 'xlsx', label: 'XLSX', icon: FileSpreadsheet },
  { format: 'json', label: 'JSON', icon: FileJson },
]

// ============================================================================
// Component
// ============================================================================

export function ExportDialog({
  open,
  onOpenChange,
  leads,
  filterDescription,
}: ExportDialogProps) {
  // ========== State ==========
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    () => new Set(EXPORT_COLUMNS.filter((c) => c.selected).map((c) => c.key))
  )
  const [isExporting, setIsExporting] = useState(false)

  // ========== Memoized values ==========
  const selectedColumnsArray = useMemo(
    () => EXPORT_COLUMNS.filter((c) => selectedColumns.has(c.key)),
    [selectedColumns]
  )

  const previewData = useMemo(() => leads.slice(0, 3), [leads])

  // ========== Handlers ==========
  const handleToggleColumn = useCallback((key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        // Don't allow unchecking if it's the last one
        if (next.size === 1) {
          toast.error('Pelo menos uma coluna deve estar selecionada')
          return prev
        }
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedColumns(new Set(EXPORT_COLUMNS.map((c) => c.key)))
  }, [])

  const handleClearAll = useCallback(() => {
    // Keep at least legalName
    setSelectedColumns(new Set(['legalName']))
  }, [])

  const handleExport = useCallback(async () => {
    if (selectedColumns.size === 0) {
      toast.error('Selecione pelo menos uma coluna')
      return
    }

    setIsExporting(true)

    try {
      await exportLeads(leads, {
        format,
        columns: selectedColumnsArray,
      })

      toast.success(`${leads.length} leads exportados com sucesso`)
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar leads')
    } finally {
      setIsExporting(false)
    }
  }, [leads, format, selectedColumnsArray, selectedColumns.size, onOpenChange])

  // ========== Render ==========
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Leads
          </DialogTitle>
          <DialogDescription>
            {leads.length} leads
            {filterDescription ? ` • ${filterDescription}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Formato</Label>
            <div className="flex gap-2">
              {formatButtons.map(({ format: fmt, label, icon: Icon }) => (
                <Button
                  key={fmt}
                  type="button"
                  variant={format === fmt ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormat(fmt)}
                  className="flex-1"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Column Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Colunas ({selectedColumns.size} selecionadas)
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                >
                  Todas
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 text-xs"
                >
                  Limpar
                </Button>
              </div>
            </div>
            <ScrollArea className="h-36 rounded-md border p-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {EXPORT_COLUMNS.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`col-${column.key}`}
                      checked={selectedColumns.has(column.key)}
                      onCheckedChange={() => handleToggleColumn(column.key)}
                    />
                    <Label
                      htmlFor={`col-${column.key}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preview (3 primeiros)</Label>
            <ScrollArea className="h-48 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedColumnsArray.map((col) => (
                      <TableHead key={col.key} className="text-xs whitespace-nowrap">
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={selectedColumnsArray.length || 1}
                        className="text-center text-muted-foreground"
                      >
                        Nenhum lead para exportar
                      </TableCell>
                    </TableRow>
                  ) : (
                    previewData.map((lead) => (
                      <TableRow key={lead.id}>
                        {selectedColumnsArray.map((col) => (
                          <TableCell key={col.key} className="text-xs whitespace-nowrap">
                            {String(col.getter(lead) ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <div className="flex items-center gap-2 mr-auto">
            <Badge variant="secondary">{leads.length} leads</Badge>
            <Badge variant="secondary">{selectedColumns.size} colunas</Badge>
            <Badge variant="outline">{format.toUpperCase()}</Badge>
          </div>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || leads.length === 0 || selectedColumns.size === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
