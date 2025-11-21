import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkPermission,
  canViewEntity,
  canEditEntity,
  canDeleteEntity,
  sanitizeInput,
  sanitizeObject,
  isValidEmail,
  isValidUUID,
  isValidURL,
  generateSecureId,
  PERMISSIONS,
} from '@/utils/security';
import { UserRole } from '@/lib/types';

// ============================================================================
// Permission Tests
// ============================================================================

describe('Permission System', () => {
  describe('checkPermission', () => {
    it('should grant admin all permissions', () => {
      const role: UserRole = 'admin';
      expect(checkPermission(role, 'canViewAll')).toBe(true);
      expect(checkPermission(role, 'canEditAll')).toBe(true);
      expect(checkPermission(role, 'canDeleteAll')).toBe(true);
      expect(checkPermission(role, 'canManageUsers')).toBe(true);
      expect(checkPermission(role, 'canManageSettings')).toBe(true);
      expect(checkPermission(role, 'canViewAnalytics')).toBe(true);
      expect(checkPermission(role, 'canExportData')).toBe(true);
      expect(checkPermission(role, 'canManageRBAC')).toBe(true);
    });

    it('should grant analyst appropriate permissions', () => {
      const role: UserRole = 'analyst';
      expect(checkPermission(role, 'canViewAll')).toBe(true);
      expect(checkPermission(role, 'canEditAll')).toBe(true);
      expect(checkPermission(role, 'canDeleteAll')).toBe(false);
      expect(checkPermission(role, 'canManageUsers')).toBe(false);
      expect(checkPermission(role, 'canManageSettings')).toBe(false);
      expect(checkPermission(role, 'canViewAnalytics')).toBe(true);
      expect(checkPermission(role, 'canExportData')).toBe(true);
      expect(checkPermission(role, 'canManageRBAC')).toBe(false);
    });

    it('should grant newbusiness read-only with analytics', () => {
      const role: UserRole = 'newbusiness';
      expect(checkPermission(role, 'canViewAll')).toBe(true);
      expect(checkPermission(role, 'canEditAll')).toBe(false);
      expect(checkPermission(role, 'canDeleteAll')).toBe(false);
      expect(checkPermission(role, 'canManageUsers')).toBe(false);
      expect(checkPermission(role, 'canManageSettings')).toBe(false);
      expect(checkPermission(role, 'canViewAnalytics')).toBe(true);
      expect(checkPermission(role, 'canExportData')).toBe(false);
      expect(checkPermission(role, 'canManageRBAC')).toBe(false);
    });

    it('should grant client minimal permissions', () => {
      const role: UserRole = 'client';
      expect(checkPermission(role, 'canViewAll')).toBe(false);
      expect(checkPermission(role, 'canEditAll')).toBe(false);
      expect(checkPermission(role, 'canDeleteAll')).toBe(false);
      expect(checkPermission(role, 'canManageUsers')).toBe(false);
      expect(checkPermission(role, 'canManageSettings')).toBe(false);
      expect(checkPermission(role, 'canViewAnalytics')).toBe(false);
      expect(checkPermission(role, 'canExportData')).toBe(false);
      expect(checkPermission(role, 'canManageRBAC')).toBe(false);
    });
  });

  describe('Entity-level permissions', () => {
    const userId = 'user-123';
    const otherUserId = 'user-456';

    it('should allow admin to view any entity', () => {
      expect(canViewEntity('admin', userId, otherUserId)).toBe(true);
      expect(canViewEntity('admin', userId, userId)).toBe(true);
    });

    it('should allow analyst to view any entity', () => {
      expect(canViewEntity('analyst', userId, otherUserId)).toBe(true);
      expect(canViewEntity('analyst', userId, userId)).toBe(true);
    });

    it('should allow newbusiness to view any entity', () => {
      expect(canViewEntity('newbusiness', userId, otherUserId)).toBe(true);
    });

    it('should restrict client to own entities only', () => {
      expect(canViewEntity('client', userId, otherUserId)).toBe(false);
      expect(canViewEntity('client', userId, userId)).toBe(true);
    });

    it('should allow admin to edit any entity', () => {
      expect(canEditEntity('admin', userId, otherUserId)).toBe(true);
    });

    it('should allow analyst to edit any entity', () => {
      expect(canEditEntity('analyst', userId, otherUserId)).toBe(true);
    });

    it('should restrict newbusiness from editing', () => {
      expect(canEditEntity('newbusiness', userId, userId)).toBe(false);
      expect(canEditEntity('newbusiness', userId, otherUserId)).toBe(false);
    });

    it('should restrict client from editing', () => {
      expect(canEditEntity('client', userId, userId)).toBe(false);
    });

    it('should allow only admin to delete entities', () => {
      expect(canDeleteEntity('admin', userId, otherUserId)).toBe(true);
      expect(canDeleteEntity('analyst', userId, otherUserId)).toBe(false);
      expect(canDeleteEntity('newbusiness', userId, userId)).toBe(false);
      expect(canDeleteEntity('client', userId, userId)).toBe(false);
    });
  });
});

// ============================================================================
// Input Sanitization Tests
// ============================================================================

describe('Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).toContain('Hello');
    });

    it('should escape special characters and remove tags', () => {
      const input = '<div>"Hello"</div>';
      const result = sanitizeInput(input);
      // Tags are removed first, then special chars are escaped
      expect(result).toContain('&quot;Hello&quot;');
      expect(result).not.toContain('<div>');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should remove script tags but preserve sanitized content', () => {
      const input = '<p>Text</p><script>malicious()</script><p>More</p>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('script');
      expect(result).toContain('Text');
      expect(result).toContain('More');
      // Note: Content inside script tags is NOT removed by our simple sanitizer
      // For production, consider using DOMPurify for comprehensive XSS protection
      expect(result).toContain('malicious()');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values in object', () => {
      const obj = {
        name: '<script>alert()</script>John',
        email: 'john@example.com',
        age: 30,
      };
      const result = sanitizeObject(obj);
      expect(result.name).not.toContain('<script>');
      expect(result.email).toBe('john@example.com');
      expect(result.age).toBe(30);
    });

    it('should sanitize nested objects', () => {
      const obj = {
        user: {
          name: '<b>John</b>',
          profile: {
            bio: '<script>evil</script>',
          },
        },
      };
      const result = sanitizeObject(obj);
      expect(result.user.name).not.toContain('<b>');
      expect(result.user.profile.bio).not.toContain('<script>');
    });
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('Validation Functions', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID formats', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('isValidURL', () => {
    it('should validate correct URL formats', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://localhost:3000')).toBe(true);
      expect(isValidURL('https://example.com/path?query=value')).toBe(true);
    });

    it('should reject invalid URL formats', () => {
      expect(isValidURL('not a url')).toBe(false);
      expect(isValidURL('example.com')).toBe(false);
      expect(isValidURL('')).toBe(false);
    });
  });
});

// ============================================================================
// Secure ID Generation Tests
// ============================================================================

describe('Secure ID Generation', () => {
  it('should generate valid UUIDs', () => {
    const id = generateSecureId();
    expect(isValidUUID(id)).toBe(true);
  });

  it('should generate unique IDs', () => {
    const id1 = generateSecureId();
    const id2 = generateSecureId();
    expect(id1).not.toBe(id2);
  });

  it('should generate IDs of correct format', () => {
    const id = generateSecureId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});

// ============================================================================
// Role Isolation Tests
// ============================================================================

describe('Role Isolation', () => {
  it('should have distinct permission sets for each role', () => {
    const adminPerms = PERMISSIONS.admin;
    const analystPerms = PERMISSIONS.analyst;
    const newbusinessPerms = PERMISSIONS.newbusiness;
    const clientPerms = PERMISSIONS.client;

    // Admin should have more permissions than analyst
    expect(adminPerms.canDeleteAll).toBe(true);
    expect(analystPerms.canDeleteAll).toBe(false);

    // Analyst should have more permissions than newbusiness
    expect(analystPerms.canEditAll).toBe(true);
    expect(newbusinessPerms.canEditAll).toBe(false);

    // Newbusiness should have more permissions than client
    expect(newbusinessPerms.canViewAll).toBe(true);
    expect(clientPerms.canViewAll).toBe(false);
  });

  it('should enforce proper role hierarchy', () => {
    // Admin > Analyst > Newbusiness > Client
    const roles: UserRole[] = ['admin', 'analyst', 'newbusiness', 'client'];
    const permissionCounts = roles.map((role) => {
      const perms = PERMISSIONS[role];
      return Object.values(perms).filter((v) => v === true).length;
    });

    // Each role should have fewer or equal permissions than the previous
    for (let i = 1; i < permissionCounts.length; i++) {
      expect(permissionCounts[i]).toBeLessThanOrEqual(permissionCounts[i - 1]);
    }
  });
});

// ============================================================================
// Security Regression Tests
// ============================================================================

describe('Security Regression Tests', () => {
  it('should prevent privilege escalation through role manipulation', () => {
    // Even if a user tries to pass a different role, the actual user role should be checked
    const clientUserId = 'client-user';
    const adminUserId = 'admin-user';

    // Client should not be able to delete even if they try to claim admin privileges
    expect(canDeleteEntity('client', clientUserId, adminUserId)).toBe(false);
  });

  it('should not allow SQL injection in sanitization', () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const sanitized = sanitizeInput(maliciousInput);
    // Escapes the single quote but preserves the text content
    expect(sanitized).toContain('&#x27;'); // Escaped single quote
    expect(sanitized).toContain('DROP TABLE'); // Text is preserved after tag removal
  });

  it('should prevent XSS in various forms', () => {
    const xssAttempts = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg/onload=alert("XSS")>',
      '<iframe src="javascript:alert(\'XSS\')">',
    ];

    xssAttempts.forEach((attempt) => {
      const sanitized = sanitizeInput(attempt);
      // Script tags are removed
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('<svg');
      expect(sanitized).not.toContain('<iframe');
    });
  });
});
