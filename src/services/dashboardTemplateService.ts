/**
 * Dashboard Template Service
 * 
 * Manages role-based dashboard templates stored in the database.
 * Templates define the default layout for users based on their role.
 */

import { supabase } from '@/lib/supabaseClient';
import { DashboardConfig } from '@/hooks/useDashboardLayout';
import { UserRole } from '@/lib/types';

export interface DashboardTemplate {
  id: string;
  role: string | null;
  config: DashboardConfig;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get dashboard template for a specific role
 * 
 * Priority:
 * 1. Role-specific template
 * 2. Global template (role = null)
 * 3. null (caller should use fallback)
 * 
 * @param role - User role (admin, analyst, client, newbusiness)
 * @returns Dashboard configuration or null
 */
export async function getTemplateForRole(role: UserRole): Promise<DashboardConfig | null> {
  try {
    // First, try to get role-specific template
    const { data: roleTemplate, error: roleError } = await supabase
      .from('dashboard_templates')
      .select('config')
      .eq('role', role)
      .maybeSingle();

    if (!roleError && roleTemplate) {
      return roleTemplate.config as DashboardConfig;
    }

    // Fallback to global template (role = null)
    const { data: globalTemplate, error: globalError } = await supabase
      .from('dashboard_templates')
      .select('config')
      .is('role', null)
      .maybeSingle();

    if (!globalError && globalTemplate) {
      return globalTemplate.config as DashboardConfig;
    }

    // No template found
    return null;
  } catch (error) {
    console.error('Error fetching dashboard template:', error);
    return null;
  }
}

/**
 * Get all dashboard templates
 * Useful for admin management interface
 * 
 * @returns Array of all dashboard templates
 */
export async function getAllTemplates(): Promise<DashboardTemplate[]> {
  const { data, error } = await supabase
    .from('dashboard_templates')
    .select('*')
    .order('role', { nullsFirst: true });

  if (error) {
    console.error('Error fetching all templates:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    role: item.role,
    config: item.config,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
}

/**
 * Save or update a dashboard template
 * Only admins should be able to call this (enforced by RLS policies)
 * 
 * @param role - User role or null for global template
 * @param config - Dashboard configuration
 * @returns Saved template or throws error
 */
export async function saveTemplate(
  role: string | null,
  config: DashboardConfig
): Promise<DashboardTemplate> {
  const { data, error } = await supabase
    .from('dashboard_templates')
    .upsert(
      {
        role,
        config,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'role'
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error saving dashboard template:', error);
    throw new Error(`Failed to save dashboard template: ${error.message}`);
  }

  return {
    id: data.id,
    role: data.role,
    config: data.config,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Delete a dashboard template
 * Only admins should be able to call this (enforced by RLS policies)
 * 
 * @param role - User role to delete template for
 * @returns True if deleted successfully
 */
export async function deleteTemplate(role: string): Promise<boolean> {
  const { error } = await supabase
    .from('dashboard_templates')
    .delete()
    .eq('role', role);

  if (error) {
    console.error('Error deleting dashboard template:', error);
    throw new Error(`Failed to delete dashboard template: ${error.message}`);
  }

  return true;
}
