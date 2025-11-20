import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Folder,
  FolderOpen,
  Briefcase,
  Tag,
  Archive,
  Pencil,
  Trash,
  Plus,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Folder as FolderType, User } from '@/lib/types'
import { toast } from 'sonner'

const FOLDER_ICONS = [
  { value: 'folder', label: 'Pasta', icon: Folder },
  { value: 'folder-open', label: 'Pasta Aberta', icon: FolderOpen },
  { value: 'briefcase', label: 'Pasta de Trabalho', icon: Briefcase },
  { value: 'tag', label: 'Etiqueta', icon: Tag },
  { value: 'archive', label: 'Arquivo', icon: Archive },
]

const FOLDER_COLORS = [
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#f59e0b', label: 'Âmbar' },
  { value: '#84cc16', label: 'Verde Limão' },
  { value: '#10b981', label: 'Verde' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6b7280', label: 'Cinza' },
]

const FOLDER_TYPES = [
  { value: 'project', label: 'Projeto' },
  { value: 'category', label: 'Categoria' },
  { value: 'archive', label: 'Arquivo' },
]

interface FolderManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
}

export default function FolderManager({
  open,
  onOpenChange,
  currentUser,
}: FolderManagerProps) {
  const [folders, setFolders] = useKV<FolderType[]>('folders', [])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: 'folder',
    type: 'project' as FolderType['type'],
    parentId: undefined as string | undefined,
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      icon: 'folder',
      type: 'project' as FolderType['type'],
      parentId: undefined,
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
      type: formData.type,
      parentId: formData.parentId,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      position: (folders || []).length,
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
              type: formData.type,
              parentId: formData.parentId,
            }
          : f
      )
    )

    toast.success('Pasta atualizada com sucesso')
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
      type: folder.type,
      parentId: folder.parentId,
    })
    setCreateDialogOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gerenciar Pastas</DialogTitle>
            <DialogDescription>
              Organize seus negócios e documentos em pastas personalizadas
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {(folders || []).length} pasta(s) criada(s)
            </p>
            <Button
              onClick={() => {
                resetForm()
                setCreateDialogOpen(true)
              }}
              size="sm"
            >
              <Plus className="mr-2" />
              Nova Pasta
            </Button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {(folders || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Folder className="mx-auto mb-2" size={32} />
                  <p>Nenhuma pasta criada ainda</p>
                </div>
              ) : (
                (folders || []).map((folder) => {
                  const IconComp =
                    FOLDER_ICONS.find((i) => i.value === folder.icon)?.icon ||
                    Folder

                  return (
                    <div
                      key={folder.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div
                        className="p-2 rounded"
                        style={{ backgroundColor: folder.color + '20' }}
                      >
                        <IconComp size={20} style={{ color: folder.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{folder.name}</p>
                        {folder.description && (
                          <p className="text-sm text-muted-foreground">
                            {folder.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
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
            <DialogTitle>
              {editingFolder ? 'Editar Pasta' : 'Nova Pasta'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Digite o nome da pasta"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição opcional"
              />
            </div>

            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: FolderType['type']) =>
                  setFormData({ ...formData, type: value })
                }
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
              <Label>Pasta Pai (opcional)</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  {(folders || [])
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
              <div className="flex flex-wrap gap-2 mt-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className="w-8 h-8 rounded border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color.value,
                      borderColor:
                        formData.color === color.value ? '#000' : 'transparent',
                    }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {FOLDER_ICONS.map((iconOption) => {
                  const IconComp = iconOption.icon
                  return (
                    <button
                      key={iconOption.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, icon: iconOption.value })
                      }
                      className="p-2 rounded border-2 transition-colors hover:bg-muted"
                      style={{
                        borderColor:
                          formData.icon === iconOption.value
                            ? formData.color
                            : 'transparent',
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
              {editingFolder ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
