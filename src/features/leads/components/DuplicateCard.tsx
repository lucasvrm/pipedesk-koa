import { ExternalLink, GitMerge } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

interface DuplicateCardProps {
  candidate: DuplicateCandidate
  onViewLead?: (id: string) => void
  onMerge?: (id: string) => void
  showMergeButton?: boolean // default true
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Card component that displays a single duplicate candidate.
 *
 * Features:
 * - Border-left colored by severity (4px)
 * - Header with score badge, matched field badges, action buttons
 * - Lead info: legalName, cnpj, website
 * - Matched fields details with scores
 */
export function DuplicateCard({
  candidate,
  onViewLead,
  onMerge,
  showMergeButton = true,
  className,
}: DuplicateCardProps) {
  const severity = getMatchSeverity(candidate.matchScore)
  const colors = getMatchSeverityColors(severity)

  return (
    <Card className={cn(colors.bg, colors.border, 'border-l-4', className)}>
      <CardContent className="pt-4 space-y-3">
        {/* Header: Score + Badges + Buttons */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={colors.badge}>{candidate.matchScore}% match</Badge>
            {candidate.matchedFields.map((field) => (
              <Badge key={field.field} variant="outline" className="text-xs">
                {field.label}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {onViewLead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewLead(candidate.id)
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {showMergeButton && onMerge && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMerge(candidate.id)
                }}
              >
                <GitMerge className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Lead Info */}
        <div>
          <h4 className="font-semibold text-foreground">{candidate.legalName}</h4>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {candidate.cnpj && <span>CNPJ: {candidate.cnpj}</span>}
            {candidate.website && (
              <>
                {candidate.cnpj && <span>•</span>}
                <span>{candidate.website}</span>
              </>
            )}
          </div>
        </div>

        {/* Matched Fields Details */}
        <div className="space-y-1">
          {candidate.matchedFields.map((field) => (
            <div
              key={field.field}
              className="text-xs text-muted-foreground flex items-baseline gap-2"
            >
              <span className="font-medium">{field.label}:</span>
              <span className="truncate">
                &quot;{field.inputValue}&quot; ↔ &quot;{field.matchedValue}&quot;
              </span>
              <span className={cn('ml-auto font-semibold', colors.text)}>
                [{field.score}%]
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
