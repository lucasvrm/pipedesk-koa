import { useState, useRef, useEffect } from 'react'
import { useDriveDocuments } from '@/hooks/useDriveDocuments'
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
  FileZip,
  FileCode,
  FilePpt,
  FileVideo,
  FileAudio,
  Image as ImageIcon,
  MagnifyingGlass,
  UploadSimple,
  CaretRight,
  SquaresFour,
  ListDashes,
  Eye,
  CloudArrowUp,
  Info,
  PencilSimple,
  LockSimple
} from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
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
import { logActivity } from '@/services/activityService'
import { DriveRole, DriveFile } from '@/services/googleDriveService'
import { useAuth } from '@/contexts/AuthContext'

export interface DriveSectionProps {
  /** Type of entity: lead, deal, or company */
  entityType: 'lead' | 'deal' | 'company'
  /** Unique identifier for the entity */
  entityId: string
  /** Optional: Make the component read-only (disable create/upload/delete operations) */
  readOnly?: boolean
  /** Optional: Entity name for better folder naming */
  entityName?: string
}

/**
 * DriveSection - A reusable component for displaying and managing files for any entity.
 * 
 * This component provides a consistent UI for managing documents across different entity types
 * (lead, deal, company) without any entity-specific logic.
 * 
 * Features:
 * - Automatic folder structure initialization on mount
 * - File and folder browsing with breadcrumb navigation
 * - Create folders
 * - Upload files via button or drag-and-drop
 * - Delete files and folders
 * - Rename files and folders
 * - Loading, error, and empty states
 * - Grid and list view modes
 * - File type filtering
 * - Search functionality
 * 
 * @example
 * ```tsx
 * // For a deal
 * <DriveSection entityType="deal" entityId={dealId} entityName={dealName} />
 * 
 * // For a lead (read-only)
 * <DriveSection entityType="lead" entityId={leadId} readOnly />
 * 
 * // For a company
 * <DriveSection entityType="company" entityId={companyId} />
 * ```
 */
export default function DriveSection({
  entityId,
  entityType,
  readOnly = false,
  entityName
}: DriveSectionProps) {
  const { profile: currentUser } = useAuth()
  const actorRole: DriveRole = (currentUser?.role as DriveRole) || 'client'

  // Hook that handles all drive operations and automatically initializes structure
  const {
    files,
    folders,
    rootFolderId,
    breadcrumbs,
    createFolder,
    uploadFiles,
    deleteItem,
    renameItem,
    loading,
    error,
    currentFolderId,
    navigateToFolder,
    reload
  } = useDriveDocuments({
    entityId,
    entityType: entityType as any,
    actorId: currentUser?.id || 'anonymous',
    actorRole,
    entityName,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  
  // States for Rename
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [itemToRename, setItemToRename] = useState<{ id: string, name: string } | null>(null)
  const [newName, setNewName] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'image' | 'sheet' | 'doc'>('all')
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null)
  const [detailsFile, setDetailsFile] = useState<DriveFile | null>(null)
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'file' | 'folder', name: string } | null>(null)

  // Log when component mounts and structure is initialized
  useEffect(() => {
    if (!loading && rootFolderId) {
      console.log(`[DriveSection] Structure initialized for ${entityType}:${entityId}`, {
        rootFolderId,
        foldersCount: folders.length,
        filesCount: files.length
      })
    }
  }, [loading, rootFolderId, entityType, entityId, folders.length, files.length])

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    if (readOnly) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles && droppedFiles.length > 0) {
      const filesArray = Array.from(droppedFiles)
      try {
        await uploadFiles(filesArray, currentFolderId)
        logActivity(
          entityId,
          entityType,
          'upload de arquivo (drag-and-drop)',
          currentUser?.id || 'anonymous',
          { count: filesArray.length }
        )
        toast.success(`${filesArray.length} arquivo(s) enviado(s)`)
      } catch (error) {
        console.error('[DriveSection] Error uploading files:', error)
        toast.error('Erro ao enviar arquivos')
      }
    }
  }

  // Filter files
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filter by type if not 'all'
    let matchesType = true
    if (filterType !== 'all') {
      const mime = f.type.toLowerCase()
      if (filterType === 'pdf') matchesType = mime.includes('pdf')
      else if (filterType === 'image') matchesType = mime.includes('image')
      else if (filterType === 'sheet') matchesType = mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')
      else if (filterType === 'doc') matchesType = mime.includes('document') || mime.includes('word') || mime.includes('text')
    }
    
    return matchesSearch && matchesType
  })

  // Folders are also filtered by search
  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getFileIcon = (mimeType: string) => {
    const mime = mimeType.toLowerCase()
    if (mime.includes('pdf')) return <FilePdf size={24} className="text-red-500" />
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return <FileXls size={24} className="text-green-600" />
    if (mime.includes('word') || mime.includes('document')) return <FileDoc size={24} className="text-blue-500" />
    if (mime.includes('presentation') || mime.includes('powerpoint')) return <FilePpt size={24} className="text-orange-500" />
    if (mime.includes('image')) return <ImageIcon size={24} className="text-purple-500" />
    if (mime.includes('video')) return <FileVideo size={24} className="text-pink-500" />
    if (mime.includes('audio')) return <FileAudio size={24} className="text-yellow-500" />
    if (mime.includes('zip') || mime.includes('compressed') || mime.includes('tar')) return <FileZip size={24} className="text-amber-600" />
    if (mime.includes('json') || mime.includes('javascript') || mime.includes('html') || mime.includes('css') || mime.includes('code')) return <FileCode size={24} className="text-slate-500" />
    return <FileText size={24} className="text-gray-400" />
  }

  const handleFileClick = (file: DriveFile) => {
    const mime = file.type.toLowerCase()
    if (mime.includes('image') || mime.includes('pdf')) {
      setPreviewFile(file)
    } else {
      window.open(file.url, '_blank')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return
    const uploadedFiles = e.target.files
    if (!uploadedFiles) return

    try {
      await uploadFiles(Array.from(uploadedFiles), currentFolderId)
      logActivity(
        entityId,
        entityType,
        'upload de arquivo', 
        currentUser?.id || 'anonymous',
        { count: uploadedFiles.length }
      )
      toast.success('Upload concluído')
    } catch (error) {
      console.error('[DriveSection] Error uploading files:', error)
      toast.error('Erro ao fazer upload')
    }
  }

  const handleCreateFolder = async () => {
    if (readOnly || !newFolderName.trim()) return

    try {
      await createFolder(newFolderName, currentFolderId)
      setNewFolderName('')
      setIsNewFolderOpen(false)
      toast.success('Pasta criada')
    } catch (error) {
      console.error('[DriveSection] Error creating folder:', error)
      toast.error('Erro ao criar pasta')
    }
  }

  // Rename logic
  const openRenameDialog = (id: string, currentName: string) => {
    if (readOnly) return
    setItemToRename({ id, name: currentName })
    setNewName(currentName)
    setIsRenameOpen(true)
  }

  const handleRename = async () => {
    if (readOnly || !itemToRename || !newName.trim()) return
    try {
      await renameItem(itemToRename.id, newName)
      toast.success('Renomeado com sucesso')
      setIsRenameOpen(false)
      setItemToRename(null)
    } catch (error) {
      console.error('[DriveSection] Error renaming item:', error)
      toast.error('Erro ao renomear')
    }
  }

  const confirmDelete = async () => {
    if (readOnly || !itemToDelete) return

    try {
      await deleteItem(itemToDelete.id, itemToDelete.type)
      toast.success(`${itemToDelete.type === 'folder' ? 'Pasta excluída' : 'Arquivo excluído'}`)
      setItemToDelete(null)
    } catch (error) {
      console.error('[DriveSection] Error deleting item:', error)
      toast.error('Erro ao excluir')
    }
  }

  return (
    <div
      className={`h-[600px] flex flex-col border rounded-lg bg-card transition-colors ${isDragging && !readOnly ? 'border-primary border-2 bg-primary/5' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Overlay de Drag */}
      {isDragging && !readOnly && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg pointer-events-none">
          <div className="flex flex-col items-center gap-4 animate-bounce">
            <UploadSimple size={48} className="text-primary" />
            <p className="text-lg font-semibold text-primary">Solte os arquivos aqui</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between gap-4">
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
            <div className="flex bg-muted rounded-md p-0.5 mr-2">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-sm"
                onClick={() => setViewMode('grid')}
              >
                <SquaresFour className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-sm"
                onClick={() => setViewMode('list')}
              >
                <ListDashes className="h-4 w-4" />
              </Button>
            </div>

            {!readOnly && (
              <>
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
              </>
            )}
            {readOnly && (
              <Badge variant="outline" className="gap-1">
                <LockSimple size={12} /> Somente leitura
              </Badge>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Badge
            variant={filterType === 'all' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/90"
            onClick={() => setFilterType('all')}
          >
            Todos
          </Badge>
          <Badge
            variant={filterType === 'pdf' ? 'secondary' : 'outline'}
            className="cursor-pointer hover:bg-secondary/80 gap-1"
            onClick={() => setFilterType('pdf')}
          >
            <FilePdf className="text-red-500" /> PDF
          </Badge>
          <Badge
            variant={filterType === 'image' ? 'secondary' : 'outline'}
            className="cursor-pointer hover:bg-secondary/80 gap-1"
            onClick={() => setFilterType('image')}
          >
            <ImageIcon className="text-purple-500" /> Imagens
          </Badge>
          <Badge
            variant={filterType === 'sheet' ? 'secondary' : 'outline'}
            className="cursor-pointer hover:bg-secondary/80 gap-1"
            onClick={() => setFilterType('sheet')}
          >
            <FileXls className="text-green-500" /> Planilhas
          </Badge>
          <Badge
            variant={filterType === 'doc' ? 'secondary' : 'outline'}
            className="cursor-pointer hover:bg-secondary/80 gap-1"
            onClick={() => setFilterType('doc')}
          >
            <FileDoc className="text-blue-500" /> Documentos
          </Badge>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 bg-muted/30 border-b flex items-center gap-1 text-sm overflow-x-auto whitespace-nowrap">
        {breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs.map((crumb, index, arr) => (
          <div key={crumb.id || 'root'} className="flex items-center">
            <button
              className={`hover:underline ${index === arr.length - 1 ? 'font-bold text-foreground' : 'text-muted-foreground hover:text-primary'}`}
              onClick={() => navigateToFolder(crumb.id || undefined)}
              disabled={index === arr.length - 1}
            >
              {crumb.name}
            </button>
            {index < arr.length - 1 && <CaretRight className="mx-1 h-3 w-3 text-muted-foreground" />}
          </div>
        )) : (
          <span className="text-muted-foreground text-xs">Carregando caminho...</span>
        )}
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-2">Erro ao carregar documentos</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button variant="outline" onClick={reload}>Tentar Novamente</Button>
          </div>
        ) : (
          <>
            {/* GRID VIEW */}
            {viewMode === 'grid' && (
              <>
                {/* Folders */}
                {filteredFolders.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pastas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {filteredFolders.map(folder => (
                        <div
                          key={folder.id}
                          className="group flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors relative"
                          onClick={() => navigateToFolder(folder.id)}
                        >
                          <FolderIcon size={48} weight="fill" className="text-yellow-400 mb-2" />
                          <span className="text-sm font-medium text-center truncate w-full">{folder.name}</span>

                          {!readOnly && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6"><DotsThreeVertical /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRenameDialog(folder.id, folder.name) }}>
                                    <PencilSimple className="mr-2 h-4 w-4" /> Renomear
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); setItemToDelete({ id: folder.id, type: 'folder', name: folder.name }) }}
                                    className="text-destructive"
                                  >
                                    <Trash className="mr-2 h-4 w-4" /> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredFiles.map(file => (
                    <div key={file.id} className="group flex flex-col p-3 border rounded-lg hover:bg-muted/40 relative">
                      <div className="flex justify-center mb-3 cursor-pointer" onClick={() => handleFileClick(file)}>
                        {getFileIcon(file.type)}
                      </div>
                      <div className="min-w-0 text-center">
                        <p className="font-medium text-sm truncate w-full" title={file.name}>{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatBytes(file.size)}</p>
                      </div>

                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-background/80 rounded-sm">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6"><DotsThreeVertical /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => handleFileClick(file)}><Eye className="mr-2 h-4 w-4" /> Visualizar</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => setDetailsFile(file)}><Info className="mr-2 h-4 w-4" /> Detalhes</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}><DownloadSimple className="mr-2 h-4 w-4" /> Baixar</DropdownMenuItem>
                             {!readOnly && (
                               <>
                                 <DropdownMenuItem onClick={() => openRenameDialog(file.id, file.name)}>
                                   <PencilSimple className="mr-2 h-4 w-4" /> Renomear
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                   onClick={() => setItemToDelete({ id: file.id, type: 'file', name: file.name })}
                                   className="text-destructive"
                                 >
                                   <Trash className="mr-2 h-4 w-4" /> Excluir
                                 </DropdownMenuItem>
                               </>
                             )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredFiles.length === 0 && filteredFolders.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <CloudArrowUp size={48} className="text-muted-foreground/50 mb-4" />
                      <p>{searchQuery ? 'Nenhum resultado encontrado' : 'Pasta vazia'}</p>
                      {!readOnly && !searchQuery && (
                        <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                          <UploadSimple className="mr-2 h-4 w-4" /> Fazer Upload
                        </Button>
                      )}
                   </div>
                )}
              </>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && (
              <div className="min-w-full">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground border-b mb-2">
                  <div className="col-span-6">Nome</div>
                  <div className="col-span-2">Tamanho</div>
                  <div className="col-span-3">Data</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Folders List */}
                {filteredFolders.map(folder => (
                  <div
                    key={folder.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-muted/50 cursor-pointer border-b last:border-0 transition-colors group"
                    onClick={() => navigateToFolder(folder.id)}
                  >
                    <div className="col-span-6 flex items-center gap-3">
                      <FolderIcon size={20} weight="fill" className="text-yellow-400" />
                      <span className="text-sm font-medium truncate">{folder.name}</span>
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground">-</div>
                    <div className="col-span-3 text-xs text-muted-foreground">-</div>
                    <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100">
                      {!readOnly && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => e.stopPropagation()}><DotsThreeVertical /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRenameDialog(folder.id, folder.name) }}>
                              <PencilSimple className="mr-2 h-4 w-4" /> Renomear
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); setItemToDelete({ id: folder.id, type: 'folder', name: folder.name }) }}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}

                {/* Files List */}
                {filteredFiles.map(file => (
                  <div
                    key={file.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-muted/50 border-b last:border-0 transition-colors group"
                  >
                    <div className="col-span-6 flex items-center gap-3 cursor-pointer" onClick={() => handleFileClick(file)}>
                      <div className="shrink-0">{getFileIcon(file.type)}</div>
                      <span className="text-sm font-medium truncate hover:text-primary hover:underline">{file.name}</span>
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground">{formatBytes(file.size)}</div>
                    <div className="col-span-3 text-xs text-muted-foreground">{formatDate(file.uploadedAt)}</div>
                    <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><DotsThreeVertical /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleFileClick(file)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDetailsFile(file)} className="cursor-pointer">
                            <Info className="mr-2 h-4 w-4" /> Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(file.url, '_blank')} className="cursor-pointer">
                            <DownloadSimple className="mr-2 h-4 w-4" /> Baixar
                          </DropdownMenuItem>
                          {!readOnly && (
                            <>
                              <DropdownMenuItem onClick={() => openRenameDialog(file.id, file.name)} className="cursor-pointer">
                                <PencilSimple className="mr-2 h-4 w-4" /> Renomear
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setItemToDelete({ id: file.id, type: 'file', name: file.name })}
                                className="text-destructive cursor-pointer"
                              >
                                <Trash className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {filteredFiles.length === 0 && filteredFolders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-lg mt-4 bg-muted/5 gap-4">
                    <div className="bg-muted p-4 rounded-full">
                      <CloudArrowUp size={48} className="text-muted-foreground/50" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">{searchQuery ? 'Nenhum arquivo encontrado.' : 'Esta pasta está vazia.'}</p>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                        {searchQuery ? 'Tente buscar com outros termos.' : readOnly ? 'Não há arquivos nesta pasta.' : 'Arraste arquivos aqui ou use o botão de upload para começar.'}
                      </p>
                    </div>
                    {!searchQuery && !readOnly && (
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <UploadSimple className="mr-2 h-4 w-4" /> Fazer Upload
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </ScrollArea>

      {/* New Folder Dialog */}
      {!readOnly && (
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
      )}

      {/* Rename Dialog */}
      {!readOnly && (
        <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renomear Item</DialogTitle>
              <DialogDescription>Digite o novo nome para o item.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRename()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancelar</Button>
              <Button onClick={handleRename}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Alert Dialog */}
      {!readOnly && (
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o item
                <span className="font-semibold text-foreground"> "{itemToDelete?.name}"</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* File Details Sheet */}
      <Sheet open={!!detailsFile} onOpenChange={(open) => !open && setDetailsFile(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalhes do Arquivo</SheetTitle>
          </SheetHeader>
          {detailsFile && (
            <div className="py-6 space-y-6">
              <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-lg border border-dashed">
                {getFileIcon(detailsFile.type)}
                <p className="mt-2 font-medium text-center break-all">{detailsFile.name}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tipo</span>
                  <p className="text-sm font-mono truncate bg-muted p-1 rounded px-2">{detailsFile.type}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tamanho</span>
                    <p className="text-sm">{formatBytes(detailsFile.size)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Data</span>
                    <p className="text-sm">{formatDate(detailsFile.uploadedAt)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t flex flex-col gap-2">
                  <Button className="w-full" onClick={() => window.open(detailsFile.url, '_blank')}>
                    <DownloadSimple className="mr-2 h-4 w-4" /> Baixar Arquivo
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => { setDetailsFile(null); setPreviewFile(detailsFile); }}>
                    <Eye className="mr-2 h-4 w-4" /> Visualizar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2 overflow-hidden">
              {previewFile && getFileIcon(previewFile.type)}
              <h3 className="font-semibold truncate">{previewFile?.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => window.open(previewFile?.url, '_blank')}>
                <DownloadSimple className="mr-2 h-4 w-4" /> Baixar / Abrir Original
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-muted/20 flex items-center justify-center overflow-hidden relative">
            {previewFile && (
              previewFile.type.includes('image') ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain" />
              ) : previewFile.type.includes('pdf') ? (
                <iframe src={previewFile.url} className="w-full h-full border-0" title="PDF Preview" />
              ) : (
                <div className="text-center">
                  <FileText size={64} className="mx-auto text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">Pré-visualização não disponível para este formato.</p>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
