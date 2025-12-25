import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listLeadTasks,
  createLeadTask,
  createLeadTaskFromTemplate,
  completeLeadTask,
  setTaskAsNextAction,
  deleteLeadTask,
  CreateLeadTaskRequest,
  CreateFromTemplateRequest,
} from '@/services/leadTasksService'

export function useLeadTasks(leadId: string, includeCompleted = false) {
  return useQuery({
    queryKey: ['lead-tasks', leadId, { includeCompleted }],
    queryFn: () => listLeadTasks(leadId, includeCompleted),
    enabled: !!leadId,
  })
}

async function invalidateLeadCaches(queryClient: ReturnType<typeof useQueryClient>, leadId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['lead-tasks', leadId] }),
    queryClient.invalidateQueries({ queryKey: ['leads'] }),
    queryClient.invalidateQueries({ queryKey: ['leads', leadId] }),
    queryClient.invalidateQueries({ queryKey: ['leads', 'sales-view'] }),
    queryClient.invalidateQueries({ queryKey: ['leads-sales-view'] }),
    queryClient.invalidateQueries({ queryKey: ['sales-view'] })
  ])
}

export function useCreateLeadTask(leadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLeadTaskRequest) => createLeadTask(leadId, data),
    onSuccess: async (data, variables) => {
      await invalidateLeadCaches(queryClient, leadId)
      const isNextAction = Boolean(data?.is_next_action || variables?.is_next_action)
      toast.success(isNextAction ? 'Próxima ação definida' : 'Tarefa criada')
    },
    onError: () => {
      toast.error('Erro ao criar tarefa')
    },
  })
}

export function useCreateLeadTaskFromTemplate(leadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFromTemplateRequest) =>
      createLeadTaskFromTemplate(leadId, data),
    onSuccess: async (data, variables) => {
      await invalidateLeadCaches(queryClient, leadId)
      const isNextAction = Boolean(data?.is_next_action || variables?.is_next_action)
      toast.success(isNextAction ? 'Próxima ação definida' : 'Tarefa criada a partir do template')
    },
    onError: () => {
      toast.error('Erro ao criar tarefa')
    },
  })
}

export function useCompleteLeadTask(leadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => completeLeadTask(leadId, taskId),
    onSuccess: async () => {
      await invalidateLeadCaches(queryClient, leadId)
      toast.success('Tarefa completada')
    },
    onError: () => {
      toast.error('Erro ao completar tarefa')
    },
  })
}

export function useSetTaskAsNextAction(leadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => setTaskAsNextAction(leadId, taskId),
    onSuccess: async () => {
      await invalidateLeadCaches(queryClient, leadId)
      toast.success('Próxima ação definida')
    },
    onError: () => {
      toast.error('Erro ao definir próxima ação')
    },
  })
}

export function useDeleteLeadTask(leadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => deleteLeadTask(leadId, taskId),
    onSuccess: async () => {
      await invalidateLeadCaches(queryClient, leadId)
      toast.success('Tarefa removida')
    },
    onError: () => {
      toast.error('Erro ao remover tarefa')
    },
  })
}
