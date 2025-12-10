import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

function normalizeToString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

/**
 * Safely converts any value to a string for React rendering.
 * Prevents React error #185 (objects rendered as children) by returning
 * a fallback string when encountering objects or arrays.
 * 
 * @param value - The value to convert to string
 * @param fallback - The fallback string to return for invalid values (default: '')
 * @returns A safe string that can be rendered by React
 */
export function safeString(value: unknown, fallback = ''): string {
  const normalized = normalizeToString(value)
  if (normalized !== undefined) return normalized

  const fallbackNormalized = normalizeToString(fallback)
  return fallbackNormalized ?? ''
}

/**
 * Similar to safeString but returns undefined instead of empty string for invalid values.
 * Useful when you want to conditionally render based on whether a value exists.
 * 
 * @param value - The value to convert to string
 * @param fallback - Optional fallback string for invalid values
 * @returns A safe string or undefined
 */
export function safeStringOptional(value: unknown, fallback?: string): string | undefined {
  const normalized = normalizeToString(value)
  if (normalized !== undefined) {
    const trimmed = normalized.trim()
    if (trimmed) return trimmed
  }

  const fallbackNormalized = normalizeToString(fallback)
  if (fallbackNormalized === undefined) return undefined

  const trimmedFallback = fallbackNormalized.trim()
  return trimmedFallback || undefined
}
