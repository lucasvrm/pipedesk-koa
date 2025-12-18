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
}: LeadsFilterSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group border-b pb-4 last:border-b-0" data-testid={testId}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-3 text-left hover:bg-muted/50 transition-colors rounded-lg -mx-2 px-2">
        <span className="text-sm font-medium">{title}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 pt-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
