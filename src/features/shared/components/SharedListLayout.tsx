import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer } from '@/components/PageContainer'

interface SharedListLayoutProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  filtersBar?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function SharedListLayout({ title, subtitle, actions, filtersBar, children, footer }: SharedListLayoutProps) {
  return (
    <PageContainer title={title} description={subtitle} actions={actions}>
      <div className="flex flex-col gap-6">
        {filtersBar && (
          <Card>
            <CardContent className="pt-6">{filtersBar}</CardContent>
          </Card>
        )}

        {children}

        {footer}
      </div>
    </PageContainer>
  )
}

interface SharedListFiltersBarProps {
  left?: ReactNode
  right?: ReactNode
}

export function SharedListFiltersBar({ left, right }: SharedListFiltersBarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-3 items-center">{left}</div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  )
}
