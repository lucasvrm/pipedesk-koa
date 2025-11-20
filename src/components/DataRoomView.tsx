import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  FolderOpen,
  File,
  Download,
  MagnifyingGlass,
  ArrowLeft,
  FileText,
  FilePdf,
  FileImage,
  FileArchive,
} from '@phosphor-icons/react'
import { downloadWithWatermark } from '@/lib/pdfWatermark'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface StorageItem {
  name: string
  id: string | null
  updated_at: string | null
  created_at: string | null
  last_accessed_at: string | null
  metadata: {
    eTag: string
    size: number
    mimetype: string
    cacheControl: string
    lastModified: string
    contentLength: number
    httpStatusCode: number
  } | null
}

const BUCKET_NAME = 'documents' // Default bucket name for VDR

export default function DataRoomView() {
  const { profile } = useAuth()
  const [items, setItems] = useState<StorageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    loadFiles()
  }, [currentPath])

  const loadFiles = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(currentPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        })

      if (error) {
        console.error('Error loading files:', error)
        toast.error('Erro ao carregar arquivos')
        return
      }

      setItems(data || [])
    } catch (error) {
      console.error('Error loading files:', error)
      toast.error('Erro ao carregar arquivos')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (item: StorageItem) => {
    if (!profile) {
      toast.error('Você precisa estar autenticado')
      return
    }

    try {
      setDownloading(item.name)
      
      const filePath = currentPath ? `${currentPath}/${item.name}` : item.name
      
      // Get signed URL for the file
      const { data: urlData, error: urlError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 600) // 10 minutes validity for larger files

      if (urlError || !urlData) {
        throw new Error(`Failed to get download URL: ${urlError?.message || 'Unknown error'}`)
      }

      // Download with watermark for PDFs
      await downloadWithWatermark(urlData.signedUrl, item.name, {
        userName: profile.name,
        userEmail: profile.email,
        timestamp: new Date(),
      })

      toast.success('Download iniciado com sucesso')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Erro ao baixar arquivo')
    } finally {
      setDownloading(null)
    }
  }

  const handleNavigateToFolder = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName
    setCurrentPath(newPath)
  }

  const handleNavigateBack = () => {
    const pathParts = currentPath.split('/')
    pathParts.pop()
    setCurrentPath(pathParts.join('/'))
  }

  const getFileIcon = (item: StorageItem) => {
    if (item.id === null) {
      return <FolderOpen className="text-blue-500" size={24} />
    }

    const fileName = item.name.toLowerCase()
    const mimeType = item.metadata?.mimetype || ''

    if (fileName.endsWith('.pdf') || mimeType === 'application/pdf') {
      return <FilePdf className="text-red-500" size={24} />
    }
    if (fileName.match(/\.(jpg|jpeg|png|gif|svg|webp)$/) || mimeType.startsWith('image/')) {
      return <FileImage className="text-green-500" size={24} />
    }
    if (fileName.match(/\.(zip|rar|7z|tar|gz)$/) || mimeType.includes('zip') || mimeType.includes('compressed')) {
      return <FileArchive className="text-yellow-500" size={24} />
    }
    if (fileName.match(/\.(doc|docx|txt|md)$/) || mimeType.includes('text') || mimeType.includes('document')) {
      return <FileText className="text-blue-500" size={24} />
    }

    return <File className="text-gray-500" size={24} />
  }

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '-'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    if (mb < 1024) return `${mb.toFixed(1)} MB`
    const gb = mb / 1024
    return `${gb.toFixed(1)} GB`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      })
    } catch {
      return '-'
    }
  }

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const folders = filteredItems.filter((item) => item.id === null)
  const files = filteredItems.filter((item) => item.id !== null)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Virtual Data Room</h2>
          <p className="text-muted-foreground">
            Acesse e baixe documentos com segurança
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        {currentPath && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNavigateBack}
          >
            <ArrowLeft className="mr-2" />
            Voltar
          </Button>
        )}
        <div className="text-sm text-muted-foreground">
          {currentPath ? (
            <span>
              / {currentPath.split('/').join(' / ')}
            </span>
          ) : (
            <span>/ Raiz</span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar arquivos e pastas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Files Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Carregando arquivos...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum arquivo ou pasta encontrado</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Modificado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {folders.map((folder) => (
                <TableRow
                  key={folder.name}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleNavigateToFolder(folder.name)}
                >
                  <TableCell>{getFileIcon(folder)}</TableCell>
                  <TableCell className="font-medium">{folder.name}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{formatDate(folder.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">Pasta</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {files.map((file) => (
                <TableRow key={file.name}>
                  <TableCell>{getFileIcon(file)}</TableCell>
                  <TableCell className="font-medium">{file.name}</TableCell>
                  <TableCell>{formatFileSize(file.metadata?.size)}</TableCell>
                  <TableCell>{formatDate(file.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      disabled={downloading === file.name}
                    >
                      <Download className="mr-2" />
                      {downloading === file.name ? 'Baixando...' : 'Baixar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
