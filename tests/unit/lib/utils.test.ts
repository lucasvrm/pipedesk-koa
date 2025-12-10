import { describe, expect, it } from 'vitest'

import { safeString, safeStringOptional, ensureArray } from '@/lib/utils'

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

describe('ensureArray', () => {
  it('should return the same array if input is an array', () => {
    const input = [1, 2, 3]
    const result = ensureArray(input)
    expect(result).toBe(input)
    expect(result).toEqual([1, 2, 3])
  })

  it('should return an empty array for null', () => {
    const result = ensureArray(null)
    expect(result).toEqual([])
  })

  it('should return an empty array for undefined', () => {
    const result = ensureArray(undefined)
    expect(result).toEqual([])
  })

  it('should return an empty array for objects', () => {
    const result = ensureArray({ key: 'value' })
    expect(result).toEqual([])
  })

  it('should return an empty array for strings', () => {
    const result = ensureArray('string')
    expect(result).toEqual([])
  })

  it('should return an empty array for numbers', () => {
    const result = ensureArray(42)
    expect(result).toEqual([])
  })

  it('should handle empty arrays', () => {
    const result = ensureArray([])
    expect(result).toEqual([])
  })

  it('should work with typed arrays', () => {
    interface Item {
      id: string
      name: string
    }
    const items: Item[] = [{ id: '1', name: 'Test' }]
    const result = ensureArray<Item>(items)
    expect(result).toEqual(items)
    expect(result[0].id).toBe('1')
  })
})
