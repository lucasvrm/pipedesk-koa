import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContacts, useCreateContact } from '@/services/contactService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MagnifyingGlass, Funnel, User, Phone, Envelope } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ContactsPage() {
  const navigate = useNavigate()
  // Fetch all contacts (generic)
  // Note: getContacts() in service fetches all if no companyId passed.
  // We might want to paginate eventually, but for now this works.
  const { data: contacts, isLoading } = useContacts()

  const [search, setSearch] = useState('')

  const filteredContacts = contacts?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground">Base geral de contatos (Empresas e Leads).</p>
        </div>
        {/* Creation is usually context-dependent (inside Company or Lead), but could be generic here */}
        {/* For now, let's keep it read/search focused or generic add */}
        <Button variant="outline" disabled title="Adicione contatos através de Empresas ou Leads">
          Novo Contato
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
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
              <TableHead>Nome</TableHead>
              <TableHead>Cargo/Empresa</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Origem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredContacts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum contato encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts?.map((contact) => (
                <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                       <User /> {contact.name}
                       {contact.isPrimary && <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">Principal</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{contact.role || '-'}</div>
                    <div className="text-xs text-muted-foreground">
                       {/* Ideally we would resolve company name here, but contact object only has companyId unless we join */}
                       {/* For now, generic list */}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {contact.email && <div className="flex items-center gap-1"><Envelope size={12}/> {contact.email}</div>}
                      {contact.phone && <div className="flex items-center gap-1"><Phone size={12}/> {contact.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(contact.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
