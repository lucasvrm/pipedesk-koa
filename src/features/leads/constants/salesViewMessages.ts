/**
 * Centralized error messages and UI text for Sales View feature
 * Ensures consistency across components and simplifies maintenance
 */

export const SALES_VIEW_MESSAGES = {
  // Error messages
  ERROR_TITLE: 'Sales View está temporariamente indisponível',
  ERROR_DESCRIPTION: 'Ocorreu um erro ao buscar os dados da Sales View. Por favor, tente novamente ou retorne à lista principal de leads.',
  ERROR_DESCRIPTION_SHORT: 'A visão Sales está temporariamente indisponível. Você pode continuar trabalhando normalmente usando a visualização em Grade ou Kanban.',
  ERROR_DESCRIPTION_ALTERNATE: 'O problema é específico da visualização Sales. Continue trabalhando em modo Grade ou Kanban.',
  ERROR_TOAST: 'Não foi possível carregar a visão de vendas. Por favor, tente novamente.',
  ERROR_TOAST_WITH_OPTIONS: 'Sales View indisponível. Use Grade ou Kanban para continuar trabalhando.',
  
  // Action button labels
  BUTTON_RETRY: 'Tentar novamente',
  BUTTON_BACK_TO_LIST: 'Voltar para a lista',
  BUTTON_SWITCH_TO_GRID: 'Abrir em Grade',
  BUTTON_SWITCH_TO_KANBAN: 'Abrir em Kanban',
  
  // Console log prefixes
  LOG_PREFIX: '[SalesView]',
  
  // Empty states
  NO_LEADS_FOUND: 'Nenhum lead encontrado',
  NO_LEADS_DESCRIPTION: 'Ajuste os filtros ou retorne mais tarde para acompanhar novos leads.',
} as const

// CSS class constants
export const SALES_VIEW_STYLES = {
  ACTION_BUTTON_MIN_WIDTH: 'min-w-[180px]',
} as const
