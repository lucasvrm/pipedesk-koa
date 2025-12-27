import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  DocumentTypeConfig,
  StructureTemplate,
  useDeleteDocumentType,
  useDeleteStructureTemplate,
  useDocumentTypes,
  useSaveDocumentType,
  useSaveStructureTemplate,
  useStructureTemplates
} from '@/services/documentAutomationService'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

function TemplateDialog({
  open,
  onOpenChange,
  initialValue
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue?: StructureTemplate | null
}) {
  const [form, setForm] = useState<StructureTemplate>(
    initialValue || {
      name: '',
      entity_type: 'deal',
      event_type: 'on_create',
      path_pattern: '',
      documents_to_create: [],
      is_active: true
    }
  )

  const saveTemplate = useSaveStructureTemplate()

  const handleSave = async () => {
    await saveTemplate.mutateAsync(form)
    toast.success('Template salvo')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{form.id ? 'Editar' : 'Novo'} template de estrutura</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Entidade</Label>
            <Input
              value={form.entity_type}
              placeholder="deal, lead, track"
              onChange={(e) => setForm({ ...form, entity_type: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Evento</Label>
            <Select
              value={form.event_type}
              onValueChange={(value) => setForm({ ...form, event_type: value as StructureTemplate['event_type'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_create">Criação</SelectItem>
                <SelectItem value="on_stage_change">Mudança de estágio</SelectItem>
                <SelectItem value="on_convert">Conversão</SelectItem>
                <SelectItem value="on_add_party">Inclusão de parte</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Path / Folder pattern</Label>
            <Input
              placeholder="/Clientes/{cliente}/Deal/{id}"
              value={form.path_pattern}
              onChange={(e) => setForm({ ...form, path_pattern: e.target.value })}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Documentos para criar (JSON)</Label>
            <Textarea
              className="h-28"
              value={JSON.stringify(form.documents_to_create ?? [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '[]')
                  setForm({ ...form, documents_to_create: parsed })
                } catch (err) {
                  toast.error('JSON inválido para documentos')
                }
              }}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Condições (JSON)</Label>
            <Textarea
              className="h-24"
              value={JSON.stringify(form.conditions ?? {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '{}')
                  setForm({ ...form, conditions: parsed })
                } catch (err) {
                  toast.error('JSON inválido para condições')
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active ?? true} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
            <Label className="text-sm">Ativo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveTemplate.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DocumentTypeDialog({
  open,
  onOpenChange,
  initialValue
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue?: DocumentTypeConfig | null
}) {
  const [form, setForm] = useState<DocumentTypeConfig>(
    initialValue || {
      label: '',
      folder_pattern: '',
      file_name_pattern: '',
      cardinality: 'single',
      tags: [],
      required_placeholders: [],
      optional_placeholders: [],
      is_active: true
    }
  )

  const saveConfig = useSaveDocumentType()

  const handleSave = async () => {
    await saveConfig.mutateAsync(form)
    toast.success('Tipo de documento salvo')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{form.id ? 'Editar' : 'Novo'} tipo de documento</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label>Rótulo</Label>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Folder pattern</Label>
            <Input
              placeholder="/Clientes/{cliente}/Deal/{id}/Documentos"
              value={form.folder_pattern}
              onChange={(e) => setForm({ ...form, folder_pattern: e.target.value })}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Arquivo modelo (URL / storage path)</Label>
            <Input value={form.template_file ?? ''} onChange={(e) => setForm({ ...form, template_file: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>File name pattern</Label>
            <Input
              placeholder="{cliente}-contrato-v{version}-{date}"
              value={form.file_name_pattern ?? ''}
              onChange={(e) => setForm({ ...form, file_name_pattern: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Estágio mínimo</Label>
            <Input
              type="number"
              value={form.min_stage ?? ''}
              onChange={(e) => setForm({ ...form, min_stage: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div className="space-y-2">
            <Label>Estágio obrigatório</Label>
            <Input
              type="number"
              value={form.required_stage ?? ''}
              onChange={(e) => setForm({ ...form, required_stage: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div className="space-y-2">
            <Label>Cardinalidade</Label>
            <Select
              value={form.cardinality ?? 'single'}
              onValueChange={(value) => setForm({ ...form, cardinality: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Quantidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Único</SelectItem>
                <SelectItem value="multiple">Múltiplos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tags (separadas por vírgula)</Label>
            <Input
              value={(form.tags ?? []).join(', ')}
              onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Placeholders obrigatórios (JSON)</Label>
            <Textarea
              className="h-20"
              value={JSON.stringify(form.required_placeholders ?? [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '[]')
                  setForm({ ...form, required_placeholders: parsed })
                } catch (err) {
                  toast.error('JSON inválido para placeholders obrigatórios')
                }
              }}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Placeholders opcionais (JSON)</Label>
            <Textarea
              className="h-20"
              value={JSON.stringify(form.optional_placeholders ?? [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '[]')
                  setForm({ ...form, optional_placeholders: parsed })
                } catch (err) {
                  toast.error('JSON inválido para placeholders opcionais')
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active ?? true} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
            <Label className="text-sm">Ativo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveConfig.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function DocumentAutomationSettings() {
  const { data: templates } = useStructureTemplates()
  const { data: documentTypes } = useDocumentTypes()
  const deleteTemplate = useDeleteStructureTemplate()
  const deleteDocumentType = useDeleteDocumentType()

  const [templateDialog, setTemplateDialog] = useState<{ open: boolean; item?: StructureTemplate | null }>({
    open: false
  })
  const [docDialog, setDocDialog] = useState<{ open: boolean; item?: DocumentTypeConfig | null }>({ open: false })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Templates de Estrutura & Documentos</CardTitle>
          <CardDescription>Configure padrões de pastas, nomes e gatilhos automáticos.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTemplateDialog({ open: true })}>
            Novo template de estrutura
          </Button>
          <Button onClick={() => setDocDialog({ open: true })}>Novo tipo de documento</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates">Eventos</TabsTrigger>
            <TabsTrigger value="documents">Tipos de documento</TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="space-y-3">
            {(templates ?? []).map((item) => (
              <div
                key={item.id}
                className="border rounded-lg px-4 py-3 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {String(item.event_type).replaceAll('_', ' ')}
                    </Badge>
                    <span className="font-semibold">{item.name}</span>
                    <Badge variant="outline">{item.entity_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.path_pattern}</p>
                  <p className="text-xs text-muted-foreground">
                    Documentos: {Array.isArray(item.documents_to_create) ? item.documents_to_create.length : 0} • Status:{' '}
                    {item.is_active ? 'ativo' : 'inativo'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setTemplateDialog({ open: true, item })}>
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTemplate.mutateAsync(item.id!)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))}
            {(templates ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum template cadastrado ainda.</p>
            )}
          </TabsContent>
          <TabsContent value="documents" className="space-y-3">
            {(documentTypes ?? []).map((doc) => (
              <div key={doc.id} className="border rounded-lg px-4 py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{doc.label}</span>
                    <Badge variant="outline" className="capitalize">
                      {doc.cardinality ?? 'single'}
                    </Badge>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{doc.folder_pattern}</p>
                  <p className="text-xs text-muted-foreground">
                    Nome: {doc.file_name_pattern || '—'} • Min estágio: {doc.min_stage ?? '-'} • Obrigatório: {doc.required_stage ?? '-'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDocDialog({ open: true, item: doc })}>
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteDocumentType.mutateAsync(doc.id!)}>
                    Remover
                  </Button>
                </div>
              </div>
            ))}
            {(documentTypes ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum tipo de documento cadastrado.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <Separator />
      <CardContent className="text-xs text-muted-foreground">
        Dica: use placeholders como {'{cliente}'} ou {'{stage}'} para formar caminhos e nomes automaticamente. Campos JSON permitem mapear
        regras de estágios, obrigatoriedade e versões.
      </CardContent>
      <TemplateDialog open={templateDialog.open} onOpenChange={(open) => setTemplateDialog({ open })} initialValue={templateDialog.item} />
      <DocumentTypeDialog open={docDialog.open} onOpenChange={(open) => setDocDialog({ open })} initialValue={docDialog.item} />
    </Card>
  )
}
