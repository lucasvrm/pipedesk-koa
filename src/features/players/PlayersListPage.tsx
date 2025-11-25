import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers, deletePlayer } from '@/services/playerService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, MagnifyingGlass, PencilSimple, Trash, Buildings } from '@phosphor-icons/react'
import { PLAYER_TYPE_LABELS, RELATIONSHIP_LEVEL_LABELS } from '@/lib/types'
import { toast } from 'sonner'
import { formatDate } from '@/lib/helpers'

export default function PlayersListPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: players, isLoading, refetch } = usePlayers()
  const [search, setSearch] = useState('')

  const handleDelete = async (id: string) => {
    if (!profile) return
    if (!confirm('Tem certeza que deseja excluir este player?')) return

    try {
      await deletePlayer(id, profile.id)
      toast.success('Player excluído')
      refetch()
    } catch (error) {
      toast.error('Erro ao excluir')
    }
  }

  const filteredPlayers = players?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  )

  const getRelationshipBadgeVariant = (level: string) => {
    switch (level) {
      case 'close': return 'default' // Próximo -> Verde/Destaque
      case 'intermediate': return 'secondary'
      case 'basic': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Buildings className="text-primary" />
            Base de Players
          </h1>
          <p className="text-muted-foreground">Diretório de fundos, empresas e investidores</p>
        </div>
        <Button onClick={() => navigate('/players/new')}>
          <Plus className="mr-2" /> Novo Player
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full md:w-96">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou tipo..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Relacionamento</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Atualizado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers?.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                        <div className="flex flex-col">
                            <span>{player.name}</span>
                            {player.cnpj && <span className="text-xs text-muted-foreground">{player.cnpj}</span>}
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{PLAYER_TYPE_LABELS[player.type] || player.type}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getRelationshipBadgeVariant(player.relationshipLevel)}>
                            {RELATIONSHIP_LEVEL_LABELS[player.relationshipLevel]}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      {player.site ? (
                        <a href={player.site} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                          Link
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(player.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/players/${player.id}`)}>
                          <PencilSimple />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(player.id)}>
                          <Trash className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPlayers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum player encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}