import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "flex-1 space-y-6 p-8 pt-6 bg-slate-50/50 dark:bg-background min-h-screen w-full max-w-none",
        className
      )}
    >
      {children}
    </div>
  )
}
