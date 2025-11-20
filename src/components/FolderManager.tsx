import { useState } from 'react'
import {
import {
  Folder as FolderIcon,
  Tag,
  Pencil,
  Plus
import { B
import { 
import {
  Dialo
  DialogFooter,
  DialogTitle,
import {
  SelectContent,
  SelectTrigger,
} from '
import { 
  DialogContent,
  DialogDescription,
  DialogFooter,
  { value: 'bri
  DialogTitle,
} from '@/components/ui/dialog'
import {
  { value
  SelectContent,
  { value: '#
  SelectTrigger,
  { value: '#3
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Folder, User } from '@/lib/types'
import { toast } from 'sonner'

const FOLDER_ICONS = [
  { value: 'folder', label: 'Pasta', icon: FolderIcon },
  onOpenChange,
}: FolderManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] =
  
 

    type: 'project' as 

    setFormData({
      description: '',
      icon: 'folder',
    })
  }
  const handleCreate = () => {
      toast.error('Nome da pasta é obr
    }
    const newFolder: Folder = {
 

      type: formData.t
      createdBy: currentUser.id,
  { value: 'team', label: 'Equipe' },
  { value: 'sprint', label: 'Sprint' },
    setFolders((current) => [...(current || 
  { value: 'custom', label: 'Personalizado' },
 

      toast.error('Nome da pas
    }
    setFolders((current) =>
        f.id === ed
 

              icon: formData.icon,
       
      )

}: FolderManagerProps) {
  const [folders, setFolders] = useKV<Folder[]>('folders', [])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: 'folder',
    type: 'project' as Folder['type'],
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      icon: 'folder',
      type: 'project',
  retu
    setEditingFolder(null)
   

            <DialogDescription
    if (!formData.name.trim()) {
      toast.error('Nome da pasta é obrigatório')
      return
     

    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      color: formData.color,
      icon: formData.icon,
          </div>
          <ScrollArea className="h-[400px]
      createdBy: currentUser.id,
      position: (folders || []).length,
    }

    setFolders((current) => [...(current || []), newFolder])
    toast.success('Pasta criada com sucesso')
    setCreateDialogOpen(false)
               
  }

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      toast.error('Nome da pasta é obrigatório')
            
    }

    setFolders((current) =>
                          <p cla
        f.id === editingFolder?.id
             
              ...f,
              name: formData.name,
              description: formData.description,
              color: formData.color,
              icon: formData.icon,
              type: formData.type,
            }
          : f
       
    )

    toast.success('Pasta atualizada com sucesso')
                        >
    resetForm()
   

  const handleDelete = (folderId: string) => {
    setFolders((current) => (current || []).filter((f) => f.id !== folderId))
    toast.success('Pasta excluída com sucesso')
  }

  const handleEdit = (folder: Folder) => {
          <DialogHeader>
    setFormData({
            </DialogTitl
      description: folder.description || '',
          <div className="space-y-4">
      icon: folder.icon || 'folder',
              <Input
      
    setCreateDialogOpen(true)
   


    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
                  setFor
            <DialogTitle>Gerenciar Pastas</DialogTitle>
            <DialogDescription>
              Organize seus negócios, trilhas e tarefas em pastas personalizadas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {(folders || []).length} pasta(s) criada(s)
                
            <Button
              onClick={() => {
                resetForm()
                setCreateDialogOpen(true)
              }}
            >
              <Plus className="mr-2" />
              Nova Pasta
              <Label>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {(folders || []).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderIcon size={48} className="mx-auto mb-4 opacity-20" />
                <p>Nenhuma pasta criada ainda.</p>
                <p className="text-sm">Clique em "Nova Pasta" para começar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(folders || []).map((folder) => {
                  const IconComp =
                    FOLDER_ICONS.find((i) => i.value === folder.icon)?.icon ||
                    FolderIcon

                  return (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                     
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="p-2 rounded"
                          style={{ backgroundColor: folder.color }}
                        >
                          <IconComp size={24} weight="fill" color="white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{folder.name}</p>
                          {folder.description && (
                            <p className="text-sm text-muted-foreground">
                              {folder.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {FOLDER_TYPES.find((t) => t.value === folder.type)?.label}
                          </p>
                        </div>
                resetForm()
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(folder)}
                        >
                          <Pencil />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(folder.id)}
                        >
                          <Trash />
                        </Button>
                      </div>
                    </div>

                })}
              </div>
            )}

        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>

            <DialogTitle>
              {editingFolder ? 'Editar Pasta' : 'Nova Pasta'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>

              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome da pasta"
              />


            <div>
              <Label>Descrição</Label>

                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>

            <div>

              <Select

                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as Folder['type'] })
                }

                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>

                  {FOLDER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>



              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}






























































