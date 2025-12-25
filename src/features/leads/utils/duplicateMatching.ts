/**
 * Duplicate Detection Utility Functions for Leads
 *
 * This module provides comprehensive duplicate matching functionality:
 * - String similarity using Levenshtein distance
 * - CNPJ normalization and matching
 * - Email/Website domain extraction and matching
 * - Weighted scoring system for duplicate detection
 *
 * Score weights:
 * - Legal Name: 40% (primary identifier, always present)
 * - CNPJ: 35% (optional, strong match when available)
 * - Trade Name: 10%
 * - Email Domain: 10%
 * - Website Domain: 5%
 *
 * Threshold: 40% minimum to consider a duplicate
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DuplicateCandidate {
  id: string
  legalName: string
  tradeName?: string | null
  cnpj?: string | null
  website?: string | null
  matchScore: number // 0-100
  matchedFields: MatchedField[]
}

export interface MatchedField {
  field: 'cnpj' | 'legalName' | 'tradeName' | 'emailDomain' | 'websiteDomain'
  label: string // 'CNPJ', 'Razão Social', etc.
  score: number
  inputValue: string
  matchedValue: string
}

export interface DuplicateCheckInput {
  legalName: string
  tradeName?: string | null
  cnpj?: string | null
  website?: string | null
  email?: string | null
}

export interface ExistingLead {
  id: string
  legalName: string
  tradeName?: string | null
  cnpj?: string | null
  website?: string | null
  primaryContactEmail?: string | null
}

export type MatchSeverity = 'high' | 'medium' | 'low'

export interface MatchSeverityColors {
  bg: string
  border: string
  badge: string
  text: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Field weights for duplicate scoring.
 * CNPJ weight reduced (35%) since it's OPTIONAL.
 * Legal Name is the PRIMARY identifier (40%) — always present.
 */
const FIELD_WEIGHTS = {
  legalName: 40, // Primary (mandatory)
  cnpj: 35, // OPTIONAL — strong when available
  tradeName: 10,
  emailDomain: 10,
  websiteDomain: 5,
} as const

/**
 * Free email domains to ignore in matching.
 * Emails from these domains don't indicate a company relationship.
 */
const FREE_EMAIL_DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
  'msn.com',
  'uol.com.br',
  'bol.com.br',
  'terra.com.br',
] as const

/**
 * Maximum string length for Levenshtein calculation.
 * Strings longer than this are truncated for performance.
 */
const MAX_LEVENSHTEIN_LENGTH = 100

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Calculate the Levenshtein distance between two strings.
 * Uses dynamic programming approach (Wagner-Fischer algorithm).
 *
 * IMPORTANT: Strings longer than MAX_LEVENSHTEIN_LENGTH chars are truncated
 * BEFORE calculation for performance.
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Number of edit operations needed to transform str1 into str2
 *
 * @example
 * levenshteinDistance('empresa', 'empresaa') // 1
 * levenshteinDistance('acme', 'acne') // 1
 */
export function levenshteinDistance(str1: string, str2: string): number {
  // Truncate for performance
  const s1 = str1.slice(0, MAX_LEVENSHTEIN_LENGTH)
  const s2 = str2.slice(0, MAX_LEVENSHTEIN_LENGTH)

  const len1 = s1.length
  const len2 = s2.length

  // Quick returns
  if (len1 === 0) return len2
  if (len2 === 0) return len1

  // Create distance matrix
  const matrix: number[][] = []

  // Initialize first column
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  // Initialize first row
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[len1][len2]
}

/**
 * Calculate similarity percentage between two strings.
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score 0-100 (100 = identical)
 *
 * @example
 * calculateStringSimilarity('Acme Corp', 'ACME CORPORATION') // ~75
 * calculateStringSimilarity('empresa', 'empresaa') // ~85
 */
export function calculateStringSimilarity(
  str1: string | null | undefined,
  str2: string | null | undefined
): number {
  // Handle nulls/undefined
  const normalized1 = normalizeString(str1)
  const normalized2 = normalizeString(str2)

  // Both empty means no match possible
  if (!normalized1 || !normalized2) {
    return 0
  }

  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLength = Math.max(normalized1.length, normalized2.length)

  if (maxLength === 0) {
    return 100 // Both strings are empty after normalization, considered equal
  }

  return Math.round((1 - distance / maxLength) * 100)
}

/**
 * Normalize a string for comparison.
 * - Converts to lowercase
 * - Removes accents (á → a, ç → c, etc.)
 * - Trims whitespace
 * - Removes multiple spaces
 *
 * @param str - String to normalize
 * @returns Normalized string, or empty string if null/undefined
 *
 * @example
 * normalizeString('  Razão  Social  ') // 'razao social'
 * normalizeString('AÇÚCAR') // 'acucar'
 * normalizeString(null) // ''
 */
export function normalizeString(str: string | null | undefined): string {
  if (str == null) {
    return ''
  }

  return (
    str
      .toLowerCase()
      // Remove accents using NFD normalization
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
  )
}

// ============================================================================
// CNPJ UTILITIES
// ============================================================================

/**
 * Normalize a CNPJ to digits only.
 *
 * @param cnpj - CNPJ string (formatted or not)
 * @returns Digits only, or empty string if invalid
 *
 * @example
 * normalizeCNPJ('12.345.678/0001-90') // '12345678000190'
 * normalizeCNPJ('12345678000190') // '12345678000190'
 * normalizeCNPJ(null) // ''
 * normalizeCNPJ('abc') // ''
 */
export function normalizeCNPJ(cnpj: string | null | undefined): string {
  if (cnpj == null) {
    return ''
  }

  // Remove all non-digit characters
  const digitsOnly = cnpj.replace(/[^\d]/g, '')

  // If empty or not numeric, return empty
  if (!digitsOnly || !/^\d+$/.test(digitsOnly)) {
    return ''
  }

  return digitsOnly
}

/**
 * Format a CNPJ to the standard pattern: XX.XXX.XXX/XXXX-XX
 *
 * @param cnpj - CNPJ string (formatted or not)
 * @returns Formatted CNPJ, or original if invalid length
 *
 * @example
 * formatCNPJ('12345678000190') // '12.345.678/0001-90'
 * formatCNPJ('12.345.678/0001-90') // '12.345.678/0001-90'
 * formatCNPJ('123') // '123'
 */
export function formatCNPJ(cnpj: string): string {
  const normalized = normalizeCNPJ(cnpj)

  // CNPJ must have exactly 14 digits
  if (normalized.length !== 14) {
    return cnpj
  }

  return `${normalized.slice(0, 2)}.${normalized.slice(2, 5)}.${normalized.slice(5, 8)}/${normalized.slice(8, 12)}-${normalized.slice(12, 14)}`
}

// ============================================================================
// EMAIL/WEBSITE UTILITIES
// ============================================================================

/**
 * Extract domain from an email address.
 * Returns null for free email domains (gmail, hotmail, etc.)
 *
 * @param email - Email address
 * @returns Domain after @, or null if invalid/free email
 *
 * @example
 * extractEmailDomain('contato@acme.com') // 'acme.com'
 * extractEmailDomain('user@gmail.com') // null (free email)
 * extractEmailDomain('user@empresa.com.br') // 'empresa.com.br'
 * extractEmailDomain(null) // null
 */
export function extractEmailDomain(
  email: string | null | undefined
): string | null {
  if (!email || typeof email !== 'string') {
    return null
  }

  const trimmed = email.trim().toLowerCase()
  const atIndex = trimmed.indexOf('@')

  if (atIndex < 0 || atIndex === trimmed.length - 1) {
    return null
  }

  const domain = trimmed.slice(atIndex + 1)

  // Ignore free email domains
  if ((FREE_EMAIL_DOMAINS as readonly string[]).includes(domain)) {
    return null
  }

  return domain
}

/**
 * Extract domain from a website URL.
 * Removes protocol (http/https), www prefix, and path.
 *
 * @param url - Website URL
 * @returns Domain only, or empty string if invalid
 *
 * @example
 * extractWebsiteDomain('https://www.acme.com/sobre') // 'acme.com'
 * extractWebsiteDomain('acme.com.br') // 'acme.com.br'
 * extractWebsiteDomain('http://empresa.com/') // 'empresa.com'
 * extractWebsiteDomain(null) // ''
 */
export function extractWebsiteDomain(
  url: string | null | undefined
): string {
  if (!url || typeof url !== 'string') {
    return ''
  }

  let domain = url.trim().toLowerCase()

  // Remove protocol
  domain = domain.replace(/^https?:\/\//, '')

  // Remove www.
  domain = domain.replace(/^www\./, '')

  // Extract only domain (before first /)
  const slashIndex = domain.indexOf('/')
  if (slashIndex > 0) {
    domain = domain.slice(0, slashIndex)
  }

  return domain
}

// ============================================================================
// MATCH FUNCTIONS (Score 0-100)
// ============================================================================

/**
 * Match two CNPJs.
 * CNPJ is OPTIONAL — returns 0 if either is null/undefined.
 * Exact match only — returns 100 or 0.
 *
 * @param input - Input CNPJ
 * @param existing - Existing CNPJ to match against
 * @returns 100 if exact match, 0 otherwise
 *
 * @example
 * matchCNPJ('12.345.678/0001-90', '12345678000190') // 100
 * matchCNPJ('12345678000190', '12345678000191') // 0
 * matchCNPJ(null, '12345678000190') // 0
 */
export function matchCNPJ(
  input: string | null | undefined,
  existing: string | null | undefined
): number {
  // CNPJ is OPTIONAL — if either is null/undefined, return 0
  if (!input || !existing) {
    return 0
  }

  const normalizedInput = normalizeCNPJ(input)
  const normalizedExisting = normalizeCNPJ(existing)

  // If either normalized is empty, return 0
  if (!normalizedInput || !normalizedExisting) {
    return 0
  }

  // CNPJ is exact match only
  return normalizedInput === normalizedExisting ? 100 : 0
}

/**
 * Match legal names using string similarity.
 * Returns score if >= 60%, otherwise 0.
 *
 * @param input - Input legal name
 * @param existing - Existing legal name to match against
 * @returns Similarity score if >= 60, 0 otherwise
 *
 * @example
 * matchLegalName('Acme Corp', 'Acme Corporation') // ~75
 * matchLegalName('Empresa A', 'Empresa B') // 0 (< 60%)
 */
export function matchLegalName(input: string, existing: string): number {
  const score = calculateStringSimilarity(input, existing)
  return score >= 60 ? score : 0
}

/**
 * Match trade names using string similarity.
 * Returns score if >= 50%, otherwise 0.
 * Lower threshold than legal name since trade names are more informal.
 *
 * @param input - Input trade name
 * @param existing - Existing trade name to match against
 * @returns Similarity score if >= 50, 0 otherwise
 */
export function matchTradeName(
  input?: string | null,
  existing?: string | null
): number {
  if (!input || !existing) {
    return 0
  }

  const score = calculateStringSimilarity(input, existing)
  return score >= 50 ? score : 0
}

/**
 * Match email domains.
 * Returns 85 for exact match, 0 otherwise.
 * Free email domains are filtered out.
 *
 * @param input - Input email or domain
 * @param existing - Existing email or domain
 * @returns 85 if domains match, 0 otherwise
 */
export function matchEmailDomain(
  input?: string | null,
  existing?: string | null
): number {
  // Extract domains (also filters free emails)
  const inputDomain =
    input && input.includes('@') ? extractEmailDomain(input) : input
  const existingDomain =
    existing && existing.includes('@')
      ? extractEmailDomain(existing)
      : existing

  // If either is null (free email or invalid), return 0
  if (!inputDomain || !existingDomain) {
    return 0
  }

  // Email domain is exact match only
  return inputDomain.toLowerCase() === existingDomain.toLowerCase() ? 85 : 0
}

/**
 * Match website domains.
 * Returns 90 for exact match, 0 otherwise.
 *
 * @param input - Input website URL
 * @param existing - Existing website URL
 * @returns 90 if domains match, 0 otherwise
 */
export function matchWebsiteDomain(
  input?: string | null,
  existing?: string | null
): number {
  const inputDomain = extractWebsiteDomain(input)
  const existingDomain = extractWebsiteDomain(existing)

  // If either is empty, return 0
  if (!inputDomain || !existingDomain) {
    return 0
  }

  // Website domain is exact match only
  return inputDomain === existingDomain ? 90 : 0
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Check if a lead input is a potential duplicate of an existing lead.
 *
 * Algorithm:
 * 1. Compare all available fields with weighted scores
 * 2. Only include fields that BOTH leads have (denominator is dynamic)
 * 3. Return null if score < 40% threshold
 *
 * Score formula: Σ(weight × field_score) / Σ(weights_of_compared_fields)
 *
 * @param input - Input lead data to check
 * @param existing - Existing lead to compare against
 * @returns DuplicateCandidate if score >= 40%, null otherwise
 */
export function checkLeadForDuplicate(
  input: DuplicateCheckInput,
  existing: ExistingLead
): DuplicateCandidate | null {
  const matchedFields: MatchedField[] = []
  let totalScore = 0
  let totalWeight = 0

  // 1. Legal Name (always present)
  const legalNameScore = matchLegalName(input.legalName, existing.legalName)
  if (legalNameScore > 0) {
    matchedFields.push({
      field: 'legalName',
      label: 'Razão Social',
      score: legalNameScore,
      inputValue: input.legalName,
      matchedValue: existing.legalName,
    })
    totalScore += FIELD_WEIGHTS.legalName * legalNameScore
    totalWeight += FIELD_WEIGHTS.legalName
  }

  // 2. CNPJ (OPTIONAL — only compare if BOTH have it)
  if (input.cnpj && existing.cnpj) {
    const cnpjScore = matchCNPJ(input.cnpj, existing.cnpj)
    if (cnpjScore > 0) {
      matchedFields.push({
        field: 'cnpj',
        label: 'CNPJ',
        score: cnpjScore,
        inputValue: input.cnpj,
        matchedValue: existing.cnpj,
      })
      totalScore += FIELD_WEIGHTS.cnpj * cnpjScore
      totalWeight += FIELD_WEIGHTS.cnpj
    }
  }

  // 3. Trade Name (optional)
  if (input.tradeName && existing.tradeName) {
    const tradeNameScore = matchTradeName(input.tradeName, existing.tradeName)
    if (tradeNameScore > 0) {
      matchedFields.push({
        field: 'tradeName',
        label: 'Nome Fantasia',
        score: tradeNameScore,
        inputValue: input.tradeName,
        matchedValue: existing.tradeName,
      })
      totalScore += FIELD_WEIGHTS.tradeName * tradeNameScore
      totalWeight += FIELD_WEIGHTS.tradeName
    }
  }

  // 4. Email Domain (if provided and not free email)
  const inputEmailDomain = extractEmailDomain(input.email)
  const existingEmailDomain = extractEmailDomain(existing.primaryContactEmail)
  if (inputEmailDomain && existingEmailDomain) {
    const emailScore = matchEmailDomain(inputEmailDomain, existingEmailDomain)
    if (emailScore > 0) {
      matchedFields.push({
        field: 'emailDomain',
        label: 'Domínio de Email',
        score: emailScore,
        inputValue: inputEmailDomain,
        matchedValue: existingEmailDomain,
      })
      totalScore += FIELD_WEIGHTS.emailDomain * emailScore
      totalWeight += FIELD_WEIGHTS.emailDomain
    }
  }

  // 5. Website Domain
  if (input.website && existing.website) {
    const inputWebDomain = extractWebsiteDomain(input.website)
    const existingWebDomain = extractWebsiteDomain(existing.website)
    if (inputWebDomain && existingWebDomain) {
      const websiteScore = matchWebsiteDomain(inputWebDomain, existingWebDomain)
      if (websiteScore > 0) {
        matchedFields.push({
          field: 'websiteDomain',
          label: 'Domínio do Website',
          score: websiteScore,
          inputValue: inputWebDomain,
          matchedValue: existingWebDomain,
        })
        totalScore += FIELD_WEIGHTS.websiteDomain * websiteScore
        totalWeight += FIELD_WEIGHTS.websiteDomain
      }
    }
  }

  // 6. Calculate final score
  if (totalWeight === 0 || matchedFields.length === 0) {
    return null
  }

  const finalScore = Math.round(totalScore / totalWeight)

  // Threshold: minimum 40% to consider a duplicate
  if (finalScore < 40) {
    return null
  }

  return {
    id: existing.id,
    legalName: existing.legalName,
    tradeName: existing.tradeName,
    cnpj: existing.cnpj,
    website: existing.website,
    matchScore: finalScore,
    matchedFields,
  }
}

/**
 * Find all duplicate candidates for a lead input.
 *
 * @param input - Input lead data to check
 * @param existingLeads - Array of existing leads to compare against
 * @returns Array of DuplicateCandidate sorted by matchScore DESC
 */
export function findDuplicates(
  input: DuplicateCheckInput,
  existingLeads: ExistingLead[]
): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = []

  for (const lead of existingLeads) {
    const candidate = checkLeadForDuplicate(input, lead)
    if (candidate) {
      candidates.push(candidate)
    }
  }

  // Sort by matchScore descending (highest score first)
  return candidates.sort((a, b) => b.matchScore - a.matchScore)
}

// ============================================================================
// SEVERITY & COLORS
// ============================================================================

/**
 * Get severity level based on match score.
 *
 * @param score - Match score (0-100)
 * @returns Severity level
 *
 * @example
 * getMatchSeverity(85) // 'high'
 * getMatchSeverity(65) // 'medium'
 * getMatchSeverity(45) // 'low'
 */
export function getMatchSeverity(score: number): MatchSeverity {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

/**
 * Get Tailwind CSS classes for severity styling.
 * Dark mode compatible.
 *
 * @param severity - Severity level
 * @returns Object with bg, border, badge, and text CSS classes
 */
export function getMatchSeverityColors(
  severity: MatchSeverity
): MatchSeverityColors {
  switch (severity) {
    case 'high':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        text: 'text-red-700 dark:text-red-400',
      }
    case 'medium':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        badge:
          'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
        text: 'text-amber-700 dark:text-amber-400',
      }
    case 'low':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        text: 'text-blue-700 dark:text-blue-400',
      }
  }
}
