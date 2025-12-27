import { useState, useContext } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { SystemMetadataContext } from '@/contexts/SystemMetadataContext'
import { supabase } from '@/lib/supabaseClient'
import { updateSystemSetting } from '@/services/settingsService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Upload, Trash2, Image as ImageIcon, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StandardPageLayout } from '@/components/layouts'
import { format } from 'date-fns'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

const LOGO_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
const FAVICON_ALLOWED_TYPES = ['image/png', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']

interface BrandAsset {
  path: string
  url: string
  contentType?: string
  updatedAt: string
}

export default function SettingsCustomizePage() {
  // Hooks no topo (ordem correta)
  const { profile } = useAuth()
  const metadataContext = useContext(SystemMetadataContext)

  // useState
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoRemoving, setLogoRemoving] = useState(false)
  const [faviconUploading, setFaviconUploading] = useState(false)
  const [faviconRemoving, setFaviconRemoving] = useState(false)

  // Early return após hooks
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  // Extract current assets from settings
  const logoSetting = metadataContext?.settings?.find(s => s.key === 'branding.logo')
  const logoData = logoSetting?.value as BrandAsset | null | undefined
  
  const faviconSetting = metadataContext?.settings?.find(s => s.key === 'branding.favicon')
  const faviconData = faviconSetting?.value as BrandAsset | null | undefined

  // Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validations
    if (!LOGO_ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato inválido', {
        description: 'Use PNG, JPG, JPEG ou SVG para o logo.'
      })
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande', {
        description: 'O logo deve ter no máximo 2MB.'
      })
      return
    }

    setLogoUploading(true)
    try {
      // Generate unique path
      const fileExt = file.name.split('.').pop()
      const filePath = `logos/${crypto.randomUUID()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file, { upsert: false })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath)

      const assetData: BrandAsset = {
        path: filePath,
        url: urlData.publicUrl,
        contentType: file.type,
        updatedAt: new Date().toISOString()
      }

      // Save to system_settings
      const { error: settingsError } = await updateSystemSetting(
        'branding.logo',
        assetData,
        'Organization logo'
      )

      if (settingsError) throw settingsError

      // Remove old file if exists
      if (logoData?.path) {
        await supabase.storage.from('branding').remove([logoData.path])
      }

      // Refresh metadata
      await metadataContext?.refreshMetadata()

      toast.success('Logo atualizado com sucesso!')
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Erro ao fazer upload do logo', {
        description: 'Tente novamente mais tarde.'
      })
    } finally {
      setLogoUploading(false)
      e.target.value = '' // Reset input
    }
  }

  const handleLogoRemove = async () => {
    if (!logoData?.path) return

    setLogoRemoving(true)
    try {
      // Remove file from storage
      const { error: storageError } = await supabase.storage
        .from('branding')
        .remove([logoData.path])

      if (storageError) throw storageError

      // Clear setting
      const { error: settingsError } = await updateSystemSetting(
        'branding.logo',
        null,
        'Organization logo (removed)'
      )

      if (settingsError) throw settingsError

      // Refresh metadata
      await metadataContext?.refreshMetadata()

      toast.success('Logo removido com sucesso!')
    } catch (error) {
      console.error('Error removing logo:', error)
      toast.error('Erro ao remover logo', {
        description: 'Tente novamente mais tarde.'
      })
    } finally {
      setLogoRemoving(false)
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validations
    if (!FAVICON_ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato inválido', {
        description: 'Use PNG, ICO ou SVG para o favicon.'
      })
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande', {
        description: 'O favicon deve ter no máximo 2MB.'
      })
      return
    }

    setFaviconUploading(true)
    try {
      // Generate unique path
      const fileExt = file.name.split('.').pop()
      const filePath = `favicons/${crypto.randomUUID()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file, { upsert: false })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath)

      const assetData: BrandAsset = {
        path: filePath,
        url: urlData.publicUrl,
        contentType: file.type,
        updatedAt: new Date().toISOString()
      }

      // Save to system_settings
      const { error: settingsError } = await updateSystemSetting(
        'branding.favicon',
        assetData,
        'Organization favicon'
      )

      if (settingsError) throw settingsError

      // Remove old file if exists
      if (faviconData?.path) {
        await supabase.storage.from('branding').remove([faviconData.path])
      }

      // Refresh metadata
      await metadataContext?.refreshMetadata()

      toast.success('Favicon atualizado com sucesso!')
    } catch (error) {
      console.error('Error uploading favicon:', error)
      toast.error('Erro ao fazer upload do favicon', {
        description: 'Tente novamente mais tarde.'
      })
    } finally {
      setFaviconUploading(false)
      e.target.value = '' // Reset input
    }
  }

  const handleFaviconRemove = async () => {
    if (!faviconData?.path) return

    setFaviconRemoving(true)
    try {
      // Remove file from storage
      const { error: storageError } = await supabase.storage
        .from('branding')
        .remove([faviconData.path])

      if (storageError) throw storageError

      // Clear setting
      const { error: settingsError } = await updateSystemSetting(
        'branding.favicon',
        null,
        'Organization favicon (removed)'
      )

      if (settingsError) throw settingsError

      // Refresh metadata
      await metadataContext?.refreshMetadata()

      toast.success('Favicon removido com sucesso!')
    } catch (error) {
      console.error('Error removing favicon:', error)
      toast.error('Erro ao remover favicon', {
        description: 'Tente novamente mais tarde.'
      })
    } finally {
      setFaviconRemoving(false)
    }
  }

  return (
    <StandardPageLayout>
      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle>Logomarca</CardTitle>
          <CardDescription>
            Logo que aparece no cabeçalho do sistema e na tela de login.
            Formatos aceitos: PNG, JPG, SVG (máx. 2MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {logoData?.url ? (
            <>
              {/* Preview: Como aparece no topo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Como aparece no topo</Label>
                <div className="border rounded-lg bg-card h-16 px-4 flex items-center">
                  <img
                    src={logoData.url}
                    alt="Logo preview no header"
                    className="h-8 w-auto object-contain"
                  />
                </div>
              </div>

              {/* Preview: Como aparece no login */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Como aparece no login</Label>
                <div className="border rounded-lg bg-card p-6">
                  <div className="text-center space-y-2">
                    <img
                      src={logoData.url}
                      alt="Logo preview no login"
                      className="h-12 w-auto object-contain mx-auto block"
                    />
                    <p className="text-sm text-muted-foreground">Sistema de DealFlow da Koa Capital.</p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Tipo:</span>
                  <span className="font-mono">{logoData.contentType || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Atualizado:</span>
                  <span>{logoData.updatedAt ? format(new Date(logoData.updatedAt), 'dd/MM/yyyy HH:mm') : 'N/A'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={logoData.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir em nova aba
                  </a>
                </Button>
                
                <Label htmlFor="logo-upload">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={logoUploading || logoRemoving}
                    asChild
                  >
                    <span>
                      {logoUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Substituir
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept={LOGO_ALLOWED_TYPES.join(',')}
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={logoUploading || logoRemoving}
                />
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogoRemove}
                  disabled={logoUploading || logoRemoving}
                >
                  {logoRemoving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Empty State */}
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center",
                  "border-muted-foreground/25 bg-muted/50"
                )}>
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Nenhum logo configurado. O sistema usará "PipeDesk" como texto.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Label htmlFor="logo-upload">
                  <Button
                    variant="default"
                    disabled={logoUploading || logoRemoving}
                    asChild
                  >
                    <span>
                      {logoUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Enviar Logo
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept={LOGO_ALLOWED_TYPES.join(',')}
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={logoUploading || logoRemoving}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Favicon Section */}
      <Card>
        <CardHeader>
          <CardTitle>Favicon</CardTitle>
          <CardDescription>
            Ícone que aparece na aba do navegador.
            Formatos aceitos: PNG, ICO, SVG (máx. 2MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {faviconData?.url ? (
            <>
              {/* Preview: Como aparece na aba */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Como aparece na aba do navegador</Label>
                <div className="border rounded-md bg-card px-3 py-2 flex items-center gap-2 w-fit">
                  <img
                    src={faviconData.url}
                    alt="Favicon preview"
                    className="h-4 w-4 object-contain"
                  />
                  <span className="text-sm">PipeDesk</span>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Tipo:</span>
                  <span className="font-mono">{faviconData.contentType || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Atualizado:</span>
                  <span>{faviconData.updatedAt ? format(new Date(faviconData.updatedAt), 'dd/MM/yyyy HH:mm') : 'N/A'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={faviconData.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir em nova aba
                  </a>
                </Button>
                
                <Label htmlFor="favicon-upload">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={faviconUploading || faviconRemoving}
                    asChild
                  >
                    <span>
                      {faviconUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Substituir
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="favicon-upload"
                  type="file"
                  accept={FAVICON_ALLOWED_TYPES.join(',')}
                  className="hidden"
                  onChange={handleFaviconUpload}
                  disabled={faviconUploading || faviconRemoving}
                />
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleFaviconRemove}
                  disabled={faviconUploading || faviconRemoving}
                >
                  {faviconRemoving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Empty State */}
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center",
                  "border-muted-foreground/25 bg-muted/50"
                )}>
                  <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Nenhum favicon configurado. O sistema usará o ícone padrão.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Label htmlFor="favicon-upload">
                  <Button
                    variant="default"
                    disabled={faviconUploading || faviconRemoving}
                    asChild
                  >
                    <span>
                      {faviconUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Enviar Favicon
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="favicon-upload"
                  type="file"
                  accept={FAVICON_ALLOWED_TYPES.join(',')}
                  className="hidden"
                  onChange={handleFaviconUpload}
                  disabled={faviconUploading || faviconRemoving}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </StandardPageLayout>
  )
}
