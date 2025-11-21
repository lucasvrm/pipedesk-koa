import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CustomFieldDefinition, CustomFieldType, User } from '@/lib/types'
import { Plus, DotsThree, Trash, PencilSimple, ArrowUp, ArrowDown, Tag } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { generateId } from '@/lib/helpers'
import { hasPermission } from '@/lib/permissions'

interface CustomFieldsManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
}

export default function CustomFieldsManager({ open, onOpenChange, currentUser }: CustomFieldsManagerProps) {
  const [customFields, setCustomFields] = useKV<CustomFieldDefinition[]>('customFieldDefinitions', [])
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'deal' | 'track' | 'task'>('deal')

  const canManage = hasPermission(currentUser.role, 'MANAGE_SETTINGS')

  const dealFields = (customFields || [])
    .filter(f => f.entityType === 'deal')
    .sort((a, b) => a.position - b.position)
  
  const trackFields = (customFields || [])
    .filter(f => f.entityType === 'track')
    .sort((a, b) => a.position - b.position)
  
  const taskFields = (customFields || [])
    .filter(f => f.entityType === 'task')
    .sort((a, b) => a.position - b.position)

  const handleCreateField = () => {
    setEditingField(null)
    setCreateDialogOpen(true)
  }

  const handleEditField = (field: CustomFieldDefinition) => {
    setEditingField(field)
    setCreateDialogOpen(true)
  }

  const handleDeleteField = (fieldId: string) => {
    setCustomFields((current) =>
      (current || []).filter(f => f.id !== fieldId)
    )
    toast.success('Campo customizado excluído')
  }

  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const fields = (customFields || []).filter(f => f.entityType === activeTab)
    const index = fields.findIndex(f => f.id === fieldId)
    
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const reorderedFields = [...fields]
    const [movedField] = reorderedFields.splice(index, 1)
    reorderedFields.splice(newIndex, 0, movedField)

    const updatedFields = reorderedFields.map((f, i) => ({
      ...f,
      position: i,
    }))

    setCustomFields((current) => [
      ...(current || []).filter(f => f.entityType !== activeTab),
      ...updatedFields,
    ])
  }

  const renderFieldsList = (fields: CustomFieldDefinition[]) => {
    if (fields.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Tag className="mx-auto mb-3" size={48} />
          <p className="text-sm">Nenhum campo customizado criado</p>
          <p className="text-xs mt-1">Clique em "Novo Campo" para começar</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{field.name}</h4>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{field.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Chave: <code className="bg-muted px-1 py-0.5 rounded">{field.key}</code>
                  </p>
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                  )}
                  {field.options && field.options.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Opções:</span>
                      {field.options.map((opt, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{opt}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveField(field.id, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveField(field.id, 'down')}
                    disabled={index === fields.length - 1}
                  >
                    <ArrowDown />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <DotsThree />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditField(field)}>
                        <PencilSimple className="mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteField(field.id)}
                        className="text-destructive"
                      >
                        <Trash className="mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!canManage) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acesso Negado</DialogTitle>
            <DialogDescription>
              Você não tem permissão para gerenciar campos customizados.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Gerenciar Campos Customizados</DialogTitle>
            <DialogDescription>
              Crie campos personalizados para capturar informações específicas do seu processo
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="deal">Negócios ({dealFields.length})</TabsTrigger>
                <TabsTrigger value="track">Players ({trackFields.length})</TabsTrigger>
                <TabsTrigger value="task">Tarefas ({taskFields.length})</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={handleCreateField} size="sm">
              <Plus className="mr-2" />
              Novo Campo
            </Button>
          </div>

          <ScrollArea className="h-[50vh]">
            {activeTab === 'deal' && renderFieldsList(dealFields)}
            {activeTab === 'track' && renderFieldsList(trackFields)}
            {activeTab === 'task' && renderFieldsList(taskFields)}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <CustomFieldDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        field={editingField}
        entityType={activeTab}
        currentUser={currentUser}
        onSave={() => {
          setCreateDialogOpen(false)
          setEditingField(null)
        }}
      />
    </>
  )
}

interface CustomFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  field: CustomFieldDefinition | null
  entityType: 'deal' | 'track' | 'task'
  currentUser: User
  onSave: () => void
}

function CustomFieldDialog({ open, onOpenChange, field, entityType, currentUser, onSave }: CustomFieldDialogProps) {
  const [customFields, setCustomFields] = useKV<CustomFieldDefinition[]>('customFieldDefinitions', [])
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [type, setType] = useState<CustomFieldType>('text')
  const [required, setRequired] = useState(false)
  const [options, setOptions] = useState('')
  const [defaultValue, setDefaultValue] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const [helpText, setHelpText] = useState('')

  useState(() => {
    if (field) {
      setName(field.name)
      setKey(field.key)
      setType(field.type)
      setRequired(field.required)
      setOptions(field.options?.join(', ') || '')
      setDefaultValue(field.defaultValue || '')
      setPlaceholder(field.placeholder || '')
      setHelpText(field.helpText || '')
    } else {
      setName('')
      setKey('')
      setType('text')
      setRequired(false)
      setOptions('')
      setDefaultValue('')
      setPlaceholder('')
      setHelpText('')
    }
  })

  const handleSave = () => {
    if (!name.trim() || !key.trim()) {
      toast.error('Nome e chave são obrigatórios')
      return
    }

    const existingField = (customFields || []).find(
      f => f.key === key && f.entityType === entityType && f.id !== field?.id
    )

    if (existingField) {
      toast.error('Já existe um campo com esta chave para este tipo de entidade')
      return
    }

    const fieldOptions = (type === 'select' || type === 'multiselect') && options.trim()
      ? options.split(',').map(o => o.trim()).filter(Boolean)
      : undefined

    if (field) {
      setCustomFields((current) =>
        (current || []).map(f =>
          f.id === field.id
            ? {
                ...f,
                name,
                key,
                type,
                required,
                options: fieldOptions,
                defaultValue: defaultValue || undefined,
                placeholder: placeholder || undefined,
                helpText: helpText || undefined,
              }
            : f
        )
      )
      toast.success('Campo customizado atualizado')
    } else {
      const maxPosition = Math.max(
        ...(customFields || [])
          .filter(f => f.entityType === entityType)
          .map(f => f.position),
        -1
      )

      const newField: CustomFieldDefinition = {
        id: generateId(),
        name,
        key,
        type,
        entityType,
        required,
        options: fieldOptions,
        defaultValue: defaultValue || undefined,
        placeholder: placeholder || undefined,
        helpText: helpText || undefined,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        position: maxPosition + 1,
      }

      setCustomFields((current) => [...(current || []), newField])
      toast.success('Campo customizado criado')
    }

    onSave()
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!field) {
      const autoKey = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
      setKey(autoKey)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{field ? 'Editar' : 'Criar'} Campo Customizado</DialogTitle>
          <DialogDescription>
            Defina um campo personalizado para {entityType === 'deal' ? 'negócios' : entityType === 'track' ? 'players' : 'tarefas'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Campo *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Data de Vencimento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Chave (identificador) *</Label>
              <Input
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Ex: data_vencimento"
              />
              <p className="text-xs text-muted-foreground">Usado internamente, sem espaços</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Campo *</Label>
              <Select value={type} onValueChange={(v) => setType(v as CustomFieldType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="select">Seleção única</SelectItem>
                  <SelectItem value="multiselect">Seleção múltipla</SelectItem>
                  <SelectItem value="boolean">Sim/Não</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex items-center gap-2 h-10">
                <Switch
                  id="required"
                  checked={required}
                  onCheckedChange={setRequired}
                />
                <Label htmlFor="required" className="cursor-pointer">Campo obrigatório</Label>
              </div>
            </div>
          </div>

          {(type === 'select' || type === 'multiselect') && (
            <div className="space-y-2">
              <Label htmlFor="options">Opções (separadas por vírgula) *</Label>
              <Textarea
                id="options"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Ex: Opção 1, Opção 2, Opção 3"
                rows={3}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder (texto de ajuda)</Label>
            <Input
              id="placeholder"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="Ex: Informe a data limite"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="helpText">Texto de Ajuda</Label>
            <Textarea
              id="helpText"
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              placeholder="Descrição detalhada do que este campo representa"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultValue">Valor Padrão</Label>
            <Input
              id="defaultValue"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="Valor inicial para novos registros"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {field ? 'Salvar Alterações' : 'Criar Campo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
