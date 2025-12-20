import type { LeadPriorityBucket } from '@/lib/types'

interface LeadPriorityInput {
  priorityScore?: number | null
  priorityBucket?: LeadPriorityBucket | null
  lastInteractionAt?: string | null
  createdAt?: string | null
  leadStatusId?: string | null
}

interface LeadPriorityResult {
  bucket: LeadPriorityBucket
  score: number
  description: string
}

/**
 * Calculates lead priority if not already provided by the backend.
 * Uses the same logic as the Sales View.
 */
export function calculateLeadPriority(lead: LeadPriorityInput): LeadPriorityResult {
  // If bucket and score already exist, use them
  if (lead.priorityBucket && lead.priorityScore !== null && lead.priorityScore !== undefined) {
    return {
      bucket: lead.priorityBucket,
      score: lead.priorityScore,
      description: getDescriptionForBucket(lead.priorityBucket)
    }
  }

  // Calculate based on days since last interaction
  const lastInteraction = lead.lastInteractionAt
    ? new Date(lead.lastInteractionAt)
    : lead.createdAt
      ? new Date(lead.createdAt)
      : new Date()

  const daysSinceInteraction = Math.floor(
    (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
  )

  let bucket: LeadPriorityBucket
  let score: number

  if (daysSinceInteraction <= 3) {
    bucket = 'hot'
    score = 90 - (daysSinceInteraction * 5)
  } else if (daysSinceInteraction <= 7) {
    bucket = 'warm'
    score = 70 - ((daysSinceInteraction - 3) * 5)
  } else {
    bucket = 'cold'
    score = Math.max(10, 50 - ((daysSinceInteraction - 7) * 3))
  }

  return {
    bucket,
    score,
    description: getDescriptionForBucket(bucket)
  }
}

function getDescriptionForBucket(bucket: LeadPriorityBucket): string {
  switch (bucket) {
    case 'hot':
      return 'Lead quente - interação recente, alta probabilidade de conversão'
    case 'warm':
      return 'Lead morno - necessita acompanhamento'
    case 'cold':
      return 'Lead frio - sem interação recente'
    default:
      return ''
  }
}
