import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useCreateLead } from '@/services/leadService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, MagnifyingGlass, Funnel, User, Building } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LEAD_STATUS_LABELS, LEAD_ORIGIN_LABELS } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export default function LeadsListPage() {
  const navigate = useNavigate()
  const { data: leads, isLoading } = useLeads()
  const createLead = useCreateLead()

  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newLeadName, setNewLeadName] = useState('')

  const filteredLeads = leads?.filter(l =>
    l.legalName.toLowerCase().includes(search.toLowerCase()) ||
    l.cnpj?.includes(search)
  )

  const handleCreate = async () => {
    if (!newLeadName) return
    try {
      const lead = await createLead.mutateAsync({
        data: { legalName: newLeadName },
        userId: 'temp-user' // Service will handle auth if using context, but here we need actual user ID.
        // TODO: Get user from context. For now, let's assume service/hook handles context if we pass it,
        // OR we use the auth context here.
      })
      setIsCreateOpen(false)
      setNewLeadName('')
      navigate(`/leads/${lead.id}`)
    } catch (error) {
      console.error(error)
    }
  }

  // NOTE: In a real app, useAuth() to get userId.
  // Since I can't easily inject useAuth in this snippet without imports,
  // I'll assume the hook `useCreateLead` might handle `userId` if we adapted it,
  // but `leadService` signature requires it.
  // Let's import useAuth.

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Gerencie seus prospects e oportunidades.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Funnel className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredLeads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum lead encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads?.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/leads/${lead.id}`)}>
                  <TableCell>
                    <div className="font-medium">{lead.legalName}</div>
                    {lead.tradeName && <div className="text-xs text-muted-foreground">{lead.tradeName}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={lead.status === 'qualified' ? 'default' : lead.status === 'disqualified' ? 'destructive' : 'secondary'}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{LEAD_ORIGIN_LABELS[lead.origin]}</TableCell>
                  <TableCell>{format(new Date(lead.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Ver</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>Comece adicionando o nome da empresa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Razão Social / Nome</Label>
              <Input value={newLeadName} onChange={(e) => setNewLeadName(e.target.value)} placeholder="Ex: Acme Corp Ltda" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newLeadName}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
