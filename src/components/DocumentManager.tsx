import { useState, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User } from '@/lib/types'
import { formatDateTime } from '@/lib/helpers'
import {
  Upload,
  File,
  FileText,
  FilePdf,
  FileDoc,
  FileXls,
  FileImage,
  Trash,
  Download,
  DotsThree,
  CloudArrowUp,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { logActivity } from './ActivityHistory'

export interface DocumentFile {
  id: string
  entityId: string
  entityType: 'deal' | 'track' | 'task'
  fileName: string
  fileType: string
  fileSize: number
  uploadedBy: string
  uploadedAt: string
  fileData: string
}

interface DocumentManagerProps {
  entityId: string
  entityType: 'deal' | 'track' | 'task'
  currentUser: User
  entityName: string
}

export default function DocumentManager({
  entityId,
  entityType,
  currentUser,
  entityName,
}: DocumentManagerProps) {
  const [documents, setDocuments] = useKV<DocumentFile[]>('documents', [])
  const [users] = useKV<User[]>('users', [])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const entityDocuments = (documents || [])
    .filter(d => d.entityId === entityId && d.entityType === entityType)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      for (const file of Array.from(files)) {
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
          toast.error(`Arquivo ${file.name} é muito grande (máx 10MB)`)
          continue
        }

        const reader = new FileReader()
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const document: DocumentFile = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          entityId,
          entityType,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedBy: currentUser.id,
          uploadedAt: new Date().toISOString(),
          fileData,
        }

        setDocuments(current => [...(current || []), document])

        logActivity({
          userId: currentUser.id,
          action: 'uploaded',
          entityType: 'file',
          entityId: document.id,
          entityName: file.name,
          details: `Arquivo enviado para ${entityType}: ${entityName}`,
          metadata: {
            fileSize: formatFileSize(file.size),
            fileType: file.type,
          },
        })

        toast.success(`${file.name} enviado com sucesso`)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Erro ao enviar arquivo')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownload = (doc: DocumentFile) => {
    try {
      const link = document.createElement('a')
      link.href = doc.fileData
      link.download = doc.fileName
      link.click()
      toast.success('Download iniciado')
    } catch (error) {
      toast.error('Erro ao baixar arquivo')
    }
  }

  const handleDelete = (docId: string) => {
    setDocuments(current => (current || []).filter(d => d.id !== docId))
    toast.success('Arquivo excluído')
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FilePdf className="text-destructive" />
    if (fileType.includes('word') || fileType.includes('document')) return <FileDoc className="text-primary" />
    if (fileType.includes('sheet') || fileType.includes('excel')) return <FileXls className="text-success" />
    if (fileType.includes('image')) return <FileImage className="text-accent" />
    if (fileType.includes('text')) return <FileText className="text-muted-foreground" />
    return <File className="text-muted-foreground" />
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getUploader = (userId: string) => {
    return (users || []).find(u => u.id === userId)
  }

  const totalSize = entityDocuments.reduce((sum, doc) => sum + doc.fileSize, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Documentos ({entityDocuments.length})</h3>
          {entityDocuments.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatFileSize(totalSize)}
            </p>
          )}
        </div>
        <Button onClick={handleFileSelect} disabled={isUploading} size="sm">
          <Upload className="mr-2" />
          {isUploading ? 'Enviando...' : 'Enviar Arquivo'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif"
        />
      </div>

      {entityDocuments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CloudArrowUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              Nenhum documento anexado
            </p>
            <Button variant="outline" onClick={handleFileSelect} disabled={isUploading}>
              <Upload className="mr-2" />
              Enviar Primeiro Documento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-2">
            {entityDocuments.map(doc => {
              const uploader = getUploader(doc.uploadedBy)
              
              return (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {getFileIcon(doc.fileType)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{doc.fileName}</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                                <DotsThree />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                <Download className="mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(doc.id)}
                                className="text-destructive"
                              >
                                <Trash className="mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>{uploader?.name || 'Usuário'}</span>
                          <span>•</span>
                          <span>{formatDateTime(doc.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
