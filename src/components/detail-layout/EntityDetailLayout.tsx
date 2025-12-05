import { ReactNode } from 'react'
import { PageContainer } from '@/components/PageContainer'
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
    <PageContainer className={cn("pb-16 space-y-6", className)}>
      {/* Top Header Area (Pipeline Visualizer, Breadcrumbs) */}
      <div className="w-full">
        {header}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column ("Golden Column") - Persistent Info */}
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col gap-4 sticky top-6">
          {sidebar}
        </div>

        {/* Center/Right Column - Main Tabs Content */}
        <div className="lg:col-span-9 xl:col-span-9 min-w-0">
          {content}
        </div>
      </div>
    </PageContainer>
  )
}
