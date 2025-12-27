/**
 * Favicon Management Utility
 * 
 * Dynamically updates the browser's favicon at runtime.
 * Used by BrandingApplier to apply custom favicons from system settings.
 */

/**
 * Updates the document's favicon by creating or updating the <link rel="icon"> element
 * @param url - The URL of the favicon image, or null to remove/reset
 */
export function setFavicon(url: string | null): void {
  if (!url) {
    // Remove custom favicon (will fall back to default in index.html)
    const existingLink = document.querySelector('link[rel="icon"][data-custom="true"]')
    if (existingLink) {
      existingLink.remove()
    }
    return
  }

  // Find existing favicon link (either custom or default)
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-custom="true"]')
  
  if (!link) {
    // Create new link element
    link = document.createElement('link')
    link.rel = 'icon'
    link.setAttribute('data-custom', 'true')
    
    // Remove default favicon if exists
    const defaultLink = document.querySelector('link[rel="icon"]:not([data-custom])')
    if (defaultLink) {
      defaultLink.remove()
    }
    
    document.head.appendChild(link)
  }
  
  // Update the href
  link.href = url
}
