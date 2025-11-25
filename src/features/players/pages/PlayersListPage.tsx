import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers, deletePlayer } from '@/services/playerService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, MagnifyingGlass, Trash, Buildings, CaretLeft, CaretRight, PencilSimple, User, Phone } from '@phosphor-icons/react'
import { PLAYER_TYPE_LABELS, RELATIONSHIP_LEVEL_LABELS, Player } from '@/lib/types'
import { toast } from 'sonner'
import { formatDate } from '@/lib/helpers'

export default function PlayersListPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: players, isLoading, refetch } = usePlayers()
  
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
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

  const renderProductTags = (products: Player['products']) => {
    if (!products) return <span className="text-muted-foreground">-</span>;
    
    const tags = [];
    
    if (products.credit?.length > 0) {
      tags.push(
        <Badge key="credit" variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 mr-1 mb-1 font-normal">
          Crédito
        </Badge>
      );
    }
    
    if (products.equity?.length > 0) {
      tags.push(
        <Badge key="equity" variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 mr-1 mb-1 font-normal">
          Equity
        </Badge>
      );
    }
    
    if (products.barter?.length > 0) {
      tags.push(
        <Badge key="barter" variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 mr-1 mb-1 font-normal">
          Permuta
        </Badge>
      );
    }

    if (tags.length === 0) return <span className="text-muted-foreground text-xs">Sem produtos</span>;
    
    return <div className="flex flex-wrap">{tags}</div>;
  }

  const getRelationshipBadgeVariant = (level: string) => {
    switch (level) {
      case 'close': return 'default'
      case 'intermediate': return 'secondary'
      case 'basic': return 'outline'
      default: return 'outline'
    }
  }

  // Lógica de Filtragem
  const filteredPlayers = players?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase()) ||
    (p.primaryContact?.name || '').toLowerCase().includes(search.toLowerCase()) // Busca também pelo contato
  ) || []

  // Lógica de Paginação
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPlayers = filteredPlayers.slice(startIndex, endIndex)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="relative w-full md:w-96">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, contato..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Itens por página:</span>
            <Select 
              value={String(itemsPerPage)} 
              onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Nome</TableHead>
                      <TableHead>Contato Principal</TableHead> {/* Nova Coluna */}
                      <TableHead>Tipo</TableHead>
                      <TableHead>Produtos</TableHead>
                      <TableHead>Relacionamento</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPlayers.map((player) => (
                      <TableRow 
                        key={player.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/players/${player.id}`)} 
                      >
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span>{player.name}</span>
                                {player.cnpj && <span className="text-xs text-muted-foreground">{player.cnpj}</span>}
                            </div>
                        </TableCell>
                        
                        {/* Coluna de Contato Principal */}
                        <TableCell>
                          {player.primaryContact ? (
                            <div className="flex flex-col text-sm">
                              <div className="flex items-center gap-1 font-medium">
                                <User size={14} className="text-muted-foreground" />
                                {player.primaryContact.name}
                              </div>
                              {player.primaryContact.phone && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                  <Phone size={12} />
                                  {player.primaryContact.phone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">Sem contato principal</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge variant="secondary">{PLAYER_TYPE_LABELS[player.type] || player.type}</Badge>
                        </TableCell>
                        
                        <TableCell>
                          {renderProductTags(player.products)}
                        </TableCell>

                        <TableCell>
                            <Badge variant={getRelationshipBadgeVariant(player.relationshipLevel)}>
                                {RELATIONSHIP_LEVEL_LABELS[player.relationshipLevel]}
                            </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {player.site ? (
                            <a href={player.site} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                              Link
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Editar"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/players/${player.id}`, { state: { startEditing: true } });
                              }}
                            >
                              <PencilSimple />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDelete(e, player.id)}
                            >
                              <Trash />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {currentPlayers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum player encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {filteredPlayers.length > 0 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredPlayers.length)} de {filteredPlayers.length} players
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <CaretLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                      <CaretRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}