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

export function useCreateLeadTask(leadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLeadTaskRequest) => createLeadTask(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-tasks', leadId] })
      queryClient.invalidateQueries({ queryKey: ['sales-view'] })
      toast.success('Tarefa criada')
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-tasks', leadId] })
      queryClient.invalidateQueries({ queryKey: ['sales-view'] })
      toast.success('Tarefa criada a partir do template')
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-tasks', leadId] })
      queryClient.invalidateQueries({ queryKey: ['sales-view'] })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-tasks', leadId] })
      queryClient.invalidateQueries({ queryKey: ['sales-view'] })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-tasks', leadId] })
      queryClient.invalidateQueries({ queryKey: ['sales-view'] })
      toast.success('Tarefa removida')
    },
    onError: () => {
      toast.error('Erro ao remover tarefa')
    },
  })
}
