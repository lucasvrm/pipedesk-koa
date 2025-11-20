import { useKV } from '@github/spark/hooks'
import { User } from '@/lib/types'
import { MagicLink, isMagicLinkExpired, isMagicLinkValid, getMagicLinkUrl } from '@/features/rbac'
import { formatDateTime } from '@/lib/helpers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Prohibit, Check, Clock } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useState } from 'react'

interface MagicLinksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function MagicLinksDialog({
  open,
  onOpenChange,
}: MagicLinksDialogProps) {
  const [users] = useKV<User[]>('users', [])
  const [magicLinks, setMagicLinks] = useKV<MagicLink[]>('magicLinks', [])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const getUserById = (userId: string) => {
    return (users || []).find(u => u.id === userId)
  }

  const handleCopyLink = async (link: MagicLink) => {
    const url = getMagicLinkUrl(link.token)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(link.id)
      toast.success('Link copiado!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error('Erro ao copiar link')
    }
  }

  const handleRevokeLink = (linkId: string) => {
    setMagicLinks((current) =>
      (current || []).map((link) =>
        link.id === linkId
          ? { ...link, revokedAt: new Date().toISOString() }
          : link
      )
    )
    toast.success('Link revogado')
  }

  const getLinkStatus = (link: MagicLink) => {
    if (link.revokedAt) return 'revoked'
    if (link.usedAt) return 'used'
    if (isMagicLinkExpired(link)) return 'expired'
    return 'valid'
  }

  const getStatusBadge = (link: MagicLink) => {
    const status = getLinkStatus(link)
    
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-success text-success-foreground">Ativo</Badge>
      case 'used':
        return <Badge variant="secondary">Usado</Badge>
      case 'expired':
        return <Badge variant="outline">Expirado</Badge>
      case 'revoked':
        return <Badge variant="destructive">Revogado</Badge>
    }
  }

  const sortedLinks = [...(magicLinks || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Links de Acesso</DialogTitle>
          <DialogDescription>
            Gerencie todos os links de convite criados
          </DialogDescription>
        </DialogHeader>

        {sortedLinks.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground">Nenhum link de acesso criado ainda</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLinks.map((link) => {
                const user = getUserById(link.userId)
                const status = getLinkStatus(link)
                const canCopy = status === 'valid'
                const canRevoke = status === 'valid'

                return (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      {user?.name || 'Usuário removido'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user?.email || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(link)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(link.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(link.expiresAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyLink(link)}
                          disabled={!canCopy}
                          title={canCopy ? 'Copiar link' : 'Link não disponível'}
                        >
                          {copiedId === link.id ? (
                            <Check className="text-success" />
                          ) : (
                            <Copy />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevokeLink(link.id)}
                          disabled={!canRevoke}
                          title={canRevoke ? 'Revogar link' : 'Link não pode ser revogado'}
                        >
                          <Prohibit className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}
