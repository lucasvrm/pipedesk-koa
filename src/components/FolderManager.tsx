import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Folder,
  Star,
  Briefcase,
  Tag,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Folder as FolderType, User } from '@/lib/types'

interface FolderManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
}

const FOLDER_ICONS = [
  { value: 'folder', label: 'Pasta', icon: Folder },
  { value: 'star', label: 'Estrela', icon: Star },
  { value: 'briefcase', label: 'Maleta', icon: Briefcase },
  { value: 'tag', label: 'Etiqueta', icon: Tag },
]

const FOLDER_COLORS = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Laranja' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
]

const FOLDER_TYPES = [
  { value: 'project', label: 'Projeto' },
  { value: 'team', label: 'Equipe' },
  { value: 'sprint', label: 'Sprint' },
  { value: 'category', label: 'Categoria' },
  { value: 'custom', label: 'Customizado' },
]

export default function FolderManager({ open, onOpenChange, currentUser }: FolderManagerProps) {
  const [folders = [], setFolders] = useKV<FolderType[]>('folders', [])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: 'folder',
    parentId: '',
    type: 'project' as FolderType['type'],
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      icon: 'folder',
      parentId: '',
      type: 'project',
    })
    setEditingFolder(null)
  }

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Nome da pasta é obrigatório')
      return
    }

    const newFolder: FolderType = {
      id: `folder-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      color: formData.color,
      icon: formData.icon,
      parentId: formData.parentId || undefined,
      type: formData.type,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      position: folders.length,
    }

    setFolders((current) => [...(current || []), newFolder])
    toast.success('Pasta criada com sucesso')
    setCreateDialogOpen(false)
    resetForm()
  }

  const handleUpdate = () => {
    if (!formData.name.trim() || !editingFolder) {
      toast.error('Nome da pasta é obrigatório')
      return
    }

    setFolders((current) =>
      (current || []).map((f) =>
        f.id === editingFolder.id
          ? {
              ...f,
              name: formData.name,
              description: formData.description,
              color: formData.color,
              icon: formData.icon,
              parentId: formData.parentId || undefined,
              type: formData.type,
            }
          : f
      )
    )
    toast.success('Pasta atualizada')
    setCreateDialogOpen(false)
    resetForm()
  }

  const handleDelete = (folderId: string) => {
    setFolders((current) => (current || []).filter((f) => f.id !== folderId))
    toast.success('Pasta removida')
  }

  const handleEdit = (folder: FolderType) => {
    setEditingFolder(folder)
    setFormData({
      name: folder.name,
      description: folder.description || '',
      color: folder.color || '#3b82f6',
      icon: folder.icon || 'folder',
      parentId: folder.parentId || '',
      type: folder.type,
    })
    setCreateDialogOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gerenciar Pastas</DialogTitle>
            <DialogDescription>
              Organize seus negócios, tracks e tarefas em pastas personalizadas
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mb-4">
            <Button onClick={() => setCreateDialogOpen(true)}>
              Criar Nova Pasta
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {folders.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  Nenhuma pasta criada ainda
                </Card>
              ) : (
                folders.map((folder) => {
                  const IconComp = FOLDER_ICONS.find((i) => i.value === folder.icon)?.icon || Folder
                  return (
                    <Card key={folder.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded"
                            style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
                          >
                            <IconComp size={24} />
                          </div>
                          <div>
                            <h4 className="font-medium">{folder.name}</h4>
                            {folder.description && (
                              <p className="text-sm text-muted-foreground">{folder.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(folder)}>
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(folder.id)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFolder ? 'Editar Pasta' : 'Nova Pasta'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Pasta</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome da pasta"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as FolderType['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="parent">Pasta Pai (Opcional)</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData({ ...formData, parentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {folders
                    .filter((f) => f.id !== editingFolder?.id)
                    .map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: color.value,
                      borderColor: formData.color === color.value ? '#000' : 'transparent',
                    }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>Ícone</Label>
              <div className="flex gap-2 mt-2">
                {FOLDER_ICONS.map((iconOption) => {
                  const IconComp = iconOption.icon
                  return (
                    <button
                      key={iconOption.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: iconOption.value })}
                      className="p-2 rounded border-2 transition-all"
                      style={{
                        borderColor: formData.icon === iconOption.value ? formData.color : 'transparent',
                      }}
                      title={iconOption.label}
                    >
                      <IconComp size={20} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={editingFolder ? handleUpdate : handleCreate}>
              {editingFolder ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
