import { useEffect, useState } from 'react'
import { listDriveItems, DriveItem } from '@/lib/driveClient'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Folder } from '@phosphor-icons/react'
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

  useEffect(() => {
    const loadDocuments = async () => {
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
    }

    if (dealId) {
      loadDocuments()
    }
  }, [dealId])

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Documentos</CardTitle>
          <Badge variant="secondary">{total} {total === 1 ? 'item' : 'itens'}</Badge>
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
  )
}
