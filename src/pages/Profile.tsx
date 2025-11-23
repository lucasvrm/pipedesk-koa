import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User as UserIcon,
  EnvelopeSimple,
  ShieldCheck,
  Calendar,
  SignOut,
  ArrowLeft,
  PencilSimple,
  Check,
  X,
  LockKey
} from '@phosphor-icons/react'
import { getInitials } from '@/lib/helpers'
import { ROLE_LABELS } from '@/lib/types'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Profile() {
  const { profile, signOut, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState(profile?.name || '')
  const [email, setEmail] = useState(profile?.email || '')

  useEffect(() => {
    // Fetch additional profile data including created_at
    const fetchProfileData = async () => {
      if (profile?.id) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', profile.id)
            .single()

          if ((data as any)?.created_at) {
            setCreatedAt((data as any).created_at)
          }
        } catch (err) {
          console.error('Error fetching profile creation date:', err)
        }
      }
    }

    fetchProfileData()
  }, [profile?.id])

  const handleSave = async () => {
    setError(null)

    if (!name || !email) {
      setError('Nome e email são obrigatórios')
      return
    }

    setIsSaving(true)
    try {
      // Update profile in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name,
          email,
        })
        .eq('id', profile?.id)

      if (updateError) throw updateError

      // Update local state
      setName(name)
      setEmail(email)

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

  const handleCancel = () => {
    setName(profile?.name || '')
    setEmail(profile?.email || '')
    setIsEditing(false)
    setError(null)
  }

  const handleResetPassword = async () => {
    if (!profile?.email) return

    try {
      await resetPassword(profile.email)
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar email de recuperação'
      toast.error(message)
    }
  }

  const handleSignOut = async () => {
    const success = await signOut()
    if (success) {
      toast.success('Você saiu do sistema')
      navigate('/login')
    } else {
      toast.error('Erro ao sair do sistema')
    }
  }

  if (!profile) {
    return null
  }

  const createdAtDate = createdAt ? new Date(createdAt) : null

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(profile.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{profile.name || 'Usuário'}</CardTitle>
                  <CardDescription className="text-base">{profile.email}</CardDescription>
                </div>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <PencilSimple className="mr-2" size={18} />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Profile Information */}
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="name"
                      type="text"
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditing || isSaving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!isEditing || isSaving}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Função</Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      className="pl-10"
                      value={ROLE_LABELS[profile.role] || profile.role}
                      disabled
                    />
                  </div>
                </div>

                {createdAtDate && (
                  <div className="space-y-2">
                    <Label>Membro desde</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        className="pl-10"
                        value={format(createdAtDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        disabled
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Check className="mr-2" size={18} />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="mr-2" size={18} />
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleResetPassword}
                >
                  <LockKey className="mr-2" size={18} />
                  Alterar Senha
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                >
                  <SignOut className="mr-2" size={18} />
                  Sair
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
