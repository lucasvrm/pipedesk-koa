import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Pencil,
  Check,
  X,
  Upload,
  FileText,
  Landmark,
  IdCard,
  CreditCard,
  MapPin,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  Linkedin,
  Copy,
  Eye,
  Clock,
  AlertTriangle,
  Camera,
  Trash,
  ImageIcon,
  ChevronDown,
  Activity,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getInitials } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import { TimelineSettings } from './components/TimelineSettings'

// ============================================================================
// TYPES
// ============================================================================
interface ProfileFormData {
  name: string
  email: string
  secondaryEmail: string
  cellphone: string
  rg: string
  cpf: string
  address: string
  pixKeyPF: string
  pixKeyPJ: string
  avatarUrl: string
  title: string
  department: string
  birthDate: string
  linkedin: string
  bio: string
  docIdentityUrl: string
  docSocialContractUrl: string
  docServiceAgreementUrl: string
  bannerStyle: string
  avatarBgColor: string
  avatarTextColor: string
  avatarBorderColor: string
}

// Banner options constants
const BANNER_OPTIONS = [
  { id: 'gradient-1', label: 'Azul Profissional', value: 'bg-gradient-to-r from-blue-600 to-blue-400' },
  { id: 'gradient-2', label: 'Verde Natureza', value: 'bg-gradient-to-r from-emerald-600 to-teal-400' },
  { id: 'gradient-3', label: 'Roxo Elegante', value: 'bg-gradient-to-r from-purple-600 to-pink-400' },
  { id: 'gradient-4', label: 'Laranja Energia', value: 'bg-gradient-to-r from-orange-500 to-amber-400' },
  { id: 'gradient-5', label: 'Cinza Neutro', value: 'bg-gradient-to-r from-gray-600 to-gray-400' },
  { id: 'gradient-6', label: 'Vermelho Intenso', value: 'bg-gradient-to-r from-red-600 to-rose-400' },
  { id: 'solid-dark', label: 'Escuro', value: 'bg-gray-800' },
  { id: 'solid-primary', label: 'Primário', value: 'bg-primary' },
]

// ============================================================================
// EDITABLE FIELD COMPONENT
// ============================================================================
interface EditableFieldProps {
  label: string
  value: string
  field: string
  onSave: (field: string, value: string) => Promise<void>
  type?: string
  placeholder?: string
  readonly?: boolean
  tooltip?: string
  isSaving?: boolean
  icon?: React.ReactNode
  colSpan?: boolean
}

function EditableField({
  label,
  value,
  field,
  onSave,
  type = 'text',
  placeholder,
  readonly = false,
  tooltip,
  isSaving = false,
  icon,
  colSpan = false,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleSave = async () => {
    if (localValue !== value) {
      await onSave(field, localValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setLocalValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  return (
    <div className={cn("group", colSpan && "md:col-span-2")}>
      <div className="flex items-center gap-2 mb-1">
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        {tooltip && (
          <span className="text-muted-foreground cursor-help text-xs" title={tooltip}>
            ⓘ
          </span>
        )}
        {readonly && (
          <Badge variant="outline" className="text-[10px]">
            Somente leitura
          </Badge>
        )}
      </div>

      {isEditing && !readonly ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            {icon && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {icon}
              </span>
            )}
            <Input
              type={type}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn("text-sm", icon && "pl-10")}
              autoFocus
              disabled={isSaving}
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !readonly && setIsEditing(true)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent text-sm transition-all min-h-[40px]",
            !readonly && "cursor-pointer hover:border-border hover:bg-accent/50 group-hover:border-border/50"
          )}
        >
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {value || placeholder || 'Não informado'}
          </span>
          {!readonly && (
            <Pencil className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-50 text-muted-foreground transition-opacity" />
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================================================
interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card>
      <CardHeader
        className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </div>
      </CardHeader>
      {isOpen && <CardContent>{children}</CardContent>}
    </Card>
  )
}

// ============================================================================
// DOCUMENT CARD COMPONENT
// ============================================================================
interface DocumentCardProps {
  title: string
  icon: React.ReactNode
  documentUrl: string
  onUpload: (file: File) => void
  onDownload: () => void
  isSaving: boolean
}

function DocumentCard({ title, icon, documentUrl, onUpload, onDownload, isSaving }: DocumentCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hasDocument = !!documentUrl

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
  }

  return (
    <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
      <CardContent className="p-4 text-center space-y-3">
        <div className="flex items-start justify-between">
          <div className="p-2 bg-muted rounded-lg">{icon}</div>
          {hasDocument ? (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Check className="h-3 w-3 mr-1" /> Enviado
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Clock className="h-3 w-3 mr-1" /> Pendente
            </Badge>
          )}
        </div>

        <div>
          <h4 className="font-medium text-sm text-foreground">{title}</h4>
          {hasDocument && <p className="text-xs text-muted-foreground mt-1">Documento enviado</p>}
        </div>

        <div className="flex gap-2">
          {hasDocument && (
            <Button variant="outline" size="sm" className="flex-1" onClick={onDownload}>
              <Eye className="h-3 w-3 mr-1" /> Ver
            </Button>
          )}
          <Button
            variant={hasDocument ? "outline" : "default"}
            size="sm"
            className="flex-1"
            onClick={() => inputRef.current?.click()}
            disabled={isSaving}
          >
            <Upload className="h-3 w-3 mr-1" />
            {hasDocument ? 'Substituir' : 'Upload'}
          </Button>
        </div>

        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN PROFILE COMPONENT
// ============================================================================
export default function Profile() {
  const { getUserRoleByCode } = useSystemMetadata()
  const { profile } = useAuth()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [isSaving, setIsSaving] = useState(false)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [lastLogin, setLastLogin] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    secondaryEmail: '',
    cellphone: '',
    rg: '',
    cpf: '',
    address: '',
    pixKeyPF: '',
    pixKeyPJ: '',
    avatarUrl: '',
    title: '',
    department: '',
    birthDate: '',
    linkedin: '',
    bio: '',
    docIdentityUrl: '',
    docSocialContractUrl: '',
    docServiceAgreementUrl: '',
    bannerStyle: 'bg-gradient-to-r from-primary via-primary/90 to-primary/70',
    avatarBgColor: '#fee2e2',
    avatarTextColor: '#991b1b',
    avatarBorderColor: '#ffffff',
  })

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        secondaryEmail: profile.secondaryEmail || '',
        cellphone: profile.cellphone || '',
        rg: profile.rg || '',
        cpf: profile.cpf || '',
        address: profile.address || '',
        pixKeyPF: profile.pixKeyPF || '',
        pixKeyPJ: profile.pixKeyPJ || '',
        avatarUrl: profile.avatar || '',
        title: profile.title || '',
        department: profile.department || '',
        birthDate: profile.birthDate || '',
        linkedin: profile.linkedin || '',
        bio: profile.bio || '',
        docIdentityUrl: profile.docIdentityUrl || '',
        docSocialContractUrl: profile.docSocialContractUrl || '',
        docServiceAgreementUrl: profile.docServiceAgreementUrl || '',
        bannerStyle: profile.bannerStyle || 'bg-gradient-to-r from-primary via-primary/90 to-primary/70',
        avatarBgColor: profile.avatarBgColor || '#fee2e2',
        avatarTextColor: profile.avatarTextColor || '#991b1b',
        avatarBorderColor: profile.avatarBorderColor || '#ffffff',
      })

      const fetchMetadata = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('created_at, last_login')
            .eq('id', profile.id)
            .single()
          
          if (data) {
            setCreatedAt(data.created_at)
            setLastLogin(data.last_login)
          }
        } catch (err) {
          console.error(err)
        }
      }
      fetchMetadata()
    }
  }, [profile])

  // Handlers
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !profile) return
    const file = event.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}-${Math.random()}.${fileExt}`

    try {
      setIsSaving(true)
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      
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

  const handleSaveField = async (field: string, value: string) => {
    if (!profile) return

    const fieldToColumn: Record<string, string> = {
      name: 'name',
      secondaryEmail: 'secondary_email',
      cellphone: 'cellphone',
      rg: 'rg',
      cpf: 'cpf',
      address: 'address',
      pixKeyPF: 'pix_key_pf',
      pixKeyPJ: 'pix_key_pj',
      title: 'title',
      department: 'department',
      birthDate: 'birth_date',
      linkedin: 'linkedin',
      bio: 'bio',
      bannerStyle: 'banner_style',
      avatarBgColor: 'avatar_bg_color',
      avatarTextColor: 'avatar_text_color',
      avatarBorderColor: 'avatar_border_color',
    }

    const column = fieldToColumn[field]
    if (!column) return

    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({ [column]: value })
        .eq('id', profile.id)

      if (error) throw error

      setFormData(prev => ({ ...prev, [field]: value }))
      toast.success('Campo atualizado!')
    } catch (err) {
      toast.error('Erro ao atualizar campo')
      console.error(err)
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
      
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file)
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

  const downloadDocument = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (e) {
      toast.error('Erro ao baixar documento')
    }
  }

  const handleCopyId = async () => {
    if (profile?.id) {
      await navigator.clipboard.writeText(profile.id)
      setCopiedId(true)
      toast.success('ID copiado!')
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const handleBannerChange = async (bannerStyle: string) => {
    await handleSaveField('bannerStyle', bannerStyle)
  }

  if (!profile) return null

  const roleInfo = getUserRoleByCode(profile.role)
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return format(new Date(dateStr), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'financial', label: 'Financeiro', icon: Landmark },
    { id: 'timeline', label: 'Timeline', icon: Activity },
  ]

  const pendingDocsCount = [formData.docIdentityUrl, formData.docSocialContractUrl, formData.docServiceAgreementUrl].filter(d => !d).length

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* HEADER COM BANNER E AVATAR */}
      {/* ================================================================ */}
      <div className="relative">
        <div className={cn("min-h-[7rem] rounded-xl relative overflow-hidden pb-14 md:pb-16", formData.bannerStyle)}>
          <div className="absolute inset-0 bg-black/10" />
            
            {/* Change Banner Button */}
            <div className="absolute top-3 right-3 z-10">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs shadow-md"
                    disabled={isSaving}
                  >
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Alterar capa
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Escolha uma capa</h4>
                      <p className="text-xs text-muted-foreground">
                        Personalize a aparência do seu perfil
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {BANNER_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleBannerChange(option.value)}
                          className={cn(
                            "relative h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                            formData.bannerStyle === option.value
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent hover:border-border"
                          )}
                        >
                          <div className={cn("w-full h-full", option.value)} />
                          {formData.bannerStyle === option.value && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Check className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                            <p className="text-[10px] text-white font-medium text-center">
                              {option.label}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="px-6 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="relative -mt-20 md:-mt-22 z-10">
                <Avatar 
                  className="h-44 w-44 border-4 border-background shadow-xl"
                  style={{
                    backgroundColor: formData.avatarBgColor,
                    borderColor: formData.avatarBorderColor
                  }}
                >
                  <AvatarImage src={formData.avatarUrl} className="object-cover" />
                  <AvatarFallback 
                    className="text-2xl"
                    style={{
                      backgroundColor: formData.avatarBgColor,
                      color: formData.avatarTextColor,
                    }}
                  >
                    {getInitials(profile.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="absolute bottom-0 right-0 flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full shadow-md"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
                  {formData.avatarUrl && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 rounded-full shadow-md"
                      onClick={handleRemoveAvatar}
                      disabled={isSaving}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="absolute bottom-1 left-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="flex-1 pb-2 pt-4 md:pt-6">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl font-bold text-foreground">{formData.name || 'Usuário'}</h1>
                  <Badge variant="default">{roleInfo?.label || profile.role}</Badge>
                </div>
                {(formData.title || formData.department) && (
                  <p className="text-sm text-muted-foreground">
                    {formData.title}{formData.title && formData.department ? ' • ' : ''}{formData.department}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* CONTEÚDO PRINCIPAL */}
        {/* ================================================================ */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* SIDEBAR INFO RÁPIDA */}
          <div className="lg:w-56 shrink-0 space-y-3">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">ID do Usuário</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground truncate">
                      {profile.id.slice(0, 8)}...{profile.id.slice(-4)}
                    </code>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCopyId}>
                      {copiedId ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Membro desde</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(createdAt)}</p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Último acesso</p>
                  <p className="text-sm font-medium text-foreground">{lastLogin ? formatDate(lastLogin) : 'Agora'}</p>
                </div>
              </CardContent>
            </Card>

            {formData.bio && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Sobre</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{formData.bio}</p>
                </CardContent>
              </Card>
            )}

            {formData.linkedin && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Links</p>
                  <a
                    href={formData.linkedin.startsWith('http') ? formData.linkedin : `https://${formData.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <Linkedin className="h-3 w-3" /> {formData.linkedin}
                  </a>
                </CardContent>
              </Card>
            )}
          </div>

          {/* CONTEÚDO CENTRAL COM TABS */}
          <div className="flex-1 space-y-4">
            {/* Tab List */}
            <div className="bg-card rounded-xl border p-1 flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* ============================================================ */}
            {/* TAB: VISÃO GERAL */}
            {/* ============================================================ */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" /> Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-3">
                    <EditableField label="Nome Completo" value={formData.name} field="name" onSave={handleSaveField} icon={<User className="h-4 w-4" />} isSaving={isSaving} />
                    <EditableField label="Email Principal" value={formData.email} field="email" onSave={handleSaveField} icon={<Mail className="h-4 w-4" />} readonly tooltip="Email de login. Contate o suporte para alterar." />
                    <EditableField label="Email Secundário" value={formData.secondaryEmail} field="secondaryEmail" onSave={handleSaveField} icon={<Mail className="h-4 w-4" />} placeholder="email@exemplo.com" isSaving={isSaving} />
                    <EditableField label="Celular / WhatsApp" value={formData.cellphone} field="cellphone" onSave={handleSaveField} icon={<Phone className="h-4 w-4" />} placeholder="(00) 00000-0000" isSaving={isSaving} />
                    <EditableField label="Cargo / Título" value={formData.title} field="title" onSave={handleSaveField} icon={<Briefcase className="h-4 w-4" />} placeholder="Ex: Gerente Comercial" isSaving={isSaving} />
                    <EditableField label="Departamento" value={formData.department} field="department" onSave={handleSaveField} icon={<Building2 className="h-4 w-4" />} placeholder="Ex: Vendas" isSaving={isSaving} />
                    <EditableField label="Data de Nascimento" value={formData.birthDate} field="birthDate" onSave={handleSaveField} icon={<Calendar className="h-4 w-4" />} type="date" isSaving={isSaving} />
                    <EditableField label="LinkedIn" value={formData.linkedin} field="linkedin" onSave={handleSaveField} icon={<Linkedin className="h-4 w-4" />} placeholder="linkedin.com/in/seu-perfil" isSaving={isSaving} />
                    <EditableField label="Bio / Sobre" value={formData.bio} field="bio" onSave={handleSaveField} icon={<FileText className="h-4 w-4" />} placeholder="Conte um pouco sobre você..." isSaving={isSaving} colSpan />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Documentos de Identificação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-3">
                    <EditableField label="CPF" value={formData.cpf} field="cpf" onSave={handleSaveField} placeholder="000.000.000-00" isSaving={isSaving} />
                    <EditableField label="RG" value={formData.rg} field="rg" onSave={handleSaveField} placeholder="00.000.000-0" isSaving={isSaving} />
                    <EditableField label="Endereço Completo" value={formData.address} field="address" onSave={handleSaveField} icon={<MapPin className="h-4 w-4" />} placeholder="Rua, Número, Bairro, Cidade - UF, CEP" isSaving={isSaving} colSpan />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB: DOCUMENTOS */}
            {/* ============================================================ */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Documentos Enviados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <DocumentCard
                        title="RG / CPF / CNH"
                        icon={<IdCard className="h-5 w-5 text-muted-foreground" />}
                        documentUrl={formData.docIdentityUrl}
                        onUpload={(file) => handleDocumentUpload(file, 'doc_identity_url', 'docIdentityUrl')}
                        onDownload={() => downloadDocument(formData.docIdentityUrl)}
                        isSaving={isSaving}
                      />
                      <DocumentCard
                        title="Contrato Social (PJ)"
                        icon={<FileText className="h-5 w-5 text-muted-foreground" />}
                        documentUrl={formData.docSocialContractUrl}
                        onUpload={(file) => handleDocumentUpload(file, 'doc_social_contract_url', 'docSocialContractUrl')}
                        onDownload={() => downloadDocument(formData.docSocialContractUrl)}
                        isSaving={isSaving}
                      />
                      <DocumentCard
                        title="Contrato de Serviço"
                        icon={<FileText className="h-5 w-5 text-muted-foreground" />}
                        documentUrl={formData.docServiceAgreementUrl}
                        onUpload={(file) => handleDocumentUpload(file, 'doc_service_agreement_url', 'docServiceAgreementUrl')}
                        onDownload={() => downloadDocument(formData.docServiceAgreementUrl)}
                        isSaving={isSaving}
                      />
                    </div>
                  </CardContent>
                </Card>

                {pendingDocsCount > 0 && (
                  <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                          {pendingDocsCount} documento{pendingDocsCount > 1 ? 's' : ''} pendente{pendingDocsCount > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          Complete seu cadastro para ter acesso a todas as funcionalidades.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB: FINANCEIRO */}
            {/* ============================================================ */}
            {activeTab === 'financial' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Landmark className="h-4 w-4" /> Dados Bancários
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-3">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Seus dados bancários são criptografados e utilizados apenas para pagamentos e reembolsos autorizados.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
                      <EditableField label="Chave PIX (Pessoa Física)" value={formData.pixKeyPF} field="pixKeyPF" onSave={handleSaveField} icon={<CreditCard className="h-4 w-4" />} placeholder="CPF, Email ou Telefone" isSaving={isSaving} />
                      <EditableField label="Chave PIX (Pessoa Jurídica)" value={formData.pixKeyPJ} field="pixKeyPJ" onSave={handleSaveField} icon={<Building2 className="h-4 w-4" />} placeholder="CNPJ, Email ou Aleatória" isSaving={isSaving} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB: TIMELINE */}
            {/* ============================================================ */}
            {activeTab === 'timeline' && <TimelineSettings />}
          </div>
        </div>
      </div>
  )
}
