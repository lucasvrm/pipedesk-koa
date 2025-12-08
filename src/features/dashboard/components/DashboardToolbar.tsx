import { useDashboardFilters } from '@/contexts/DashboardFiltersContext'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { useOperationalTeam } from '@/hooks/useOperationalTeam'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Users, Briefcase } from '@phosphor-icons/react'
import { DateFilterType } from '@/types/metadata'

/**
 * Date range options with user-friendly labels
 */
const DATE_RANGE_OPTIONS: { value: DateFilterType; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '1y', label: 'Último ano' },
  { value: 'ytd', label: 'Este ano' },
  { value: 'all', label: 'Todo o período' }
]

/**
 * Dashboard Toolbar Component
 * Provides global filter controls for the entire dashboard
 */
export function DashboardToolbar() {
  const { filters, setDateRangePreset, setSelectedTeamMemberId, setSelectedOperationTypeId } = useDashboardFilters()
  const { operationTypes, isLoading: metadataLoading } = useSystemMetadata()
  const { data: teamMembers, isLoading: teamLoading } = useOperationalTeam()

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Date Range Filter */}
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Período
            </label>
            <Select
              value={filters.dateRangePreset}
              onValueChange={(value) => setDateRangePreset(value as DateFilterType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Member Filter */}
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Membro da Equipe
            </label>
            <Select
              value={filters.selectedTeamMemberId}
              onValueChange={(value) => setSelectedTeamMemberId(value)}
              disabled={teamLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um membro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda a Equipe</SelectItem>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operation Type Filter */}
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              Tipo de Operação
            </label>
            <Select
              value={filters.selectedOperationTypeId}
              onValueChange={(value) => setSelectedOperationTypeId(value)}
              disabled={metadataLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Operações</SelectItem>
                {operationTypes
                  .filter(op => op.isActive)
                  .map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
