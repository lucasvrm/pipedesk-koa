/**
 * Centralized error messages and UI text for Sales View feature
 * Ensures consistency across components and simplifies maintenance
 */

export const SALES_VIEW_MESSAGES = {
  // Error messages
  ERROR_TITLE: 'Não foi possível carregar a visão de vendas',
  ERROR_DESCRIPTION: 'Ocorreu um erro ao buscar os dados da Sales View. Por favor, tente novamente ou retorne à lista principal de leads.',
  ERROR_DESCRIPTION_SHORT: 'Ocorreu um erro ao buscar os dados da Sales View. Você pode alternar para outros modos de visualização ou tentar novamente.',
  ERROR_TOAST: 'Não foi possível carregar a visão de vendas. Por favor, tente novamente.',
  ERROR_TOAST_WITH_OPTIONS: 'Não foi possível carregar a visão de vendas. Por favor, tente novamente ou alterne para outro modo de visualização.',
  
  // Action button labels
  BUTTON_RETRY: 'Tentar novamente',
  BUTTON_BACK_TO_LIST: 'Voltar para a lista',
  BUTTON_SWITCH_TO_GRID: 'Alternar para Grade',
  BUTTON_SWITCH_TO_KANBAN: 'Alternar para Kanban',
  
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
