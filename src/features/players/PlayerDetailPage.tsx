import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, FloppyDisk, Buildings, User, Plus, Trash, 
  Phone, Envelope, Star 
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

export default function PlayerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isNew = id === 'new'
  
  const { data: player, isLoading } = usePlayer(isNew ? undefined : id)
  const createContactMutation = useCreateContact()
  const deleteContactMutation = useDeleteContact()
  
  // Estado do Player
  const [formData, setFormData] = useState<Partial<Player>>({
    name: '',
    cnpj: '',
    site: '',
    type: 'bank', // Default
    relationshipLevel: 'none',
    gestoraTypes: [],
    products: { credit: [], equity: [], barter: [] },
    description: '',
  })

  // Estado do Novo Contato (Mini form local)
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

  // Handlers de Produtos (Checkbox Logic)
  const toggleProduct = (
    category: 'credit' | 'equity' | 'barter',
    subtype: string
  ) => {
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
        // Redirecionar para edição para poder adicionar contatos
        navigate(`/players/${created.id}`, { replace: true })
      } else if (id) {
        await updatePlayer(id, formData, profile.id)
        toast.success('Player atualizado')
      }
    } catch (error) {
      toast.error('Erro ao salvar')
      console.error(error)
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
    } catch (error) {
      toast.error('Erro ao adicionar contato')
    }
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
              {isNew ? 'Novo Player' : formData.name}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? 'Adicione uma nova entidade à base' : `Gerenciando informações de ${formData.name}`}
            </p>
          </div>
        </div>
        <Button onClick={handleSavePlayer} size="lg">
          <FloppyDisk className="mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: Dados Cadastrais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Cadastrais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome da Entidade *</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: XP Investimentos"
                />
              </div>
              
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input 
                  value={formData.cnpj} 
                  onChange={e => setFormData({...formData, cnpj: e.target.value})}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label>Site</Label>
                <Input 
                  value={formData.site} 
                  onChange={e => setFormData({...formData, site: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Player</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v: PlayerType) => setFormData({...formData, type: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  onValueChange={(v: any) => setFormData({...formData, relationshipLevel: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(RELATIONSHIP_LEVEL_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Área condicional para Gestoras */}
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
                        />
                        <Label htmlFor={`gestora-${key}`} className="text-sm font-normal cursor-pointer">
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
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="h-24"
                  placeholder="Detalhes adicionais sobre o player..."
                />
              </div>
            </CardContent>
          </Card>

          {/* PRODUTOS E SUBTIPOS */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos & Teses</CardTitle>
              <CardDescription>Selecione os tipos de operações que este player analisa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Crédito */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> Crédito
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(CREDIT_SUBTYPE_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-transparent hover:border-border">
                      <Checkbox 
                        id={`credit-${key}`}
                        checked={formData.products?.credit?.includes(key as any)}
                        onCheckedChange={() => toggleProduct('credit', key)}
                      />
                      <Label htmlFor={`credit-${key}`} className="text-xs cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Equity */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> Equity
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(EQUITY_SUBTYPE_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-transparent hover:border-border">
                      <Checkbox 
                        id={`equity-${key}`}
                        checked={formData.products?.equity?.includes(key as any)}
                        onCheckedChange={() => toggleProduct('equity', key)}
                      />
                      <Label htmlFor={`equity-${key}`} className="text-xs cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Permuta */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-purple-500" /> Permuta
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(BARTER_SUBTYPE_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-transparent hover:border-border">
                      <Checkbox 
                        id={`barter-${key}`}
                        checked={formData.products?.barter?.includes(key as any)}
                        onCheckedChange={() => toggleProduct('barter', key)}
                      />
                      <Label htmlFor={`barter-${key}`} className="text-xs cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA: Contatos */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Contatos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {isNew ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Salve o player para adicionar contatos.
                </div>
              ) : (
                <>
                  {/* Lista de Contatos */}
                  <div className="flex-1 space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
                    {player?.contacts?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum contato cadastrado.</p>
                    )}
                    {player?.contacts?.map(contact => (
                      <div key={contact.id} className="p-3 rounded-lg border bg-card text-sm relative group">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold flex items-center gap-2">
                            {contact.name}
                            {contact.isPrimary && <Star weight="fill" className="text-yellow-500 h-3 w-3" title="Principal" />}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                            onClick={() => {
                              if(confirm('Excluir contato?')) deleteContactMutation.mutate(contact.id)
                            }}
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                        <div className="text-muted-foreground text-xs mb-2">{contact.role}</div>
                        <div className="space-y-1">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-xs">
                              <Envelope className="h-3 w-3" /> {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-xs">
                              <Phone className="h-3 w-3" /> {contact.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="mb-4" />

                  {/* Form de Adicionar Contato */}
                  <div className="space-y-3 bg-muted/20 p-3 rounded-lg border border-dashed">
                    <h4 className="text-sm font-medium">Novo Contato</h4>
                    <Input 
                      placeholder="Nome" 
                      value={newContact.name}
                      onChange={e => setNewContact({...newContact, name: e.target.value})}
                      className="h-8 text-sm"
                    />
                    <Input 
                      placeholder="Cargo" 
                      value={newContact.role}
                      onChange={e => setNewContact({...newContact, role: e.target.value})}
                      className="h-8 text-sm"
                    />
                    <Input 
                      placeholder="Email" 
                      value={newContact.email}
                      onChange={e => setNewContact({...newContact, email: e.target.value})}
                      className="h-8 text-sm"
                    />
                    <Input 
                      placeholder="Telefone" 
                      value={newContact.phone}
                      onChange={e => setNewContact({...newContact, phone: e.target.value})}
                      className="h-8 text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="is-primary" 
                        checked={newContact.isPrimary}
                        onCheckedChange={(c) => setNewContact({...newContact, isPrimary: !!c})}
                      />
                      <Label htmlFor="is-primary" className="text-xs">Contato Principal</Label>
                    </div>
                    <Button size="sm" className="w-full" onClick={handleAddContact}>
                      <Plus className="mr-2" /> Adicionar
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}