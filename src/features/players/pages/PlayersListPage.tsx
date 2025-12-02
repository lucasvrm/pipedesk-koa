import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers, useDeletePlayer } from '@/services/playerService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, MagnifyingGlass, Trash, User, IdentificationCard, Buildings } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageContainer } from '@/components/PageContainer'
import { SharedListLayout } from '@/components/layouts/SharedListLayout'
import { SharedListFiltersBar } from '@/components/layouts/SharedListFiltersBar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function PlayersListPage() {
  const navigate = useNavigate()
  const { data: players, isLoading } = usePlayers()
  const deletePlayer = useDeletePlayer()
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const filteredPlayers = useMemo(() => players?.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.nickname?.toLowerCase().includes(search.toLowerCase())) || [], [players, search])
  
  const totalItems = filteredPlayers.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const currentItems = filteredPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleDelete = async (id: string) => {
    if (confirm("Excluir player?")) { await deletePlayer.mutateAsync(id); toast.success("Player excluído"); }
  }

  return (
    <PageContainer>
      <SharedListLayout
        title="Players"
        description="Gestão de players e envolvidos."
        isLoading={isLoading}
        isEmpty={!isLoading && filteredPlayers.length === 0}
        emptyState={{ title: "Nenhum player", description: "Cadastre novos players para gerenciar.", actionLabel: "Novo Player", onAction: () => navigate('/players/new'), icon: <User size={48} /> }}
        primaryAction={<Button onClick={() => navigate('/players/new')}><Plus className="mr-2 h-4 w-4" /> Novo Player</Button>}
        filtersBar={
          <SharedListFiltersBar
            leftContent={
              <div className="relative w-full md:w-80">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Buscar players..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            }
          />
        }
        footer={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}–{Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}><SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent></Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Próximo</Button>
            </div>
          </div>
        }
      >
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="sticky top-0 bg-muted/50 z-10">Nome</TableHead>
              <TableHead className="sticky top-0 bg-muted/50 z-10">CPF</TableHead>
              <TableHead className="sticky top-0 bg-muted/50 z-10">Empresas</TableHead>
              <TableHead className="sticky top-0 bg-muted/50 z-10 w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map(player => (
              <TableRow key={player.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/players/${player.id}`)}>
                <TableCell>
                  <div className="flex flex-col"><span className="font-medium">{player.name}</span>{player.nickname && <span className="text-xs text-muted-foreground">({player.nickname})</span>}</div>
                </TableCell>
                <TableCell><div className="flex items-center gap-2"><IdentificationCard size={16} className="text-muted-foreground" /> {player.cpf || '-'}</div></TableCell>
                <TableCell>
                  {player.companies && player.companies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {player.companies.slice(0, 2).map((c: any) => <Badge key={c.id} variant="outline" className="flex items-center gap-1"><Buildings size={10} /> {c.name}</Badge>)}
                      {player.companies.length > 2 && <Badge variant="secondary">+{player.companies.length - 2}</Badge>}
                    </div>
                  ) : <span className="text-muted-foreground italic">--</span>}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(player.id); }}><Trash size={16} /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SharedListLayout>
    </PageContainer>
  )
}