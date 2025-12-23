import { useState } from 'react'
import { Plus, FileText, Briefcase, Building2, User, Users, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateLeadModal } from '@/features/leads/components/CreateLeadModal'
import { CreateDealDialog } from '@/features/deals/components/CreateDealDialog'
import { CreatePlayerDialog } from '@/features/deals/components/CreatePlayerDialog'
import { CreateTaskDialog } from '@/features/tasks/components/CreateTaskDialog'
import { toast } from 'sonner'

type EntityType = 'lead' | 'deal' | 'company' | 'contact' | 'player' | 'task'

const CREATE_OPTIONS: { type: EntityType; label: string; icon: React.ElementType; shortcut: string }[] = [
  { type: 'lead', label: 'Novo Lead', icon: FileText, shortcut: '⌘⇧L' },
  { type: 'deal', label: 'Novo Deal', icon: Briefcase, shortcut: '⌘⇧D' },
  { type: 'company', label: 'Nova Empresa', icon: Building2, shortcut: '⌘⇧E' },
  { type: 'contact', label: 'Novo Contato', icon: User, shortcut: '⌘⇧C' },
  { type: 'player', label: 'Novo Player', icon: Users, shortcut: '⌘⇧P' },
  { type: 'task', label: 'Nova Tarefa', icon: CheckSquare, shortcut: '⌘⇧T' },
]

export function CreateNewDropdown() {
  const [openModal, setOpenModal] = useState<EntityType | null>(null)

  const handleOpenModal = (type: EntityType) => {
    if (type === 'company' || type === 'contact') {
      toast.info('Funcionalidade em desenvolvimento')
      return
    }
    setOpenModal(type)
  }

  const handleCloseModal = () => {
    setOpenModal(null)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5" size="sm">
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {CREATE_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <DropdownMenuItem
                key={option.type}
                onClick={() => handleOpenModal(option.type)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{option.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{option.shortcut}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modais - renderizar condicionalmente */}
      <CreateLeadModal 
        open={openModal === 'lead'} 
        onOpenChange={(open) => !open && handleCloseModal()} 
      />
      <CreateDealDialog 
        open={openModal === 'deal'} 
        onOpenChange={(open) => !open && handleCloseModal()} 
      />
      <CreatePlayerDialog 
        open={openModal === 'player'} 
        onOpenChange={(open) => !open && handleCloseModal()} 
      />
      <CreateTaskDialog 
        open={openModal === 'task'} 
        onOpenChange={(open) => !open && handleCloseModal()} 
      />
    </>
  )
}
