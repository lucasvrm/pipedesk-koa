import { UserRole, User } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Permission Definitions
// ============================================================================

/**
 * Permission levels by role
 */
export const PERMISSIONS = {
  admin: {
    canViewAll: true,
    canEditAll: true,
    canDeleteAll: true,
    canManageUsers: true,
    canManageSettings: true,
    canViewAnalytics: true,
    canExportData: true,
    canManageRBAC: true,
  },
  analyst: {
    canViewAll: true,
    canEditAll: true,
    canDeleteAll: false,
    canManageUsers: false,
    canManageSettings: false,
    canViewAnalytics: true,
    canExportData: true,
    canManageRBAC: false,
  },
  newbusiness: {
    canViewAll: true,
    canEditAll: false,
    canDeleteAll: false,
    canManageUsers: false,
    canManageSettings: false,
    canViewAnalytics: true,
    canExportData: false,
    canManageRBAC: false,
  },
  client: {
    canViewAll: false,
    canEditAll: false,
    canDeleteAll: false,
    canManageUsers: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canExportData: false,
    canManageRBAC: false,
  },
} as const;

export type Permission = keyof typeof PERMISSIONS.admin;

// ============================================================================
// Permission Checking Functions
// ============================================================================

/**
 * Check if a user has a specific permission
 */
export function checkPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  const rolePermissions = PERMISSIONS[userRole];
  return rolePermissions?.[permission] ?? false;
}

/**
 * Check if a user can view a specific entity
 */
export function canViewEntity(
  userRole: UserRole,
  userId: string,
  entityOwnerId?: string
): boolean {
  // Admins and analysts can view all
  if (checkPermission(userRole, 'canViewAll')) {
    return true;
  }

  // Others can only view their own entities
  return userId === entityOwnerId;
}

/**
 * Check if a user can edit a specific entity
 */
export function canEditEntity(
  userRole: UserRole,
  userId: string,
  entityOwnerId?: string
): boolean {
  // Admins and analysts can edit all
  if (checkPermission(userRole, 'canEditAll')) {
    return true;
  }

  // Others cannot edit (even their own entities)
  return false;
}

/**
 * Check if a user can delete a specific entity
 */
export function canDeleteEntity(
  userRole: UserRole,
  userId: string,
  entityOwnerId?: string
): boolean {
  // Only admins can delete
  if (checkPermission(userRole, 'canDeleteAll')) {
    return true;
  }

  return false;
}

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Sanitize user input to prevent XSS and injection attacks
 * 
 * ⚠️⚠️⚠️ CRITICAL SECURITY WARNING ⚠️⚠️⚠️
 * This is a BASIC sanitization function with KNOWN LIMITATIONS.
 * 
 * ❌ DO NOT USE IN PRODUCTION without replacing with a proper library!
 * 
 * RECOMMENDED ALTERNATIVES for production:
 * - DOMPurify (https://github.com/cure53/DOMPurify) - BEST CHOICE
 * - js-xss (https://github.com/leizongmin/js-xss)
 * 
 * Known issues with this implementation:
 * - CodeQL Alert: Incomplete multi-character sanitization (chained replaces)
 * - May not catch all XSS vectors
 * - Does not handle malformed HTML
 * - Content preservation may allow script fragments
 * 
 * This function exists ONLY to:
 * 1. Provide basic protection during development
 * 2. Serve as a placeholder until DOMPurify is integrated
 * 3. Pass build validation
 * 
 * Action required before production deployment:
 * ```bash
 * npm install dompurify
 * npm install --save-dev @types/dompurify
 * ```
 * 
 * Then replace this function's implementation with:
 * ```typescript
 * import DOMPurify from 'dompurify';
 * return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
 * ```
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // First escape all special characters to prevent interpretation
  let sanitized = input
    .trim()
    .replace(/[<>'"&]/g, (char) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return escapeMap[char] || char;
    });

  // Remove dangerous patterns in a single pass to avoid partial match issues
  // This prevents attribute injection attacks
  sanitized = sanitized
    .replace(/&lt;script/gi, '')
    .replace(/(javascript|data|vbscript)\s*:/gi, '')
    // Remove all event handlers in one pass (on followed by letters and =)
    .replace(/\s*on[a-z]+\s*=/gi, '');

  return sanitized;
}

/**
 * Sanitize an object's string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Secure ID Generation
// ============================================================================

/**
 * Generate a secure UUID
 */
export function generateSecureId(): string {
  return uuidv4();
}

// ============================================================================
// Security Event Logging
// ============================================================================

export interface SecurityEvent {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  details?: Record<string, any>;
}

/**
 * Log security events for audit purposes
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const { error } = await supabase.from('activity_log').insert({
      user_id: event.userId,
      entity_id: event.entityId,
      entity_type: event.entityType,
      action: `SECURITY: ${event.action}`,
      changes: {
        status: event.status,
        details: event.details,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('Failed to log security event:', error);
    }
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook to check permissions for the current user
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();

  if (!user) return false;

  return checkPermission(user.role, permission);
}

/**
 * Hook to check if current user can perform actions on an entity
 */
export function useEntityPermissions(entityOwnerId?: string) {
  const { user } = useAuth();

  if (!user) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
    };
  }

  return {
    canView: canViewEntity(user.role, user.id, entityOwnerId),
    canEdit: canEditEntity(user.role, user.id, entityOwnerId),
    canDelete: canDeleteEntity(user.role, user.id, entityOwnerId),
  };
}

/**
 * Hook to get all permissions for current user
 */
export function useUserPermissions() {
  const { user } = useAuth();

  if (!user) {
    return {
      canViewAll: false,
      canEditAll: false,
      canDeleteAll: false,
      canManageUsers: false,
      canManageSettings: false,
      canViewAnalytics: false,
      canExportData: false,
      canManageRBAC: false,
    };
  }

  return PERMISSIONS[user.role];
}

// ============================================================================
// Rate Limiting (Client-side)
// ============================================================================

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  /**
   * Check if an action is rate limited
   * @param key - Unique identifier for the action
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   */
  isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Filter out attempts outside the window
    const recentAttempts = attempts.filter((time) => now - time < windowMs);

    // Update the attempts list
    this.attempts.set(key, recentAttempts);

    // Check if rate limited
    return recentAttempts.length >= maxAttempts;
  }

  /**
   * Record an attempt
   */
  recordAttempt(key: string): void {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    attempts.push(now);
    this.attempts.set(key, attempts);
  }

  /**
   * Clear attempts for a key
   */
  clearAttempts(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();
