import { UserRole } from '@/lib/types'

export const PERMISSIONS = {
  VIEW_ALL_DEALS: ['admin', 'analyst'] as UserRole[],
  CREATE_DEAL: ['admin', 'analyst'] as UserRole[],
  EDIT_DEAL: ['admin', 'analyst'] as UserRole[],
  DELETE_DEAL: ['admin'] as UserRole[],
  EXPORT_DATA: ['admin'] as UserRole[],
  MANAGE_USERS: ['admin'] as UserRole[],
  VIEW_ANALYTICS: ['admin', 'analyst'] as UserRole[],
  VIEW_REAL_PLAYER_NAMES: ['admin', 'analyst', 'newbusiness'] as UserRole[],
  ASSIGN_TASKS: ['admin', 'analyst'] as UserRole[],
  MANAGE_INTEGRATIONS: ['admin'] as UserRole[],
  MANAGE_SETTINGS: ['admin'] as UserRole[],
}

export function hasPermission(userRole: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission].includes(userRole)
}

export function canViewPlayerName(userRole: UserRole): boolean {
  return hasPermission(userRole, 'VIEW_REAL_PLAYER_NAMES')
}

export function anonymizePlayerName(playerName: string, index: number): string {
  return `Player ${String.fromCharCode(65 + index)}`
}
