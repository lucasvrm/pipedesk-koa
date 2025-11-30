import { MasterDeal, PlayerTrack, PlayerStage } from '@/lib/types'
import { calculateWeightedVolume } from '@/lib/helpers'

/**
 * Calculate total pipeline value (sum of all active tracks)
 */
export function calculatePipelineValue(tracks: PlayerTrack[]): number {
  return tracks
    .filter(track => track.status === 'active')
    .reduce((sum, track) => sum + track.trackVolume, 0)
}

/**
 * Calculate weighted pipeline (sum of weighted forecast for all active tracks)
 * Uses the probability stored in the track snapshot
 */
export function calculateWeightedPipeline(tracks: PlayerTrack[]): number {
  return tracks
    .filter(track => track.status === 'active')
    .reduce((sum, track) => {
      return sum + calculateWeightedVolume(track.trackVolume, track.probability || 0)
    }, 0)
}

/**
 * Calculate conversion rate (concluded deals / total deals)
 */
export function calculateConversionRate(deals: MasterDeal[]): number {
  if (deals.length === 0) return 0
  
  const concludedCount = deals.filter(deal => deal.status === 'concluded').length
  return (concludedCount / deals.length) * 100
}

/**
 * Group tracks by stage
 * Dynamically counts based on stages present in tracks
 */
export function groupTracksByStage(tracks: PlayerTrack[]): Record<PlayerStage, number> {
  const result: Record<string, number> = {}

  tracks
    .filter(track => track.status === 'active')
    .forEach(track => {
      const stage = track.currentStage || 'unknown'
      result[stage] = (result[stage] || 0) + 1
    })

  return result
}

/**
 * Calculate average time to close (in days)
 */
export function calculateAverageTimeToClose(deals: MasterDeal[]): number {
  const concludedDeals = deals.filter(deal => deal.status === 'concluded')
  
  if (concludedDeals.length === 0) return 0

  const totalDays = concludedDeals.reduce((sum, deal) => {
    const created = new Date(deal.createdAt).getTime()
    const updated = new Date(deal.updatedAt).getTime()
    const days = (updated - created) / (1000 * 60 * 60 * 24)
    return sum + days
  }, 0)

  return totalDays / concludedDeals.length
}

/**
 * Calculate forecast for a specific stage
 * Uses the probability stored in the track snapshot
 */
export function calculateStageForecast(
  tracks: PlayerTrack[],
  stage: PlayerStage
): number {
  return tracks
    .filter(track => track.status === 'active' && track.currentStage === stage)
    .reduce((sum, track) => {
      // Usamos a probabilidade do snapshot do track, que é atualizada quando muda de estágio
      return sum + calculateWeightedVolume(track.trackVolume, track.probability || 0)
    }, 0)
}

/**
 * Get deals count by status
 */
export function getDealCountByStatus(deals: MasterDeal[]): {
  active: number
  concluded: number
  cancelled: number
  total: number
} {
  return {
    active: deals.filter(d => d.status === 'active').length,
    concluded: deals.filter(d => d.status === 'concluded').length,
    cancelled: deals.filter(d => d.status === 'cancelled').length,
    total: deals.length,
  }
}

/**
 * Calculate win rate (concluded / (concluded + cancelled))
 */
export function calculateWinRate(deals: MasterDeal[]): number {
  const concluded = deals.filter(d => d.status === 'concluded').length
  const cancelled = deals.filter(d => d.status === 'cancelled').length
  const total = concluded + cancelled

  if (total === 0) return 0
  return (concluded / total) * 100
}

/**
 * Get top deals by volume
 */
export function getTopDealsByVolume(
  deals: MasterDeal[],
  limit: number = 5
): MasterDeal[] {
  return [...deals]
    .filter(deal => deal.status === 'active')
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit)
}

/**
 * Calculate total fees for concluded deals
 */
export function calculateTotalFees(deals: MasterDeal[]): number {
  return deals
    .filter(deal => deal.status === 'concluded' && deal.feePercentage)
    .reduce((sum, deal) => {
      const feePercentage = deal.feePercentage || 0
      return sum + (deal.volume * feePercentage / 100)
    }, 0)
}