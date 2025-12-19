import { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LeadsFilterSectionProps {
  /** Section title */
  title: string
  /** Section content */
  children: ReactNode
  /** Whether the section is initially expanded */
  defaultOpen?: boolean
  /** Optional test id */
  testId?: string
  /** Optional selected count to surface in the header */
  selectedCount?: number
  /** Visual hierarchy for parent vs child sections */
  tone?: 'parent' | 'child'
}

/**
 * LeadsFilterSection - Consistent wrapper for filter sections
 * 
 * Provides a collapsible section WITHOUT internal border/rounded wrapper
 * to avoid overflow/clipping issues in scrollable containers.
 * 
 * Uses border-b as separator between sections instead of individual borders.
 * The sidebar's outer container provides the complete border.
 */
export function LeadsFilterSection({
  title,
  children,
  defaultOpen = true,
  testId,
  selectedCount,
  tone = 'child',
}: LeadsFilterSectionProps) {
  const showCount = typeof selectedCount === 'number' && selectedCount > 0
  const isParent = tone === 'parent'

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn(
        'group border-b pb-4 last:border-b-0',
        isParent ? 'pt-1' : 'pl-1'
      )}
      data-testid={testId}
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:bg-muted/60',
          isParent ? 'text-sm font-semibold' : 'text-sm font-medium'
        )}
      >
        <span className="flex items-center gap-2">
          <span>{title}</span>
          {showCount && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-semibold leading-none">
              {selectedCount}
            </Badge>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent forceMount>
        <div className="space-y-4 pt-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
