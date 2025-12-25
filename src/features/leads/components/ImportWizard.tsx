import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Upload,
  FileSpreadsheet,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateLead } from '@/services/leadService'
import {
  parseCSV,
  parseXLSX,
  autoMapColumns,
  IMPORT_TARGET_FIELDS,
  type ImportPreview,
  type ColumnMapping,
} from '../utils/exportHelpers'
import {
  findDuplicates,
  type DuplicateCandidate,
  type ExistingLead,
} from '../utils/duplicateMatching'

// ============================================================================
// Types
// ============================================================================

interface ImportWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingLeads?: ExistingLead[]
  onComplete?: (stats: ImportStats) => void
}

interface ImportStats {
  total: number
  created: number
  skipped: number
  errors: number
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'complete'

interface ImportRow {
  rowIndex: number
  data: Record<string, string>
  mappedData: Partial<{
    legalName: string
    tradeName?: string
    cnpj?: string
    website?: string
    segment?: string
    addressCity?: string
    addressState?: string
    description?: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string
  }>
  status: 'pending' | 'duplicate' | 'error' | 'success'
  duplicates?: DuplicateCandidate[]
  error?: string
}

const WIZARD_STEPS: WizardStep[] = ['upload', 'mapping', 'preview', 'complete']

// ============================================================================
// Component
// ============================================================================

export function ImportWizard({
  open,
  onOpenChange,
  existingLeads,
  onComplete,
}: ImportWizardProps) {
  // ========== Hooks (always at top, before any conditionals) ==========
  const { profile } = useAuth()
  const createLead = useCreateLead()

  // ========== useState ==========
  const [step, setStep] = useState<WizardStep>('upload')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [rows, setRows] = useState<ImportRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState<ImportStats>({
    total: 0,
    created: 0,
    skipped: 0,
    errors: 0,
  })
  const [isDragging, setIsDragging] = useState(false)

  // ========== Handlers ==========
  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsProcessing(true)
      try {
        const ext = file.name.split('.').pop()?.toLowerCase()

        let result: ImportPreview
        if (ext === 'csv') {
          const text = await file.text()
          result = parseCSV(text)
        } else if (ext === 'xlsx' || ext === 'xls') {
          result = await parseXLSX(file)
        } else {
          throw new Error('Formato não suportado. Use CSV, XLSX ou XLS.')
        }

        if (result.rows.length === 0) {
          throw new Error('Arquivo sem dados para importar')
        }

        setPreview(result)
        setMappings(autoMapColumns(result.headers))
        setStep('mapping')
      } catch (error) {
        toast.error(
          `Erro ao ler arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        )
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileUpload(file)
      }
    },
    [handleFileUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileUpload(file)
      }
    },
    [handleFileUpload]
  )

  const handleMappingChange = useCallback(
    (sourceColumn: string, targetField: string | null) => {
      setMappings((prev) =>
        prev.map((m) =>
          m.sourceColumn === sourceColumn ? { ...m, targetField } : m
        )
      )
    },
    []
  )

  const checkDuplicates = useCallback(
    (importRows: ImportRow[]) => {
      if (!existingLeads || existingLeads.length === 0) return

      for (const row of importRows) {
        if (!row.mappedData.legalName) {
          row.status = 'error'
          row.error = 'Razão social obrigatória'
          continue
        }

        const duplicates = findDuplicates(
          {
            legalName: row.mappedData.legalName,
            tradeName: row.mappedData.tradeName,
            cnpj: row.mappedData.cnpj,
            email: row.mappedData.contactEmail,
            website: row.mappedData.website,
          },
          existingLeads
        )

        // Threshold 70%
        if (duplicates.length > 0 && duplicates[0].matchScore >= 70) {
          row.status = 'duplicate'
          row.duplicates = duplicates.slice(0, 3)
        }
      }

      setRows([...importRows])
    },
    [existingLeads]
  )

  const handleMapping = useCallback(() => {
    // Validate legalName is mapped
    const hasLegalName = mappings.some((m) => m.targetField === 'legalName')
    if (!hasLegalName) {
      toast.error('Razão Social é obrigatória. Mapeie pelo menos uma coluna para este campo.')
      return
    }

    // Apply mappings to rows
    const mappedRows: ImportRow[] =
      preview?.rows.map((row) => {
        const mappedData: ImportRow['mappedData'] = {}

        mappings.forEach((mapping) => {
          if (mapping.targetField) {
            const value = row.data[mapping.sourceColumn]
            if (value) {
              ;(mappedData as Record<string, string>)[mapping.targetField] = value
            }
          }
        })

        return {
          rowIndex: row.rowIndex,
          data: row.data,
          mappedData,
          status: 'pending' as const,
          duplicates: [],
        }
      }) ?? []

    setRows(mappedRows)
    setStep('preview')

    // Check for duplicates in background
    setTimeout(() => {
      setIsProcessing(true)
      checkDuplicates(mappedRows)
      setIsProcessing(false)
    }, 100)
  }, [mappings, preview, checkDuplicates])

  const handleImport = useCallback(async () => {
    if (!profile?.id) {
      toast.error('Usuário não autenticado')
      return
    }

    const pendingRows = rows.filter((r) => r.status === 'pending')
    const total = pendingRows.length

    if (total === 0) {
      toast.error('Nenhum lead para importar')
      return
    }

    setIsProcessing(true)
    setStats({
      total,
      created: 0,
      skipped: rows.filter((r) => r.status === 'duplicate').length,
      errors: 0,
    })

    let created = 0
    let errors = 0

    for (let i = 0; i < total; i++) {
      const row = pendingRows[i]

      try {
        await createLead.mutateAsync({
          data: {
            legalName: row.mappedData.legalName!,
            tradeName: row.mappedData.tradeName,
            cnpj: row.mappedData.cnpj,
            website: row.mappedData.website,
            segment: row.mappedData.segment,
            addressCity: row.mappedData.addressCity,
            addressState: row.mappedData.addressState,
            description: row.mappedData.description,
          },
          userId: profile.id,
        })

        row.status = 'success'
        created++
        setStats((prev) => ({ ...prev, created }))
      } catch (error) {
        row.status = 'error'
        row.error =
          error instanceof Error ? error.message : 'Erro desconhecido'
        errors++
        setStats((prev) => ({ ...prev, errors }))
      }

      setProgress(Math.round(((i + 1) / total) * 100))
    }

    setRows([...rows])
    setIsProcessing(false)
    setStep('complete')

    const finalStats: ImportStats = {
      total,
      created,
      skipped: rows.filter((r) => r.status === 'duplicate').length,
      errors,
    }
    setStats(finalStats)
    onComplete?.(finalStats)
  }, [rows, profile, createLead, onComplete])

  const handleClose = useCallback(() => {
    // Reset state
    setStep('upload')
    setPreview(null)
    setMappings([])
    setRows([])
    setIsProcessing(false)
    setProgress(0)
    setStats({ total: 0, created: 0, skipped: 0, errors: 0 })
    onOpenChange(false)
  }, [onOpenChange])

  const handleBack = useCallback(() => {
    if (step === 'mapping') {
      setStep('upload')
      setPreview(null)
      setMappings([])
    } else if (step === 'preview') {
      setStep('mapping')
      setRows([])
    }
  }, [step])

  // ========== Derived values ==========
  const usedTargets = new Set(
    mappings.filter((m) => m.targetField).map((m) => m.targetField)
  )

  const pendingCount = rows.filter((r) => r.status === 'pending').length
  const duplicateCount = rows.filter((r) => r.status === 'duplicate').length
  const errorCount = rows.filter(
    (r) => r.status === 'error' || r.error
  ).length

  const currentStepIndex = WIZARD_STEPS.indexOf(step)

  // ========== Render ==========
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Leads
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : currentStepIndex > i
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {currentStepIndex > i ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <div className="w-12 h-0.5 bg-muted mx-2" />
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Step Content */}
        <div className="flex-1 overflow-hidden py-4">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-muted-foreground">
                      Processando arquivo...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                      <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">
                        Arraste um arquivo ou clique para selecionar
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Formatos aceitos: CSV, XLSX, XLS
                      </p>
                    </div>
                    <label>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <Button type="button" variant="outline" asChild>
                        <span className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar Arquivo
                        </span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 'mapping' && preview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Mapeamento de Colunas
                </Label>
                <Badge variant="secondary">
                  {preview.headers.length} colunas encontradas
                </Badge>
              </div>

              <ScrollArea className="h-[400px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
                        Coluna do Arquivo
                      </TableHead>
                      <TableHead className="w-[250px]">
                        Campo do Sistema
                      </TableHead>
                      <TableHead>Exemplo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.map((mapping) => {
                      const exampleValue =
                        preview.rows[0]?.data[mapping.sourceColumn] ?? ''

                      return (
                        <TableRow key={mapping.sourceColumn}>
                          <TableCell className="font-medium">
                            {mapping.sourceColumn}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={mapping.targetField ?? 'ignore'}
                              onValueChange={(value) =>
                                handleMappingChange(
                                  mapping.sourceColumn,
                                  value === 'ignore' ? null : value
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ignore">
                                  Ignorar coluna
                                </SelectItem>
                                {IMPORT_TARGET_FIELDS.map((field) => (
                                  <SelectItem
                                    key={field.key}
                                    value={field.key}
                                    disabled={
                                      usedTargets.has(field.key) &&
                                      mapping.targetField !== field.key
                                    }
                                  >
                                    {field.label}
                                    {field.required && ' *'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                            {exampleValue || '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>

              {!mappings.some((m) => m.targetField === 'legalName') && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700 dark:text-amber-400">
                    Razão Social é obrigatória. Mapeie pelo menos uma coluna
                    para este campo.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-2xl font-bold">{rows.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {pendingCount}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Novos
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {duplicateCount}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-500">
                    Duplicatas
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {errorCount}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-500">
                    Erros
                  </p>
                </div>
              </div>

              {/* Progress bar during import */}
              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Importando... {progress}%
                  </p>
                </div>
              )}

              {/* Preview Table */}
              <ScrollArea className="h-[300px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Razão Social</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 100).map((row) => (
                      <TableRow key={row.rowIndex}>
                        <TableCell className="text-muted-foreground">
                          {row.rowIndex}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.mappedData.legalName ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.mappedData.cnpj ?? '—'}
                        </TableCell>
                        <TableCell>
                          {row.status === 'pending' && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                            >
                              Novo
                            </Badge>
                          )}
                          {row.status === 'duplicate' && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                            >
                              {row.duplicates?.length ?? 0} duplicata
                              {(row.duplicates?.length ?? 0) > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {row.status === 'error' && (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                            >
                              Erro
                            </Badge>
                          )}
                          {row.status === 'success' && (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Criado
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {rows.length > 100 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground"
                        >
                          ... e mais {rows.length - 100} linhas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-8 gap-6">
              {stats.errors === 0 ? (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              ) : (
                <AlertTriangle className="h-16 w-16 text-amber-500" />
              )}

              <h3 className="text-xl font-semibold">Importação Concluída</h3>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-center">
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {stats.created}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Criados
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-center">
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                    {stats.skipped}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-500">
                    Ignorados
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-center">
                  <p className="text-3xl font-bold text-red-700 dark:text-red-400">
                    {stats.errors}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-500">
                    Erros
                  </p>
                </div>
              </div>

              <Button onClick={handleClose}>
                <Check className="h-4 w-4 mr-2" />
                Concluir
              </Button>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        {step !== 'complete' && (
          <>
            <Separator />
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                {preview && (
                  <>
                    <Badge variant="secondary">
                      {preview.totalRows} linhas
                    </Badge>
                    {preview.errorCount > 0 && (
                      <Badge variant="destructive">
                        {preview.errorCount} com erros
                      </Badge>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {step !== 'upload' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isProcessing}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                )}

                {step === 'mapping' && (
                  <Button
                    type="button"
                    onClick={handleMapping}
                    disabled={
                      !mappings.some((m) => m.targetField === 'legalName') ||
                      isProcessing
                    }
                  >
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}

                {step === 'preview' && (
                  <Button
                    type="button"
                    onClick={handleImport}
                    disabled={pendingCount === 0 || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar {pendingCount} Lead
                        {pendingCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
