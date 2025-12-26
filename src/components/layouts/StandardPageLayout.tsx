// src/components/layouts/StandardPageLayout.tsx
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StandardPageLayoutProps {
  children: ReactNode
  className?: string
  /** @default true - Aplica padding vertical py-6 */
  withPaddingY?: boolean
  /** @default true - Aplica espaçamento vertical space-y-6 */
  withSpacing?: boolean
}

/**
 * Layout padrão para páginas da aplicação.
 * 
 * ⚠️ NÃO APLICA px-* (padding lateral vem do UnifiedLayout)
 * ✅ Aplica py-6 (espaçamento superior/inferior)
 * ✅ Aplica space-y-6 (gap entre elementos internos)
 * 
 * Referência: /profile (src/pages/Profile/index.tsx linha 572)
 * 
 * @example
 * ```tsx
 * <StandardPageLayout>
 *   <Card>Meu conteúdo</Card>
 * </StandardPageLayout>
 * ```
 */
export function StandardPageLayout({ 
  children, 
  className,
  withPaddingY = true,
  withSpacing = true
}: StandardPageLayoutProps) {
  return (
    <div 
      className={cn(
        withSpacing && "space-y-6",
        withPaddingY && "py-6",
        className
      )}
    >
      {children}
    </div>
  )
}
