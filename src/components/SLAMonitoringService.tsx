import { useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { PlayerTrack, StageHistory, Notification, PlayerStage } from '../lib/types'
import { differenceInHours, differenceInDays } from 'date-fns'
import { toast } from 'sonner'

interface SLAConfigItem {
  stage: PlayerStage
  maxDays: number
  alertThresholdPercent: number
}

interface SLAViolation {
  playerTrackId: string
  stage: PlayerStage
  hoursInStage: number
  maxHours: number
  percentage: number
  status: 'at_risk' | 'overdue'
}

export function useSLAMonitoring() {
  const [slaConfig] = useKV<SLAConfigItem[]>('sla_config', [])
  const [playerTracks] = useKV<PlayerTrack[]>('player_tracks', [])
  const [stageHistory] = useKV<StageHistory[]>('stage_history', [])
  const [notifications, setNotifications] = useKV<Notification[]>('notifications', [])
  const [currentUser] = useKV<{ id: string } | null>('current_user', null)

  const checkSLAViolations = useCallback(() => {
    if (!slaConfig || slaConfig.length === 0) return;

    const violations: SLAViolation[] = [];
    const now = new Date();

    // Check each active player track
    (playerTracks ?? [])
      .filter(track => track.status === 'active')
      .forEach(track => {
        // Find current stage entry
        const currentStageEntry = (stageHistory ?? []).find(
          h => h.playerTrackId === track.id && h.stage === track.currentStage && !h.exitedAt
        )

        if (!currentStageEntry) return

        // Get SLA config for this stage
        const stageSLA = (slaConfig ?? []).find(c => c.stage === track.currentStage)
        if (!stageSLA) return

        const enteredAt = new Date(currentStageEntry.enteredAt)
        const hoursInStage = differenceInHours(now, enteredAt)
        const maxHours = stageSLA.maxDays * 24
        const alertThresholdHours = maxHours * (stageSLA.alertThresholdPercent / 100)
        const percentage = (hoursInStage / maxHours) * 100

        // Check if at risk or overdue
        if (hoursInStage >= maxHours) {
          violations.push({
            playerTrackId: track.id,
            stage: track.currentStage,
            hoursInStage,
            maxHours,
            percentage,
            status: 'overdue',
          })
        } else if (hoursInStage >= alertThresholdHours) {
          violations.push({
            playerTrackId: track.id,
            stage: track.currentStage,
            hoursInStage,
            maxHours,
            percentage,
            status: 'at_risk',
          })
        }
      })

    // Create notifications for new violations
    violations.forEach(violation => {
      const track = (playerTracks ?? []).find(t => t.id === violation.playerTrackId)
      if (!track) return

      // Check if we already sent a notification for this violation
      const existingNotification = (notifications ?? []).find(
        n => 
          n.type === 'sla_breach' &&
          n.link === `/deals/${track.masterDealId}?track=${track.id}` &&
          !n.read &&
          n.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Within last 24h
      )

      if (existingNotification) return // Don't spam notifications

      // Create notification for track responsibles
      track.responsibles.forEach(userId => {
        // Find current stage entry
        const currentStageEntry = (stageHistory ?? []).find(
          h => h.playerTrackId === track.id && h.stage === track.currentStage && !h.exitedAt
        )
        
        if (!currentStageEntry) return
        
        const daysInStage = differenceInDays(now, new Date(currentStageEntry.enteredAt))
        
        const newNotification: Notification = {
          id: crypto.randomUUID(),
          userId,
          type: 'sla_breach',
          title: violation.status === 'overdue' 
            ? `⚠️ SLA Vencido: ${track.playerName}`
            : `🔔 SLA em Risco: ${track.playerName}`,
          message: violation.status === 'overdue'
            ? `${track.playerName} está ${daysInStage} dias em ${track.currentStage.toUpperCase()}, ultrapassando o limite de ${Math.round(violation.maxHours / 24)} dias.`
            : `${track.playerName} está há ${daysInStage} dias em ${track.currentStage.toUpperCase()}, próximo ao limite de ${Math.round(violation.maxHours / 24)} dias (${Math.round(violation.percentage)}%).`,
          link: `/deals/${track.masterDealId}?track=${track.id}`,
          read: false,
          createdAt: new Date().toISOString(),
        }

        setNotifications([...(notifications ?? []), newNotification])

        // Show toast for current user
        if (currentUser && userId === currentUser.id) {
          if (violation.status === 'overdue') {
            toast.error(newNotification.title, {
              description: newNotification.message,
            })
          } else {
            toast.warning(newNotification.title, {
              description: newNotification.message,
            })
          }
        }
      })
    })
  }, [playerTracks, stageHistory, slaConfig, notifications, setNotifications, currentUser])

  useEffect(() => {
    // Run SLA check every 5 minutes
    const intervalId = setInterval(() => {
      checkSLAViolations()
    }, 5 * 60 * 1000) // 5 minutes

    // Run immediately on mount
    checkSLAViolations()

    return () => clearInterval(intervalId)
  }, [checkSLAViolations])

  return {
    checkSLAViolations,
  }
}

// Component to mount the monitoring service
export function SLAMonitoringService() {
  useSLAMonitoring()
  return null
}
