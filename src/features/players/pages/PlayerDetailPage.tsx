import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { usePlayer, createPlayer, updatePlayer } from '@/services/playerService'
import { useCreateContact, useDeleteContact } from '@/services/contactService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  ArrowLeft, FloppyDisk, Buildings, User, Plus, Trash,
  Phone, Envelope, Star, PencilSimple, X
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  Player,
  PLAYER_TYPE_LABELS,
  ASSET_MANAGER_TYPE_LABELS,
  AssetManagerType,
  RELATIONSHIP_LEVEL_LABELS,
  CREDIT_SUBTYPE_LABELS,
  EQUITY_SUBTYPE_LABELS,
  BARTER_SUBTYPE_LABELS,
  PlayerType
} from '@/lib/types'

// Estilo Padrão (Cinza/Muted) - Para campos secundários
const INPUT_STYLE_SECONDARY = "disabled:opacity-100 disabled:cursor-default disabled:bg-transparent disabled:border-border/50 disabled:text-muted-foreground text-muted-foreground font-medium"

// Estilo Destaque (Preto/Foreground) - Apenas para o Nome
const INPUT_STYLE_PRIMARY = "disabled:opacity-100 disabled:cursor-default disabled:bg-transparent disabled:border-border/50 disabled:text-foreground text-foreground font-bold text-lg"

export default function PlayerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()

  const isNew = id === 'new'
  const startEditing = isNew || location.state?.startEditing
  const [isEditing, setIsEditing] = useState(!!startEditing)

  const { data: player, isLoading, refetch } = usePlayer(isNew ? undefined : id)
  const createContactMutation = useCreateContact()
  const deleteContactMutation = useDeleteContact()

  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  const [formData, setFormData] = useState<Partial<Player>>({
    name: '',
    cnpj: '',
    site: '',
    type: 'bank',
    relationshipLevel: 'none',
    gestoraTypes: [],
    products: { credit: [], equity: [], barter: [] },
    description: '',
  })

  const [newContact, setNewContact] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    isPrimary: false
  })

  useEffect(() => {
    if (player) {
      setFormData({
        ...player,
        products: player.products || { credit: [], equity: [], barter: [] },
        gestoraTypes: player.gestoraTypes || []
      })
    }
  }, [player])

  const toggleProduct = (category: 'credit' | 'equity' | 'barter', subtype: string) => {
    if (!isEditing) return
    setFormData(prev => {
      const currentList = prev.products?.[category] || []
      const newList = currentList.includes(subtype as any)
        ? currentList.filter(i => i !== subtype)
        : [...currentList, subtype as any]
      return {
        ...prev,
        products: { ...prev.products, [category]: newList }
      }
    })
  }

  const toggleGestoraType = (type: AssetManagerType) => {
    if (!isEditing) return
    setFormData(prev => {
      const current = prev.gestoraTypes || []
      const newList = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type]
      return { ...prev, gestoraTypes: newList }
    })
  }

  const handleSavePlayer = async () => {
    if (!profile) return
    if (!formData.name) return toast.error('Nome é obrigatório')

    try {
      if (isNew) {
        const created = await createPlayer(formData, profile.id)
        toast.success('Player criado com sucesso')
        navigate(`/players/${created.id}`, { replace: true })
        setIsEditing(false)
      } else if (id) {
        await updatePlayer(id, formData, profile.id)
        toast.success('Player atualizado')
        setIsEditing(false)
        refetch()
      }
    } catch (error) {
      toast.error('Erro ao salvar')
      console.error(error)
    }
  }

  const handleCancel = () => {
    if (isNew) {
      navigate('/players')
    } else {
      if (player) {
        const cleanPlayer = JSON.parse(JSON.stringify(player));
        setFormData({
          ...cleanPlayer,
          products: cleanPlayer.products || { credit: [], equity: [], barter: [] },
          gestoraTypes: cleanPlayer.gestoraTypes || []
        })
      }
      setIsEditing(false)
    }
  }

  const handleAddContact = async () => {
    if (!profile || !id || isNew) return
    if (!newContact.name) return toast.error('Nome do contato é obrigatório')

    try {
      await createContactMutation.mutateAsync({
        userId: profile.id,
        contact: { ...newContact, playerId: id }
      })
      toast.success('Contato adicionado')
      setNewContact({ name: '', role: '', email: '', phone: '', isPrimary: false })
      setIsContactModalOpen(false)
    } catch (error) {
      toast.error('Erro ao adicionar contato')
    }
  }

  const ActionButtons = () => {
    if (isEditing) {
      return (
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2" /> Cancelar
          </Button>
          <Button onClick={handleSavePlayer}>
            <FloppyDisk className="mr-2" /> Salvar
          </Button>
        </div>
      )
    }
    return (
      <Button onClick={() => setIsEditing(true)}>
        <PencilSimple className="mr-2" /> Editar
      </Button>
    )
  }

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  return (
    <div className="container mx-auto p-6 max-w-5xl pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/players')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Buildings className="text-primary" />
              {isNew ? 'Novo Player' : (player?.name || formData.name)}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? 'Adicione uma nova entidade à base' : `Visualizando informações de ${player?.name}`}
            </p>
          </div>
        </div>
        <ActionButtons />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUNA ESQUERDA: ABAS (Informações / Produtos) */}
        <div className="lg:col-span-2 space-y-6">
          
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="products">Produtos & Teses</TabsTrigger>
            </TabsList>

            {/* ABA 1: INFORMAÇÕES */}
            <TabsContent value="info" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações</CardTitle> {/* Item 1: Título Alterado */}
                </CardHeader>
                {/* Item 5: Espaçamento aumentado para gap-6 */}
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome do Player *</Label> {/* Item 2: Label Alterado */}
                    <Input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      className={INPUT_STYLE_PRIMARY} // Item 3: Cor Preta/Destaque
                      placeholder="Ex: XP Investimentos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input
                      value={formData.cnpj}
                      onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                      disabled={!isEditing}
                      className={INPUT_STYLE_SECONDARY} // Item 3: Cor Cinza
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Site</Label>
                    <Input
                      value={formData.site}
                      onChange={e => setFormData({ ...formData, site: e.target.value })}
                      disabled={!isEditing}
                      className={INPUT_STYLE_SECONDARY}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Player</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v: PlayerType) => setFormData({ ...formData, type: v })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className={INPUT_STYLE_SECONDARY}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PLAYER_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Nível de Relacionamento</Label>
                    <Select
                      value={formData.relationshipLevel}
                      onValueChange={(v: any) => setFormData({ ...formData, relationshipLevel: v })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className={INPUT_STYLE_SECONDARY}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(RELATIONSHIP_LEVEL_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === 'asset_manager' && (
                    <div className="md:col-span-2 bg-muted/30 p-4 rounded-lg border">
                      <Label className="mb-3 block text-primary font-semibold">Tipos de Fundos sob Gestão</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(ASSET_MANAGER_TYPE_LABELS).map(([key, label]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={`gestora-${key}`}
                              checked={formData.gestoraTypes?.includes(key as any)}
                              onCheckedChange={() => toggleGestoraType(key as any)}
                              disabled={!isEditing}
                              className="disabled:opacity-100 disabled:cursor-default data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                            <Label htmlFor={`gestora-${key}`} className="text-sm font-normal cursor-pointer disabled:cursor-default text-muted-foreground">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2 space-y-2">
                    <Label>Observações / Tese</Label>
                    <Textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      disabled={!isEditing}
                      className={`${INPUT_STYLE_SECONDARY} h-24`}
                      placeholder="Detalhes adicionais sobre o player..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 2: PRODUTOS */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Produtos & Teses</CardTitle>
                  <CardDescription>Tipos de operações que este player analisa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {['credit', 'equity', 'barter'].map((category) => {
                    const labels = category === 'credit' ? CREDIT_SUBTYPE_LABELS
                      : category === 'equity' ? EQUITY_SUBTYPE_LABELS
                        : BARTER_SUBTYPE_LABELS
                    const color = category === 'credit' ? 'bg-blue-500'
                      : category === 'equity' ? 'bg-green-500'
                        : 'bg-purple-500'
                    const title = category === 'credit' ? 'Crédito'
                      : category === 'equity' ? 'Equity'
                        : 'Permuta'

                    return (
                      <div key={category}>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                          <div className={`w-2 h-2 rounded-full ${color}`} /> {title}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(labels).map(([key, label]) => (
                            <div key={key} className={`flex items-center space-x-2 p-2 rounded border border-transparent ${isEditing ? 'bg-slate-50 hover:border-border' : ''}`}>
                              <Checkbox
                                id={`${category}-${key}`}
                                checked={formData.products?.[category as any]?.includes(key as any)}
                                onCheckedChange={() => toggleProduct(category as any, key)}
                                disabled={!isEditing}
                                className="disabled:opacity-100 disabled:cursor-default data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                              />
                              <Label htmlFor={`${category}-${key}`} className="text-xs cursor-pointer disabled:cursor-default text-muted-foreground">{label}</Label>
                            </div>
                          ))}
                        </div>
                        {category !== 'barter' && <Separator className="mt-6" />}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Ações Rodapé Coluna Esquerda */}
          <div className="flex justify-end">
            <ActionButtons />
          </div>
        </div>

        {/* COLUNA DIREITA: Contatos (Fixo/Visível em ambas as abas) */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Contatos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {isNew ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Salve o player primeiro para gerenciar contatos.
                </div>
              ) : (
                <>
                  {/* Lista de Contatos */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {player?.contacts?.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum contato cadastrado.</p>
                    ) : (
                      player?.contacts?.map(contact => (
                        <div key={contact.id} className="p-3 rounded-lg border bg-card text-sm relative group hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold flex items-center gap-2">
                              {contact.name}
                              {contact.isPrimary && <Star weight="fill" className="text-yellow-500 h-3 w-3" title="Principal" />}
                            </span>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                                onClick={() => {
                                  if (confirm('Excluir contato?')) deleteContactMutation.mutate(contact.id)
                                }}
                              >
                                <Trash size={14} />
                              </Button>
                            )}
                          </div>
                          <div className="text-muted-foreground text-xs mb-2">{contact.role}</div>
                          <div className="space-y-1">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Envelope className="h-3 w-3" /> {contact.email}
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" /> {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Botão Novo Contato */}
                  <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full" variant="outline">
                        <Plus className="mr-2" /> Novo Contato
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Contato</DialogTitle>
                        <DialogDescription>Preencha as informações do novo contato para este player.</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input
                            placeholder="Nome completo"
                            value={newContact.name}
                            onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cargo</Label>
                          <Input
                            placeholder="Ex: Analista, Diretor"
                            value={newContact.role}
                            onChange={e => setNewContact({ ...newContact, role: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            placeholder="email@empresa.com"
                            value={newContact.email}
                            onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone</Label>
                          <Input
                            placeholder="(00) 00000-0000"
                            value={newContact.phone}
                            onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Checkbox
                            id="is-primary"
                            checked={newContact.isPrimary}
                            onCheckedChange={(c) => setNewContact({ ...newContact, isPrimary: !!c })}
                          />
                          <Label htmlFor="is-primary" className="text-sm cursor-pointer">Definir como Contato Principal</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsContactModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddContact}>Salvar Contato</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}