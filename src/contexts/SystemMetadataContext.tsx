import { createContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  SystemMetadata, 
  Stage, 
  OperationType, 
  LossReason, 
  SystemSettings,
  DealStatusMeta,
  RelationshipLevelMeta,
  CompanyTypeMeta,
  LeadStatusMeta,
  LeadOriginMeta,
  LeadMemberRoleMeta,
  UserRoleMetadata
} from '@/types/metadata'

interface SystemMetadataContextType {
  stages: Stage[]
  operationTypes: OperationType[]
  lossReasons: LossReason[]
  settings: SystemSettings[]
  dealStatuses: DealStatusMeta[]
  relationshipLevels: RelationshipLevelMeta[]
  companyTypes: CompanyTypeMeta[]
  leadStatuses: LeadStatusMeta[]
  leadOrigins: LeadOriginMeta[]
  leadMemberRoles: LeadMemberRoleMeta[]
  userRoleMetadata: UserRoleMetadata[]
  isLoading: boolean
  error: Error | null
  reload: () => Promise<void>
  refreshMetadata: () => Promise<void>
}

const SystemMetadataContext = createContext<SystemMetadataContextType | undefined>(undefined)

interface SystemMetadataProviderProps {
  children: ReactNode
}

export function SystemMetadataProvider({ children }: SystemMetadataProviderProps) {
  const [metadata, setMetadata] = useState<SystemMetadata>({
    stages: [],
    operationTypes: [],
    lossReasons: [],
    settings: [],
    dealStatuses: [],
    relationshipLevels: [],
    companyTypes: [],
    leadStatuses: [],
    leadOrigins: [],
    leadMemberRoles: [],
    userRoleMetadata: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadMetadata = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load all metadata in parallel
      const [
        stagesRes, 
        operationTypesRes, 
        lossReasonsRes, 
        settingsRes,
        dealStatusesRes,
        relationshipLevelsRes,
        companyTypesRes,
        leadStatusesRes,
        leadOriginsRes,
        leadMemberRolesRes,
        userRoleMetadataRes
      ] = await Promise.all([
        supabase
          .from('pipeline_stages')
          .select('*')
          .order('stage_order', { ascending: true }),
        supabase
          .from('operation_types')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('loss_reasons')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('system_settings')
          .select('*')
          .order('key'),
        supabase
          .from('deal_statuses')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('company_relationship_levels')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('company_types')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('lead_statuses')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('lead_origins')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('lead_member_roles')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('user_role_metadata')
          .select('*')
          .order('sort_order', { ascending: true })
      ])

      // Check for errors
      if (stagesRes.error) throw stagesRes.error
      if (operationTypesRes.error) throw operationTypesRes.error
      if (lossReasonsRes.error) throw lossReasonsRes.error
      if (settingsRes.error) throw settingsRes.error
      if (dealStatusesRes.error) throw dealStatusesRes.error
      if (relationshipLevelsRes.error) throw relationshipLevelsRes.error
      if (companyTypesRes.error) throw companyTypesRes.error
      if (leadStatusesRes.error) throw leadStatusesRes.error
      if (leadOriginsRes.error) throw leadOriginsRes.error
      if (leadMemberRolesRes.error) throw leadMemberRolesRes.error
      if (userRoleMetadataRes.error) throw userRoleMetadataRes.error

      // Map database results to typed objects
      const stages: Stage[] = (stagesRes.data || []).map(item => ({
        id: item.id,
        pipelineId: item.pipeline_id,
        name: item.name,
        color: item.color,
        stageOrder: item.stage_order,
        probability: item.probability || 0,
        isDefault: item.is_default,
        active: item.active !== false,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))

      const operationTypes: OperationType[] = (operationTypesRes.data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))

      const lossReasons: LossReason[] = (lossReasonsRes.data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        isActive: item.is_active,
        createdAt: item.created_at
      }))

      const settings: SystemSettings[] = (settingsRes.data || []).map(item => ({
        key: item.key,
        value: item.value,
        description: item.description,
        updatedAt: item.updated_at,
        updatedBy: item.updated_by
      }))

      const dealStatuses: DealStatusMeta[] = (dealStatusesRes.data || []).map(item => ({
        id: item.id,
        code: item.code,
        label: item.label,
        description: item.description,
        isActive: item.is_active,
        sortOrder: item.sort_order,
        createdAt: item.created_at
      }))

      const relationshipLevels: RelationshipLevelMeta[] = (relationshipLevelsRes.data || []).map(item => ({
        id: item.id,
        code: item.code,
        label: item.label,
        description: item.description,
        isActive: item.is_active,
        sortOrder: item.sort_order,
        createdAt: item.created_at
      }))

      const companyTypes: CompanyTypeMeta[] = (companyTypesRes.data || []).map(item => ({
        id: item.id,
        code: item.code,
        label: item.label,
        description: item.description,
        isActive: item.is_active,
        sortOrder: item.sort_order,
        createdAt: item.created_at
      }))

      const leadStatuses: LeadStatusMeta[] = (leadStatusesRes.data || []).map(item => ({
        id: item.id,
        code: item.code,
        label: item.label,
        description: item.description,
        isActive: item.is_active,
        sortOrder: item.sort_order,
        createdAt: item.created_at
      }))

      const leadOrigins: LeadOriginMeta[] = (leadOriginsRes.data || []).map(item => ({
        id: item.id,
        code: item.code,
        label: item.label,
        description: item.description,
        isActive: item.is_active,
        sortOrder: item.sort_order,
        createdAt: item.created_at
      }))

      const leadMemberRoles: LeadMemberRoleMeta[] = (leadMemberRolesRes.data || []).map(item => ({
        id: item.id,
        code: item.code,
        label: item.label,
        description: item.description,
        isActive: item.is_active,
        sortOrder: item.sort_order,
        createdAt: item.created_at
      }))

      const userRoleMetadata: UserRoleMetadata[] = (userRoleMetadataRes.data || []).map(item => ({
        id: item.id,
        code: item.code,
        label: item.label,
        description: item.description,
        permissions: item.permissions || [],
        isActive: item.is_active,
        sortOrder: item.sort_order,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))

      setMetadata({
        stages,
        operationTypes,
        lossReasons,
        settings,
        dealStatuses,
        relationshipLevels,
        companyTypes,
        leadStatuses,
        leadOrigins,
        leadMemberRoles,
        userRoleMetadata
      })
    } catch (err) {
      console.error('Error loading system metadata:', err)
      setError(err instanceof Error ? err : new Error('Failed to load system metadata'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMetadata()
  }, [])

  return (
    <SystemMetadataContext.Provider
      value={{
        stages: metadata.stages,
        operationTypes: metadata.operationTypes,
        lossReasons: metadata.lossReasons,
        settings: metadata.settings,
        dealStatuses: metadata.dealStatuses,
        relationshipLevels: metadata.relationshipLevels,
        companyTypes: metadata.companyTypes,
        leadStatuses: metadata.leadStatuses,
        leadOrigins: metadata.leadOrigins,
        leadMemberRoles: metadata.leadMemberRoles,
        userRoleMetadata: metadata.userRoleMetadata,
        isLoading,
        error,
        reload: loadMetadata, // Kept for backward compatibility
        refreshMetadata: loadMetadata // New alias for clarity
      }}
    >
      {children}
    </SystemMetadataContext.Provider>
  )
}

export { SystemMetadataContext }
