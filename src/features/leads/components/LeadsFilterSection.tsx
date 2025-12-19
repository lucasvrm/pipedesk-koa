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
  /** Count of selected filters in this section */
  count?: number
  /** Visual variant: default (Parent) or sub (Child) */
  variant?: 'default' | 'sub'
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
  count = 0,
  variant = 'default'
}: LeadsFilterSectionProps) {
  const isSub = variant === 'sub'

  return (
    <Collapsible defaultOpen={defaultOpen} className="group border-b pb-4 last:border-b-0" data-testid={testId}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between py-3 text-left hover:bg-muted/50 transition-colors rounded-lg -mx-2 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isSub && "pl-4"
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn(
            isSub ? "text-sm font-medium" : "text-sm font-semibold"
          )}>
            {title}
          </span>
          {count > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 min-w-[1.25rem] justify-center text-[10px]">
              {count}
            </Badge>
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent forceMount>
        <div className={cn(
          "space-y-4 pt-2 group-data-[state=closed]:hidden",
          isSub && "pl-2"
        )}>
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
