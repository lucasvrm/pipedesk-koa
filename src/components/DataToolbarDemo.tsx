import { useState } from 'react'
import { DataToolbar } from '@/components/DataToolbar'
import { LeadsSmartFilters } from '@/features/leads/components/LeadsSmartFilters'
import { LeadOrderBy } from '@/features/leads/components/LeadsSmartFilters'
import { LeadsOrderByDropdown } from '@/features/leads/components/LeadsOrderByDropdown'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { LeadPriorityBucket, User } from '@/lib/types'

/**
 * DataToolbarDemo - Demo component for testing DataToolbar and LeadsSmartFilters
 * 
 * This is a standalone demo component to verify the visual appearance and
 * functionality of the Command Center components.
 * 
 * Usage: Import this component in a page to test the visual design
 */
export function DataToolbarDemo() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'cards' | 'kanban'>('list')
  const [ownerMode, setOwnerMode] = useState<'me' | 'all' | 'custom'>('me')
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])
  const [priority, setPriority] = useState<LeadPriorityBucket[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [origins, setOrigins] = useState<string[]>([])
  const [daysWithoutInteraction, setDaysWithoutInteraction] = useState<number | null>(null)
  const [orderBy, setOrderBy] = useState<LeadOrderBy>('priority')

  // Mock data for demo
  const mockUsers: User[] = [
    { id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'analyst' },
    { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com', role: 'analyst' },
    { id: 'user-3', name: 'Bob Wilson', email: 'bob@example.com', role: 'manager' }
  ]

  const mockLeadStatuses = [
    { id: 'status-1', code: 'new', label: 'Novo' },
    { id: 'status-2', code: 'contacted', label: 'Contatado' },
    { id: 'status-3', code: 'qualified', label: 'Qualificado' },
    { id: 'status-4', code: 'proposal', label: 'Proposta' }
  ]

  const mockLeadOrigins = [
    { id: 'origin-1', code: 'website', label: 'Website' },
    { id: 'origin-2', code: 'referral', label: 'Indicação' },
    { id: 'origin-3', code: 'cold-call', label: 'Cold Call' },
    { id: 'origin-4', code: 'social-media', label: 'Redes Sociais' }
  ]

  const handleClearFilters = () => {
    setOwnerMode('me')
    setSelectedOwners([])
    setPriority([])
    setStatuses([])
    setOrigins([])
    setDaysWithoutInteraction(null)
    setOrderBy('priority')
  }

  return (
    <div className="space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Command Center Demo</h1>
        <p className="text-muted-foreground">
          Demonstração dos componentes DataToolbar e LeadsSmartFilters
        </p>
      </div>

      {/* Full Example with Filters */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Exemplo Completo</h2>
        <DataToolbar
          searchTerm={search}
          onSearchChange={setSearch}
          currentView={view}
          onViewChange={setView}
          actions={
            <Button>
              <Plus className="h-4 w-4" />
              Novo Lead
            </Button>
          }
        >
          <LeadsSmartFilters
            ownerMode={ownerMode}
            onOwnerModeChange={setOwnerMode}
            selectedOwners={selectedOwners}
            onSelectedOwnersChange={setSelectedOwners}
            priority={priority}
            onPriorityChange={setPriority}
            statuses={statuses}
            onStatusesChange={setStatuses}
            origins={origins}
            onOriginsChange={setOrigins}
            daysWithoutInteraction={daysWithoutInteraction}
            onDaysWithoutInteractionChange={setDaysWithoutInteraction}
            users={mockUsers}
            leadStatuses={mockLeadStatuses}
            leadOrigins={mockLeadOrigins}
            onClear={handleClearFilters}
          />
          <LeadsOrderByDropdown
            orderBy={orderBy}
            onOrderByChange={setOrderBy}
          />
        </DataToolbar>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Estado Atual</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Busca:</strong> {search || '(vazio)'}</p>
            <p><strong>View:</strong> {view}</p>
            <p><strong>Modo de Owner:</strong> {ownerMode}</p>
            <p><strong>Owners Selecionados:</strong> {selectedOwners.length || 'Nenhum'}</p>
            <p><strong>Prioridade:</strong> {priority.join(', ') || 'Nenhuma'}</p>
            <p><strong>Status:</strong> {statuses.length || 'Nenhum'}</p>
            <p><strong>Origens:</strong> {origins.length || 'Nenhuma'}</p>
            <p><strong>Dias sem interação:</strong> {daysWithoutInteraction ?? 'Qualquer'}</p>
            <p><strong>Ordenação:</strong> {orderBy}</p>
          </div>
        </div>
      </div>

      {/* Simple Example - Search Only */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Exemplo Simples - Apenas Busca</h2>
        <DataToolbar
          searchTerm={search}
          onSearchChange={setSearch}
        />
      </div>

      {/* View Switcher Only */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Exemplo - Apenas Alternador de Views</h2>
        <DataToolbar
          currentView={view}
          onViewChange={setView}
        />
      </div>

      {/* With Actions Only */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Exemplo - Apenas Ações</h2>
        <DataToolbar
          actions={
            <>
              <Button variant="outline">Exportar</Button>
              <Button>
                <Plus className="h-4 w-4" />
                Novo
              </Button>
            </>
          }
        />
      </div>
    </div>
  )
}
