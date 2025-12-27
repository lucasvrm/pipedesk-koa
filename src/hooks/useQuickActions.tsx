import { NavigateFunction } from 'react-router-dom'
import { UseMutationResult } from '@tanstack/react-query'
import { logActivity } from '@/services/activityService'
import { QuickAction } from '@/components/QuickActionsMenu'
import {
  PencilSimple,
  Trash,
  Users,
  FileArrowDown,
  ChartBar,
  Tag,
  Copy,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  CalendarBlank,
  Plus,
  Envelope,
  Phone,
  Buildings,
  Link as LinkIcon,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import { 
  MasterDeal, 
  DealStatus, 
  STATUS_LABELS,
  PlayerTrack,
  Task,
  Company,
  Contact,
  Lead,
  LeadStatus,
} from '@/lib/types'
import { toast } from 'sonner'
import { safeString } from '@/lib/utils'

interface GetDealQuickActionsProps {
  deal: MasterDeal
  navigate: NavigateFunction
  updateDeal: UseMutationResult<any, Error, { dealId: string; updates: any }, unknown>
  deleteDeal: UseMutationResult<any, Error, string, unknown>
  profileId?: string
  onEdit?: () => void
  onAddPlayer?: () => void
  onGenerateDoc?: () => void
  onManageTags?: () => void
  onViewAnalytics?: () => void
  onDuplicate?: () => void
}

/**
 * Factory function that returns quick actions for a Deal entity
 * Note: This is NOT a React hook - call it inside your component render
 */
export function getDealQuickActions({
  deal,
  navigate,
  updateDeal,
  deleteDeal,
  profileId,
  onEdit,
  onAddPlayer,
  onGenerateDoc,
  onManageTags,
  onViewAnalytics,
  onDuplicate,
}: GetDealQuickActionsProps): QuickAction[] {
  const handleStatusChange = (newStatus: DealStatus) => {
    updateDeal.mutate(
      {
        dealId: deal.id,
        updates: { status: newStatus },
      },
      {
        onSuccess: () => {
          toast.success(`Status alterado para ${STATUS_LABELS[newStatus]}`)
          if (profileId) {
            logActivity(
              deal.id,
              'deal',
              `Status alterado para ${STATUS_LABELS[newStatus]}`,
              profileId
            )
          }
        },
        onError: () => toast.error('Erro ao atualizar status'),
      }
    )
  }

  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja excluir este negócio?')) return

    deleteDeal.mutate(deal.id, {
      onSuccess: () => {
        toast.success('Negócio excluído com sucesso')
        navigate('/deals')
      },
      onError: () => toast.error('Erro ao excluir negócio'),
    })
  }

  return [
      {
        id: 'edit',
        label: 'Editar Negócio',
        icon: <PencilSimple className="h-4 w-4" />,
        onClick: () => onEdit?.(),
        disabled: !onEdit,
      },
      {
        id: 'status',
        label: 'Alterar Status',
        icon: <PlayCircle className="h-4 w-4" />,
        onClick: () => {}, // Parent for sub-actions
        subActions: [
          {
            id: 'status-active',
            label: 'Ativo',
            icon: <PlayCircle className="h-4 w-4" />,
            onClick: () => handleStatusChange('active'),
          },
          {
            id: 'status-on-hold',
            label: 'Em Espera',
            icon: <PauseCircle className="h-4 w-4" />,
            onClick: () => handleStatusChange('on_hold'),
          },
          {
            id: 'status-concluded',
            label: 'Concluído',
            icon: <CheckCircle className="h-4 w-4" />,
            onClick: () => handleStatusChange('concluded'),
          },
          {
            id: 'status-cancelled',
            label: 'Cancelado',
            icon: <XCircle className="h-4 w-4" />,
            onClick: () => handleStatusChange('cancelled'),
            variant: 'destructive',
          },
        ],
      },
      {
        id: 'add-player',
        label: 'Adicionar Player',
        icon: <Users className="h-4 w-4" />,
        onClick: () => onAddPlayer?.(),
        disabled: !onAddPlayer,
      },
      {
        id: 'separator-1',
        label: '',
        onClick: () => {},
      },
      {
        id: 'analytics',
        label: 'Ver Analytics (AIDA)',
        icon: <ChartBar className="h-4 w-4" />,
        onClick: () => onViewAnalytics?.() || navigate(`/aida/${deal.companyId}`),
        disabled: !deal.companyId,
      },
      {
        id: 'generate-doc',
        label: 'Gerar Documento',
        icon: <FileArrowDown className="h-4 w-4" />,
        onClick: () => onGenerateDoc?.(),
        disabled: !onGenerateDoc,
      },
      {
        id: 'manage-tags',
        label: 'Gerenciar Tags',
        icon: <Tag className="h-4 w-4" />,
        onClick: () => onManageTags?.(),
        disabled: !onManageTags,
      },
      {
        id: 'duplicate',
        label: 'Duplicar Negócio',
        icon: <Copy className="h-4 w-4" />,
        onClick: () => onDuplicate?.(),
        disabled: !onDuplicate,
      },
      {
        id: 'separator-2',
        label: '',
        onClick: () => {},
      },
      {
        id: 'delete',
        label: 'Excluir Negócio',
        icon: <Trash className="h-4 w-4" />,
        onClick: handleDelete,
        variant: 'destructive',
      },
    ]
}

// ===== TRACK/PLAYER QUICK ACTIONS =====

interface GetTrackQuickActionsProps {
  track: PlayerTrack
  navigate: NavigateFunction
  updateTrack: UseMutationResult<any, Error, { trackId: string; updates: any }, unknown>
  deleteTrack: UseMutationResult<any, Error, string, unknown>
  profileId?: string
  onEdit?: () => void
  onAddTask?: () => void
  onUpdateProbability?: () => void
  onAssignResponsible?: () => void
}

/**
 * Factory function that returns quick actions for a Track/Player entity
 */
export function getTrackQuickActions({
  track,
  navigate,
  updateTrack,
  deleteTrack,
  profileId,
  onEdit,
  onAddTask,
  onUpdateProbability,
  onAssignResponsible,
}: GetTrackQuickActionsProps): QuickAction[] {
  const handleStageChange = (newStage: string) => {
    updateTrack.mutate(
      {
        trackId: track.id,
        updates: { stage: newStage },
      },
      {
        onSuccess: () => {
          toast.success(`Stage alterado para ${newStage}`)
          if (profileId) logActivity(track.id, 'track', `Stage alterado para ${newStage}`, profileId)
        },
        onError: () => toast.error('Erro ao atualizar stage'),
      }
    )
  }

  const handleMarkWon = () => {
    updateTrack.mutate(
      {
        trackId: track.id,
        updates: { status: 'concluded', stage: 'closing' },
      },
      {
        onSuccess: () => {
          toast.success('Player marcado como Ganho!')
          if (profileId) logActivity(track.id, 'track', 'Player marcado como ganho', profileId)
        },
        onError: () => toast.error('Erro ao marcar como ganho'),
      }
    )
  }

  const handleMarkLost = () => {
    updateTrack.mutate(
      {
        trackId: track.id,
        updates: { status: 'cancelled' },
      },
      {
        onSuccess: () => {
          toast.success('Player marcado como Perdido')
          if (profileId) logActivity(track.id, 'track', 'Player marcado como perdido', profileId)
        },
        onError: () => toast.error('Erro ao marcar como perdido'),
      }
    )
  }

  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja excluir este player?')) return
    deleteTrack.mutate(track.id, {
      onSuccess: () => {
        toast.success('Player excluído')
        navigate(`/deals/${track.masterDealId}`)
      },
      onError: () => toast.error('Erro ao excluir player'),
    })
  }

  return [
      {
        id: 'edit',
        label: 'Editar Player',
        icon: <PencilSimple className="h-4 w-4" />,
        onClick: () => onEdit?.(),
        disabled: !onEdit,
      },
      {
        id: 'stage',
        label: 'Alterar Stage',
        icon: <ArrowsClockwise className="h-4 w-4" />,
        onClick: () => {},
        subActions: [
          { id: 'stage-nda', label: 'NDA', onClick: () => handleStageChange('nda') },
          { id: 'stage-analysis', label: 'Análise', onClick: () => handleStageChange('analysis') },
          { id: 'stage-proposal', label: 'Proposta', onClick: () => handleStageChange('proposal') },
          { id: 'stage-negotiation', label: 'Negociação', onClick: () => handleStageChange('negotiation') },
          { id: 'stage-closing', label: 'Fechamento', onClick: () => handleStageChange('closing') },
        ],
      },
      {
        id: 'probability',
        label: 'Atualizar Probabilidade',
        icon: <Clock className="h-4 w-4" />,
        onClick: () => onUpdateProbability?.(),
        disabled: !onUpdateProbability,
      },
      {
        id: 'assign',
        label: 'Atribuir Responsável',
        icon: <Users className="h-4 w-4" />,
        onClick: () => onAssignResponsible?.(),
        disabled: !onAssignResponsible,
      },
      {
        id: 'separator-1',
        label: '',
        onClick: () => {},
      },
      {
        id: 'add-task',
        label: 'Adicionar Tarefa',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => onAddTask?.(),
        disabled: !onAddTask,
      },
      {
        id: 'view-details',
        label: 'Ver Detalhes',
        icon: <ChartBar className="h-4 w-4" />,
        onClick: () => navigate(`/tracks/${track.id}`),
      },
      {
        id: 'separator-2',
        label: '',
        onClick: () => {},
      },
      {
        id: 'mark-won',
        label: 'Marcar como Ganho',
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: handleMarkWon,
      },
      {
        id: 'mark-lost',
        label: 'Marcar como Perdido',
        icon: <XCircle className="h-4 w-4" />,
        onClick: handleMarkLost,
        variant: 'destructive',
      },
      {
        id: 'separator-3',
        label: '',
        onClick: () => {},
      },
      {
        id: 'delete',
        label: 'Excluir Player',
        icon: <Trash className="h-4 w-4" />,
        onClick: handleDelete,
        variant: 'destructive',
      },
    ]
}

// ===== TASK QUICK ACTIONS =====

interface GetTaskQuickActionsProps {
  task: Task
  updateTask: UseMutationResult<any, Error, { taskId: string; updates: any }, unknown>
  deleteTask: UseMutationResult<any, Error, string, unknown>
  profileId?: string
  onEdit?: () => void
  onSetDueDate?: () => void
  onAddDependency?: () => void
  onReassign?: () => void
}

/**
 * Factory function that returns quick actions for a Task entity
 */
export function getTaskQuickActions({
  task,
  updateTask,
  deleteTask,
  profileId,
  onEdit,
  onSetDueDate,
  onAddDependency,
  onReassign,
}: GetTaskQuickActionsProps): QuickAction[] {
  const handleToggleComplete = () => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    updateTask.mutate(
      {
        taskId: task.id,
        updates: { status: newStatus },
      },
      {
        onSuccess: () => {
          toast.success(newStatus === 'completed' ? 'Tarefa concluída!' : 'Tarefa reaberta')
          if (profileId) logActivity(task.id, 'task', `Status alterado para ${newStatus}`, profileId)
        },
        onError: () => toast.error('Erro ao atualizar tarefa'),
      }
    )
  }

  const handleStatusChange = (newStatus: string) => {
    updateTask.mutate(
      {
        taskId: task.id,
        updates: { status: newStatus },
      },
      {
        onSuccess: () => {
          toast.success('Status atualizado')
          if (profileId) logActivity(task.id, 'task', `Status alterado para ${newStatus}`, profileId)
        },
        onError: () => toast.error('Erro ao atualizar status'),
      }
    )
  }

  const handlePriorityChange = (newPriority: string) => {
    updateTask.mutate(
      {
        taskId: task.id,
        updates: { priority: newPriority },
      },
      {
        onSuccess: () => {
          toast.success('Prioridade atualizada')
          if (profileId) logActivity(task.id, 'task', `Prioridade alterada para ${newPriority}`, profileId)
        },
        onError: () => toast.error('Erro ao atualizar prioridade'),
      }
    )
  }

  const handleToggleMilestone = () => {
    updateTask.mutate(
      {
        taskId: task.id,
        updates: { isMilestone: !task.isMilestone },
      },
      {
        onSuccess: () => {
          toast.success(task.isMilestone ? 'Removido de Milestone' : 'Marcado como Milestone')
        },
        onError: () => toast.error('Erro ao atualizar tarefa'),
      }
    )
  }

  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return
    deleteTask.mutate(task.id, {
      onSuccess: () => toast.success('Tarefa excluída'),
      onError: () => toast.error('Erro ao excluir tarefa'),
    })
  }

  return [
      {
        id: 'toggle-complete',
        label: task.status === 'completed' ? 'Marcar como Incompleta' : 'Marcar como Completa',
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: handleToggleComplete,
      },
      {
        id: 'status',
        label: 'Alterar Status',
        icon: <PlayCircle className="h-4 w-4" />,
        onClick: () => {},
        subActions: [
          { id: 'status-todo', label: 'A Fazer', onClick: () => handleStatusChange('todo') },
          { id: 'status-in-progress', label: 'Em Progresso', onClick: () => handleStatusChange('in_progress') },
          { id: 'status-blocked', label: 'Bloqueada', onClick: () => handleStatusChange('blocked') },
          { id: 'status-completed', label: 'Concluída', onClick: () => handleStatusChange('completed') },
        ],
      },
      {
        id: 'priority',
        label: 'Alterar Prioridade',
        icon: <Star className="h-4 w-4" />,
        onClick: () => {},
        subActions: [
          { id: 'priority-low', label: 'Baixa', onClick: () => handlePriorityChange('low') },
          { id: 'priority-medium', label: 'Média', onClick: () => handlePriorityChange('medium') },
          { id: 'priority-high', label: 'Alta', onClick: () => handlePriorityChange('high') },
          { id: 'priority-urgent', label: 'Urgente', onClick: () => handlePriorityChange('urgent') },
        ],
      },
      {
        id: 'separator-1',
        label: '',
        onClick: () => {},
      },
      {
        id: 'edit',
        label: 'Editar Tarefa',
        icon: <PencilSimple className="h-4 w-4" />,
        onClick: () => onEdit?.(),
        disabled: !onEdit,
      },
      {
        id: 'set-due-date',
        label: 'Definir Prazo',
        icon: <CalendarBlank className="h-4 w-4" />,
        onClick: () => onSetDueDate?.(),
        disabled: !onSetDueDate,
      },
      {
        id: 'reassign',
        label: 'Reatribuir',
        icon: <Users className="h-4 w-4" />,
        onClick: () => onReassign?.(),
        disabled: !onReassign,
      },
      {
        id: 'toggle-milestone',
        label: task.isMilestone ? 'Remover Milestone' : 'Marcar como Milestone',
        icon: <Star className="h-4 w-4" />,
        onClick: handleToggleMilestone,
      },
      {
        id: 'add-dependency',
        label: 'Adicionar Dependência',
        icon: <LinkIcon className="h-4 w-4" />,
        onClick: () => onAddDependency?.(),
        disabled: !onAddDependency,
      },
      {
        id: 'separator-2',
        label: '',
        onClick: () => {},
      },
      {
        id: 'delete',
        label: 'Excluir Tarefa',
        icon: <Trash className="h-4 w-4" />,
        onClick: handleDelete,
        variant: 'destructive',
      },
    ]
}

// ===== COMPANY QUICK ACTIONS =====

interface GetCompanyQuickActionsProps {
  company: Company
  navigate: NavigateFunction
  deleteCompany: UseMutationResult<any, Error, string, unknown>
  onEdit?: () => void
  onAddContact?: () => void
  onCreateDeal?: () => void
  onManageTags?: () => void
}

/**
 * Factory function that returns quick actions for a Company entity
 */
export function getCompanyQuickActions({
  company,
  navigate,
  deleteCompany,
  onEdit,
  onAddContact,
  onCreateDeal,
  onManageTags,
}: GetCompanyQuickActionsProps): QuickAction[] {
  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return
    deleteCompany.mutate(company.id, {
      onSuccess: () => {
        toast.success('Empresa excluída')
        navigate('/companies')
      },
      onError: () => toast.error('Erro ao excluir empresa'),
    })
  }

  return [
      {
        id: 'edit',
        label: 'Editar Empresa',
        icon: <PencilSimple className="h-4 w-4" />,
        onClick: () => onEdit?.(),
        disabled: !onEdit,
      },
      {
        id: 'add-contact',
        label: 'Adicionar Contato',
        icon: <Users className="h-4 w-4" />,
        onClick: () => onAddContact?.(),
        disabled: !onAddContact,
      },
      {
        id: 'create-deal',
        label: 'Criar Negócio',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => onCreateDeal?.(),
        disabled: !onCreateDeal,
      },
      {
        id: 'separator-1',
        label: '',
        onClick: () => {},
      },
      {
        id: 'view-deals',
        label: 'Ver Todos os Negócios',
        icon: <FileArrowDown className="h-4 w-4" />,
        onClick: () => navigate(`/deals?company=${company.id}`),
      },
      {
        id: 'manage-tags',
        label: 'Gerenciar Tags',
        icon: <Tag className="h-4 w-4" />,
        onClick: () => onManageTags?.(),
        disabled: !onManageTags,
      },
      {
        id: 'separator-2',
        label: '',
        onClick: () => {},
      },
      {
        id: 'delete',
        label: 'Excluir Empresa',
        icon: <Trash className="h-4 w-4" />,
        onClick: handleDelete,
        variant: 'destructive',
      },
    ]
}

// ===== CONTACT QUICK ACTIONS =====

interface GetContactQuickActionsProps {
  contact: Contact
  navigate: NavigateFunction
  deleteContact: UseMutationResult<any, Error, string, unknown>
  onEdit?: () => void
  onLinkToCompany?: () => void
  onAddToLead?: () => void
}

/**
 * Factory function that returns quick actions for a Contact entity
 */
export function getContactQuickActions({
  contact,
  navigate,
  deleteContact,
  onEdit,
  onLinkToCompany,
  onAddToLead,
}: GetContactQuickActionsProps): QuickAction[] {
  const handleSendEmail = () => {
    if (contact.email) {
      window.location.href = `mailto:${contact.email}`
    } else {
      toast.error('Contato não possui email')
    }
  }

  const handleCall = () => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`
    } else {
      toast.error('Contato não possui telefone')
    }
  }

  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return
    deleteContact.mutate(contact.id, {
      onSuccess: () => {
        toast.success('Contato excluído')
        navigate('/contacts')
      },
      onError: () => toast.error('Erro ao excluir contato'),
    })
  }

  return [
      {
        id: 'edit',
        label: 'Editar Contato',
        icon: <PencilSimple className="h-4 w-4" />,
        onClick: () => onEdit?.(),
        disabled: !onEdit,
      },
      {
        id: 'send-email',
        label: 'Enviar Email',
        icon: <Envelope className="h-4 w-4" />,
        onClick: handleSendEmail,
        disabled: !contact.email,
      },
      {
        id: 'call',
        label: 'Ligar',
        icon: <Phone className="h-4 w-4" />,
        onClick: handleCall,
        disabled: !contact.phone,
      },
      {
        id: 'separator-1',
        label: '',
        onClick: () => {},
      },
      {
        id: 'link-company',
        label: 'Vincular à Empresa',
        icon: <Buildings className="h-4 w-4" />,
        onClick: () => onLinkToCompany?.(),
        disabled: !onLinkToCompany,
      },
      {
        id: 'add-to-lead',
        label: 'Adicionar ao Lead',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => onAddToLead?.(),
        disabled: !onAddToLead,
      },
      {
        id: 'separator-2',
        label: '',
        onClick: () => {},
      },
      {
        id: 'delete',
        label: 'Excluir Contato',
        icon: <Trash className="h-4 w-4" />,
        onClick: handleDelete,
        variant: 'destructive',
      },
    ]
}

// ===== LEAD QUICK ACTIONS =====

interface GetLeadQuickActionsProps {
  lead: Lead
  navigate: NavigateFunction
  updateLead: UseMutationResult<any, Error, { leadId: string; updates: any }, unknown>
  deleteLead: UseMutationResult<any, Error, string, unknown>
  profileId?: string
  onEdit?: () => void
  onQualify?: () => void
  onAddContact?: () => void
  onAssignOwner?: () => void
  onAddMember?: () => void
  onManageTags?: () => void
  getLeadStatusLabel?: (code: string) => string
  // Optional dynamic statuses
  statusOptions?: { id: string; label: string; code?: string }[]
}

/**
 * Factory function that returns quick actions for a Lead entity
 */
export function getLeadQuickActions({
  lead,
  navigate,
  updateLead,
  deleteLead,
  profileId,
  onEdit,
  onQualify,
  onAddContact,
  onAssignOwner,
  onAddMember,
  onManageTags,
  getLeadStatusLabel = (id) => id, // Fallback to code/id if not provided
  statusOptions
}: GetLeadQuickActionsProps): QuickAction[] {

  const handleStatusChange = (newStatusId: string) => {
    updateLead.mutate(
      {
        leadId: lead.id,
        updates: { leadStatusId: newStatusId },
      },
      {
        onSuccess: () => {
          const statusLabel = getLeadStatusLabel(newStatusId);
          toast.success(`Status alterado para ${statusLabel}`)
          if (profileId) {
            logActivity(lead.id, 'lead', `Status alterado para ${statusLabel}`, profileId)
          }
        },
        onError: () => toast.error('Erro ao atualizar status'),
      }
    )
  }

  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return
    deleteLead.mutate(lead.id, {
      onSuccess: () => {
        toast.success('Lead excluído')
        navigate('/leads')
      },
      onError: () => toast.error('Erro ao excluir lead'),
    })
  }

  const statusActions: QuickAction[] = statusOptions?.map(status => ({
    id: `status-${status.id}`,
    label: safeString(status.label, status.code),
    icon: status.code === 'new' ? <PlayCircle className="h-4 w-4" /> :
          status.code === 'contacted' ? <PauseCircle className="h-4 w-4" /> :
          status.code === 'qualified' ? <CheckCircle className="h-4 w-4" /> :
          status.code === 'disqualified' ? <XCircle className="h-4 w-4" /> :
          <PlayCircle className="h-4 w-4" />,
    onClick: () => handleStatusChange(status.id),
    variant: status.code === 'disqualified' ? 'destructive' : 'default',
  })) || []

  return [
      {
        id: 'qualify',
        label: 'Qualificar Lead',
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: () => onQualify?.(),
        // Check using ID if possible, or skip check if strictly needed
        disabled: !onQualify, // || lead.leadStatusId === 'qualified_id',
      },
      ...(statusActions.length > 0 ? [{
        id: 'status',
        label: 'Alterar Status',
        icon: <PlayCircle className="h-4 w-4" />,
        onClick: () => {},
        subActions: statusActions,
      }] : []),
      {
        id: 'separator-1',
        label: '',
        onClick: () => {},
      },
      {
        id: 'edit',
        label: 'Editar Lead',
        icon: <PencilSimple className="h-4 w-4" />,
        onClick: () => onEdit?.(),
        disabled: !onEdit,
      },
      {
        id: 'add-contact',
        label: 'Adicionar Contato',
        icon: <Users className="h-4 w-4" />,
        onClick: () => onAddContact?.(),
        disabled: !onAddContact,
      },
      {
        id: 'assign-owner',
        label: 'Atribuir Responsável',
        icon: <Users className="h-4 w-4" />,
        onClick: () => onAssignOwner?.(),
        disabled: !onAssignOwner,
      },
      {
        id: 'add-member',
        label: 'Adicionar Membro',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => onAddMember?.(),
        disabled: !onAddMember,
      },
      {
        id: 'manage-tags',
        label: 'Gerenciar Tags',
        icon: <Tag className="h-4 w-4" />,
        onClick: () => onManageTags?.(),
        disabled: !onManageTags,
      },
      {
        id: 'separator-2',
        label: '',
        onClick: () => {},
      },
      {
        id: 'delete',
        label: 'Excluir Lead',
        icon: <Trash className="h-4 w-4" />,
        onClick: handleDelete,
        variant: 'destructive',
      },
    ]
}
