import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, ExternalLink, Unlink, Search, Loader2, UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserBadge } from '@/components/ui/user-badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Contact } from '@/lib/types'
import { toast } from 'sonner'
import { useLeadContacts } from '@/services/leadService'
import { useContacts } from '@/services/contactService'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  leadName: string
  contacts: Contact[]
}

function getInitials(name?: string) {
  if (!name) return 'NA'
  const parts = name.trim().split(' ')
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function LeadContactsModal({ open, onOpenChange, leadId, leadName, contacts }: Props) {
  const navigate = useNavigate()
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [toUnlink, setToUnlink] = useState<Contact | null>(null)
  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)

  const { addContact, removeContact } = useLeadContacts(leadId)
  const { data: allContacts = [], isLoading } = useContacts()

  const linkedIds = new Set(contacts.map(c => c.id))
  const available = allContacts.filter(c => !linkedIds.has(c.id))
  const filtered = search.trim()
    ? available.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))
    : available

  const handleLink = async (contact: Contact) => {
    setIsLinking(true)
    try {
      await addContact({ contactId: contact.id, isPrimary: contacts.length === 0 })
      toast.success('Contato vinculado')
      setShowPicker(false)
      setSearch('')
    } catch {
      toast.error('Erro ao vincular')
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlink = async () => {
    if (!toUnlink) return
    setIsUnlinking(true)
    try {
      await removeContact(toUnlink.id)
      toast.success('Contato desvinculado')
      setToUnlink(null)
    } catch {
      toast.error('Erro ao desvincular')
    } finally {
      setIsUnlinking(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Contatos
            </DialogTitle>
            <DialogDescription>
              Informações dos contatos de <span className="font-medium">{leadName}</span>
            </DialogDescription>
          </DialogHeader>

          {!showPicker ? (
            <div className="space-y-4">
              {contacts.length > 0 ? (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {contacts.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <UserBadge
                          name={c.name || 'NA'}
                          avatarUrl={c.avatar}
                          size="md"
                          className="h-10 w-10 border"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{c.name}</span>
                            {c.isPrimary && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Principal</Badge>}
                          </div>
                          {c.role && <p className="text-xs text-muted-foreground truncate">{c.role}</p>}
                          {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { onOpenChange(false); navigate(`/contacts/${c.id}`) }}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setToUnlink(c)}>
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum contato vinculado</p>
                </div>
              )}
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowPicker(true)}>
                  <Plus className="h-4 w-4" /> Vincular existente
                </Button>
                <Button className="flex-1 gap-2" onClick={() => { onOpenChange(false); navigate('/contacts?action=create') }}>
                  <UserPlus className="h-4 w-4" /> Criar novo
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setShowPicker(false); setSearch('') }}>← Voltar</Button>
                <span className="text-sm font-medium">Vincular contato</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">{search ? 'Nenhum encontrado.' : 'Todos vinculados.'}</div>
              ) : (
                <ScrollArea className="h-[250px]">
                  <div className="space-y-1">
                    {filtered.map(c => (
                      <button key={c.id} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 text-left" onClick={() => handleLink(c)} disabled={isLinking}>
                        <UserBadge
                          name={c.name || 'NA'}
                          avatarUrl={c.avatar}
                          size="sm"
                          className="h-9 w-9 border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toUnlink} onOpenChange={o => !o && setToUnlink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular contato?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{toUnlink?.name}</span> será removido deste lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnlinking}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink} disabled={isUnlinking} className="bg-destructive hover:bg-destructive/90">
              {isUnlinking && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
