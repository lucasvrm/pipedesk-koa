import type { LeadPriorityBucket } from '@/lib/types'
import type { LeadPriorityConfig, LeadStatusMeta, LeadOriginMeta } from '@/types/metadata'
import { parseLeadPriorityConfig } from './parseLeadPriorityConfig'

interface LeadPriorityInput {
  priorityScore?: number | null
  priorityBucket?: LeadPriorityBucket | null
  lastInteractionAt?: string | null
  createdAt?: string | null
  leadStatusId?: string | null
  leadOriginId?: string | null
  hasUpcomingMeeting?: boolean
}

interface LeadPriorityResult {
  bucket: LeadPriorityBucket
  score: number
  description: string
}

interface LeadPriorityContext {
  leadStatuses?: LeadStatusMeta[]
  leadOrigins?: LeadOriginMeta[]
}

/**
 * Calculates lead priority if not already provided by the backend.
 * Uses dynamic configuration from system settings.
 * 
 * Priority buckets based on configurable score ranges (defaults: 70/40):
 * - hot: score >= config.thresholds.hot (default 70)
 * - warm: config.thresholds.warm <= score < config.thresholds.hot (default 40-69)
 * - cold: score < config.thresholds.warm (default <40)
 */
export function calculateLeadPriority(
  lead: LeadPriorityInput,
  config?: LeadPriorityConfig,
  context?: LeadPriorityContext
): LeadPriorityResult {
  // Use provided config or defaults
  const priorityConfig = config ?? parseLeadPriorityConfig(null)
  
  // If bucket and score already exist, normalize bucket based on score for consistency
  if (lead.priorityScore !== null && lead.priorityScore !== undefined) {
    const score = lead.priorityScore
    const bucket = getBucketFromScore(score, priorityConfig)
    return {
      bucket,
      score,
      description: getDescriptionForBucket(bucket, priorityConfig)
    }
  }
  
  // If only bucket exists without score, use it as-is
  if (lead.priorityBucket) {
    return {
      bucket: lead.priorityBucket,
      score: getDefaultScoreForBucket(lead.priorityBucket, priorityConfig),
      description: getDescriptionForBucket(lead.priorityBucket, priorityConfig)
    }
  }

  // Calculate fallback score using recency + status/origin weights + meetings
  const fallbackScore = calculateFallbackScore(lead, priorityConfig, context)
  const bucket = getBucketFromScore(fallbackScore, priorityConfig)
  
  return {
    bucket,
    score: fallbackScore,
    description: getDescriptionForBucket(bucket, priorityConfig)
  }
}

/**
 * Calculates a fallback score when backend doesn't provide one.
 * Uses recency, status/origin weights, and meeting points.
 */
function calculateFallbackScore(
  lead: LeadPriorityInput,
  config: LeadPriorityConfig,
  context?: LeadPriorityContext
): number {
  let score = 0
  
  // 1. Recency points (0 to recencyMaxPoints based on days since last interaction)
  const lastInteraction = lead.lastInteractionAt
    ? new Date(lead.lastInteractionAt)
    : lead.createdAt
      ? new Date(lead.createdAt)
      : new Date()

  const daysSinceInteraction = Math.floor(
    (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Linear decay from recencyMaxPoints to 0 over staleDays
  const recencyPoints = Math.max(
    0,
    config.scoring.recencyMaxPoints * (1 - daysSinceInteraction / config.scoring.staleDays)
  )
  score += recencyPoints

  // 2. Status weight points
  if (lead.leadStatusId && context?.leadStatuses) {
    const status = context.leadStatuses.find(s => s.id === lead.leadStatusId)
    if (status) {
      score += status.priorityWeight
    }
  }

  // 3. Origin weight points
  if (lead.leadOriginId && context?.leadOrigins) {
    const origin = context.leadOrigins.find(o => o.id === lead.leadOriginId)
    if (origin) {
      score += origin.priorityWeight
    }
  }

  // 4. Upcoming meeting bonus
  if (lead.hasUpcomingMeeting) {
    score += config.scoring.upcomingMeetingPoints
  }

  // 5. Clamp to min/max
  return Math.max(
    config.scoring.minScore,
    Math.min(config.scoring.maxScore, score)
  )
}

/**
 * Determines priority bucket from score using configurable thresholds.
 */
function getBucketFromScore(score: number, config: LeadPriorityConfig): LeadPriorityBucket {
  if (score >= config.thresholds.hot) return 'hot'
  if (score >= config.thresholds.warm) return 'warm'
  return 'cold'
}

/**
 * Returns a default score for a bucket when only bucket is available.
 */
function getDefaultScoreForBucket(bucket: LeadPriorityBucket, config: LeadPriorityConfig): number {
  switch (bucket) {
    case 'hot':
      // Midpoint between hot threshold and max
      return (config.thresholds.hot + config.scoring.maxScore) / 2
    case 'warm':
      // Midpoint between warm and hot thresholds
      return (config.thresholds.warm + config.thresholds.hot) / 2
    case 'cold':
      // Midpoint between min and warm threshold
      return (config.scoring.minScore + config.thresholds.warm) / 2
    default:
      // Fallback to warm midpoint
      return (config.thresholds.warm + config.thresholds.hot) / 2
  }
}

/**
 * Returns the description for a bucket from the config.
 */
function getDescriptionForBucket(bucket: LeadPriorityBucket, config: LeadPriorityConfig): string {
  return config.descriptions[bucket] ?? ''
}
