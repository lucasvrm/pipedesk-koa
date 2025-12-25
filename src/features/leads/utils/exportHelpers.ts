import type { Lead } from '@/lib/types'

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = 'csv' | 'xlsx' | 'json'

export interface ExportColumn {
  key: string
  label: string
  getter: (lead: Lead) => string | number | null | undefined
  selected?: boolean
}

export interface ExportOptions {
  format: ExportFormat
  columns: ExportColumn[]
  filename?: string
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Available columns for export.
 * CNPJ is optional and not selected by default.
 */
export const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'legalName', label: 'Razão Social', getter: (l) => l.legalName, selected: true },
  { key: 'tradeName', label: 'Nome Fantasia', getter: (l) => l.tradeName },
  { key: 'cnpj', label: 'CNPJ', getter: (l) => l.cnpj }, // Opcional
  { key: 'website', label: 'Website', getter: (l) => l.website },
  { key: 'segment', label: 'Segmento', getter: (l) => l.segment },
  { key: 'addressCity', label: 'Cidade', getter: (l) => l.addressCity },
  { key: 'addressState', label: 'UF', getter: (l) => l.addressState },
  { key: 'status', label: 'Status', getter: (l) => l.leadStatusId, selected: true },
  { key: 'origin', label: 'Origem', getter: (l) => l.leadOriginId },
  {
    key: 'primaryContact',
    label: 'Contato Principal',
    getter: (l) => l.contacts?.find((c) => c.isPrimary)?.name ?? l.contacts?.[0]?.name,
    selected: true,
  },
  {
    key: 'primaryContactEmail',
    label: 'Email do Contato',
    getter: (l) => l.contacts?.find((c) => c.isPrimary)?.email ?? l.contacts?.[0]?.email,
    selected: true,
  },
  {
    key: 'primaryContactPhone',
    label: 'Telefone do Contato',
    getter: (l) => l.contacts?.find((c) => c.isPrimary)?.phone ?? l.contacts?.[0]?.phone,
  },
  { key: 'owner', label: 'Responsável', getter: (l) => l.owner?.name, selected: true },
  { key: 'ownerEmail', label: 'Email do Responsável', getter: (l) => l.owner?.email },
  {
    key: 'priorityBucket',
    label: 'Prioridade',
    getter: (l) =>
      ({ hot: 'Alta', warm: 'Média', cold: 'Baixa' })[l.priorityBucket ?? ''] ?? '',
  },
  { key: 'description', label: 'Descrição', getter: (l) => l.description },
  {
    key: 'createdAt',
    label: 'Data de Criação',
    getter: (l) => (l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR') : ''),
  },
  {
    key: 'updatedAt',
    label: 'Última Atualização',
    getter: (l) => (l.updatedAt ? new Date(l.updatedAt).toLocaleDateString('pt-BR') : ''),
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Escapes a value for CSV format.
 * - Converts to string
 * - Wraps in quotes if contains comma, quotes, or newline
 * - Escapes internal quotes by doubling them
 */
export function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  const str = String(value)

  // Check if value needs escaping
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escape internal quotes by doubling them
    const escaped = str.replace(/"/g, '""')
    return `"${escaped}"`
  }

  return str
}

/**
 * Exports leads to CSV format.
 * - First line: headers (column labels)
 * - Remaining lines: data via column.getter(lead)
 * - Includes BOM UTF-8 for Excel compatibility
 * - Separator: comma
 * - Line ending: \n
 */
export function exportToCSV(leads: Lead[], columns: ExportColumn[]): string {
  // BOM UTF-8 for Excel compatibility
  const BOM = '\uFEFF'

  // Header row
  const headers = columns.map((col) => escapeCSVValue(col.label)).join(',')

  // Data rows
  const rows = leads.map((lead) =>
    columns.map((col) => escapeCSVValue(col.getter(lead))).join(',')
  )

  return BOM + [headers, ...rows].join('\n')
}

/**
 * Exports leads to JSON format.
 * - Array of objects with { [column.label]: column.getter(lead) }
 * - Pretty-printed with indent 2
 */
export function exportToJSON(leads: Lead[], columns: ExportColumn[]): string {
  const data = leads.map((lead) => {
    const row: Record<string, unknown> = {}
    columns.forEach((col) => {
      row[col.label] = col.getter(lead) ?? ''
    })
    return row
  })

  return JSON.stringify(data, null, 2)
}

/**
 * Exports leads to XLSX format.
 * Uses dynamic import for tree shaking.
 */
export async function exportToXLSX(leads: Lead[], columns: ExportColumn[]): Promise<Blob> {
  // Dynamic import for tree shaking
  const XLSX = await import('xlsx')

  // Prepare data
  const data = leads.map((lead) => {
    const row: Record<string, unknown> = {}
    columns.forEach((col) => {
      row[col.label] = col.getter(lead) ?? ''
    })
    return row
  })

  // Create workbook
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')

  // Generate blob
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/**
 * Downloads a file in the browser.
 * - Creates a Blob if content is a string
 * - Creates an anchor element to trigger download
 * - Cleans up the object URL after 100ms
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Cleanup object URL after a short delay
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Generates a timestamp string for filenames.
 * Format: YYYY-MM-DDTHH-MM-SS
 */
function generateTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/:/g, '-')
}

/**
 * Main export function.
 * - Generates filename with timestamp if not provided
 * - Handles CSV, XLSX, and JSON formats
 * - Downloads the file
 */
export async function exportLeads(leads: Lead[], options: ExportOptions): Promise<void> {
  const { format, columns, filename } = options

  const timestamp = generateTimestamp()
  const baseFilename = filename ?? `leads-export-${timestamp}`

  switch (format) {
    case 'csv': {
      const csvContent = exportToCSV(leads, columns)
      downloadFile(csvContent, `${baseFilename}.csv`, 'text/csv;charset=utf-8;')
      break
    }
    case 'xlsx': {
      const xlsxBlob = await exportToXLSX(leads, columns)
      downloadFile(
        xlsxBlob,
        `${baseFilename}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      break
    }
    case 'json': {
      const jsonContent = exportToJSON(leads, columns)
      downloadFile(jsonContent, `${baseFilename}.json`, 'application/json;charset=utf-8;')
      break
    }
  }
}
