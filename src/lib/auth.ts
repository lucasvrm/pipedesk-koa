import { generateId } from './helpers'
import { MagicLink, ROLE_LABELS, UserRole } from './types'

export type { MagicLink }

export function generateMagicLink(userId: string, expirationHours = 72): MagicLink {
  const token = generateSecureToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000)

  return {
    id: generateId(),
    userId,
    token,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  }
}

export function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const length = 64
  let token = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    token += chars[randomIndex]
  }
  
  return token
}

export function getMagicLinkUrl(token: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/auth?token=${token}`
}

export function isMagicLinkExpired(link: MagicLink): boolean {
  return new Date(link.expiresAt) < new Date()
}

export function isMagicLinkValid(link: MagicLink): boolean {
  return !link.usedAt && !link.revokedAt && !isMagicLinkExpired(link)
}

export function getInvitationEmailBody(
  recipientName: string,
  senderName: string,
  role: string,
  magicLinkUrl: string,
  expirationHours: number
): string {
  return `Olá ${recipientName},

${senderName} convidou você para acessar o DealFlow Manager com a função de ${role}.

Para acessar a plataforma, clique no link abaixo:

${magicLinkUrl}

Este link é válido por ${expirationHours} horas e pode ser usado apenas uma vez.

Se você não solicitou este acesso, ignore este email.

Atenciosamente,
Equipe DealFlow Manager`
}

export function getInvitationEmailSubject(senderName: string): string {
  return `${senderName} convidou você para o DealFlow Manager`
}
