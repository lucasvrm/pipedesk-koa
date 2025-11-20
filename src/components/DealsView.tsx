import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MasterDeal, DealStatus, User } from '@/lib/types'
import { MagnifyingGlass, FunnelSimple, CheckSquare, X } from '@phosphor-icons/react'
import DealsList from './DealsList'
import BulkOperations from './BulkOperations'
import { useDeals } from '@/hooks/useDeals'

export default function DealsView() {
  const { data: masterDeals, loading } = useDeals()
  const [currentUser] = useKV<User>('currentUser', {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    role: 'admin',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all')
  const [bulkMode, setBulkMode] = useState(false)

  const filteredDeals = masterDeals
    .filter(deal => {
      const matchesSearch = deal.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || deal.status === statusFilter
      return matchesSearch && matchesStatus
    })

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Negócios</h2>
          <p className="text-muted-foreground">Gerencie todos os seus Master Deals</p>
        </div>
        <Button
          variant={bulkMode ? "default" : "outline"}
          size="sm"
          onClick={() => setBulkMode(!bulkMode)}
        >
          {bulkMode ? (
            <>
              <X className="mr-2" />
              Cancelar Seleção
            </>
          ) : (
            <>
              <CheckSquare className="mr-2" />
              Operações em Lote
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DealStatus | 'all')}>
          <SelectTrigger className="w-full md:w-[200px]">
            <FunnelSimple className="mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="concluded">Concluídos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Carregando negócios...</p>
        </div>
      ) : (
        <>
          {bulkMode && currentUser && (
            <BulkOperations
              entityType="deal"
              entities={filteredDeals}
              currentUser={currentUser}
              onComplete={() => setBulkMode(false)}
            />
          )}

          <DealsList deals={filteredDeals} bulkMode={bulkMode} />
        </>
      )}
    </div>
  )
}
