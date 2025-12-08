import { useSystemMetadata } from './useSystemMetadata'
import { EntityType } from '@/types/metadata'

/**
 * Hook for resolving entity keys to human-readable labels
 * Provides automatic fallback to formatted key if label is not found
 */
export function useLabel() {
  const { stages, operationTypes, lossReasons } = useSystemMetadata()

  /**
   * Resolve an entity key to a human-readable label
   * @param entity - The type of entity ('stage', 'operation', 'status', 'lossReason')
   * @param key - The entity key/id to resolve
   * @returns The human-readable label, or a formatted version of the key if not found
   */
  const getLabel = (entity: EntityType, key: string): string => {
    if (!key) return ''

    switch (entity) {
      case 'stage': {
        const stage = stages.find(s => s.id === key || s.name === key)
        if (stage) return stage.name
        break
      }

      case 'operation': {
        const operation = operationTypes.find(o => o.id === key || o.name === key)
        if (operation) return operation.name
        break
      }

      case 'lossReason': {
        const reason = lossReasons.find(l => l.id === key || l.name === key)
        if (reason) return reason.name
        break
      }

      case 'status': {
        // Status labels are typically hardcoded in the UI
        // but we provide a fallback formatter here
        const statusLabels: Record<string, string> = {
          'active': 'Ativo',
          'concluded': 'Concluído',
          'cancelled': 'Cancelado',
          'on_hold': 'Em Espera'
        }
        if (statusLabels[key]) return statusLabels[key]
        break
      }
    }

    // Fallback: format the key nicely
    return formatKey(key)
  }

  /**
   * Format a key into a human-readable label
   * Converts snake_case and kebab-case to Title Case
   * @param key - The key to format
   * @returns Formatted label
   */
  const formatKey = (key: string): string => {
    return key
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
  }

  return {
    getLabel,
    formatKey
  }
}
