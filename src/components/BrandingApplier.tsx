import { useContext, useEffect } from 'react'
import { SystemMetadataContext } from '@/contexts/SystemMetadataContext'
import { setFavicon } from '@/lib/favicon'

/**
 * BrandingApplier Component
 * 
 * Applies branding customizations globally:
 * - Updates browser favicon dynamically from system settings
 * 
 * This component renders nothing (returns null) but performs side effects.
 * Mount once at app root level.
 */
export function BrandingApplier() {
  const context = useContext(SystemMetadataContext)
  
  useEffect(() => {
    // Extract branding.favicon from settings
    const faviconSetting = context?.settings?.find(s => s.key === 'branding.favicon')
    const faviconData = faviconSetting?.value as { url?: string; path?: string } | null | undefined
    const faviconUrl = faviconData?.url || null
    
    // Apply favicon
    setFavicon(faviconUrl)
  }, [context?.settings])

  return null
}
