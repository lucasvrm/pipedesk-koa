import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

import { useLeadTaskTemplates } from '@/hooks/useLeadTaskTemplates'
import {
  useLeadTasks,
  useCreateLeadTask,
  useCreateLeadTaskFromTemplate,
  useCompleteLeadTask,
  useSetTaskAsNextAction,
  useDeleteLeadTask,
} from '../hooks/useLeadTasks'
import { LeadTaskItem } from './LeadTaskItem'
import { LeadTaskCreateForm } from './LeadTaskCreateForm'

interface LeadTasksModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  leadName: string
}

export function LeadTasksModal({
  open,
  onOpenChange,
  leadId,
  leadName,
}: LeadTasksModalProps) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const [settingNextActionId, setSettingNextActionId] = useState<string | null>(null)

  // Queries
  const { data: tasksData, isLoading: tasksLoading } = useLeadTasks(leadId, showCompleted)
  const { data: templatesData, isLoading: templatesLoading } = useLeadTaskTemplates(false)

  // Mutations
  const createTask = useCreateLeadTask(leadId)
  const createFromTemplate = useCreateLeadTaskFromTemplate(leadId)
  const completeTask = useCompleteLeadTask(leadId)
  const setNextAction = useSetTaskAsNextAction(leadId)
  const deleteTask = useDeleteLeadTask(leadId)

  const tasks = tasksData?.data ?? []
  const templates = templatesData?.data ?? []

  const handleTemplateClick = async (templateId: string) => {
    await createFromTemplate.mutateAsync({ template_id: templateId })
  }

  const handleComplete = async (taskId: string) => {
    setCompletingTaskId(taskId)
    try {
      await completeTask.mutateAsync(taskId)
    } finally {
      setCompletingTaskId(null)
    }
  }

  const handleSetNextAction = async (taskId: string) => {
    setSettingNextActionId(taskId)
    try {
      await setNextAction.mutateAsync(taskId)
    } finally {
      setSettingNextActionId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Tarefas - {leadName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Templates */}
          <div>
            <h4 className="text-sm font-medium mb-2">Templates disponíveis</h4>
            {templatesLoading ? (
              <div className="flex gap-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <Badge
                    key={template.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleTemplateClick(template.id)}
                  >
                    {createFromTemplate.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    {template.label}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Clique para adicionar ao lead
            </p>
          </div>

          {/* Lista de tarefas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Tarefas do lead</h4>
              <div className="flex items-center gap-2">
                <Switch
                  id="show-completed"
                  checked={showCompleted}
                  onCheckedChange={setShowCompleted}
                />
                <Label htmlFor="show-completed" className="text-sm">
                  Mostrar concluídas
                </Label>
              </div>
            </div>

            {tasksLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma tarefa. Clique em um template ou crie uma tarefa customizada.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <LeadTaskItem
                    key={task.id}
                    task={task}
                    onComplete={() => handleComplete(task.id)}
                    onSetNextAction={() => handleSetNextAction(task.id)}
                    onDelete={() => deleteTask.mutate(task.id)}
                    isCompletePending={completingTaskId === task.id}
                    isSetNextActionPending={settingNextActionId === task.id}
                  />
                ))}
              </div>
            )}

            {/* Form para criar customizada */}
            <div className="mt-4">
              <LeadTaskCreateForm
                onSubmit={(data) => createTask.mutate(data)}
                isSubmitting={createTask.isPending}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
