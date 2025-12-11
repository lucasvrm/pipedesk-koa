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
  
  // Code-specific error messages
  ERROR_VALIDATION_TITLE: 'Filtros da Sales View inválidos',
  ERROR_VALIDATION_DESCRIPTION: 'Alguns filtros da Sales View são inválidos. Ajuste os filtros e tente novamente.',
  ERROR_VALIDATION_TOAST: 'Filtros inválidos. Ajuste os filtros e tente novamente.',
  
  ERROR_INTERNAL_TITLE: 'Erro interno na Sales View',
  ERROR_INTERNAL_DESCRIPTION: 'Erro interno ao carregar a Sales View. Tente novamente mais tarde.',
  ERROR_INTERNAL_TOAST: 'Erro interno ao carregar a Sales View. Tente novamente mais tarde.',
  
  ERROR_GENERIC_TITLE: 'Erro ao carregar Sales View',
  ERROR_GENERIC_DESCRIPTION: 'Erro ao carregar Sales View. Tente novamente.',
  ERROR_GENERIC_TOAST: 'Erro ao carregar Sales View. Tente novamente.',
  
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

/**
 * Get appropriate error messages based on error code
 */
export function getSalesViewErrorMessages(errorCode?: string) {
  switch (errorCode) {
    case 'validation_error':
      return {
        title: SALES_VIEW_MESSAGES.ERROR_VALIDATION_TITLE,
        description: SALES_VIEW_MESSAGES.ERROR_VALIDATION_DESCRIPTION,
        toast: SALES_VIEW_MESSAGES.ERROR_VALIDATION_TOAST,
      }
    case 'sales_view_error':
      return {
        title: SALES_VIEW_MESSAGES.ERROR_INTERNAL_TITLE,
        description: SALES_VIEW_MESSAGES.ERROR_INTERNAL_DESCRIPTION,
        toast: SALES_VIEW_MESSAGES.ERROR_INTERNAL_TOAST,
      }
    default:
      return {
        title: SALES_VIEW_MESSAGES.ERROR_GENERIC_TITLE,
        description: SALES_VIEW_MESSAGES.ERROR_GENERIC_DESCRIPTION,
        toast: SALES_VIEW_MESSAGES.ERROR_GENERIC_TOAST,
      }
  }
}
