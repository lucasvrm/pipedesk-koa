import { useContext } from 'react'
import { SystemMetadataContext } from '@/contexts/SystemMetadataContext'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  variant?: 'header' | 'login'
  className?: string
}

/**
 * BrandMark Component
 * 
 * Displays the organization's logo from system settings (branding.logo).
 * Falls back to "PipeDesk" text if no logo is configured.
 * 
 * @param variant - 'header' for top navigation, 'login' for login page
 * @param className - Additional Tailwind classes
 */
export function BrandMark({ variant = 'header', className }: BrandMarkProps) {
  const context = useContext(SystemMetadataContext)
  
  // Extract branding.logo from settings
  const logoSetting = context?.settings?.find(s => s.key === 'branding.logo')
  const logoData = logoSetting?.value as { url?: string; path?: string } | null | undefined
  const logoUrl = logoData?.url

  // Variant-specific styling
  const variantClasses = {
    header: 'text-xl font-bold text-primary tracking-tight cursor-pointer hover:opacity-80 transition-opacity',
    login: 'text-2xl font-bold',
  }

  if (logoUrl) {
    const variantImageClasses = {
      header: 'h-8 w-auto object-contain',
      login: 'h-12 w-auto object-contain mx-auto block',
    }

    return (
      <img
        src={logoUrl}
        alt="Logo"
        data-testid="brandmark-img"
        className={cn(variantImageClasses[variant], className)}
      />
    )
  }

  // Fallback: text "PipeDesk"
  return (
    <span className={cn(variantClasses[variant], className)}>
      PipeDesk
    </span>
  )
}
