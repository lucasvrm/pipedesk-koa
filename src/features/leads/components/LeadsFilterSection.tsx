import { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface LeadsFilterSectionProps {
  /** Section title */
  title: string
  /** Section content */
  children: ReactNode
  /** Whether the section is initially expanded */
  defaultOpen?: boolean
  /** Optional test id */
  testId?: string
}

/**
 * LeadsFilterSection - Consistent wrapper for filter sections
 * 
 * Provides a collapsible section with:
 * - Border on all sides (rounded)
 * - Header with title and toggle
 * - Body with padding
 * 
 * This ensures "Filtros definidos pelo sistema" and "Atividade do lead"
 * have exactly the same visual structure (consistent borders).
 */
export function LeadsFilterSection({
  title,
  children,
  defaultOpen = true,
  testId,
}: LeadsFilterSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group" data-testid={testId}>
      <div className="border rounded-lg bg-card">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-t-lg">
          <span className="text-sm font-medium">{title}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-4 py-4 space-y-4">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
