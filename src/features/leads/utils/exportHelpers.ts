import type { Lead } from '@/lib/types'
import { calculateStringSimilarity, normalizeString } from './duplicateMatching'

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
// Import Types
// ============================================================================

export interface ParsedRow {
  rowIndex: number
  data: Record<string, string>
  errors: string[]
}

export interface ImportPreview {
  headers: string[]
  rows: ParsedRow[]
  totalRows: number
  errorCount: number
}

export interface ColumnMapping {
  sourceColumn: string // Nome da coluna no arquivo
  targetField: string | null // Campo do sistema ou null (ignorar)
}

export interface TargetField {
  key: string
  label: string
  required: boolean
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

/**
 * Target fields for import mapping.
 * CNPJ is NOT required.
 */
export const IMPORT_TARGET_FIELDS: TargetField[] = [
  { key: 'legalName', label: 'Razão Social', required: true },
  { key: 'tradeName', label: 'Nome Fantasia', required: false },
  { key: 'cnpj', label: 'CNPJ', required: false }, // OPCIONAL
  { key: 'website', label: 'Website', required: false },
  { key: 'segment', label: 'Segmento', required: false },
  { key: 'addressCity', label: 'Cidade', required: false },
  { key: 'addressState', label: 'UF', required: false },
  { key: 'description', label: 'Descrição', required: false },
  { key: 'contactName', label: 'Nome do Contato', required: false },
  { key: 'contactEmail', label: 'Email do Contato', required: false },
  { key: 'contactPhone', label: 'Telefone do Contato', required: false },
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

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Parses a single CSV line, handling quoted values.
 * - Treats values between quotes
 * - Splits by comma
 * - Removes external quotes
 * - Unescapes internal quotes ("" → ")
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote ("" → ")
          current += '"'
          i++ // Skip next quote
        } else {
          // End of quoted value
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }

  // Add last value
  result.push(current.trim())

  return result
}

/**
 * Parses CSV content into ImportPreview.
 * - First line = headers
 * - Remaining lines = data rows
 * - Basic validation: first column not empty (expected to be legal name)
 */
export function parseCSV(content: string): ImportPreview {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '')

  if (lines.length === 0) {
    throw new Error('Arquivo vazio')
  }

  const headers = parseCSVLine(lines[0])
  const dataLines = lines.slice(1)

  const rows: ParsedRow[] = dataLines.map((line, index) => {
    const values = parseCSVLine(line)
    const data: Record<string, string> = {}

    headers.forEach((header, i) => {
      data[header] = values[i] ?? ''
    })

    const errors: string[] = []
    // Basic validation: first column should not be empty (expected legal name)
    if (!values[0] || values[0].trim() === '') {
      errors.push('Primeira coluna vazia (razão social esperada)')
    }

    return {
      rowIndex: index + 2, // +1 for header, +1 for 1-indexed
      data,
      errors,
    }
  })

  return {
    headers,
    rows,
    totalRows: rows.length,
    errorCount: rows.filter((r) => r.errors.length > 0).length,
  }
}

/**
 * Parses an XLSX file into ImportPreview.
 * Uses dynamic import for xlsx library.
 */
export async function parseXLSX(file: File): Promise<ImportPreview> {
  const XLSX = await import('xlsx')

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  // First sheet
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // Convert to JSON (header: 1 means each row is an array)
  const jsonData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

  if (jsonData.length === 0) {
    throw new Error('Arquivo vazio')
  }

  const headers = (jsonData[0] as unknown[]).map((h) => String(h ?? ''))
  const dataRows = jsonData.slice(1)

  const rows: ParsedRow[] = dataRows
    .filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && cell !== '')
    )
    .map((row, index) => {
      const data: Record<string, string> = {}
      headers.forEach((header, i) => {
        data[header] = String(row[i] ?? '')
      })

      const errors: string[] = []
      // Basic validation: first column should not be empty
      if (!row[0] || String(row[0]).trim() === '') {
        errors.push('Primeira coluna vazia (razão social esperada)')
      }

      return {
        rowIndex: index + 2, // +1 for header, +1 for 1-indexed
        data,
        errors,
      }
    })

  return {
    headers,
    rows,
    totalRows: rows.length,
    errorCount: rows.filter((r) => r.errors.length > 0).length,
  }
}

/**
 * Field aliases for auto-mapping columns.
 */
const FIELD_ALIASES: Record<string, string[]> = {
  legalName: [
    'razao',
    'razão',
    'empresa',
    'company',
    'legal',
    'razao social',
    'nome empresa',
  ],
  tradeName: ['fantasia', 'trade', 'nome fantasia'],
  cnpj: ['cnpj', 'cpf', 'documento'],
  website: ['site', 'web', 'url', 'website', 'homepage'],
  addressCity: ['cidade', 'city', 'municipio', 'município'],
  addressState: ['estado', 'uf', 'state'],
  contactEmail: ['email', 'e-mail', 'mail', 'contato email'],
  contactPhone: [
    'telefone',
    'phone',
    'cel',
    'celular',
    'fone',
    'whatsapp',
  ],
  contactName: ['contato', 'contact', 'nome contato', 'responsavel'],
  description: ['descricao', 'descrição', 'obs', 'observacao', 'observação'],
  segment: ['segmento', 'segment', 'setor', 'ramo'],
}

/**
 * Auto-maps CSV/XLSX headers to target fields using similarity matching.
 * - First tries exact match (normalized)
 * - Then tries fuzzy match (>= 70% similarity)
 * - Each target field can only be used once
 */
export function autoMapColumns(headers: string[]): ColumnMapping[] {
  const usedTargets = new Set<string>()
  const mappings: ColumnMapping[] = []

  for (const header of headers) {
    const normalizedHeader = normalizeString(header)
    let bestMatch: { field: string; score: number } | null = null

    // Try to find a match for this header
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      // Skip if already used
      if (usedTargets.has(field)) continue

      for (const alias of aliases) {
        const normalizedAlias = normalizeString(alias)

        // Exact match
        if (normalizedHeader === normalizedAlias) {
          bestMatch = { field, score: 100 }
          break
        }

        // Fuzzy match
        const similarity = calculateStringSimilarity(normalizedHeader, normalizedAlias)
        if (similarity >= 70) {
          if (!bestMatch || similarity > bestMatch.score) {
            bestMatch = { field, score: similarity }
          }
        }
      }

      // If exact match found, no need to check other fields
      if (bestMatch?.score === 100) break
    }

    if (bestMatch) {
      usedTargets.add(bestMatch.field)
      mappings.push({
        sourceColumn: header,
        targetField: bestMatch.field,
      })
    } else {
      mappings.push({
        sourceColumn: header,
        targetField: null, // Ignore this column
      })
    }
  }

  return mappings
}
