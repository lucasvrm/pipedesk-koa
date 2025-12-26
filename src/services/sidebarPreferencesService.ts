import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Tipo de seção:  
 * - 'default':  Seção padrão do sistema (Dashboard, Leads, etc.)
 * - 'custom': Seção criada pelo usuário
 */
export type SidebarSectionType = 'default' | 'custom';

/**
 * Subitem da sidebar expandida (menu filho de uma seção)
 */
export interface SidebarItemConfig {
  id: string;                // ID único (ex: 'overview', 'custom-item-1')
  label: string;             // Texto exibido (ex: 'Visão Geral')
  path: string;              // Rota (ex: '/dashboard')
  enabled: boolean;          // Visível ou oculto
  order: number;             // Ordem de exibição
  fixed: boolean;            // Se true, não pode mover/deletar (ex: 'Dados Pessoais' em Profile)
  icon?: string;             // Ícone opcional (lucide-react)
}

export interface SidebarSectionConfig {
  // ═══ Campos Existentes (Manter) ═══
  id: string;                // ID único (ex: 'dashboard', 'custom-1')
  enabled: boolean;          // Seção ativa/inativa
  order: number;             // Ordem na Rail
  color: string;             // Cor do ícone (hex)
  icon: string;              // Ícone (lucide-react name)
  
  // ═══ Novos Campos ═══
  type: SidebarSectionType;  // 'default' | 'custom'
  label: string;             // Texto exibido (ex: 'Dashboard', 'Meus Relatórios')
  tooltip: string;           // Tooltip ao hover (ex: 'Ir para Dashboard')
  path: string;              // Rota principal (ex: '/dashboard')
  children: SidebarItemConfig[];  // Subitens da sidebar expandida
}

export interface SidebarPreferences {
  id: string;
  user_id: string;
  config: { sections: SidebarSectionConfig[] };
  created_at: string;
  updated_at: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const SIDEBAR_PREFERENCES_KEY = ['sidebarPreferences'] as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/** Mínimo de seções ativas permitidas */
export const MIN_ACTIVE_SECTIONS = 4;

/** Máximo de seções ativas permitidas */
export const MAX_ACTIVE_SECTIONS = 10;

/** IDs de subitens fixos que não podem ser movidos/deletados */
export const FIXED_ITEMS: Record<string, string[]> = {
  profile: ['personal', 'preferences', 'security'],  // Sistema precisa
  settings: ['*'],  // Todos (requer permissão MANAGE_SETTINGS)
  management: ['*'],  // Todos (requer permissão VIEW_ANALYTICS)
};

/**
 * Verifica se um subitem é fixo (não pode mover/deletar)
 */
export function isItemFixed(sectionId: string, itemId: string): boolean {
  const fixedList = FIXED_ITEMS[sectionId];
  if (!fixedList) return false;
  return fixedList.includes('*') || fixedList.includes(itemId);
}

/**
 * Normaliza uma seção com campos parciais para incluir todos os campos obrigatórios
 * (usado para retrocompatibilidade com dados antigos)
 */
export function normalizeSection(section: Partial<SidebarSectionConfig> & Pick<SidebarSectionConfig, 'id' | 'enabled' | 'order' | 'color' | 'icon'>): SidebarSectionConfig {
  // Buscar config padrão correspondente
  const defaultSection = DEFAULT_SIDEBAR_CONFIG.find(s => s.id === section.id);
  
  // Definir valores padrão
  const type = section.type || 'default';
  const label = section.label || (defaultSection?.label) || section.id;
  const tooltip = section.tooltip || (defaultSection?.tooltip) || label;
  const path = section.path || (defaultSection?.path) || '/';
  const children = section.children || (defaultSection?.children) || [];
  
  return {
    id: section.id,
    enabled: section.enabled,
    order: section.order,
    color: section.color,
    icon: section.icon,
    type,
    label,
    tooltip,
    path,
    children,
  };
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

export const DEFAULT_SIDEBAR_CONFIG: SidebarSectionConfig[] = [
  {
    id: 'dashboard',
    type: 'default',
    enabled: true,
    order: 0,
    color: '#3b82f6',
    icon: 'Home',
    label: 'Dashboard',
    tooltip: 'Ir para Dashboard',
    path: '/dashboard',
    children: [
      { id: 'overview', label: 'Visão Geral', path: '/dashboard', enabled: true, order: 0, fixed: true, icon: 'Home' }
    ]
  },
  {
    id: 'leads',
    type: 'default',
    enabled: true,
    order: 1,
    color: '#10b981',
    icon: 'Filter',
    label: 'Leads',
    tooltip: 'Gerenciar Leads',
    path: '/leads',
    children: [
      { id: 'list', label: 'Lista de Leads', path: '/leads', enabled: true, order: 0, fixed: false, icon: 'Filter' },
      { id: 'sales-view', label: 'Sales View', path: '/admin/leads/sales-view', enabled: true, order: 1, fixed: false, icon: 'BarChart3' }
    ]
  },
  {
    id: 'deals',
    type: 'default',
    enabled: true,
    order: 2,
    color: '#f59e0b',
    icon: 'Briefcase',
    label: 'Deals',
    tooltip: 'Gerenciar Deals',
    path: '/deals',
    children: [
      { id: 'list', label: 'Lista de Deals', path: '/deals', enabled: true, order: 0, fixed: false, icon: 'Briefcase' },
      { id: 'comparison', label: 'Comparador', path: '/deals/comparison', enabled: true, order: 1, fixed: true, icon: 'FileText' }
    ]
  },
  {
    id: 'kanban',
    type: 'default',
    enabled: true,
    order: 3,
    color: '#f97316',
    icon: 'Kanban',
    label: 'Tracks',
    tooltip: 'Master Matrix',
    path: '/deals/tracks',
    children: [
      { id: 'matrix', label: 'Master Matrix', path: '/deals/tracks', enabled: true, order: 0, fixed: true, icon: 'Kanban' }
    ]
  },
  {
    id: 'companies',
    type: 'default',
    enabled: true,
    order: 4,
    color: '#8b5cf6',
    icon: 'Building2',
    label: 'Empresas',
    tooltip: 'Gerenciar Empresas',
    path: '/companies',
    children: [
      { id: 'list', label: 'Lista de Empresas', path: '/companies', enabled: true, order: 0, fixed: false, icon: 'Building2' }
    ]
  },
  {
    id: 'contacts',
    type: 'default',
    enabled: true,
    order: 5,
    color: '#ec4899',
    icon: 'User',
    label: 'Contatos',
    tooltip: 'Gerenciar Contatos',
    path: '/contacts',
    children: [
      { id: 'list', label: 'Lista de Contatos', path: '/contacts', enabled: true, order: 0, fixed: false, icon: 'User' }
    ]
  },
  {
    id: 'players',
    type: 'default',
    enabled: true,
    order: 6,
    color: '#06b6d4',
    icon: 'Users',
    label: 'Players',
    tooltip: 'Gerenciar Players',
    path: '/players',
    children: [
      { id: 'list', label: 'Lista de Players', path: '/players', enabled: true, order: 0, fixed: false, icon: 'Users' }
    ]
  },
  {
    id: 'tasks',
    type: 'default',
    enabled: true,
    order: 7,
    color: '#14b8a6',
    icon: 'CheckSquare',
    label: 'Tarefas',
    tooltip: 'Gerenciar Tarefas',
    path: '/tasks',
    children: [
      { id: 'list', label: 'Minhas Tarefas', path: '/tasks', enabled: true, order: 0, fixed: false, icon: 'CheckSquare' }
    ]
  },
  {
    id: 'profile',
    type: 'default',
    enabled: true,
    order: 8,
    color: '#6366f1',
    icon: 'User',
    label: 'Meu Perfil',
    tooltip: 'Acessar Perfil',
    path: '/profile',
    children: [
      { id: 'personal', label: 'Dados Pessoais', path: '/profile', enabled: true, order: 0, fixed: true, icon: 'User' },
      { id: 'preferences', label: 'Preferências', path: '/profile/preferences', enabled: true, order: 1, fixed: true, icon: 'Settings' },
      { id: 'customize', label: 'Customização', path: '/profile/customize', enabled: true, order: 2, fixed: false, icon: 'Palette' },
      { id: 'activity', label: 'Atividades', path: '/profile/activity', enabled: true, order: 3, fixed: false, icon: 'Activity' },
      { id: 'security', label: 'Segurança', path: '/profile/security', enabled: true, order: 4, fixed: true, icon: 'Shield' }
    ]
  },
  {
    id: 'management',
    type: 'default',
    enabled: true,
    order: 9,
    color: '#3b82f6',
    icon: 'BarChart3',
    label: 'Gestão',
    tooltip: 'Ferramentas de Gestão',
    path: '/analytics',
    children: []  // Populado dinamicamente com base em permissões
  },
  {
    id: 'settings',
    type: 'default',
    enabled: true,
    order: 10,
    color: '#64748b',
    icon: 'Settings',
    label: 'Configurações',
    tooltip: 'Configurações do Sistema',
    path: '/admin/settings',
    children: []  // Populado dinamicamente com base em permissões
  }
];

// ============================================================================
// CRUD FUNCTIONS
// ============================================================================

/**
 * Fetch sidebar preferences for a user
 */
export async function getSidebarPreferences(userId: string | null): Promise<SidebarPreferences | null> {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('user_sidebar_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    // PGRST116 = Row not found
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar preferências: ${error.message}`);
  }
  
  // Normalizar seções para garantir retrocompatibilidade
  const normalizedData = {
    ...data,
    config: {
      sections: (data.config?.sections || []).map((section: any) => normalizeSection(section))
    }
  };
  
  return normalizedData as SidebarPreferences;
}

/**
 * Create or update sidebar preferences
 */
export async function upsertSidebarPreferences(
  userId: string,
  config: { sections: SidebarSectionConfig[] }
): Promise<SidebarPreferences> {
  // Normalizar seções para garantir todos os campos obrigatórios
  const normalizedConfig = {
    sections: config.sections.map(normalizeSection)
  };
  
  const { data, error } = await supabase
    .from('user_sidebar_preferences')
    .upsert(
      { user_id: userId, config: normalizedConfig, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single();
  
  if (error) throw new Error(`Erro ao salvar preferências: ${error.message}`);
  
  return data as SidebarPreferences;
}

/**
 * Reset sidebar preferences to default
 */
export async function resetSidebarPreferences(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_sidebar_preferences')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw new Error(`Erro ao resetar preferências: ${error.message}`);
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Valida se a configuração atende aos requisitos mínimos/máximos
 */
export function validateSidebarConfig(sections: SidebarSectionConfig[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  const activeSections = sections.filter(s => s.enabled);
  
  // Min 4 ativas
  if (activeSections.length < MIN_ACTIVE_SECTIONS) {
    errors.push(`Mínimo de ${MIN_ACTIVE_SECTIONS} seções ativas requerido (atual: ${activeSections.length})`);
  }
  
  // Max 10 ativas
  if (activeSections.length > MAX_ACTIVE_SECTIONS) {
    errors.push(`Máximo de ${MAX_ACTIVE_SECTIONS} seções ativas permitido (atual: ${activeSections.length})`);
  }
  
  // IDs únicos
  const ids = sections.map(s => s.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    errors.push(`IDs duplicados: ${duplicates.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Marca subitens como órfãos quando uma seção customizada é deletada
 */
export function markOrphanedItems(
  sections: SidebarSectionConfig[],
  deletedSectionId: string
): SidebarSectionConfig[] {
  return sections.map(section => {
    if (section.id === deletedSectionId) {
      // Seção deletada: marcar children como órfãos
      return {
        ...section,
        children: section.children.map(child => ({
          ...child,
          enabled: false,  // Ocultar
          // @ts-ignore - Campo interno para controle
          orphaned: true
        }))
      };
    }
    return section;
  });
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch sidebar preferences
 */
export function useSidebarPreferences(userId: string | null) {
  return useQuery({
    queryKey: [...SIDEBAR_PREFERENCES_KEY, userId],
    queryFn: () => getSidebarPreferences(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update sidebar preferences
 */
export function useUpdateSidebarPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, config }: { userId: string; config: { sections: SidebarSectionConfig[] } }) =>
      upsertSidebarPreferences(userId, config),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...SIDEBAR_PREFERENCES_KEY, variables.userId] });
      toast.success('Preferências salvas!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

/**
 * Hook to reset sidebar preferences
 */
export function useResetSidebarPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => resetSidebarPreferences(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: [...SIDEBAR_PREFERENCES_KEY, userId] });
      toast.success('Preferências resetadas!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
