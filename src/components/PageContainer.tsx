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
        "space-y-6 min-w-0 w-full",
        className
      )}
    >
      {children}
    </div>
  )
}
