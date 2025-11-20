export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function calculateWeightedVolume(volume: number, probability: number): number {
  return volume * (probability / 100)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function anonymizePlayerName(playerName: string, trackId: string, isClient: boolean): string {
  if (!isClient) return playerName
  const trackNumber = trackId.split('-')[0].slice(-4)
  return `Player ${trackNumber}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function isOverdue(deadline: string): boolean {
  return new Date(deadline) < new Date()
}

export function getDaysUntil(date: string): number {
  const diff = new Date(date).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function trackStageChange(
  trackId: string,
  newStage: string,
  oldStage?: string
): void {
  if (!oldStage || oldStage === newStage) return

  const stageHistoryKey = 'stageHistory'
  
  window.spark.kv.get<any[]>(stageHistoryKey).then((history) => {
    const existingHistory = history || []
    
    const openRecord = existingHistory.find(
      (h) => h.playerTrackId === trackId && h.stage === oldStage && !h.exitedAt
    )

    const now = new Date().toISOString()
    const updatedHistory = [...existingHistory]

    if (openRecord) {
      const exitedAt = now
      const enteredAt = new Date(openRecord.enteredAt)
      const durationHours =
        (new Date(exitedAt).getTime() - enteredAt.getTime()) / (1000 * 60 * 60)

      const index = updatedHistory.findIndex((h) => h.id === openRecord.id)
      if (index !== -1) {
        updatedHistory[index] = {
          ...openRecord,
          exitedAt,
          durationHours,
        }
      }
    }

    const newRecord = {
      id: `stage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerTrackId: trackId,
      stage: newStage,
      enteredAt: now,
    }

    updatedHistory.push(newRecord)

    window.spark.kv.set(stageHistoryKey, updatedHistory)
  })
}
