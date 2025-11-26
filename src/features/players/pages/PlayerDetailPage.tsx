import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { usePlayer, createPlayer, updatePlayer } from '@/services/playerService'
import { useCreateContact, useDeleteContact } from '@/services/contactService'
import { usePlayerTracks, useCreateTrack, useDeleteTrack } from '@/services/trackService'
import { useDeals, useCreateDeal } from '@/services/dealService' // Importado useCreateDeal
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { 
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft, FloppyDisk, Buildings, User, Plus, Trash,
  Phone, Envelope, Star, PencilSimple, X, Funnel, CaretUp, CaretDown, CaretUpDown, Link as LinkIcon
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
  ALL_PRODUCT_LABELS,
  PlayerType,
  PlayerStage,
  STAGE_LABELS
} from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'

const INPUT_STYLE_SECONDARY = "disabled:opacity-100 disabled:cursor-default disabled:bg-transparent disabled:border-border/50 disabled:text-muted-foreground text-muted-foreground font-medium"
const INPUT_STYLE_PRIMARY = "disabled:opacity-100 disabled:cursor-default disabled:bg-transparent disabled:border-border/50 disabled:text-foreground text-foreground font-bold text-lg"

type DealSortKey = 'dealName' | 'dealProduct' | 'trackVolume' | 'currentStage';
type SortDirection = 'asc' | 'desc';

interface DealSortConfig {
  key: DealSortKey;
  direction: SortDirection;
}

export default function PlayerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()

  const isNew = id === 'new'
  const startEditing = isNew || location.state?.startEditing
  const [isEditing, setIsEditing] = useState(!!startEditing)

  // Hooks de dados
  const { data: player, isLoading, refetch } = usePlayer(isNew ? undefined : id)
  const { data: playerTracks, isLoading: isLoadingTracks } = usePlayerTracks(isNew ? undefined : id)
  
  // Hooks para vincular/desvincular e criar deals
  const { data: allDeals } = useDeals() 
  const createTrackMutation = useCreateTrack()
  const deleteTrackMutation = useDeleteTrack()
  const createDealMutation = useCreateDeal() // Mutation para criar novo deal
  
  const createContactMutation = useCreateContact()
  const deleteContactMutation = useDeleteContact()

  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isLinkDealModalOpen, setIsLinkDealModalOpen] = useState(false)
  const [selectedDealToLink, setSelectedDealToLink] = useState<string>('')

  // Estado para criação rápida de deal
  const [newDealForm, setNewDealForm] = useState({
    clientName: '',
    volume: '',
    dealProduct: '',
  })

  // Estados da tabela de Deals
  const [dealSortConfig, setDealSortConfig] = useState<DealSortConfig | null>(null)
  const [dealStageFilters, setDealStageFilters] = useState<PlayerStage[]>([])

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

  // --- Lógica de Tabela de Deals (Ordenação e Filtro) ---
  
  const handleDealSort = (key: DealSortKey) => {
    setDealSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const processedDeals = useMemo(() => {
    if (!playerTracks) return [];

    let result = playerTracks.filter(track => {
      if (dealStageFilters.length > 0 && !dealStageFilters.includes(track.currentStage)) return false;
      return true;
    });

    if (dealSortConfig) {
      result.sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        switch (dealSortConfig.key) {
          case 'dealName':
            aValue = (a as any).dealName || ''; 
            bValue = (b as any).dealName || '';
            break;
          case 'dealProduct':
            const prodA = (a as any).dealProduct;
            const prodB = (b as any).dealProduct;
            aValue = prodA ? ALL_PRODUCT_LABELS[prodA] || '' : '';
            bValue = prodB ? ALL_PRODUCT_LABELS[prodB] || '' : '';
            break;
          case 'trackVolume':
            aValue = a.trackVolume || 0;
            bValue = b.trackVolume || 0;
            break;
          case 'currentStage':
            const stageOrder: Record<string, number> = { 'nda': 0, 'analysis': 1, 'proposal': 2, 'negotiation': 3, 'closing': 4 };
            aValue = stageOrder[a.currentStage] || -1;
            bValue = stageOrder[b.currentStage] || -1;
            break;
        }

        if (aValue < bValue) return dealSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return dealSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [playerTracks, dealStageFilters, dealSortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: DealSortKey }) => {
    if (dealSortConfig?.key !== columnKey) return <CaretUpDown className="ml-1 h-3 w-3 text-muted-foreground opacity-50" weight="bold" />;
    return dealSortConfig.direction === 'asc' 
      ? <CaretUp className="ml-1 h-3 w-3 text-primary" weight="bold" />
      : <CaretDown className="ml-1 h-3 w-3 text-primary" weight="bold" />;
  };

  // --- Lógica de Vinculação (Link/Unlink) ---

  const handleLinkExistingDeal = async () => {
    if (!profile || !id || !selectedDealToLink || !player) return
    
    const alreadyLinked = playerTracks?.some(t => t.masterDealId === selectedDealToLink)
    if (alreadyLinked) {
      toast.error('Este deal já está vinculado a este player.')
      return
    }

    const selectedMasterDeal = allDeals?.find(d => d.id === selectedDealToLink)
    if (!selectedMasterDeal) return

    try {
      await createTrackMutation.mutateAsync({
        masterDealId: selectedDealToLink,
        playerName: player.name,
        playerId: id, // CORREÇÃO: Passando o ID do player
        currentStage: 'nda',
        trackVolume: selectedMasterDeal.volume,
        probability: 10,
        status: 'active'
      })
      toast.success('Deal vinculado com sucesso')
      setIsLinkDealModalOpen(false)
      setSelectedDealToLink('')
    } catch (error) {
      toast.error('Erro ao vincular deal')
    }
  }

  const handleCreateAndLinkDeal = async () => {
    if (!profile || !id || !newDealForm.clientName) return toast.error('Nome do deal é obrigatório');
    
    try {
      await createDealMutation.mutateAsync({
        clientName: newDealForm.clientName,
        volume: Number(newDealForm.volume) || 0,
        dealProduct: newDealForm.dealProduct,
        createdBy: profile.id,
        playerId: id, // Isso ativa a criação automática do track no backend (vide dealService)
        initialStage: 'nda'
      })
      toast.success('Novo deal criado e vinculado!')
      setIsLinkDealModalOpen(false)
      setNewDealForm({ clientName: '', volume: '', dealProduct: '' })
    } catch (error) {
      toast.error('Erro ao criar e vincular deal')
    }
  }

  const handleUnlinkDeal = async (trackId: string) => {
    if (confirm('Tem certeza que deseja desvincular este deal? O histórico dessa interação será perdido.')) {
      try {
        await deleteTrackMutation.mutateAsync(trackId)
        toast.success('Deal desvinculado')
      } catch (error) {
        toast.error('Erro ao desvincular deal')
      }
    }
  }

  // --- Fim Lógica de Tabela ---

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

        <div className="lg:col-span-2 space-y-6">
          
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="products">Produtos & Teses</TabsTrigger>
              <TabsTrigger value="deals">Deals ({playerTracks?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              <Card>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6"> 
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome do Player *</Label>
                    <Input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      className={INPUT_STYLE_PRIMARY}
                      placeholder="Ex: XP Investimentos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input
                      value={formData.cnpj}
                      onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                      disabled={!isEditing}
                      className={INPUT_STYLE_SECONDARY}
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

            <TabsContent value="deals">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Deals Vinculados</CardTitle>
                    <CardDescription>Oportunidades apresentadas para este player.</CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    {!isNew && (
                      <Dialog open={isLinkDealModalOpen} onOpenChange={setIsLinkDealModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <LinkIcon className="mr-2 h-4 w-4" /> Vincular Deal
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Vincular Deal</DialogTitle>
                            <DialogDescription>
                              Selecione um deal existente ou crie um novo para apresentar a este player.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Tabs defaultValue="existing" className="w-full mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="existing">Selecionar Existente</TabsTrigger>
                              <TabsTrigger value="new">Criar e Vincular</TabsTrigger>
                            </TabsList>
                            
                            {/* ABA EXISTENTE */}
                            <TabsContent value="existing" className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label>Selecione o Deal</Label>
                                <Select value={selectedDealToLink} onValueChange={setSelectedDealToLink}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allDeals?.map(deal => (
                                      <SelectItem key={deal.id} value={deal.id}>
                                        {deal.clientName} ({formatCurrency(deal.volume)})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end pt-4">
                                <Button onClick={handleLinkExistingDeal} disabled={!selectedDealToLink}>
                                  Vincular Selecionado
                                </Button>
                              </div>
                            </TabsContent>

                            {/* ABA NOVO */}
                            <TabsContent value="new" className="space-y-4 pt-4">
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label>Nome do Deal / Cliente</Label>
                                  <Input 
                                    placeholder="Ex: Expansão Grupo ABC" 
                                    value={newDealForm.clientName}
                                    onChange={e => setNewDealForm({...newDealForm, clientName: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Produto</Label>
                                  <Select 
                                    value={newDealForm.dealProduct} 
                                    onValueChange={v => setNewDealForm({...newDealForm, dealProduct: v})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o produto..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(ALL_PRODUCT_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Volume Estimado (R$)</Label>
                                  <Input 
                                    type="number"
                                    placeholder="0,00" 
                                    value={newDealForm.volume}
                                    onChange={e => setNewDealForm({...newDealForm, volume: e.target.value})}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end pt-4">
                                <Button onClick={handleCreateAndLinkDeal} disabled={!newDealForm.clientName}>
                                  Criar e Vincular
                                </Button>
                              </div>
                            </TabsContent>
                          </Tabs>

                        </DialogContent>
                      </Dialog>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className={dealStageFilters.length > 0 ? 'bg-primary/10 border-primary text-primary' : ''}>
                          <Funnel className="mr-2 h-3 w-3" />
                          Estágio {dealStageFilters.length > 0 && `(${dealStageFilters.length})`}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Filtrar por Estágio</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.entries(STAGE_LABELS).map(([key, label]) => (
                          <DropdownMenuCheckboxItem
                            key={key}
                            checked={dealStageFilters.includes(key as PlayerStage)}
                            onCheckedChange={(checked) => {
                              setDealStageFilters(prev => checked ? [...prev, key as PlayerStage] : prev.filter(k => k !== key))
                            }}
                          >
                            {label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {isLoadingTracks ? (
                    <div className="text-center py-8 text-muted-foreground">Carregando deals...</div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleDealSort('dealName')}
                            >
                              <div className="flex items-center">Nome do Deal <SortIcon columnKey="dealName" /></div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleDealSort('dealProduct')}
                            >
                              <div className="flex items-center">Tipo <SortIcon columnKey="dealProduct" /></div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleDealSort('trackVolume')}
                            >
                              <div className="flex items-center">Volume <SortIcon columnKey="trackVolume" /></div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleDealSort('currentStage')}
                            >
                              <div className="flex items-center">Estágio <SortIcon columnKey="currentStage" /></div>
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedDeals.length > 0 ? processedDeals.map((track) => (
                            <TableRow key={track.id}>
                              <TableCell className="font-medium">
                                {(track as any).dealName || 'Deal Desconhecido'}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {(track as any).dealProduct && ALL_PRODUCT_LABELS[(track as any).dealProduct] 
                                  ? ALL_PRODUCT_LABELS[(track as any).dealProduct] 
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(track.trackVolume)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {STAGE_LABELS[track.currentStage]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:text-destructive/90"
                                  onClick={() => handleUnlinkDeal(track.id)}
                                  title="Desvincular Deal"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                Nenhum deal vinculado a este player.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

          <div className="flex justify-end">
            <ActionButtons />
          </div>
        </div>

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