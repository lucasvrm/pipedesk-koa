import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useCallback } from 'react'

const STORAGE_KEY = 'leads-filters-v2-collapsed-sections'

/**
 * Sections that can be collapsed in the V2 filters sidebar
 */
export type FilterSectionKey =
  | 'prioridade'
  | 'status'
  | 'acao'
  | 'dias'
  | 'responsavel'
  | 'origem'
  | 'tags'
  | 'orderBy'

type CollapsedSections = {
  [K in FilterSectionKey]?: boolean
}

/**
 * Hook to manage collapsed/expanded state of filter sections.
 * State is persisted in localStorage so user preferences are remembered.
 * 
 * @example
 * ```tsx
 * const { toggleSection, isCollapsed } = useFilterSectionsState()
 * 
 * // Check if a section is collapsed
 * const collapsed = isCollapsed('status')
 * 
 * // Toggle a section
 * toggleSection('status')
 * ```
 */
export function useFilterSectionsState() {
  const [collapsed, setCollapsed] = useLocalStorage<CollapsedSections>(STORAGE_KEY, {
    prioridade: true,
    status: true,
    acao: true,
    dias: true,
    responsavel: true,
    origem: true,
    tags: true,
    orderBy: true
  })

  const toggleSection = useCallback((section: FilterSectionKey) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }))
  }, [setCollapsed])

  const isCollapsed = useCallback((section: FilterSectionKey): boolean => {
    return collapsed[section] ?? false
  }, [collapsed])

  const setSection = useCallback((section: FilterSectionKey, value: boolean) => {
    setCollapsed(prev => ({ ...prev, [section]: value }))
  }, [setCollapsed])

  return { toggleSection, isCollapsed, setSection }
}
