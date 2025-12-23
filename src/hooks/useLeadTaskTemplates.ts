import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listLeadTaskTemplates,
  createLeadTaskTemplate,
  updateLeadTaskTemplate,
  deleteLeadTaskTemplate,
  LeadTaskTemplateCreate,
  LeadTaskTemplateUpdate,
} from '@/services/leadTaskTemplatesService'

const QUERY_KEY = ['lead-task-templates']

export function useLeadTaskTemplates(includeInactive = true) {
  return useQuery({
    queryKey: [...QUERY_KEY, { includeInactive }],
    queryFn: () => listLeadTaskTemplates(includeInactive),
  })
}

export function useCreateLeadTaskTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LeadTaskTemplateCreate) => createLeadTaskTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Template criado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar template', {
        description: error.message,
      })
    },
  })
}

export function useUpdateLeadTaskTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeadTaskTemplateUpdate }) =>
      updateLeadTaskTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Template atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar template', {
        description: error.message,
      })
    },
  })
}

export function useDeleteLeadTaskTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteLeadTaskTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Template desativado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao desativar template', {
        description: error.message,
      })
    },
  })
}

export function useReorderLeadTaskTemplates() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        updateLeadTaskTemplate(id, { sort_order: index + 1 })
      )
      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Ordem atualizada')
    },
    onError: () => {
      toast.error('Erro ao reordenar templates')
    },
  })
}
