import { useEffect, useState, useCallback } from 'react'
import { 
  listDriveItems, 
  DriveItem, 
  createDriveFolderForEntity,
  uploadDriveFileForEntity 
} from '@/lib/driveClient'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Folder, FolderPlus, Upload } from '@phosphor-icons/react'
import { formatBytes, formatDate } from '@/lib/helpers'
import { toast } from 'sonner'

interface DealDocumentsListProps {
  dealId: string
}

export function DealDocumentsList({ dealId }: DealDocumentsListProps) {
  const [items, setItems] = useState<DriveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  // Modal states
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Call listDriveItems with entity type and entity ID as requested
      const response = await listDriveItems('deal', dealId)
      setItems(response.items)
      setTotal(response.total)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar documentos'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('[DealDocumentsList] Error loading documents:', err)
    } finally {
      setLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    if (dealId) {
      loadDocuments()
    }
  }, [dealId, loadDocuments])

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast.error('Por favor, informe o nome da pasta')
      return
    }

    setCreatingFolder(true)
    try {
      await createDriveFolderForEntity('deal', dealId, folderName)
      toast.success(`Pasta "${folderName}" criada com sucesso`)
      setCreateFolderOpen(false)
      setFolderName('')
      // Reload the list after successful creation
      await loadDocuments()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar pasta'
      toast.error(errorMessage)
      console.error('[DealDocumentsList] Error creating folder:', err)
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error('Por favor, selecione um arquivo')
      return
    }

    setUploading(true)
    try {
      await uploadDriveFileForEntity('deal', dealId, selectedFile)
      toast.success(`Arquivo "${selectedFile.name}" enviado com sucesso`)
      setUploadOpen(false)
      setSelectedFile(null)
      // Reload the list after successful upload
      await loadDocuments()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload do arquivo'
      toast.error(errorMessage)
      console.error('[DealDocumentsList] Error uploading file:', err)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Verifique se a API do Drive está configurada corretamente.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum documento encontrado para este negócio.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documentos</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{total} {total === 1 ? 'item' : 'itens'}</Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCreateFolderOpen(true)}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Criar Pasta
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[120px]">Tamanho</TableHead>
                  <TableHead className="w-[180px]">Data de Criação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell>
                      {item.type === 'folder' ? (
                        <Folder className="h-5 w-5 text-yellow-500" weight="fill" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{item.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.type === 'folder' ? 'Pasta' : 'Arquivo'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.type === 'file' && item.size 
                        ? formatBytes(item.size)
                        : '—'
                      }
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.createdAt ? formatDate(item.createdAt) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Folder Modal */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Pasta</DialogTitle>
            <DialogDescription>
              Informe o nome da pasta que deseja criar no Drive.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Nome da Pasta</Label>
              <Input
                id="folder-name"
                placeholder="Ex: Contratos, Propostas..."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder()
                  }
                }}
                disabled={creatingFolder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateFolderOpen(false)
                setFolderName('')
              }}
              disabled={creatingFolder}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateFolder}
              disabled={creatingFolder || !folderName.trim()}
            >
              {creatingFolder ? 'Criando...' : 'Criar Pasta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload File Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Arquivo</DialogTitle>
            <DialogDescription>
              Selecione um arquivo para fazer upload no Drive.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file-upload">Arquivo</Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Arquivo selecionado: <strong>{selectedFile.name}</strong> ({formatBytes(selectedFile.size)})
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadOpen(false)
                setSelectedFile(null)
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUploadFile}
              disabled={uploading || !selectedFile}
            >
              {uploading ? 'Enviando...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
