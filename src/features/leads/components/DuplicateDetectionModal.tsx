import { AlertTriangle, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { DuplicateCandidate, getMatchSeverity } from '../utils/duplicateMatching'
import { DuplicateCard } from './DuplicateCard'

// ============================================================================
// TYPES
// ============================================================================

interface DuplicateDetectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicates: DuplicateCandidate[]
  onCreateAnyway: () => void
  onMerge?: (leadId: string) => void
  isCreating?: boolean
  inputData?: { legalName: string; cnpj?: string }
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Modal component for displaying duplicate detection results.
 *
 * Features:
 * - Header with AlertTriangle icon (red if high severity, amber otherwise)
 * - Stats badges showing counts per severity level
 * - Input data preview card
 * - ScrollArea with groups by severity (high → medium → low)
 * - Footer with Cancel and Create Anyway buttons
 * - AlertDialog confirmation when creating with high severity duplicates
 */
export function DuplicateDetectionModal({
  open,
  onOpenChange,
  duplicates,
  onCreateAnyway,
  onMerge,
  isCreating = false,
  inputData,
}: DuplicateDetectionModalProps) {
  const navigate = useNavigate()
  const [showForceConfirm, setShowForceConfirm] = useState(false)

  // Group duplicates by severity
  const grouped = {
    high: duplicates.filter((d) => getMatchSeverity(d.matchScore) === 'high'),
    medium: duplicates.filter((d) => getMatchSeverity(d.matchScore) === 'medium'),
    low: duplicates.filter((d) => getMatchSeverity(d.matchScore) === 'low'),
  }

  const hasHighSeverity = grouped.high.length > 0

  const handleCreateClick = () => {
    if (hasHighSeverity) {
      setShowForceConfirm(true)
    } else {
      onCreateAnyway()
    }
  }

  const handleConfirmForce = () => {
    setShowForceConfirm(false)
    onCreateAnyway()
  }

  const handleViewLead = (id: string) => {
    navigate(`/leads/${id}`)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className={cn(
                  'h-5 w-5',
                  hasHighSeverity ? 'text-red-600' : 'text-amber-600'
                )}
              />
              Possíveis Duplicatas Encontradas
            </DialogTitle>
            <DialogDescription>
              Encontramos {duplicates.length} lead
              {duplicates.length !== 1 ? 's' : ''} similar
              {duplicates.length !== 1 ? 'es' : ''} no sistema
            </DialogDescription>
          </DialogHeader>

          {/* Stats Badges */}
          <div className="flex items-center gap-2">
            {grouped.high.length > 0 && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                {grouped.high.length} alta probabilidade
              </Badge>
            )}
            {grouped.medium.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                {grouped.medium.length} média
              </Badge>
            )}
            {grouped.low.length > 0 && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {grouped.low.length} baixa
              </Badge>
            )}
          </div>

          {/* Input Data Preview */}
          {inputData && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <span className="font-medium">Novo lead: </span>
              {inputData.legalName}
              {inputData.cnpj && (
                <span className="text-muted-foreground"> • CNPJ: {inputData.cnpj}</span>
              )}
            </div>
          )}

          <Separator />

          {/* Duplicates List Grouped by Severity */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {grouped.high.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">
                    ALTA PROBABILIDADE
                  </h4>
                  {grouped.high.map((dup) => (
                    <DuplicateCard
                      key={dup.id}
                      candidate={dup}
                      onViewLead={handleViewLead}
                      onMerge={onMerge}
                      showMergeButton={!!onMerge}
                    />
                  ))}
                </div>
              )}

              {grouped.medium.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    MÉDIA PROBABILIDADE
                  </h4>
                  {grouped.medium.map((dup) => (
                    <DuplicateCard
                      key={dup.id}
                      candidate={dup}
                      onViewLead={handleViewLead}
                      onMerge={onMerge}
                      showMergeButton={!!onMerge}
                    />
                  ))}
                </div>
              )}

              {grouped.low.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    BAIXA PROBABILIDADE
                  </h4>
                  {grouped.low.map((dup) => (
                    <DuplicateCard
                      key={dup.id}
                      candidate={dup}
                      onViewLead={handleViewLead}
                      onMerge={onMerge}
                      showMergeButton={!!onMerge}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleCreateClick} disabled={isCreating}>
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? 'Criando...' : 'Criar Mesmo Assim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog for Force Confirmation */}
      <AlertDialog open={showForceConfirm} onOpenChange={setShowForceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirmar Criação de Lead Duplicado?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Foram encontradas {grouped.high.length} duplicata
              {grouped.high.length !== 1 ? 's' : ''} com{' '}
              <strong>alta probabilidade</strong> de ser o mesmo lead. Tem certeza que
              deseja criar mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmForce}
              className="bg-red-600 hover:bg-red-700"
            >
              Criar Mesmo Assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
