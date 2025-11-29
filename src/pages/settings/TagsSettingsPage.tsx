import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/services/tagService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Trash, PencilSimple, Plus, Tag as TagIcon, Kanban, Target } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Tag } from '@/lib/types'

const PRESET_COLORS = [
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Roxo', value: '#a855f7' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Cinza', value: '#64748b' },
]

export default function TagsSettingsPage() {
  const { profile } = useAuth()
  const { data: tags, isLoading } = useTags()
  
  const createMutation = useCreateTag()
  const updateMutation = useUpdateTag()
  const deleteMutation = useDeleteTag()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [activeTab, setActiveTab] = useState<'deal' | 'track'>('deal')
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#64748b',
    entityType: 'deal' as 'deal' | 'track'
  })

  const filteredTags = tags?.filter(t => t.entityType === activeTab) || []

  const handleCreate = () => {
    setEditingTag(null)
    setFormData({ name: '', color: '#64748b', entityType: activeTab })
    setIsDialogOpen(true)
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({ name: tag.name, color: tag.color, entityType: tag.entityType })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name) return toast.error('Nome é obrigatório')
    if (!profile) return

    try {
      if (editingTag) {
        await updateMutation.mutateAsync({
          id: editingTag.id,
          updates: { name: formData.name, color: formData.color }
        })
        toast.success('Tag atualizada')
      } else {
        await createMutation.mutateAsync({
          ...formData,
          userId: profile.id
        })
        toast.success('Tag criada')
      }
      setIsDialogOpen(false)
    } catch (error) {
      toast.error('Erro ao salvar tag')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Isso removerá a tag de todos os itens.')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Tag excluída')
    } catch (error) {
      toast.error('Erro ao excluir')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TagIcon className="text-primary" /> Gerenciar Tags
          </h1>
          <p className="text-muted-foreground">Crie etiquetas para organizar Deals e Tracks.</p>
        </div>
      </div>

      {/* TOGGLE DE VISUALIZAÇÃO */}
      <div className="flex justify-center">
        <ToggleGroup type="single" value={activeTab} onValueChange={(v) => v && setActiveTab(v as any)}>
          <ToggleGroupItem value="deal" className="px-4 py-2 gap-2">
            <Kanban size={18} /> Deals
          </ToggleGroupItem>
          <ToggleGroupItem value="track" className="px-4 py-2 gap-2">
            <Target size={18} /> Tracks
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tags de {activeTab === 'deal' ? 'Deals' : 'Tracks'}</CardTitle>
            <CardDescription>
              {activeTab === 'deal' 
                ? 'Aplicáveis aos Master Deals (Oportunidades Macro).' 
                : 'Aplicáveis aos Tracks (Negociações com Players).'}
            </CardDescription>
          </div>
          <Button onClick={handleCreate} size="sm"><Plus className="mr-2" /> Nova Tag</Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags.map(tag => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tag)}>
                          <PencilSimple />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(tag.id)}>
                          <Trash />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTags.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      Nenhuma tag criada para {activeTab === 'deal' ? 'Deals' : 'Tracks'}.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Urgente, VIP..." />
            </div>
            
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <div 
                    key={color.value}
                    onClick={() => setFormData({...formData, color: color.value})}
                    className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${formData.color === color.value ? 'border-black scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Aplicável a</Label>
              <Select 
                value={formData.entityType} 
                onValueChange={v => setFormData({...formData, entityType: v as 'deal' | 'track'})}
                disabled={!!editingTag}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deal">Deals</SelectItem>
                  <SelectItem value="track">Tracks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}