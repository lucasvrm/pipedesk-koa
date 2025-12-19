import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EntityDetailLayoutProps {
  header: ReactNode
  sidebar: ReactNode
  content: ReactNode
  className?: string
}

export function EntityDetailLayout({
  header,
  sidebar,
  content,
  className
}: EntityDetailLayoutProps) {
  return (
    <div className={cn("pb-16 space-y-6", className)}>
      {/* Top Header Area (Pipeline Visualizer, Breadcrumbs) */}
      <div className="w-full">
        {header}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column ("Golden Column") - Persistent Info with Sticky + Internal Scroll */}
        <aside 
          className="lg:col-span-3 xl:col-span-3 flex flex-col gap-4 lg:sticky lg:top-6"
          style={{ maxHeight: 'calc(100vh - 4rem)' }}
          data-testid="entity-detail-sidebar"
        >
          <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            {sidebar}
          </div>
        </aside>

        {/* Center/Right Column - Main Tabs Content */}
        <main className="lg:col-span-9 xl:col-span-9 min-w-0">
          {content}
        </main>
      </div>
    </div>
  )
}
