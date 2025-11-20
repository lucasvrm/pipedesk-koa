import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MasterDeal, DealStatus } from '@/lib/types'
import { MagnifyingGlass, FunnelSimple } from '@phosphor-icons/react'
import DealsList from './DealsList'

export default function DealsView() {
  const [masterDeals] = useKV<MasterDeal[]>('masterDeals', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all')

  const filteredDeals = (masterDeals || [])
    .filter(deal => !deal.deletedAt)
    .filter(deal => {
      const matchesSearch = deal.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || deal.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Negócios</h2>
        <p className="text-muted-foreground">Gerencie todos os seus Master Deals</p>
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

      <DealsList deals={filteredDeals} />
    </div>
  )
}
