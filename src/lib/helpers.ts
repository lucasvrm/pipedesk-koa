
// Definição de tipo para window.spark
declare global {
  interface Window {
    spark?: {
      kv: {
        get: <T>(key: string) => Promise<T | null>;
        set: <T>(key: string, value: T) => Promise<void>;
      };
    };
  }
}

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

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// ADICIONADO: Função para formatar tamanho de arquivos
export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function calculateWeightedVolume(volume: number, probability: number): number {
  return volume * (probability / 100)
}

export function calculateFee(volume: number, feePercentage: number): number {
  return volume * (feePercentage / 100)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function anonymizePlayerName(playerName: string, trackId: string, shouldAnonymize: boolean): string {
  if (!shouldAnonymize) return playerName
  const trackNumber = trackId.split('-')[0].slice(-4)
  return `Player ${trackNumber}`
}

/**
 * Gets initials from a name for avatar display.
 * - Single name: First 2 characters (e.g., "John" → "JO")
 * - Multiple names: First letter of first + first letter of last (e.g., "John Smith" → "JS")
 * - Empty/null: Returns '?'
 * 
 * @param name - The full name to extract initials from
 * @returns The initials in uppercase
 */
export function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function isOverdue(deadline: string | null | undefined): boolean {
  if (!deadline) return false
  const d = new Date(deadline)
  if (isNaN(d.getTime())) return false

  return d < new Date()
}

export function getDaysUntil(date: string | null | undefined): number {
  if (!date) return 0
  const d = new Date(date)
  if (isNaN(d.getTime())) return 0

  const diff = d.getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function trackStageChange(
  trackId: string,
  newStage: string,
  oldStage?: string
): void {
  // Nota: Esta função usa storage local (KV) e pode precisar ser migrada 
  // para o backend (Supabase) futuramente se for manter o histórico no banco.
  if (!oldStage || oldStage === newStage) return

  const stageHistoryKey = 'stageHistory'
  
  // Verificação de segurança para ambiente SSR
  if (typeof window !== 'undefined' && window.spark && window.spark.kv) {
    window.spark.kv.get<any[]>(stageHistoryKey).then((history) => {
      const existingHistory = history || []
      
      const openRecord = existingHistory.find(
        (h: any) => h.playerTrackId === trackId && h.stage === oldStage && !h.exitedAt
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
}
