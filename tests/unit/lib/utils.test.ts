import { describe, expect, it } from 'vitest'

import { safeString, safeStringOptional } from '@/lib/utils'

describe('safeString', () => {
  it('coerces fallback primitives and never returns objects', () => {
    expect(safeString(undefined, 123 as unknown as string)).toBe('123')
    expect(safeString(null, { foo: 'bar' } as unknown as string)).toBe('')
  })
})

describe('safeStringOptional', () => {
  it('trims values and ignores object fallbacks', () => {
    expect(safeStringOptional('   ', ' fallback ')).toBe('fallback')
    expect(safeStringOptional(undefined, { foo: 'bar' } as unknown as string)).toBeUndefined()
  })
})
