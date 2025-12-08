import { useContext } from 'react'
import { SystemMetadataContext } from '@/contexts/SystemMetadataContext'

/**
 * Hook to access system metadata loaded from database
 * Provides access to stages, operation types, loss reasons, and settings
 */
export function useSystemMetadata() {
  const context = useContext(SystemMetadataContext)

  if (context === undefined) {
    throw new Error('useSystemMetadata must be used within a SystemMetadataProvider')
  }

  /**
   * Get the probability for a specific stage
   * @param stageId - The stage ID to lookup
   * @returns The probability percentage (0-100) for the stage, or 0 if not found
   */
  const getStageProbability = (stageId: string): number => {
    const stage = context.stages.find(s => s.id === stageId)
    return stage?.probability || 0
  }

  /**
   * Get a stage by ID
   * @param stageId - The stage ID to lookup
   * @returns The stage object or undefined if not found
   */
  const getStageById = (stageId: string) => {
    return context.stages.find(s => s.id === stageId)
  }

  /**
   * Get an operation type by ID
   * @param operationTypeId - The operation type ID to lookup
   * @returns The operation type object or undefined if not found
   */
  const getOperationTypeById = (operationTypeId: string) => {
    return context.operationTypes.find(o => o.id === operationTypeId)
  }

  /**
   * Get a loss reason by ID
   * @param lossReasonId - The loss reason ID to lookup
   * @returns The loss reason object or undefined if not found
   */
  const getLossReasonById = (lossReasonId: string) => {
    return context.lossReasons.find(l => l.id === lossReasonId)
  }

  /**
   * Get a system setting by key
   * @param key - The setting key to lookup
   * @returns The setting value or undefined if not found
   */
  const getSetting = (key: string) => {
    const setting = context.settings.find(s => s.key === key)
    return setting?.value
  }

  return {
    ...context,
    getStageProbability,
    getStageById,
    getOperationTypeById,
    getLossReasonById,
    getSetting
  }
}
