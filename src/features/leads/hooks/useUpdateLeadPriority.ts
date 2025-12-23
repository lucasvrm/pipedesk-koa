import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateLeadPriority, PriorityBucket } from '@/services/leadPriorityService'
import { toast } from 'sonner'

const LABELS: Record<PriorityBucket, string> = {
  hot: 'Alta',
  warm: 'Média',
  cold: 'Baixa',
}

export function useUpdateLeadPriority() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leadId, priorityBucket }: { leadId: string; priorityBucket: PriorityBucket }) =>
      updateLeadPriority(leadId, priorityBucket),
    
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['sales-view'] })
      queryClient.invalidateQueries({ queryKey: ['lead', data.lead_id] })
      
      toast.success('Prioridade atualizada', {
        description: `Alterada para: ${LABELS[data.priority_bucket]}`,
      })
    },
    
    onError: (error) => {
      toast.error('Erro ao atualizar prioridade', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      })
    },
  })
}
