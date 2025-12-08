import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { UserRole } from '@/lib/types'

/**
 * Default operational roles - can be overridden
 */
const DEFAULT_OPERATIONAL_ROLES: UserRole[] = ['analyst', 'admin', 'newbusiness']

export interface OperationalTeamMember {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

/**
 * Hook to fetch users from operational teams
 * Filters users by operational roles instead of using hardcoded role lists
 * 
 * @param roles - Optional array of roles to filter by. Defaults to ['analyst', 'admin', 'newbusiness']
 * @returns Query result with operational team members
 */
export function useOperationalTeam(roles?: UserRole[]) {
  const effectiveRoles = roles || DEFAULT_OPERATIONAL_ROLES

  return useQuery({
    queryKey: ['operational-team', effectiveRoles],
    queryFn: async (): Promise<OperationalTeamMember[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, avatar_url')
        .in('role', effectiveRoles)
        .order('name')

      if (error) {
        console.error('Error fetching operational team:', error)
        throw error
      }

      return (data || []).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        avatar: user.avatar_url
      }))
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

/**
 * Hook to get just the IDs of operational team members
 * Useful for filtering queries by team members
 * 
 * @param roles - Optional array of roles to filter by
 * @returns Query result with array of user IDs
 */
export function useOperationalTeamIds(roles?: UserRole[]) {
  const { data, isLoading, error } = useOperationalTeam(roles)

  return {
    data: data?.map(member => member.id) || [],
    isLoading,
    error
  }
}
