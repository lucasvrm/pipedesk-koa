import { useState, useEffect } from 'react'
import { settingsService } from '@/services/settingsService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, PencilSimple, Trash, Gear, Globe, Users, Megaphone, Calendar as CalendarIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { format } from 'date-fns'

// --- TIPOS DE CONFIGURAÇÃO SUPORTADOS ---
type SettingType = 'products' | 'deal_sources' | 'loss_reasons' | 'player_categories' | 'holidays' | 'communication_templates'

interface GenericTableProps {
  type: SettingType
  title: string
  description: string
  columns: { key: string; label: string; width?: string; render?: (item: any) => React.ReactNode }[]
}

// --- COMPONENTE DE TABELA GENÉRICA ---
function SettingsTable({ type, title, description, columns }: GenericTableProps) {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)

  // Estado do Formulário (Genérico)
  const [formData, setFormData] = useState<any>({})

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const result = await settingsService.getSettings(type)
      setData(result)
    } catch (error) {
      toast.error('Erro ao carregar configurações')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [type])

  const handleSave = async () => {
    try {
      if (editingItem) {
        await settingsService.updateSetting(type, editingItem.id, formData)
        toast.success('Atualizado com sucesso!')
      } else {
        await settingsService.createSetting(type, { ...formData, isActive: true })
        toast.success('Criado com sucesso!')
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      toast.error('Erro ao salvar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return
    try {
      await settingsService.deleteSetting(type, id)
      toast.success('Excluído com sucesso')
      fetchData()
    } catch (error) {
      toast.error('Erro ao excluir')
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await settingsService.toggleActive(type, id, !current)
      // Atualiza localmente para feedback instantâneo
      setData(prev => prev.map(item => item.id === id ? { ...item, isActive: !current } : item))
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const openDialog = (item?: any) => {
    setEditingItem(item || null)
    // Reset form com valores padrão ou do item
    if (item) {
      setFormData({ ...item })
    } else {
      setFormData({ name: '', description: '', type: 'national', variables: [] }) // Defaults genéricos
    }
    setIsDialogOpen(true)
  }

  // --- RENDERIZAÇÃO DO FORMULÁRIO (DINÂMICO) ---
  const renderFormFields = () => {
    switch (type) {
      case 'products':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome do Produto</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Sigla</Label>
              <Input value={formData.acronym} onChange={e => setFormData({ ...formData, acronym: e.target.value })} placeholder="Ex: CRI" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Fee Padrão (%)</Label>
                    <Input type="number" step="0.1" value={formData.defaultFeePercentage} onChange={e => setFormData({ ...formData, defaultFeePercentage: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                    <Label>SLA (Dias)</Label>
                    <Input type="number" value={formData.defaultSlaDays} onChange={e => setFormData({ ...formData, defaultSlaDays: parseInt(e.target.value) })} />
                </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </>
        )
      case 'holidays':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome do Feriado</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="national">Nacional</SelectItem>
                    <SelectItem value="regional">Regional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )
      case 'communication_templates':
        return (
            <>
                <div className="space-y-2">
                    <Label>Título do Template</Label>
                    <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Canal</Label>
                        <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="email">E-mail</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="document">Documento</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Input placeholder="Ex: welcome" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                    </div>
                </div>
                {formData.type === 'email' && (
                    <div className="space-y-2">
                        <Label>Assunto (Subject)</Label>
                        <Input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Conteúdo</Label>
                    <Textarea className="h-32 font-mono text-xs" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                    <p className="text-xs text-muted-foreground">Use {'{{variable}}'} para campos dinâmicos.</p>
                </div>
            </>
        )
      default: // Genérico (Loss Reasons, Categories, Sources)
        return (
          <>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            {type === 'deal_sources' && (
                <div className="space-y-2">
                    <Label>Tipo de Origem</Label>
                    <Input placeholder="Ex: inbound, outbound" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} />
                </div>
            )}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </>
        )
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button size="sm" onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Novo
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col, idx) => (
                  <TableHead key={idx} style={{ width: col.width }}>{col.label}</TableHead>
                ))}
                {type !== 'holidays' && <TableHead className="w-[100px]">Ativo</TableHead>}
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center py-4">Carregando...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((col, idx) => (
                      <TableCell key={idx}>
                        {col.render ? col.render(item) : item[col.key]}
                      </TableCell>
                    ))}

                    {type !== 'holidays' && (
                      <TableCell>
                        <Switch
                          checked={item.isActive}
                          onCheckedChange={() => handleToggleActive(item.id, item.isActive)}
                        />
                      </TableCell>
                    )}

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(item)}>
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar' : 'Novo'} Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {renderFormFields()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// --- PÁGINA PRINCIPAL ---
export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl pb-24">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary/10 p-3 rounded-full">
            <Gear className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações Globais</h1>
          <p className="text-muted-foreground">Gerencie parâmetros do sistema, listas e templates.</p>
        </div>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="business"><Globe className="mr-2 h-4 w-4" /> Negócios</TabsTrigger>
          <TabsTrigger value="players"><Users className="mr-2 h-4 w-4" /> Players</TabsTrigger>
          <TabsTrigger value="system"><CalendarIcon className="mr-2 h-4 w-4" /> Sistema</TabsTrigger>
          <TabsTrigger value="comms"><Megaphone className="mr-2 h-4 w-4" /> Comms</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          <SettingsTable
            type="products"
            title="Produtos & Tipos de Operação"
            description="Defina os produtos financeiros (ex: CRI, CRA, CCB) disponíveis."
            columns={[
              { key: 'name', label: 'Nome', width: '250px', render: (i) => <span className="font-medium">{i.name}</span> },
              { key: 'acronym', label: 'Sigla', width: '100px', render: (i) => <Badge variant="outline">{i.acronym}</Badge> },
              { key: 'defaultFeePercentage', label: 'Fee Padrão', width: '100px', render: (i) => i.defaultFeePercentage ? `${i.defaultFeePercentage}%` : '-' },
              { key: 'description', label: 'Descrição' }
            ]}
          />

          <SettingsTable
            type="loss_reasons"
            title="Motivos de Perda"
            description="Razões padronizadas para cancelamento de deals (Churn)."
            columns={[
              { key: 'name', label: 'Motivo', width: '250px', render: (i) => <span className="font-medium">{i.name}</span> },
              { key: 'description', label: 'Descrição' }
            ]}
          />

          <SettingsTable
            type="deal_sources"
            title="Origens de Deal (Sources)"
            description="Canais de aquisição de novos negócios."
            columns={[
              { key: 'name', label: 'Canal', width: '250px', render: (i) => <span className="font-medium">{i.name}</span> },
              { key: 'type', label: 'Tipo', width: '150px', render: (i) => i.type && <Badge variant="secondary" className="capitalize">{i.type}</Badge> },
              { key: 'description', label: 'Descrição' }
            ]}
          />
        </TabsContent>

        <TabsContent value="players" className="space-y-6">
          <SettingsTable
            type="player_categories"
            title="Categorias de Players"
            description="Segmentação de investidores e parceiros."
            columns={[
              { key: 'name', label: 'Categoria', width: '250px', render: (i) => <span className="font-medium">{i.name}</span> },
              { key: 'description', label: 'Descrição' }
            ]}
          />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SettingsTable
            type="holidays"
            title="Feriados & Dias Não Úteis"
            description="Cadastro para cálculo correto de SLA."
            columns={[
              { key: 'date', label: 'Data', width: '150px', render: (i) => format(new Date(i.date), 'dd/MM/yyyy') },
              { key: 'name', label: 'Feriado', render: (i) => <span className="font-medium">{i.name}</span> },
              { key: 'type', label: 'Tipo', width: '150px', render: (i) => <Badge className={i.type === 'national' ? 'bg-blue-500' : 'bg-orange-500'}>{i.type === 'national' ? 'Nacional' : 'Regional'}</Badge> }
            ]}
          />
        </TabsContent>

        <TabsContent value="comms" className="space-y-6">
          <SettingsTable
            type="communication_templates"
            title="Templates de Mensagens"
            description="Padronização de emails, whatsapps e documentos."
            columns={[
              { key: 'title', label: 'Título', width: '200px', render: (i) => <span className="font-medium">{i.title}</span> },
              { key: 'type', label: 'Canal', width: '100px', render: (i) => <Badge variant="outline" className="capitalize">{i.type}</Badge> },
              { key: 'category', label: 'Categoria', width: '150px', render: (i) => <Badge variant="secondary">{i.category}</Badge> },
              { key: 'subject', label: 'Assunto', render: (i) => <span className="text-muted-foreground text-sm truncate max-w-[200px] block">{i.subject || '-'}</span> }
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
