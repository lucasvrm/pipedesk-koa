import { useContext } from 'react'
import { SystemMetadataContext } from '@/contexts/SystemMetadataContext'

/**
 * Hook to access system metadata loaded from database
 * Provides access to stages, operation types, loss reasons, settings, and all dynamic metadata tables
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

  /**
   * Get a deal status by code
   * @param code - The deal status code to lookup
   * @returns The deal status object or undefined if not found
   */
  const getDealStatusByCode = (code: string) => {
    return context.dealStatuses.find(ds => ds.code === code)
  }

  /**
   * Get a deal status by ID
   * @param id - The deal status ID to lookup
   * @returns The deal status object or undefined if not found
   */
  const getDealStatusById = (id: string) => {
    return context.dealStatuses.find(ds => ds.id === id)
  }

  /**
   * Get a relationship level by code
   * @param code - The relationship level code to lookup
   * @returns The relationship level object or undefined if not found
   */
  const getRelationshipLevelByCode = (code: string) => {
    return context.relationshipLevels.find(rl => rl.code === code)
  }

  /**
   * Get a relationship level by ID
   * @param id - The relationship level ID to lookup
   * @returns The relationship level object or undefined if not found
   */
  const getRelationshipLevelById = (id: string) => {
    return context.relationshipLevels.find(rl => rl.id === id)
  }

  /**
   * Get a company type by code
   * @param code - The company type code to lookup
   * @returns The company type object or undefined if not found
   */
  const getCompanyTypeByCode = (code: string) => {
    return context.companyTypes.find(ct => ct.code === code)
  }

  /**
   * Get a company type by ID
   * @param id - The company type ID to lookup
   * @returns The company type object or undefined if not found
   */
  const getCompanyTypeById = (id: string) => {
    return context.companyTypes.find(ct => ct.id === id)
  }

  /**
   * Get a lead status by code
   * @param code - The lead status code to lookup
   * @returns The lead status object or undefined if not found
   */
  const getLeadStatusByCode = (code: string) => {
    return context.leadStatuses.find(ls => ls.code === code)
  }

  /**
   * Get a lead status by ID
   * @param id - The lead status ID to lookup
   * @returns The lead status object or undefined if not found
   */
  const getLeadStatusById = (id: string) => {
    return context.leadStatuses.find(ls => ls.id === id)
  }

  /**
   * Get a lead origin by code
   * @param code - The lead origin code to lookup
   * @returns The lead origin object or undefined if not found
   */
  const getLeadOriginByCode = (code: string) => {
    return context.leadOrigins.find(lo => lo.code === code)
  }

  /**
   * Get a lead origin by ID
   * @param id - The lead origin ID to lookup
   * @returns The lead origin object or undefined if not found
   */
  const getLeadOriginById = (id: string) => {
    return context.leadOrigins.find(lo => lo.id === id)
  }

  /**
   * Get a lead member role by code
   * @param code - The lead member role code to lookup
   * @returns The lead member role object or undefined if not found
   */
  const getLeadMemberRoleByCode = (code: string) => {
    return context.leadMemberRoles.find(lmr => lmr.code === code)
  }

  /**
   * Get a lead member role by ID
   * @param id - The lead member role ID to lookup
   * @returns The lead member role object or undefined if not found
   */
  const getLeadMemberRoleById = (id: string) => {
    return context.leadMemberRoles.find(lmr => lmr.id === id)
  }

  /**
   * Get user role metadata by code
   * @param code - The user role code to lookup
   * @returns The user role metadata object or undefined if not found
   */
  const getUserRoleByCode = (code: string) => {
    return context.userRoleMetadata.find(urm => urm.code === code)
  }

  /**
   * Get user role metadata by ID
   * @param id - The user role ID to lookup
   * @returns The user role metadata object or undefined if not found
   */
  const getUserRoleById = (id: string) => {
    return context.userRoleMetadata.find(urm => urm.id === id)
  }

  return {
    ...context,
    getStageProbability,
    getStageById,
    getOperationTypeById,
    getLossReasonById,
    getSetting,
    getDealStatusByCode,
    getDealStatusById,
    getRelationshipLevelByCode,
    getRelationshipLevelById,
    getCompanyTypeByCode,
    getCompanyTypeById,
    getLeadStatusByCode,
    getLeadStatusById,
    getLeadOriginByCode,
    getLeadOriginById,
    getLeadMemberRoleByCode,
    getLeadMemberRoleById,
    getUserRoleByCode,
    getUserRoleById
  }
}
