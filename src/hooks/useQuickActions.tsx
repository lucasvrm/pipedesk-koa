import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUpdateDeal, useDeleteDeal } from '@/services/dealService'
import { useUpdateTrack, useDeleteTrack } from '@/services/trackService'
import { useUpdateTask, useDeleteTask } from '@/services/taskService'
import { useDeleteCompany } from '@/services/companyService'
import { useDeleteContact } from '@/services/contactService'
import { useUpdateLead, useDeleteLead } from '@/services/leadService'
import { logActivity } from '@/services/activityService'
import { useAuth } from '@/contexts/AuthContext'
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
  LEAD_STATUS_LABELS,
} from '@/lib/types'
import { toast } from 'sonner'

interface UseDealQuickActionsProps {
  deal: MasterDeal
  onEdit?: () => void
  onAddPlayer?: () => void
  onGenerateDoc?: () => void
  onManageTags?: () => void
  onViewAnalytics?: () => void
  onDuplicate?: () => void
}

/**
 * Hook that returns quick actions for a Deal entity
 */
export function useDealQuickActions({
  deal,
  onEdit,
  onAddPlayer,
  onGenerateDoc,
  onManageTags,
  onViewAnalytics,
  onDuplicate,
}: UseDealQuickActionsProps): QuickAction[] {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const updateDeal = useUpdateDeal()
  const deleteDeal = useDeleteDeal()

  const handleStatusChange = (newStatus: DealStatus) => {
    updateDeal.mutate(
      {
        dealId: deal.id,
        updates: { status: newStatus },
      },
      {
        onSuccess: () => {
          toast.success(`Status alterado para ${STATUS_LABELS[newStatus]}`)
          if (profile) {
            logActivity(
              deal.id,
              'deal',
              `Status alterado para ${STATUS_LABELS[newStatus]}`,
              profile.id
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

  return useMemo<QuickAction[]>(
    () => [
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
    ],
    [deal, onEdit, onAddPlayer, onGenerateDoc, onManageTags, onViewAnalytics, onDuplicate]
  )
}

// ===== TRACK/PLAYER QUICK ACTIONS =====

interface UseTrackQuickActionsProps {
  track: PlayerTrack
  onEdit?: () => void
  onAddTask?: () => void
  onUpdateProbability?: () => void
  onAssignResponsible?: () => void
}

/**
 * Hook that returns quick actions for a Track/Player entity
 */
export function useTrackQuickActions({
  track,
  onEdit,
  onAddTask,
  onUpdateProbability,
  onAssignResponsible,
}: UseTrackQuickActionsProps): QuickAction[] {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const updateTrack = useUpdateTrack()
  const deleteTrack = useDeleteTrack()

  const handleStageChange = (newStage: string) => {
    updateTrack.mutate(
      {
        trackId: track.id,
        updates: { stage: newStage },
      },
      {
        onSuccess: () => {
          toast.success(`Stage alterado para ${newStage}`)
          if (profile) logActivity(track.id, 'track', `Stage alterado para ${newStage}`, profile.id)
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
          if (profile) logActivity(track.id, 'track', 'Player marcado como ganho', profile.id)
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
          if (profile) logActivity(track.id, 'track', 'Player marcado como perdido', profile.id)
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
        navigate(`/deals/${track.dealId}`)
      },
      onError: () => toast.error('Erro ao excluir player'),
    })
  }

  return useMemo<QuickAction[]>(
    () => [
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
    ],
    [track, onEdit, onAddTask, onUpdateProbability, onAssignResponsible]
  )
}

// ===== TASK QUICK ACTIONS =====

interface UseTaskQuickActionsProps {
  task: Task
  onEdit?: () => void
  onSetDueDate?: () => void
  onAddDependency?: () => void
  onReassign?: () => void
}

/**
 * Hook that returns quick actions for a Task entity
 */
export function useTaskQuickActions({
  task,
  onEdit,
  onSetDueDate,
  onAddDependency,
  onReassign,
}: UseTaskQuickActionsProps): QuickAction[] {
  const { profile } = useAuth()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

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
          if (profile) logActivity(task.id, 'task', `Status alterado para ${newStatus}`, profile.id)
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
          if (profile) logActivity(task.id, 'task', `Status alterado para ${newStatus}`, profile.id)
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
          if (profile) logActivity(task.id, 'task', `Prioridade alterada para ${newPriority}`, profile.id)
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

  return useMemo<QuickAction[]>(
    () => [
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
    ],
    [task, onEdit, onSetDueDate, onAddDependency, onReassign]
  )
}

// ===== COMPANY QUICK ACTIONS =====

interface UseCompanyQuickActionsProps {
  company: Company
  onEdit?: () => void
  onAddContact?: () => void
  onCreateDeal?: () => void
  onManageTags?: () => void
}

/**
 * Hook that returns quick actions for a Company entity
 */
export function useCompanyQuickActions({
  company,
  onEdit,
  onAddContact,
  onCreateDeal,
  onManageTags,
}: UseCompanyQuickActionsProps): QuickAction[] {
  const navigate = useNavigate()
  const deleteCompany = useDeleteCompany()

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

  return useMemo<QuickAction[]>(
    () => [
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
    ],
    [company, onEdit, onAddContact, onCreateDeal, onManageTags]
  )
}

// ===== CONTACT QUICK ACTIONS =====

interface UseContactQuickActionsProps {
  contact: Contact
  onEdit?: () => void
  onLinkToCompany?: () => void
  onAddToLead?: () => void
}

/**
 * Hook that returns quick actions for a Contact entity
 */
export function useContactQuickActions({
  contact,
  onEdit,
  onLinkToCompany,
  onAddToLead,
}: UseContactQuickActionsProps): QuickAction[] {
  const navigate = useNavigate()
  const deleteContact = useDeleteContact()

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

  return useMemo<QuickAction[]>(
    () => [
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
    ],
    [contact, onEdit, onLinkToCompany, onAddToLead]
  )
}

// ===== LEAD QUICK ACTIONS =====

interface UseLeadQuickActionsProps {
  lead: Lead
  onEdit?: () => void
  onQualify?: () => void
  onAddContact?: () => void
  onAssignOwner?: () => void
  onAddMember?: () => void
  onManageTags?: () => void
}

/**
 * Hook that returns quick actions for a Lead entity
 */
export function useLeadQuickActions({
  lead,
  onEdit,
  onQualify,
  onAddContact,
  onAssignOwner,
  onAddMember,
  onManageTags,
}: UseLeadQuickActionsProps): QuickAction[] {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()

  const handleStatusChange = (newStatus: LeadStatus) => {
    updateLead.mutate(
      {
        leadId: lead.id,
        updates: { status: newStatus },
      },
      {
        onSuccess: () => {
          toast.success(`Status alterado para ${LEAD_STATUS_LABELS[newStatus]}`)
          if (profile) {
            logActivity(lead.id, 'lead', `Status alterado para ${LEAD_STATUS_LABELS[newStatus]}`, profile.id)
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

  return useMemo<QuickAction[]>(
    () => [
      {
        id: 'qualify',
        label: 'Qualificar Lead',
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: () => onQualify?.(),
        disabled: !onQualify || lead.status === 'qualified',
      },
      {
        id: 'status',
        label: 'Alterar Status',
        icon: <PlayCircle className="h-4 w-4" />,
        onClick: () => {},
        subActions: [
          { id: 'status-new', label: 'Novo', onClick: () => handleStatusChange('new') },
          { id: 'status-contacted', label: 'Contatado', onClick: () => handleStatusChange('contacted') },
          { id: 'status-qualified', label: 'Qualificado', onClick: () => handleStatusChange('qualified') },
          {
            id: 'status-disqualified',
            label: 'Desqualificado',
            onClick: () => handleStatusChange('disqualified'),
            variant: 'destructive',
          },
        ],
      },
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
    ],
    [lead, onEdit, onQualify, onAddContact, onAssignOwner, onAddMember, onManageTags]
  )
}
