import { supabase } from './supabaseClient'
import { generateId } from './helpers'
import { MagicLink } from './types'

export type { MagicLink }

/**
 * SUPABASE AUTH MIGRATION COMPLETE
 * 
 * This application now uses Supabase Auth with Magic Link authentication.
 * 
 * Main authentication is handled by:
 * - AuthProvider in src/contexts/AuthContext.tsx
 * - useAuth() hook exported from AuthContext
 * 
 * Key functions:
 * - signInWithMagicLink(email) - Send magic link to user's email
 * - signOut() - Sign out current user
 * - onAuthStateChange - Listen to auth state changes (used in AuthProvider)
 * 
 * The legacy token-based functions below are kept for backward compatibility
 * but are no longer used in the main authentication flow.
 */

/**
 * Legacy magic link functions for backward compatibility
 * Note: These are deprecated and will be replaced by Supabase Auth
 */
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

/**
 * Send a magic link to the user's email using Supabase Auth
 */
export async function sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send magic link',
    }
  }
}

/**
 * Verify the OTP token from the magic link
 */
export async function verifyMagicLink(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to verify magic link',
    }
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to sign out',
    }
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    return null
  }

  return session
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback)

  return subscription
}

/**
 * Helper function to get invitation email body (for UI display)
 */
export function getInvitationEmailBody(
  recipientName: string,
  senderName: string,
  role: string,
  magicLinkUrl?: string,
  expirationHours = 72
): string {
  const linkSection = magicLinkUrl 
    ? `Para acessar a plataforma, clique no link abaixo:

${magicLinkUrl}

Este link é válido por ${expirationHours} horas e pode ser usado apenas uma vez.`
    : `Você receberá um link mágico por email para acessar a plataforma.

Este link é válido por ${expirationHours} horas e pode ser usado apenas uma vez.`

  return `Olá ${recipientName},

${senderName} convidou você para acessar o PipeDesk com a função de ${role}.

${linkSection}

Se você não solicitou este acesso, ignore este email.

Atenciosamente,
Equipe PipeDesk`
}

/**
 * Helper function to get invitation email subject
 */
export function getInvitationEmailSubject(senderName: string): string {
  return `${senderName} convidou você para o PipeDesk`
}
