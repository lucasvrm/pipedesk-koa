import { createContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { SystemMetadata, Stage, OperationType, LossReason, SystemSettings } from '@/types/metadata'

interface SystemMetadataContextType {
  stages: Stage[]
  operationTypes: OperationType[]
  lossReasons: LossReason[]
  settings: SystemSettings[]
  isLoading: boolean
  error: Error | null
  reload: () => Promise<void>
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
    settings: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadMetadata = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load all metadata in parallel
      const [stagesRes, operationTypesRes, lossReasonsRes, settingsRes] = await Promise.all([
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
          .order('key')
      ])

      // Check for errors
      if (stagesRes.error) throw stagesRes.error
      if (operationTypesRes.error) throw operationTypesRes.error
      if (lossReasonsRes.error) throw lossReasonsRes.error
      if (settingsRes.error) throw settingsRes.error

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

      setMetadata({
        stages,
        operationTypes,
        lossReasons,
        settings
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
        isLoading,
        error,
        reload: loadMetadata
      }}
    >
      {children}
    </SystemMetadataContext.Provider>
  )
}

export { SystemMetadataContext }
