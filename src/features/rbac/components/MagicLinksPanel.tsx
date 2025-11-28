import { useState } from 'react'
import { useUsers } from '@/services/userService'
import { useMagicLinks, useRevokeMagicLink } from '@/services/magicLinkService'
import { getMagicLinkUrl } from '@/lib/auth'
import { formatDateTime } from '@/lib/helpers'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Prohibit, Check, Clock, Link as LinkIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import MagicLinkAuth from './MagicLinkAuth' // Componente para criar novos links

export default function MagicLinksPanel() {
  const { data: users } = useUsers()
  const { data: magicLinks } = useMagicLinks(null)
  const revokeMagicLink = useRevokeMagicLink()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const getUserById = (userId: string) => {
    return (users || []).find(u => u.id === userId)
  }

  const handleCopyLink = async (link: any) => {
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
    revokeMagicLink.mutate(linkId, {
      onSuccess: () => toast.success('Link revogado'),
      onError: () => toast.error('Erro ao revogar link')
    })
  }

  const getLinkStatus = (link: any) => {
    if (link.revokedAt) return 'revoked'
    if (link.usedAt) return 'used'
    if (new Date(link.expiresAt) < new Date()) return 'expired'
    return 'valid'
  }

  const getStatusBadge = (link: any) => {
    const status = getLinkStatus(link)
    switch (status) {
      case 'valid': return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">Ativo</Badge>
      case 'used': return <Badge variant="secondary">Usado</Badge>
      case 'expired': return <Badge variant="outline">Expirado</Badge>
      case 'revoked': return <Badge variant="destructive">Revogado</Badge>
    }
  }

  const sortedLinks = [...(magicLinks || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Criação */}
        <div className="md:col-span-1">
            <MagicLinkAuth />
        </div>

        {/* Lista de Links */}
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="text-primary" />
                    Histórico de Links
                </CardTitle>
                <CardDescription>
                    Gerencie os links de acesso gerados para usuários.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {sortedLinks.length === 0 ? (
                <div className="text-center py-12 border-dashed border-2 rounded-lg">
                    <Clock className="mx-auto mb-4 text-muted-foreground/50" size={48} />
                    <p className="text-muted-foreground">Nenhum link de acesso criado ainda</p>
                </div>
                ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Criado</TableHead>
                            <TableHead>Expira</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
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
                                <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{user?.name || 'Desconhecido'}</span>
                                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                                </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(link)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                {formatDateTime(link.createdAt)}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                {formatDateTime(link.expiresAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCopyLink(link)}
                                    disabled={!canCopy}
                                    title={canCopy ? 'Copiar link' : 'Indisponível'}
                                    className="h-8 w-8"
                                    >
                                    {copiedId === link.id ? <Check className="text-emerald-500" /> : <Copy />}
                                    </Button>
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRevokeLink(link.id)}
                                    disabled={!canRevoke}
                                    title={canRevoke ? 'Revogar link' : 'Indisponível'}
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    >
                                    <Prohibit />
                                    </Button>
                                </div>
                                </TableCell>
                            </TableRow>
                            )
                        })}
                        </TableBody>
                    </Table>
                </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}