import { describe, it, expect } from 'vitest'
import type { TimelineItem } from '@/hooks/useUnifiedTimeline'

/**
 * Organizes timeline items into a hierarchical thread structure.
 * Items with parentId are nested under their parent as replies.
 * Supports up to 4 levels of nesting (depth 0-4).
 */
function organizeIntoThreads(items: TimelineItem[]): TimelineItem[] {
  const itemsMap = new Map<string, TimelineItem>()
  const rootItems: TimelineItem[] = []
  
  // First pass: create map with empty replies array
  items.forEach(item => {
    itemsMap.set(item.id, { ...item, replies: [], depth: 0 })
  })
  
  // Second pass: organize hierarchy
  items.forEach(item => {
    const mappedItem = itemsMap.get(item.id)
    if (!mappedItem) return
    
    if (item.parentId && itemsMap.has(item.parentId)) {
      const parent = itemsMap.get(item.parentId)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(mappedItem)
        // Set depth based on parent's depth
        mappedItem.depth = (parent.depth ?? 0) + 1
      }
    } else {
      rootItems.push(mappedItem)
    }
  })
  
  // Recursively sort replies by date (ascending - oldest first in replies)
  function sortRepliesRecursively(item: TimelineItem) {
    if (item.replies?.length) {
      item.replies.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      // Recursively sort nested replies
      item.replies.forEach(reply => sortRepliesRecursively(reply))
    }
  }
  
  rootItems.forEach(item => sortRepliesRecursively(item))
  
  return rootItems
}

describe('organizeIntoThreads - Nested Replies', () => {
  const createMockItem = (id: string, parentId?: string | null): TimelineItem => ({
    id,
    type: 'comment',
    author: {
      id: 'user1',
      name: 'John Doe'
    },
    content: `Content ${id}`,
    date: new Date(`2024-01-01T${id.padStart(2, '0')}:00:00Z`).toISOString(),
    parentId: parentId ?? null
  })

  it('should organize flat items with no parents as root items', () => {
    const items = [
      createMockItem('1'),
      createMockItem('2'),
      createMockItem('3')
    ]

    const result = organizeIntoThreads(items)

    expect(result).toHaveLength(3)
    expect(result[0].depth).toBe(0)
    expect(result[1].depth).toBe(0)
    expect(result[2].depth).toBe(0)
  })

  it('should nest replies under their parent (1 level)', () => {
    const items = [
      createMockItem('1'),
      createMockItem('2', '1'),
      createMockItem('3', '1')
    ]

    const result = organizeIntoThreads(items)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
    expect(result[0].depth).toBe(0)
    expect(result[0].replies).toHaveLength(2)
    expect(result[0].replies?.[0].depth).toBe(1)
    expect(result[0].replies?.[1].depth).toBe(1)
  })

  it('should support nested replies up to 4 levels', () => {
    const items = [
      createMockItem('root'),
      createMockItem('level1', 'root'),
      createMockItem('level2', 'level1'),
      createMockItem('level3', 'level2'),
      createMockItem('level4', 'level3')
    ]

    const result = organizeIntoThreads(items)

    expect(result).toHaveLength(1)
    
    const root = result[0]
    expect(root.depth).toBe(0)
    expect(root.replies).toHaveLength(1)
    
    const level1 = root.replies?.[0]
    expect(level1?.depth).toBe(1)
    expect(level1?.replies).toHaveLength(1)
    
    const level2 = level1?.replies?.[0]
    expect(level2?.depth).toBe(2)
    expect(level2?.replies).toHaveLength(1)
    
    const level3 = level2?.replies?.[0]
    expect(level3?.depth).toBe(3)
    expect(level3?.replies).toHaveLength(1)
    
    const level4 = level3?.replies?.[0]
    expect(level4?.depth).toBe(4)
  })

  it('should sort replies by date (oldest first)', () => {
    const items = [
      createMockItem('1'),
      createMockItem('3', '1'),
      createMockItem('2', '1'),
      createMockItem('4', '1')
    ]

    const result = organizeIntoThreads(items)

    expect(result[0].replies?.[0].id).toBe('2')
    expect(result[0].replies?.[1].id).toBe('3')
    expect(result[0].replies?.[2].id).toBe('4')
  })

  it('should recursively sort nested replies', () => {
    const items = [
      createMockItem('1'),
      createMockItem('2', '1'),
      createMockItem('4', '2'),
      createMockItem('3', '2')
    ]

    const result = organizeIntoThreads(items)

    const level1 = result[0].replies?.[0]
    expect(level1?.replies?.[0].id).toBe('3')
    expect(level1?.replies?.[1].id).toBe('4')
  })

  it('should handle complex thread structures', () => {
    const items = [
      createMockItem('root1'),
      createMockItem('root2'),
      createMockItem('root1-reply1', 'root1'),
      createMockItem('root1-reply2', 'root1'),
      createMockItem('root1-reply1-reply1', 'root1-reply1'),
      createMockItem('root2-reply1', 'root2')
    ]

    const result = organizeIntoThreads(items)

    expect(result).toHaveLength(2)
    expect(result[0].replies).toHaveLength(2)
    expect(result[0].replies?.[0].replies).toHaveLength(1)
    expect(result[1].replies).toHaveLength(1)
  })

  it('should preserve ordering of root items', () => {
    const items = [
      createMockItem('3'),
      createMockItem('1'),
      createMockItem('2')
    ]

    const result = organizeIntoThreads(items)

    expect(result[0].id).toBe('3')
    expect(result[1].id).toBe('1')
    expect(result[2].id).toBe('2')
  })
})
