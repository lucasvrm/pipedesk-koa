import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Folder,
  FolderOpen,
  Plus,
  Pencil,
  Trash,
  Circle,
  X,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Folder as FolderType, User } from '@/lib/types'
import { toast } from 'sonner'

interface FolderManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
}

const FOLDER_ICONS = [
  { value: 'folder', label: 'Pasta', icon: Folder },
  { value: 'folder-open', label: 'Pasta Aberta', icon: FolderOpen },
  { value: 'circle', label: 'Círculo', icon: Circle },
]

const FOLDER_TYPES = [
  { value: 'project', label: 'Projeto' },
  { value: 'team', label: 'Equipe' },
  { value: 'sprint', label: 'Sprint' },
  { value: 'category', label: 'Categoria' },
  { value: 'custom', label: 'Customizado' },
]

const FOLDER_COLORS = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6b7280', label: 'Cinza' },
]

export default function FolderManager({ open, onOpenChange, currentUser }: FolderManagerProps) {
  const [folders = [], setFolders] = useKV<FolderType[]>('folders', [])
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  
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

    setFolders((current = []) => [...current, newFolder])
    toast.success('Pasta criada com sucesso')
    resetForm()
    setCreateDialogOpen(false)
  }

  const handleUpdate = () => {
    if (!editingFolder || !formData.name.trim()) {
      toast.error('Nome da pasta é obrigatório')
      return
    }

    setFolders((current = []) =>
      current.map((f) =>
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
    toast.success('Pasta atualizada com sucesso')
    resetForm()
    setCreateDialogOpen(false)
  }

  const handleDelete = (folderId: string) => {
    const hasChildren = folders.some((f) => f.parentId === folderId)
    if (hasChildren) {
      toast.error('Não é possível excluir uma pasta com subpastas')
      return
    }

    setFolders((current = []) => current.filter((f) => f.id !== folderId))
    toast.success('Pasta excluída com sucesso')
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

  const rootFolders = folders.filter((f) => !f.parentId)

  const renderFolderTree = (parentFolders: FolderType[], level = 0) => {
    return parentFolders.map((folder) => {
      const children = folders.filter((f) => f.parentId === folder.id)
      const IconComponent = FOLDER_ICONS.find((i) => i.value === folder.icon)?.icon || Folder

      return (
        <div key={folder.id} style={{ marginLeft: level * 24 }}>
          <Card className="p-3 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <IconComponent
                  size={20}
                  style={{ color: folder.color }}
                  weight="duotone"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{folder.name}</h4>
                  {folder.description && (
                    <p className="text-xs text-muted-foreground mt-1">{folder.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {FOLDER_TYPES.find((t) => t.value === folder.type)?.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(folder)}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(folder.id)}
                >
                  <Trash size={16} />
                </Button>
              </div>
            </div>
          </Card>
          {children.length > 0 && renderFolderTree(children, level + 1)}
        </div>
      )
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gerenciar Pastas</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Organize seus negócios, tarefas e player tracks em pastas
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="mr-2" />
              Nova Pasta
            </Button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {rootFolders.length === 0 ? (
              <div className="text-center py-12">
                <Folder size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma pasta criada ainda</p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="mr-2" />
                  Criar Primeira Pasta
                </Button>
              </div>
            ) : (
              renderFolderTree(rootFolders)
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? 'Editar Pasta' : 'Nova Pasta'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Pasta</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Projeto App V2"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da pasta..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as FolderType['type'] })}
                >
                  <SelectTrigger id="type">
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
                <Label htmlFor="parent">Pasta Pai (opcional)</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger id="parent">
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {folders
                      .filter((f) => f.id !== editingFolder?.id)
                      .map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
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
                        backgroundColor: formData.icon === iconOption.value ? `${formData.color}10` : 'transparent',
                      }}
                      title={iconOption.label}
                    >
                      <IconComp size={20} style={{ color: formData.color }} />
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
