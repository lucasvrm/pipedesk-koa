import { createContext, useContext, useState, ReactNode } from 'react'
import { DateFilterType } from '@/types/metadata'

/**
 * State interface for dashboard filters
 */
export interface DashboardFiltersState {
  dateRangePreset: DateFilterType
  selectedTeamMemberId: string
  selectedOperationTypeId: string
}

/**
 * Context type including state and setter functions
 */
interface DashboardFiltersContextType {
  filters: DashboardFiltersState
  setDateRangePreset: (preset: DateFilterType) => void
  setSelectedTeamMemberId: (memberId: string) => void
  setSelectedOperationTypeId: (typeId: string) => void
  resetFilters: () => void
}

const DashboardFiltersContext = createContext<DashboardFiltersContextType | undefined>(undefined)

/**
 * Default filter state
 */
const DEFAULT_FILTERS: DashboardFiltersState = {
  dateRangePreset: '30d',
  selectedTeamMemberId: 'all',
  selectedOperationTypeId: 'all'
}

/**
 * Provider component for dashboard filters
 * Manages global filter state for the entire dashboard
 */
export function DashboardFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFiltersState>(DEFAULT_FILTERS)

  const setDateRangePreset = (preset: DateFilterType) => {
    setFilters(prev => ({ ...prev, dateRangePreset: preset }))
  }

  const setSelectedTeamMemberId = (memberId: string) => {
    setFilters(prev => ({ ...prev, selectedTeamMemberId: memberId || 'all' }))
  }

  const setSelectedOperationTypeId = (typeId: string) => {
    setFilters(prev => ({ ...prev, selectedOperationTypeId: typeId || 'all' }))
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <DashboardFiltersContext.Provider
      value={{
        filters,
        setDateRangePreset,
        setSelectedTeamMemberId,
        setSelectedOperationTypeId,
        resetFilters
      }}
    >
      {children}
    </DashboardFiltersContext.Provider>
  )
}

/**
 * Hook to access dashboard filters context
 * @throws Error if used outside of DashboardFiltersProvider
 */
export function useDashboardFilters() {
  const context = useContext(DashboardFiltersContext)
  if (!context) {
    throw new Error('useDashboardFilters must be used within a DashboardFiltersProvider')
  }
  return context
}
