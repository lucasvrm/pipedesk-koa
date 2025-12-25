import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DuplicateCandidate,
  getMatchSeverity,
  getMatchSeverityColors,
} from '../utils/duplicateMatching'

// ============================================================================
// TYPES
// ============================================================================

interface DuplicateWarningInlineProps {
  duplicates: DuplicateCandidate[]
  onViewDuplicates: () => void
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Inline warning component for duplicate detection.
 *
 * Features:
 * - Compact layout with rounded-lg border
 * - Colors based on top candidate severity
 * - AlertTriangle icon
 * - Text showing number of duplicates found
 * - Subtext showing most similar lead name and score
 * - "Ver" button to open duplicates modal
 *
 * Returns null if duplicates array is empty.
 */
export function DuplicateWarningInline({
  duplicates,
  onViewDuplicates,
  className,
}: DuplicateWarningInlineProps) {
  // Return null if no duplicates
  if (duplicates.length === 0) return null

  const topCandidate = duplicates[0]
  const severity = getMatchSeverity(topCandidate.matchScore)
  const colors = getMatchSeverityColors(severity)

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-2 rounded-lg border p-3',
        colors.bg,
        colors.border,
        className
      )}
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <AlertTriangle className={cn('h-5 w-5 mt-0.5 shrink-0', colors.text)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', colors.text)}>
            {duplicates.length} possíve{duplicates.length !== 1 ? 'is' : 'l'} duplicata
            {duplicates.length !== 1 ? 's' : ''} encontrada
            {duplicates.length !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            Lead mais similar: {topCandidate.legalName} ({topCandidate.matchScore}%
            match)
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onViewDuplicates}
        className="shrink-0"
      >
        Ver
      </Button>
    </div>
  )
}
