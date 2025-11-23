import { useState, useEffect } from 'react'
import { useFolders } from '@/services/folderService'
import {
  Folder,
  FolderOpen,
  Plus,
  X,
  Star,
  StarFour,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { User } from '@/lib/types'
import { toast } from 'sonner'

interface CrossTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityId: string
  entityType: 'deal' | 'track' | 'task'
  entityName: string
  currentUser: User
}

export default function CrossTagDialog({
  open,
  onOpenChange,
  entityId,
  entityType,
  entityName,
  currentUser,
}: CrossTagDialogProps) {
  const { data: folders = [] } = useFolders()
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [primaryFolder, setPrimaryFolder] = useState<string>('')

  useEffect(() => {
    if (open) {
      // Note: This needs entity locations to be fetched from folderService
      // For now, using empty state
      setSelectedFolders(new Set())
      setPrimaryFolder('')
    }
  }, [open, entityId, entityType])

  const handleToggleFolder = (folderId: string) => {
    setSelectedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
        if (primaryFolder === folderId) {
          setPrimaryFolder('')
        }
      } else {
        newSet.add(folderId)
        if (newSet.size === 1) {
          setPrimaryFolder(folderId)
        }
      }
      return newSet
    })
  }

  const handleSetPrimary = (folderId: string) => {
    if (selectedFolders.has(folderId)) {
      setPrimaryFolder(folderId)
    } else {
      toast.error('Selecione a pasta primeiro antes de torná-la primária')
    }
  }

  const handleSave = () => {
    // Note: This needs full folder service implementation
    toast.warning('Gerenciamento de pastas requer implementação completa no backend')
    onOpenChange(false)
  }

  const rootFolders = folders.filter((f) => !f.parentId)

  const renderFolderTree = (parentFolders: any[], level = 0) => {
    return parentFolders.map((folder) => {
      const children = folders.filter((f) => f.parentId === folder.id)
      const IconComponent = folder.icon === 'folder-open' ? FolderOpen : Folder
      const isSelected = selectedFolders.has(folder.id)
      const isPrimary = primaryFolder === folder.id

      return (
        <div key={folder.id} style={{ marginLeft: level * 20 }}>
          <div
            className={`flex items-center justify-between p-2 rounded-md mb-1 transition-colors ${isSelected ? 'bg-accent/50' : 'hover:bg-accent/20'
              }`}
          >
            <div className="flex items-center gap-2 flex-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggleFolder(folder.id)}
                id={`folder-${folder.id}`}
              />
              <label
                htmlFor={`folder-${folder.id}`}
                className="flex items-center gap-2 flex-1 cursor-pointer"
              >
                <IconComponent
                  size={18}
                  style={{ color: folder.color }}
                  weight="duotone"
                />
                <span className="text-sm font-medium">{folder.name}</span>
                {folder.type !== 'custom' && (
                  <Badge variant="outline" className="text-xs">
                    {folder.type}
                  </Badge>
                )}
              </label>
            </div>
            {isSelected && (
              <Button
                variant={isPrimary ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => handleSetPrimary(folder.id)}
                title={isPrimary ? 'Pasta primária' : 'Tornar pasta primária'}
              >
                {isPrimary ? (
                  <StarFour size={14} weight="fill" />
                ) : (
                  <Star size={14} />
                )}
              </Button>
            )}
          </div>
          {children.length > 0 && renderFolderTree(children, level + 1)}
        </div>
      )
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Organizar "{entityName}" em Pastas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Cross-Tagging:</strong> Este item pode aparecer em múltiplas pastas simultaneamente.
              Todas as alterações serão refletidas em todos os locais automaticamente.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Use a estrela <Star size={14} className="inline" /> para marcar a pasta primária (principal).
            </p>
          </div>

          {selectedFolders.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Selecionadas:</span>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedFolders).map((folderId) => {
                  const folder = folders.find((f) => f.id === folderId)
                  if (!folder) return null
                  const IconComponent = folder.icon === 'folder-open' ? FolderOpen : Folder
                  const isPrimary = primaryFolder === folderId

                  return (
                    <Badge
                      key={folderId}
                      variant={isPrimary ? 'default' : 'secondary'}
                      className="gap-1"
                    >
                      {isPrimary && <StarFour size={12} weight="fill" />}
                      <IconComponent size={12} style={{ color: isPrimary ? 'currentColor' : folder.color }} />
                      {folder.name}
                      <button
                        onClick={() => handleToggleFolder(folderId)}
                        className="ml-1 hover:bg-background/20 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          <ScrollArea className="h-[400px] border rounded-md p-3">
            {rootFolders.length === 0 ? (
              <div className="text-center py-12">
                <Folder size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm">
                  Nenhuma pasta disponível
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Crie pastas no Gerenciador de Pastas primeiro
                </p>
              </div>
            ) : (
              renderFolderTree(rootFolders)
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Plus className="mr-2" />
            Salvar Localização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
