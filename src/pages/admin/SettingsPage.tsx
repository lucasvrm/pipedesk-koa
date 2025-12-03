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
import {
  Plus,
  PencilSimple,
  Trash,
  Gear,
  Globe,
  Users,
  Megaphone,
  Calendar as CalendarIcon,
  FlowArrow,
  ListChecks,
  ShieldCheck,
  Tag as TagIcon,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { PageContainer } from '@/components/PageContainer'
import { trackStatusService } from '@/services/trackStatusService'
import { operationTypeService } from '@/services/operationTypeService'
import { taskStatusService } from '@/services/taskStatusService'
import { taskPriorityService } from '@/services/taskPriorityService'
import RolesManager from '@/features/rbac/components/RolesManager'
import TagSettings from '@/pages/admin/TagSettings'

// --- TIPOS DE CONFIGURAÇÃO SUPORTADOS ---
// O tipo SettingType descreve apenas as listas genéricas que usam SettingsTable.
// As abas RBAC e Tags são adicionadas separadamente e não fazem parte deste enum.
export type SettingType =
  | 'products'
  | 'deal_sources'
  | 'loss_reasons'
  | 'player_categories'
  | 'holidays'
  | 'communication_templates'
  | 'track_statuses'
  | 'operation_types'
  | 'task_statuses'
  | 'task_priorities'

interface SettingHandler {
  list: () => Promise<any[]>
  create: (data: any) => Promise<any>
  update: (id: string, data: any) => Promise<any>
  remove: (id: string) => Promise<void>
  toggleActive?: (id: string, isActive: boolean) => Promise<void>
}

// Cria um adaptador para os tipos suportados pelo settingsService padrão
const createSettingsAdapter = (
  type: Exclude<
    SettingType,
    'track_statuses' | 'operation_types' | 'task_statuses' | 'task_priorities'
  >,
): SettingHandler => ({
  list: () => settingsService.getSettings(type),
  create: (data) => settingsService.createSetting(type, data),
  update: (id, data) => settingsService.updateSetting(type, id, data),
  remove: (id) => settingsService.deleteSetting(type, id),
  toggleActive:
    type === 'holidays'
      ? undefined
      : (id, isActive) => settingsService.toggleActive(type, id, isActive),
})

// Adapta os serviços customizados para a interface SettingHandler
const customHandlers = {
  track_statuses: {
    list: () => trackStatusService.getTrackStatuses(),
    create: (data: any) => trackStatusService.createTrackStatus(data),
    update: (id: string, data: any) => trackStatusService.updateTrackStatus(id, data),
    remove: (id: string) => trackStatusService.deleteTrackStatus(id),
    toggleActive: (id: string, isActive: boolean) => trackStatusService.toggleTrackStatus(id, isActive),
  },
  operation_types: {
    list: () => operationTypeService.getOperationTypes(),
    create: (data: any) => operationTypeService.createOperationType(data),
    update: (id: string, data: any) => operationTypeService.updateOperationType(id, data),
    remove: (id: string) => operationTypeService.deleteOperationType(id),
    toggleActive: (id: string, isActive: boolean) => operationTypeService.toggleOperationType(id, isActive),
  },
  task_statuses: {
    list: () => taskStatusService.getTaskStatuses(),
    create: (data: any) => taskStatusService.createTaskStatus(data),
    update: (id: string, data: any) => taskStatusService.updateTaskStatus(id, data),
    remove: (id: string) => taskStatusService.deleteTaskStatus(id),
    toggleActive: (id: string, isActive: boolean) => taskStatusService.toggleTaskStatus(id, isActive),
  },
  task_priorities: {
    list: () => taskPriorityService.getTaskPriorities(),
    create: (data: any) => taskPriorityService.createTaskPriority(data),
    update: (id: string, data: any) => taskPriorityService.updateTaskPriority(id, data),
    remove: (id: string) => taskPriorityService.deleteTaskPriority(id),
    toggleActive: (id: string, isActive: boolean) => taskPriorityService.toggleTaskPriority(id, isActive),
  },
} as const

// Mapeia cada tipo de configuração para o serviço correspondente
const SERVICE_HANDLERS: Record<SettingType, SettingHandler> = {
  products: createSettingsAdapter('products'),
  deal_sources: createSettingsAdapter('deal_sources'),
  loss_reasons: createSettingsAdapter('loss_reasons'),
  player_categories: createSettingsAdapter('player_categories'),
  holidays: createSettingsAdapter('holidays'),
  communication_templates: createSettingsAdapter('communication_templates'),
  track_statuses: customHandlers.track_statuses,
  operation_types: customHandlers.operation_types,
  task_statuses: customHandlers.task_statuses,
  task_priorities: customHandlers.task_priorities,
}

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
  const handler = SERVICE_HANDLERS[type]
  const supportsToggle = !!handler.toggleActive && type !== 'holidays'

  // Estado do Formulário (Genérico)
  const [formData, setFormData] = useState<any>({})

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const result = await handler.list()
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
        await handler.update(editingItem.id, formData)
        toast.success('Atualizado com sucesso!')
      } else {
        await handler.create({ ...formData, isActive: true })
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
      await handler.remove(id)
      toast.success('Excluído com sucesso')
      fetchData()
    } catch (error) {
      toast.error('Erro ao excluir')
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    if (!handler.toggleActive) return
    try {
      await handler.toggleActive(id, !current)
      // Atualiza localmente para feedback instantâneo
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isActive: !current } : item)),
      )
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
      const defaults: Record<SettingType, any> = {
        products: {
          name: '',
          description: '',
          type: 'national',
          variables: [],
          acronym: '',
          defaultFeePercentage: 0,
          defaultSlaDays: 0,
        },
        deal_sources: { name: '', description: '', type: 'inbound' },
        loss_reasons: { name: '', description: '' },
        player_categories: { name: '', description: '' },
        holidays: { name: '', description: '', type: 'national', date: '' },
        communication_templates: {
          title: '',
          subject: '',
          content: '',
          type: 'email',
          category: '',
          variables: [],
        },
        track_statuses: { name: '', description: '', color: '#22c55e' },
        operation_types: { name: '', description: '', code: '' },
        task_statuses: { name: '', description: '', color: '#2563eb' },
        task_priorities: { name: '', description: '', color: '#eab308' },
      }
      setFormData(defaults[type])
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
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Sigla</Label>
              <Input
                value={formData.acronym}
                onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
                placeholder="Ex: CRI"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fee Padrão (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.defaultFeePercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultFeePercentage: parseFloat(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>SLA (Dias)</Label>
                <Input
                  type="number"
                  value={formData.defaultSlaDays}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultSlaDays: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </>
        )
      case 'holidays':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome do Feriado</Label>
              <Input
                value{formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value{formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value{formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">Nacional</SelectItem>
                  <SelectItem value="regional">Regional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )
      case 'track_statuses':
      case 'task_statuses':
      case 'task_priorities':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value{formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value{formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input
                type="color"
                value{formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20 p-1"
              />
            </div>
          </>
        )
      case 'operation_types':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value{formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value{formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: ccb"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value{formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </>
        )
      case 'communication_templates':
        return (
          <>
            <div className="space-y-2">
              <Label>Título do Template</Label>
              <Input
                value{formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select
                  value{formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  placeholder="Ex: welcome"
                  value{formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>
            {formData.type === 'email' && (
              <div className="space-y-2">
                <Label>Assunto (Subject)</Label>
                <Input
                  value{formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                className="h-32 font-mono text-xs"
                value{formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Use {'{{variable}}'} para campos dinâmicos.
              </p>
            </div>
          </>
        )
      default: // Genérico (Loss Reasons, Categories, Sources)
        return (
          <>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value{formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            {type === 'deal_sources' && (
              <div className="space-y-2">
                <Label>Tipo de Origem</Label>
                <Input
                  placeholder="Ex: inbound, outbound"
                  value{formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value{formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
                {supportsToggle && <TableHead className="w-[100px]">Ativo</TableHead>}
                <TableHead className="w-[120px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (supportsToggle ? 2 : 1)}
                    className="text-center py-4"
                  >
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (supportsToggle ? 2 : 1)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((col, idx) => (
                      <TableCell key={idx}>{col.render ? col.render(item) : item[col.key]}</TableCell>
                    ))}
                    {supportsToggle && (
                      <TableCell>
                        <Switch
                          checked{item.isActive}
                          onCheckedChange={() => handleToggleActive(item.id, item.isActive)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDialog(item)}
                        >
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(item.id)}
                        >
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
      <Dialog open{isDialogOpen} onOpenChange{setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar' : 'Novo'} Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">{renderFormFields()}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
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
    <PageContainer>
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary/10 p-3 rounded-full">
          <Gear className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações Globais</h1>
          <p className="text-muted-foreground">
            Gerencie parâmetros do sistema, listas, templates e permissões.
          </p>
        </div>
      </div>
      <Tabs defaultValue="business" className="space-y-6">
        {/* A grade de triggers ajusta-se para acomodar as novas abas sem poluir a interface. */}
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="business">
            <Globe className="mr-2 h-4 w-4" /> Negócios
          </TabsTrigger>
          <TabsTrigger value="players">
            <Users className="mr-2 h-4 w-4" /> Players
          </TabsTrigger>
          <TabsTrigger value="tracks">
            <FlowArrow className="mr-2 h-4 w-4" /> Track Status
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListChecks className="mr-2 h-4 w-4" /> Tarefas
          </TabsTrigger>
          <TabsTrigger value="system">
            <CalendarIcon className="mr-2 h-4 w-4" /> Sistema
          </TabsTrigger>
          <TabsTrigger value="comms">
            <Megaphone className="mr-2 h-4 w-4" /> Comms
          </TabsTrigger>
          <TabsTrigger value="rbac">
            <ShieldCheck className="mr-2 h-4 w-4" /> Permissões
          </TabsTrigger>
          <TabsTrigger value="tags">
            <TagIcon className="mr-2 h-4 w-4" /> Tags
          </TabsTrigger>
        </TabsList>
        {/* Aba de Negócios */}
        <TabsContent value="business" className="space-y-6">
          <SettingsTable
            type="products"
            title="Produtos"
            description="Defina os produtos financeiros (ex: CRI, CRA, CCB) disponíveis."
            columns={[
              { key: 'name', label: 'Nome', width: '250px', render: (i) => <span className="font-medium">{i.name}</span> },
              { key: 'acronym', label: 'Sigla', width: '100px', render: (i) => <Badge variant="outline">{i.acronym}</Badge> },
              {
                key: 'defaultFeePercentage',
                label: 'Fee Padrão',
                width: '100px',
                render: (i) => (i.defaultFeePercentage ? `${i.defaultFeePercentage}%` : '-'),
              },
              { key: 'description', label: 'Descrição' },
            ]}
          />
          <SettingsTable
            type="operation_types"
            title="Tipos de Operação"
            description="Configure os tipos de operação suportados para negócios e deals."
            columns={[
              { key: 'name', label: 'Tipo', width: '220px', render: (i) => <span className="font-medium">{i.name}</span> },
              {
                key: 'code',
                label: 'Código',
                width: '120px',
                render: (i) => (i.code ? <Badge variant="outline" className="uppercase">{i.code}</Badge> : '-'),
              },
              { key: 'description', label: 'Descrição' },
            ]}
          />
          <SettingsTable
            type="loss_reasons"
            title="Motivos de Perda"
            description="Razões padronizadas para cancelamento de deals (Churn)."
            columns={[
              { key: 'name', label: 'Motivo', width: '250px', render: (i) => <span className="font-medium">{i.name}</span> },
              { key: 'description', label: 'Descrição' },
            ]}
          />
          <SettingsTable
            type="deal_sources"
            title="Origens de Deal (Sources)"
            description="Canais de aquisição de novos negócios."
            columns={[
              { key: 'name', label: 'Canal', width: '250px', render: (i) => <span className="font-medium">{i.name}</span> },
              {
                key: 'type',
                label: 'Tipo',
                width: '150px',
                render: (i) => i.type && <Badge variant="secondary" className="capitalize">{i.type}</Badge>,
              },
              { key: 'description', label: 'Descrição' },
            ]}
          />
        </TabsContent>
        {/* Aba de Players */}
        <TabsContent value="players" className="space-y-6">
          <SettingsTable
            type="player_categories"
            title="Categorias de Players"
            description="Segmentação de investidores e parceiros."
            columns={[
              { key: 'name', label: 'Categoria', width: '250px', render: (i) => <span className="font-medium">{i.name}</span> },
              { key: 'description', label: 'Descrição' },
            ]}
          />
        </TabsContent>
        {/* Aba de Track Status */}
        <TabsContent value="tracks" className="space-y-6">
          <SettingsTable
            type="track_statuses"
            title="Track Status"
            description="Gerencie os status utilizados para os tracks dos players."
            columns={[
              { key: 'name', label: 'Status', width: '220px', render: (i) => <span className="font-medium">{i.name}</span> },
              {
                key: 'color',
                label: 'Cor',
                width: '120px',
                render: (i) => {
                  const color = i.color || '#475569'
                  return <Badge style={{ backgroundColor: color, color: '#fff' }}>{i.color || 'Sem cor'}</Badge>
                },
              },
              { key: 'description', label: 'Descrição' },
            ]}
          />
        </TabsContent>
        {/* Aba de Tarefas */}
        <TabsContent value="tasks" className="space-y-6">
          <SettingsTable
            type="task_statuses"
            title="Status de Tarefas"
            description="Padronize os status das tarefas e acompanhe a ativação de cada um."
            columns={[
              { key: 'name', label: 'Status', width: '220px', render: (i) => <span className="font-medium">{i.name}</span> },
              {
                key: 'color',
                label: 'Cor',
                width: '120px',
                render: (i) => {
                  const color = i.color || '#475569'
                  return <Badge style={{ backgroundColor: color, color: '#fff' }}>{i.color || 'Sem cor'}</Badge>
                },
              },
              { key: 'description', label: 'Descrição' },
            ]}
          />
          <SettingsTable
            type="task_priorities"
            title="Prioridades de Tarefas"
            description="Defina níveis de prioridade para organizar o fluxo de trabalho."
            columns={[
              { key: 'name', label: 'Prioridade', width: '220px', render: (i) => <span className="font-medium">{i.name}</span> },
              {
                key: 'color',
                label: 'Cor',
                width: '120px',
                render: (i) => {
                  const color = i.color || '#475569'
                  return <Badge style={{ backgroundColor: color, color: '#fff' }}>{i.color || 'Sem cor'}</Badge>
                },
              },
              { key: 'description', label: 'Descrição' },
            ]}
          />
        </TabsContent>
        {/* Aba de Sistema */}
        <TabsContent value="system" className="space-y-6">
          <SettingsTable
            type="holidays"
            title="Feriados & Dias Não Úteis"
            description="Cadastro para cálculo correto de SLA."
            columns={[
              {
                key: 'date',
                label: 'Data',
                width: '150px',
                render: (i) => format(new Date(i.date), 'dd/MM/yyyy'),
              },
              {
                key: 'name',
                label: 'Feriado',
                render: (i) => <span className="font-medium">{i.name}</span>,
              },
              {
                key: 'type',
                label: 'Tipo',
                width: '150px',
                render: (i) => (
                  <Badge className={i.type === 'national' ? 'bg-blue-500' : 'bg-orange-500'}>
                    {i.type === 'national' ? 'Nacional' : 'Regional'}
                  </Badge>
                ),
              },
            ]}
          />
        </TabsContent>
        {/* Aba de Comunicação */}
        <TabsContent value="comms" className="space-y-6">
          <SettingsTable
            type="communication_templates"
            title="Templates de Mensagens"
            description="Padronização de emails, whatsapps e documentos."
            columns={[
              {
                key: 'title',
                label: 'Título',
                width: '200px',
                render: (i) => <span className="font-medium">{i.title}</span>,
              },
              {
                key: 'type',
                label: 'Canal',
                width: '100px',
                render: (i) => <Badge variant="outline" className="capitalize">{i.type}</Badge>,
              },
              {
                key: 'category',
                label: 'Categoria',
                width: '150px',
                render: (i) => <Badge variant="secondary">{i.category}</Badge>,
              },
              {
                key: 'subject',
                label: 'Assunto',
                render: (i) => (
                  <span className="text-muted-foreground text-sm truncate max-w-[200px] block">
                    {i.subject || '-'}
                  </span>
                ),
              },
            ]}
          />
        </TabsContent>
        {/* Aba de RBAC (Funções e Permissões) */}
        <TabsContent value="rbac" className="space-y-6">
          {/* Utiliza o componente RolesManager para controlar funções e permissões */}
          <RolesManager />
        </TabsContent>
        {/* Aba de Tags */}
        <TabsContent value="tags" className="space-y-6">
          {/* Usa o componente TagSettings para gerenciar tags */}
          <TagSettings />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
