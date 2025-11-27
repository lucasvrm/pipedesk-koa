import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useFolders } from '@/hooks/useFolders'
import {
  Folder as FolderIcon,
  FileText,
  DownloadSimple,
  Trash,
  Plus,
  DotsThreeVertical,
  FilePdf,
  FileXls,
  FileDoc,
  Image as ImageIcon,
  MagnifyingGlass,
  UploadSimple,
  CaretRight,
  CaretDown
} from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatBytes, formatDate } from '@/lib/helpers'
// MUDANÇA AQUI: Importação corrigida para o novo serviço
import { logActivity } from '@/services/activityService'

export interface DocumentFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  folderId?: string
  uploadedBy: string
  uploadedAt: string
  entityId: string
  entityType: string
}

export interface Folder {
  id: string
  name: string
  parentId?: string
}

interface DocumentManagerProps {
  entityId: string
  entityType: 'deal' | 'track' | 'task'
  currentUser: any
  entityName?: string
}

export default function DocumentManager({
  entityId,
  entityType,
  currentUser,
  entityName
}: DocumentManagerProps) {
  // Estado local simplificado para demonstração (idealmente viria de um hook useDocuments)
  const [files, setFiles] = useState<DocumentFile[]>([])
  const { folders, createFolder, deleteFolder } = useFolders(entityId, entityType)
  
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filtra arquivos e pastas
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFolder = f.folderId === currentFolderId
    return matchesSearch && matchesFolder
  })

  const currentFolders = (folders || []).filter(f => f.parentId === currentFolderId)

  // Helper para ícones de arquivo
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FilePdf size={24} className="text-red-500" />
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileXls size={24} className="text-green-500" />
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileDoc size={24} className="text-blue-500" />
    if (mimeType.includes('image')) return <ImageIcon size={24} className="text-purple-500" />
    return <FileText size={24} className="text-gray-500" />
  }

  // Ações
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles) return

    const newFiles: DocumentFile[] = Array.from(uploadedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // Simulação
      folderId: currentFolderId,
      uploadedBy: currentUser.id,
      uploadedAt: new Date().toISOString(),
      entityId,
      entityType
    }))

    setFiles(prev => [...prev, ...newFiles])
    
    // Log de atividade usando o novo serviço
    logActivity(
      entityId, 
      entityType, 
      'upload de arquivo', 
      currentUser.id, 
      { count: newFiles.length, names: newFiles.map(f => f.name).join(', ') }
    )

    toast.success(`${newFiles.length} arquivo(s) enviado(s)`)
    setIsUploadOpen(false)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    
    try {
      await createFolder.mutateAsync({
        name: newFolderName,
        parentId: currentFolderId,
        entityId,
        entityType,
        type: 'custom'
      })
      setNewFolderName('')
      setIsNewFolderOpen(false)
      toast.success('Pasta criada')
    } catch (error) {
      toast.error('Erro ao criar pasta')
    }
  }

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    toast.success('Arquivo excluído')
  }

  // Breadcrumbs simplificado
  const getBreadcrumbs = () => {
    if (!currentFolderId) return [{ id: undefined, name: 'Raiz' }]
    
    // Lógica recursiva real seria necessária para breadcrumbs profundos
    // Aqui mostramos apenas Raiz > Atual para simplificar
    const current = folders?.find(f => f.id === currentFolderId)
    return [
      { id: undefined, name: 'Raiz' },
      ...(current ? [current] : [])
    ]
  }

  return (
    <div className="h-[600px] flex flex-col border rounded-lg bg-card">
      {/* Toolbar */}
      <div className="p-4 border-b flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Buscar documentos..." 
              className="pl-8 h-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsNewFolderOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Pasta
          </Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <UploadSimple className="mr-2 h-4 w-4" /> Upload
          </Button>
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 bg-muted/30 border-b flex items-center gap-1 text-sm">
        {getBreadcrumbs().map((crumb, index, arr) => (
          <div key={crumb.id || 'root'} className="flex items-center">
            <button 
              className="hover:underline hover:text-primary font-medium"
              onClick={() => setCurrentFolderId(crumb.id)}
            >
              {crumb.name}
            </button>
            {index < arr.length - 1 && <CaretRight className="mx-1 h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1 p-4">
        {/* Folders Grid */}
        {currentFolders && currentFolders.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pastas</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {currentFolders.map(folder => (
                <div 
                  key={folder.id}
                  className="group flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors relative"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <FolderIcon size={48} weight="fill" className="text-yellow-400 mb-2 drop-shadow-sm" />
                  <span className="text-sm font-medium text-center truncate w-full">{folder.name}</span>
                  
                  {/* Context Menu */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6"><DotsThreeVertical /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => deleteFolder.mutate(folder.id)} className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files List */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Arquivos</h4>
          {filteredFiles.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              {searchQuery ? 'Nenhum arquivo encontrado na busca.' : 'Esta pasta está vazia.'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFiles.map(file => (
                <div 
                  key={file.id} 
                  className="group flex items-center gap-3 p-3 border rounded-md hover:bg-muted/40 transition-colors"
                >
                  <div className="shrink-0">{getFileIcon(file.type)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Download">
                      <DownloadSimple className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><DotsThreeVertical /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteFile(file.id)} className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* New Folder Dialog */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>Crie uma nova pasta para organizar documentos.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Nome da pasta" 
              value={newFolderName} 
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateFolder}>Criar Pasta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}