import { supabase } from '@/lib/supabaseClient'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export type TemplateEvent = 'on_create' | 'on_stage_change' | 'on_convert' | 'on_add_party'

export interface StructureTemplate {
  id?: string
  name: string
  entity_type: string
  event_type: TemplateEvent
  path_pattern: string
  documents_to_create?: any
  conditions?: any
  is_active?: boolean
}

export interface DocumentTypeConfig {
  id?: string
  label: string
  folder_pattern: string
  template_file?: string | null
  file_name_pattern?: string | null
  min_stage?: number | null
  required_stage?: number | null
  cardinality?: string
  tags?: string[]
  required_placeholders?: any
  optional_placeholders?: any
  is_active?: boolean
}

async function fetchStructureTemplates(): Promise<StructureTemplate[]> {
  const { data, error } = await supabase
    .from('structure_templates')
    .select('*')
    .order('name')

  if (error) throw error
  return data as StructureTemplate[]
}

async function fetchDocumentTypes(): Promise<DocumentTypeConfig[]> {
  const { data, error } = await supabase
    .from('document_type_configs')
    .select('*')
    .order('label')

  if (error) throw error
  return data as DocumentTypeConfig[]
}

async function upsertStructureTemplate(template: StructureTemplate) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, data } = await (supabase
    .from('structure_templates') as any)
    .upsert(template)
    .select()
    .single()

  if (error) throw error
  return data as StructureTemplate
}

async function deleteStructureTemplate(id: string) {
  const { error } = await supabase.from('structure_templates').delete().eq('id', id)
  if (error) throw error
}

async function upsertDocumentType(config: DocumentTypeConfig) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, data } = await (supabase
    .from('document_type_configs') as any)
    .upsert(config)
    .select()
    .single()

  if (error) throw error
  return data as DocumentTypeConfig
}

async function deleteDocumentType(id: string) {
  const { error } = await supabase.from('document_type_configs').delete().eq('id', id)
  if (error) throw error
}

export function useStructureTemplates() {
  return useQuery({ queryKey: ['structure_templates'], queryFn: fetchStructureTemplates })
}

export function useDocumentTypes() {
  return useQuery({ queryKey: ['document_type_configs'], queryFn: fetchDocumentTypes })
}

export function useSaveStructureTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StructureTemplate) => upsertStructureTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structure_templates'] })
    }
  })
}

export function useDeleteStructureTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteStructureTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structure_templates'] })
    }
  })
}

export function useSaveDocumentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DocumentTypeConfig) => upsertDocumentType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_type_configs'] })
    }
  })
}

export function useDeleteDocumentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocumentType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_type_configs'] })
    }
  })
}
