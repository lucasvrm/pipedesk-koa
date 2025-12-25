import { useQuery } from '@tanstack/react-query'
import { useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  DuplicateCheckInput,
  DuplicateCandidate,
  ExistingLead,
  findDuplicates,
  getMatchSeverity,
} from '../utils/duplicateMatching'

// ============================================================================
// TYPES
// ============================================================================

interface UseDuplicateDetectionOptions {
  minScore?: number // default 40
  maxResults?: number // default 5
  includeQualified?: boolean // default false
  excludeLeadId?: string // para modo edição
}

interface DuplicateDetectionResult {
  duplicates: DuplicateCandidate[]
  isChecking: boolean
  error: Error | null
  checkForDuplicates: (input: DuplicateCheckInput) => Promise<DuplicateCandidate[]>
  clearResults: () => void
  hasDuplicates: boolean
  highSeverityCount: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const QUERY_KEY_BASE = ['leads', 'duplicate-check'] as const

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for detecting duplicate leads.
 *
 * Fetches existing leads from Supabase and exposes a function to check
 * for duplicates against a new lead input.
 *
 * @param options - Configuration options
 * @returns Duplicate detection state and functions
 */
export function useDuplicateDetection(
  options?: UseDuplicateDetectionOptions
): DuplicateDetectionResult {
  // Options with defaults
  const minScore = options?.minScore ?? 40
  const maxResults = options?.maxResults ?? 5
  const includeQualified = options?.includeQualified ?? false
  const excludeLeadId = options?.excludeLeadId

  // Local state
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Query to fetch existing leads
  const {
    data: existingLeads = [],
    refetch: refetchLeads,
    isLoading: isLoadingLeads,
  } = useQuery({
    queryKey: [...QUERY_KEY_BASE, { includeQualified, excludeLeadId }],
    queryFn: async (): Promise<ExistingLead[]> => {
      let query = supabase
        .from('leads')
        .select(
          `
          id,
          legal_name,
          trade_name,
          cnpj,
          website,
          lead_contacts!inner(
            is_primary,
            contacts!inner(email)
          )
        `
        )
        .is('deleted_at', null)

      if (!includeQualified) {
        query = query.is('qualified_at', null)
      }

      if (excludeLeadId) {
        query = query.neq('id', excludeLeadId)
      }

      const { data, error: fetchError } = await query.limit(1000)

      if (fetchError) throw fetchError

      // Map snake_case → camelCase
      return (data || []).map((lead: Record<string, unknown>) => {
        const leadContacts = lead.lead_contacts as
          | Array<{
              is_primary?: boolean
              contacts?: { email?: string | null }
            }>
          | null

        return {
          id: lead.id as string,
          legalName: lead.legal_name as string,
          tradeName: lead.trade_name as string | null | undefined,
          cnpj: lead.cnpj as string | null | undefined,
          website: lead.website as string | null | undefined,
          primaryContactEmail:
            leadContacts?.find((lc) => lc.is_primary)?.contacts?.email ||
            leadContacts?.[0]?.contacts?.email ||
            null,
        }
      })
    },
    staleTime: 5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: false,
  })

  // Check for duplicates function
  const checkForDuplicates = useCallback(
    async (input: DuplicateCheckInput): Promise<DuplicateCandidate[]> => {
      setIsChecking(true)
      setError(null)

      try {
        // Refetch to ensure fresh data
        const { data: freshLeads } = await refetchLeads()
        const leadsToCheck = freshLeads || existingLeads

        // Find duplicates using utility function from Prompt A1
        const found = findDuplicates(input, leadsToCheck)

        // Filter by minScore and limit results
        const filtered = found
          .filter((dup) => dup.matchScore >= minScore)
          .slice(0, maxResults)

        setDuplicates(filtered)
        return filtered
      } catch (err) {
        const detectionError =
          err instanceof Error ? err : new Error('Erro ao verificar duplicatas')
        setError(detectionError)
        throw detectionError
      } finally {
        setIsChecking(false)
      }
    },
    [existingLeads, refetchLeads, minScore, maxResults]
  )

  // Clear results function
  const clearResults = useCallback(() => {
    setDuplicates([])
    setError(null)
  }, [])

  // Derived values
  const hasDuplicates = duplicates.length > 0

  const highSeverityCount = useMemo(
    () =>
      duplicates.filter((dup) => getMatchSeverity(dup.matchScore) === 'high')
        .length,
    [duplicates]
  )

  return {
    duplicates,
    isChecking: isChecking || isLoadingLeads,
    error,
    checkForDuplicates,
    clearResults,
    hasDuplicates,
    highSeverityCount,
  }
}
