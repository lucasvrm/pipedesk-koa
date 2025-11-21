import { describe, it, expect } from 'vitest'
import { hasPermission, canViewPlayerName, anonymizePlayerName, PERMISSIONS } from '../permissions'
import { UserRole } from '../types'

describe('RBAC - Permissions', () => {
  describe('PERMISSIONS constant', () => {
    it('should define VIEW_ALL_DEALS permission correctly', () => {
      expect(PERMISSIONS.VIEW_ALL_DEALS).toEqual(['admin', 'analyst'])
    })

    it('should define CREATE_DEAL permission correctly', () => {
      expect(PERMISSIONS.CREATE_DEAL).toEqual(['admin', 'analyst'])
    })

    it('should define EDIT_DEAL permission correctly', () => {
      expect(PERMISSIONS.EDIT_DEAL).toEqual(['admin', 'analyst'])
    })

    it('should define DELETE_DEAL permission correctly', () => {
      expect(PERMISSIONS.DELETE_DEAL).toEqual(['admin'])
    })

    it('should define EXPORT_DATA permission correctly', () => {
      expect(PERMISSIONS.EXPORT_DATA).toEqual(['admin'])
    })

    it('should define MANAGE_USERS permission correctly', () => {
      expect(PERMISSIONS.MANAGE_USERS).toEqual(['admin'])
    })

    it('should define VIEW_ANALYTICS permission correctly', () => {
      expect(PERMISSIONS.VIEW_ANALYTICS).toEqual(['admin', 'analyst'])
    })

    it('should define VIEW_REAL_PLAYER_NAMES permission correctly', () => {
      expect(PERMISSIONS.VIEW_REAL_PLAYER_NAMES).toEqual(['admin', 'analyst', 'newbusiness'])
    })

    it('should define ASSIGN_TASKS permission correctly', () => {
      expect(PERMISSIONS.ASSIGN_TASKS).toEqual(['admin', 'analyst'])
    })

    it('should define MANAGE_INTEGRATIONS permission correctly', () => {
      expect(PERMISSIONS.MANAGE_INTEGRATIONS).toEqual(['admin'])
    })

    it('should define MANAGE_SETTINGS permission correctly', () => {
      expect(PERMISSIONS.MANAGE_SETTINGS).toEqual(['admin'])
    })
  })

  describe('hasPermission', () => {
    describe('admin role', () => {
      const role: UserRole = 'admin'

      it('should have VIEW_ALL_DEALS permission', () => {
        expect(hasPermission(role, 'VIEW_ALL_DEALS')).toBe(true)
      })

      it('should have CREATE_DEAL permission', () => {
        expect(hasPermission(role, 'CREATE_DEAL')).toBe(true)
      })

      it('should have EDIT_DEAL permission', () => {
        expect(hasPermission(role, 'EDIT_DEAL')).toBe(true)
      })

      it('should have DELETE_DEAL permission', () => {
        expect(hasPermission(role, 'DELETE_DEAL')).toBe(true)
      })

      it('should have EXPORT_DATA permission', () => {
        expect(hasPermission(role, 'EXPORT_DATA')).toBe(true)
      })

      it('should have MANAGE_USERS permission', () => {
        expect(hasPermission(role, 'MANAGE_USERS')).toBe(true)
      })

      it('should have VIEW_ANALYTICS permission', () => {
        expect(hasPermission(role, 'VIEW_ANALYTICS')).toBe(true)
      })

      it('should have VIEW_REAL_PLAYER_NAMES permission', () => {
        expect(hasPermission(role, 'VIEW_REAL_PLAYER_NAMES')).toBe(true)
      })

      it('should have ASSIGN_TASKS permission', () => {
        expect(hasPermission(role, 'ASSIGN_TASKS')).toBe(true)
      })

      it('should have MANAGE_INTEGRATIONS permission', () => {
        expect(hasPermission(role, 'MANAGE_INTEGRATIONS')).toBe(true)
      })

      it('should have MANAGE_SETTINGS permission', () => {
        expect(hasPermission(role, 'MANAGE_SETTINGS')).toBe(true)
      })
    })

    describe('analyst role', () => {
      const role: UserRole = 'analyst'

      it('should have VIEW_ALL_DEALS permission', () => {
        expect(hasPermission(role, 'VIEW_ALL_DEALS')).toBe(true)
      })

      it('should have CREATE_DEAL permission', () => {
        expect(hasPermission(role, 'CREATE_DEAL')).toBe(true)
      })

      it('should have EDIT_DEAL permission', () => {
        expect(hasPermission(role, 'EDIT_DEAL')).toBe(true)
      })

      it('should NOT have DELETE_DEAL permission', () => {
        expect(hasPermission(role, 'DELETE_DEAL')).toBe(false)
      })

      it('should NOT have EXPORT_DATA permission', () => {
        expect(hasPermission(role, 'EXPORT_DATA')).toBe(false)
      })

      it('should NOT have MANAGE_USERS permission', () => {
        expect(hasPermission(role, 'MANAGE_USERS')).toBe(false)
      })

      it('should have VIEW_ANALYTICS permission', () => {
        expect(hasPermission(role, 'VIEW_ANALYTICS')).toBe(true)
      })

      it('should have VIEW_REAL_PLAYER_NAMES permission', () => {
        expect(hasPermission(role, 'VIEW_REAL_PLAYER_NAMES')).toBe(true)
      })

      it('should have ASSIGN_TASKS permission', () => {
        expect(hasPermission(role, 'ASSIGN_TASKS')).toBe(true)
      })

      it('should NOT have MANAGE_INTEGRATIONS permission', () => {
        expect(hasPermission(role, 'MANAGE_INTEGRATIONS')).toBe(false)
      })

      it('should NOT have MANAGE_SETTINGS permission', () => {
        expect(hasPermission(role, 'MANAGE_SETTINGS')).toBe(false)
      })
    })

    describe('newbusiness role', () => {
      const role: UserRole = 'newbusiness'

      it('should NOT have VIEW_ALL_DEALS permission', () => {
        expect(hasPermission(role, 'VIEW_ALL_DEALS')).toBe(false)
      })

      it('should NOT have CREATE_DEAL permission', () => {
        expect(hasPermission(role, 'CREATE_DEAL')).toBe(false)
      })

      it('should NOT have EDIT_DEAL permission', () => {
        expect(hasPermission(role, 'EDIT_DEAL')).toBe(false)
      })

      it('should NOT have DELETE_DEAL permission', () => {
        expect(hasPermission(role, 'DELETE_DEAL')).toBe(false)
      })

      it('should NOT have EXPORT_DATA permission', () => {
        expect(hasPermission(role, 'EXPORT_DATA')).toBe(false)
      })

      it('should NOT have MANAGE_USERS permission', () => {
        expect(hasPermission(role, 'MANAGE_USERS')).toBe(false)
      })

      it('should NOT have VIEW_ANALYTICS permission', () => {
        expect(hasPermission(role, 'VIEW_ANALYTICS')).toBe(false)
      })

      it('should have VIEW_REAL_PLAYER_NAMES permission', () => {
        expect(hasPermission(role, 'VIEW_REAL_PLAYER_NAMES')).toBe(true)
      })

      it('should NOT have ASSIGN_TASKS permission', () => {
        expect(hasPermission(role, 'ASSIGN_TASKS')).toBe(false)
      })

      it('should NOT have MANAGE_INTEGRATIONS permission', () => {
        expect(hasPermission(role, 'MANAGE_INTEGRATIONS')).toBe(false)
      })

      it('should NOT have MANAGE_SETTINGS permission', () => {
        expect(hasPermission(role, 'MANAGE_SETTINGS')).toBe(false)
      })
    })

    describe('client role', () => {
      const role: UserRole = 'client'

      it('should NOT have VIEW_ALL_DEALS permission', () => {
        expect(hasPermission(role, 'VIEW_ALL_DEALS')).toBe(false)
      })

      it('should NOT have CREATE_DEAL permission', () => {
        expect(hasPermission(role, 'CREATE_DEAL')).toBe(false)
      })

      it('should NOT have EDIT_DEAL permission', () => {
        expect(hasPermission(role, 'EDIT_DEAL')).toBe(false)
      })

      it('should NOT have DELETE_DEAL permission', () => {
        expect(hasPermission(role, 'DELETE_DEAL')).toBe(false)
      })

      it('should NOT have EXPORT_DATA permission', () => {
        expect(hasPermission(role, 'EXPORT_DATA')).toBe(false)
      })

      it('should NOT have MANAGE_USERS permission', () => {
        expect(hasPermission(role, 'MANAGE_USERS')).toBe(false)
      })

      it('should NOT have VIEW_ANALYTICS permission', () => {
        expect(hasPermission(role, 'VIEW_ANALYTICS')).toBe(false)
      })

      it('should NOT have VIEW_REAL_PLAYER_NAMES permission', () => {
        expect(hasPermission(role, 'VIEW_REAL_PLAYER_NAMES')).toBe(false)
      })

      it('should NOT have ASSIGN_TASKS permission', () => {
        expect(hasPermission(role, 'ASSIGN_TASKS')).toBe(false)
      })

      it('should NOT have MANAGE_INTEGRATIONS permission', () => {
        expect(hasPermission(role, 'MANAGE_INTEGRATIONS')).toBe(false)
      })

      it('should NOT have MANAGE_SETTINGS permission', () => {
        expect(hasPermission(role, 'MANAGE_SETTINGS')).toBe(false)
      })
    })
  })

  describe('canViewPlayerName', () => {
    it('should return true for admin role', () => {
      expect(canViewPlayerName('admin')).toBe(true)
    })

    it('should return true for analyst role', () => {
      expect(canViewPlayerName('analyst')).toBe(true)
    })

    it('should return true for newbusiness role', () => {
      expect(canViewPlayerName('newbusiness')).toBe(true)
    })

    it('should return false for client role', () => {
      expect(canViewPlayerName('client')).toBe(false)
    })
  })

  describe('anonymizePlayerName', () => {
    it('should anonymize first player name as Player A', () => {
      expect(anonymizePlayerName('Goldman Sachs', 0)).toBe('Player A')
    })

    it('should anonymize second player name as Player B', () => {
      expect(anonymizePlayerName('JP Morgan', 1)).toBe('Player B')
    })

    it('should anonymize third player name as Player C', () => {
      expect(anonymizePlayerName('Morgan Stanley', 2)).toBe('Player C')
    })

    it('should anonymize tenth player name as Player K', () => {
      expect(anonymizePlayerName('Bank of America', 10)).toBe('Player K')
    })

    it('should handle any player name consistently', () => {
      expect(anonymizePlayerName('Any Name Here', 5)).toBe('Player F')
    })

    it('should ignore original name content', () => {
      const index = 3
      const result = anonymizePlayerName('Very Long Bank Name', index)
      expect(result).toBe('Player D')
    })
  })
})
