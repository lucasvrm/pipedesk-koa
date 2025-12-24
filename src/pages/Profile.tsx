import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UnifiedLayout } from '@/components/UnifiedLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge, BadgeVariant } from '@/components/ui/badge'
import {
  User,
  Mail,
  ShieldCheck,
  Pencil,
  Check,
  Camera,
  Trash2,
  Upload,
  FileText,
  Landmark,
  IdCard,
  CreditCard,
  MapPin,
  Phone
} from 'lucide-react'
import { getInitials } from '@/lib/helpers'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'

export default function Profile() {
  const { getUserRoleByCode } = useSystemMetadata()
  const { profile, resetPassword } = useAuth()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    secondaryEmail: '',
    cellphone: '', // Novo campo
    rg: '',
    cpf: '',
    address: '',
    pixKeyPF: '',
    pixKeyPJ: '',
    avatarUrl: '',
    docIdentityUrl: '',
    docSocialContractUrl: '',
    docServiceAgreementUrl: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        secondaryEmail: profile.secondaryEmail || '',
        cellphone: profile.cellphone || '', // Carrega do profile
        rg: profile.rg || '',
        cpf: profile.cpf || '',
        address: profile.address || '',
        pixKeyPF: profile.pixKeyPF || '',
        pixKeyPJ: profile.pixKeyPJ || '',
        avatarUrl: profile.avatar || '',
        docIdentityUrl: profile.docIdentityUrl || '',
        docSocialContractUrl: profile.docSocialContractUrl || '',
        docServiceAgreementUrl: profile.docServiceAgreementUrl || ''
      })

      const fetchCreatedAt = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', profile.id)
            .single()
          if ((data as any)?.created_at) setCreatedAt((data as any).created_at)
        } catch (err) { console.error(err) }
      }
      fetchCreatedAt()
    }
  }, [profile])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !profile) return
    const file = event.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}-${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    try {
      setIsSaving(true)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setFormData(prev => ({ ...prev, avatarUrl: data.publicUrl }))
      toast.success('Foto de perfil atualizada!')
    } catch (error) {
      toast.error('Erro ao atualizar foto de perfil')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!profile) return
    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id)

      if (error) throw error

      setFormData(prev => ({ ...prev, avatarUrl: '' }))
      toast.success('Foto removida')
    } catch (error) {
      toast.error('Erro ao remover foto')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDocumentUpload = async (file: File, column: string, stateKey: string) => {
    if (!profile) return
    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}/${stateKey}-${Date.now()}.${fileExt}`

    try {
      setIsSaving(true)
      toast.info('Enviando documento...')
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [column]: fileName })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setFormData(prev => ({ ...prev, [stateKey]: fileName }))
      toast.success('Documento enviado com sucesso!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao enviar documento')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    setError(null)
    if (!formData.name || !formData.email) {
      setError('Nome e email são obrigatórios')
      return
    }

    setIsSaving(true)
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          secondary_email: formData.secondaryEmail,
          cellphone: formData.cellphone, // Salva o celular
          rg: formData.rg,
          cpf: formData.cpf,
          address: formData.address,
          pix_key_pf: formData.pixKeyPF,
          pix_key_pj: formData.pixKeyPJ
        })
        .eq('id', profile?.id)

      if (updateError) throw updateError

      toast.success('Perfil atualizado com sucesso!')
      setIsEditing(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar perfil'
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const downloadDocument = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 60)

      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (e) {
      toast.error('Erro ao baixar documento')
    }
  }

  if (!profile) return null

  const createdAtDate = createdAt ? new Date(createdAt) : null

  return (
    <UnifiedLayout
      activeSection="profile"
      activeItem="personal"
    >
      <div className="max-w-4xl space-y-6">
        {/* Header Card com Avatar e Info */}
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {/* Avatar com ações */}
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={formData.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-2xl">{getInitials(profile.name || 'U')}</AvatarFallback>
                  </Avatar>
                  
                  <div className="absolute bottom-0 right-0 flex gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full shadow-md hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      title="Alterar foto"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </Button>
                    {formData.avatarUrl && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 rounded-full shadow-md"
                        onClick={handleRemoveAvatar}
                        title="Remover foto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div>
                  <CardTitle className="text-2xl">{formData.name || 'Usuário'}</CardTitle>
                  <CardDescription className="text-base flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" /> {profile.email}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={(getUserRoleByCode(profile.role)?.badgeVariant as BadgeVariant) || 'default'}>
                      {getUserRoleByCode(profile.role)?.label || profile.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar Dados
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="financial">Dados Bancários</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6 animate-in fade-in-50">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input id="name" className="pl-10" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={!isEditing} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Principal (Login)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input id="email" className="pl-10" value={formData.email} disabled />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryEmail">Email Secundário</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input id="secondaryEmail" className="pl-10" value={formData.secondaryEmail} onChange={(e) => setFormData({...formData, secondaryEmail: e.target.value})} disabled={!isEditing} placeholder="email@exemplo.com" />
                    </div>
                  </div>

                  {/* CAMPO DE CELULAR ADICIONADO AQUI */}
                  <div className="space-y-2">
                    <Label htmlFor="cellphone">Celular / WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input id="cellphone" className="pl-10" value={formData.cellphone} onChange={(e) => setFormData({...formData, cellphone: e.target.value})} disabled={!isEditing} placeholder="(00) 00000-0000" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input id="cpf" className="pl-10" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} disabled={!isEditing} placeholder="000.000.000-00" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input id="rg" className="pl-10" value={formData.rg} onChange={(e) => setFormData({...formData, rg: e.target.value})} disabled={!isEditing} />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço Completo</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input id="address" className="pl-10" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} disabled={!isEditing} placeholder="Rua, Número, Bairro, Cidade - UF" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-6 animate-in fade-in-50">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pixPF">Chave PIX (Pessoa Física)</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input id="pixPF" className="pl-10" value={formData.pixKeyPF} onChange={(e) => setFormData({...formData, pixKeyPF: e.target.value})} disabled={!isEditing} placeholder="CPF, Email ou Telefone" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pixPJ">Chave PIX (Pessoa Jurídica)</Label>
                    <div className="relative">
                      <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input id="pixPJ" className="pl-10" value={formData.pixKeyPJ} onChange={(e) => setFormData({...formData, pixKeyPJ: e.target.value})} disabled={!isEditing} placeholder="CNPJ, Email ou Aleatória" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-lg flex gap-3 text-sm text-muted-foreground">
                  <ShieldCheck className="h-6 w-6 shrink-0" />
                  <p>Esses dados são utilizados apenas para fins de pagamentos e reembolsos autorizados. Suas informações bancárias são armazenadas de forma segura.</p>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6 animate-in fade-in-50">
                <div className="grid gap-6 md:grid-cols-3">
                  <Card className="border-dashed border-2">
                    <CardHeader className="p-4 text-center">
                      <IdCard className="mx-auto text-muted-foreground mb-2 h-8 w-8" />
                      <CardTitle className="text-sm">RG / CPF / CNH</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-center space-y-3">
                      {formData.docIdentityUrl ? (
                        <div className="text-xs">
                          <p className="text-green-600 font-medium mb-2 flex items-center justify-center gap-1"><Check className="h-3 w-3" /> Enviado</p>
                          <Button variant="outline" size="sm" onClick={() => downloadDocument(formData.docIdentityUrl)}>Visualizar</Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Pendente envio</p>
                      )}
                      
                      {isEditing && (
                        <div className="mt-2">
                          <input 
                            type="file" 
                            id="upload-identity" 
                            className="hidden" 
                            onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0], 'doc_identity_url', 'docIdentityUrl')}
                          />
                          <Button size="sm" variant="secondary" className="w-full" onClick={() => document.getElementById('upload-identity')?.click()}>
                            <Upload className="mr-2 h-3.5 w-3.5" /> Upload
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-dashed border-2">
                    <CardHeader className="p-4 text-center">
                      <FileText className="mx-auto text-muted-foreground mb-2 h-8 w-8" />
                      <CardTitle className="text-sm">Contrato Social (PJ)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-center space-y-3">
                      {formData.docSocialContractUrl ? (
                        <div className="text-xs">
                          <p className="text-green-600 font-medium mb-2 flex items-center justify-center gap-1"><Check className="h-3 w-3" /> Enviado</p>
                          <Button variant="outline" size="sm" onClick={() => downloadDocument(formData.docSocialContractUrl)}>Visualizar</Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Pendente envio</p>
                      )}
                      
                      {isEditing && (
                        <div className="mt-2">
                          <input 
                            type="file" 
                            id="upload-social" 
                            className="hidden" 
                            onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0], 'doc_social_contract_url', 'docSocialContractUrl')}
                          />
                          <Button size="sm" variant="secondary" className="w-full" onClick={() => document.getElementById('upload-social')?.click()}>
                            <Upload className="mr-2 h-3.5 w-3.5" /> Upload
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-dashed border-2">
                    <CardHeader className="p-4 text-center">
                      <FileText className="mx-auto text-muted-foreground mb-2 h-8 w-8" />
                      <CardTitle className="text-sm">Contrato de Serviço</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-center space-y-3">
                      {formData.docServiceAgreementUrl ? (
                        <div className="text-xs">
                          <p className="text-green-600 font-medium mb-2 flex items-center justify-center gap-1"><Check className="h-3 w-3" /> Enviado</p>
                          <Button variant="outline" size="sm" onClick={() => downloadDocument(formData.docServiceAgreementUrl)}>Visualizar</Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Pendente envio</p>
                      )}
                      
                      {isEditing && (
                        <div className="mt-2">
                          <input 
                            type="file" 
                            id="upload-service" 
                            className="hidden" 
                            onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0], 'doc_service_agreement_url', 'docServiceAgreementUrl')}
                          />
                          <Button size="sm" variant="secondary" className="w-full" onClick={() => document.getElementById('upload-service')?.click()}>
                            <Upload className="mr-2 h-3.5 w-3.5" /> Upload
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {isEditing && (
              <div className="flex justify-end gap-3 mt-8 border-t pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            )}

            <div className="mt-8 text-xs text-muted-foreground text-center border-t pt-4">
              Membro desde {createdAtDate ? format(createdAtDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '...'} • 
              <button onClick={() => resetPassword(profile.email)} className="ml-1 hover:underline text-primary">Redefinir Senha</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  )
}