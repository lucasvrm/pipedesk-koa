import { TimelineEventType } from '@/lib/types';

// ============================================================================
// TIMELINE EVENT LABELS
// ============================================================================

export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  status_change: 'Mudanças de Status',
  comments: 'Comentários',
  mentions: 'Menções',
  assignment: 'Atribuições',
  task_completed: 'Conclusão de Tarefas',
  notes: 'Notas',
  file_upload: 'Upload de Arquivos',
  priority_change: 'Mudanças de Prioridade',
  contact_associated: 'Contatos Associados',
  loss_reason: 'Motivos de Perda',
  calendar_event: 'Eventos de Calendário',
};

// ============================================================================
// TIMELINE EVENT ICONS (lucide-react names)
// ============================================================================

export const TIMELINE_EVENT_ICONS: Record<TimelineEventType, string> = {
  status_change: 'RefreshCw',
  comments: 'MessageSquare',
  mentions: 'AtSign',
  assignment: 'UserPlus',
  task_completed: 'CheckCircle2',
  notes: 'StickyNote',
  file_upload: 'Upload',
  priority_change: 'TrendingUp',
  contact_associated: 'Users',
  loss_reason: 'XCircle',
  calendar_event: 'Calendar',
};

// ============================================================================
// DEFAULT COLORS FOR EACH EVENT TYPE
// ============================================================================

export const DEFAULT_TIMELINE_COLORS: Record<TimelineEventType, string> = {
  status_change: '#3b82f6', // blue-500
  comments: '#eab308', // yellow-500
  mentions: '#f59e0b', // amber-500
  assignment: '#8b5cf6', // violet-500
  task_completed: '#10b981', // emerald-500
  notes: '#6366f1', // indigo-500
  file_upload: '#06b6d4', // cyan-500
  priority_change: '#f97316', // orange-500
  contact_associated: '#14b8a6', // teal-500
  loss_reason: '#ef4444', // red-500
  calendar_event: '#ec4899', // pink-500
};

// ============================================================================
// DEFAULT ENABLED EVENTS (all except future ones)
// ============================================================================

export const DEFAULT_ENABLED_EVENTS: Record<TimelineEventType, boolean> = {
  status_change: true,
  comments: true,
  mentions: true,
  assignment: true,
  task_completed: true,
  notes: true,
  file_upload: true,
  priority_change: false, // FUTURO
  contact_associated: false, // FUTURO
  loss_reason: false, // FUTURO
  calendar_event: false, // FUTURO
};

// ============================================================================
// AVAILABLE EVENTS (implemented)
// ============================================================================

export const AVAILABLE_EVENTS: TimelineEventType[] = [
  'status_change',
  'comments',
  'mentions',
  'assignment',
  'task_completed',
  'notes',
  'file_upload',
];

// ============================================================================
// FUTURE EVENTS (not yet implemented)
// ============================================================================

export const FUTURE_EVENTS: TimelineEventType[] = [
  'priority_change',
  'contact_associated',
  'loss_reason',
  'calendar_event',
];

// ============================================================================
// HELPER: Get color with opacity
// ============================================================================

export function getColorWithOpacity(hexColor: string, opacity: number): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
