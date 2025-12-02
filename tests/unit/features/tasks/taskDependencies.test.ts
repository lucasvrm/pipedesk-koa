import { describe, it, expect } from 'vitest'
import {
  detectCircularDependency,
  getDependentTasks,
  isTaskBlocked,
  getBlockingTasks,
  getPriorityScore,
} from '@/features/tasks/utils/taskDependencies'
import { Task } from '@/lib/types'

describe('Task Dependencies', () => {
  const createTask = (id: string, dependencies: string[] = [], completed = false): Task => ({
    id,
    playerTrackId: 'track-1',
    title: `Task ${id}`,
    description: '',
    assignees: [],
    completed,
    dependencies,
    isMilestone: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    position: 0,
  })

  describe('detectCircularDependency', () => {
    it('should detect direct circular dependency', () => {
      const tasks: Task[] = [
        createTask('A', ['B']),
        createTask('B', []),
      ]
      
      // If we try to make B depend on A, it would create a cycle
      expect(detectCircularDependency('B', 'A', tasks)).toBe(true)
    })

    it('should detect indirect circular dependency', () => {
      const tasks: Task[] = [
        createTask('A', ['B']),
        createTask('B', ['C']),
        createTask('C', []),
      ]
      
      // If we try to make C depend on A, it would create a cycle: A -> B -> C -> A
      expect(detectCircularDependency('C', 'A', tasks)).toBe(true)
    })

    it('should detect deep circular dependency', () => {
      const tasks: Task[] = [
        createTask('A', ['B']),
        createTask('B', ['C']),
        createTask('C', ['D']),
        createTask('D', []),
      ]
      
      // If we try to make D depend on A, it would create a cycle
      expect(detectCircularDependency('D', 'A', tasks)).toBe(true)
    })

    it('should allow valid dependency', () => {
      const tasks: Task[] = [
        createTask('A', ['B']),
        createTask('B', []),
        createTask('C', []),
      ]
      
      // C can depend on B without creating a cycle
      expect(detectCircularDependency('C', 'B', tasks)).toBe(false)
    })

    it('should allow parallel dependencies', () => {
      const tasks: Task[] = [
        createTask('A', ['B', 'C']),
        createTask('B', []),
        createTask('C', []),
        createTask('D', []),
      ]
      
      // D can depend on B or C without creating a cycle
      expect(detectCircularDependency('D', 'B', tasks)).toBe(false)
      expect(detectCircularDependency('D', 'C', tasks)).toBe(false)
    })

    it('should handle self-dependency', () => {
      const tasks: Task[] = [
        createTask('A', []),
      ]
      
      // Task cannot depend on itself
      expect(detectCircularDependency('A', 'A', tasks)).toBe(true)
    })

    it('should handle empty task list', () => {
      expect(detectCircularDependency('A', 'B', [])).toBe(false)
    })

    it('should handle complex dependency graph', () => {
      const tasks: Task[] = [
        createTask('A', ['B', 'C']),
        createTask('B', ['D']),
        createTask('C', ['E']),
        createTask('D', []),
        createTask('E', []),
        createTask('F', ['D', 'E']),
      ]
      
      // D can't depend on A (A -> B -> D -> A)
      expect(detectCircularDependency('D', 'A', tasks)).toBe(true)
      
      // E can't depend on A (A -> C -> E -> A)
      expect(detectCircularDependency('E', 'A', tasks)).toBe(true)
      
      // F can depend on A (F already depends on D and E, but adding A doesn't create a cycle)
      expect(detectCircularDependency('F', 'A', tasks)).toBe(false)
      
      // But A can't depend on F (A -> B -> D, F -> D doesn't create direct cycle but A -> C -> E, F -> E would)
      expect(detectCircularDependency('A', 'F', tasks)).toBe(false)
    })
  })

  describe('getDependentTasks', () => {
    it('should get tasks that depend on given task', () => {
      const tasks: Task[] = [
        createTask('A', []),
        createTask('B', ['A']),
        createTask('C', ['A']),
        createTask('D', ['B']),
      ]
      
      const dependents = getDependentTasks('A', tasks)
      expect(dependents).toHaveLength(2)
      expect(dependents.map(t => t.id)).toEqual(expect.arrayContaining(['B', 'C']))
    })

    it('should return empty array if no dependents', () => {
      const tasks: Task[] = [
        createTask('A', []),
        createTask('B', []),
      ]
      
      expect(getDependentTasks('A', tasks)).toEqual([])
    })

    it('should not include indirect dependents', () => {
      const tasks: Task[] = [
        createTask('A', []),
        createTask('B', ['A']),
        createTask('C', ['B']),
      ]
      
      const dependents = getDependentTasks('A', tasks)
      expect(dependents).toHaveLength(1)
      expect(dependents[0].id).toBe('B')
    })
  })

  describe('isTaskBlocked', () => {
    it('should return false for task with no dependencies', () => {
      const task = createTask('A', [])
      expect(isTaskBlocked(task, [])).toBe(false)
    })

    it('should return true if any dependency is incomplete', () => {
      const task = createTask('A', ['B', 'C'])
      const tasks: Task[] = [
        task,
        createTask('B', [], true),  // completed
        createTask('C', [], false), // incomplete
      ]
      
      expect(isTaskBlocked(task, tasks)).toBe(true)
    })

    it('should return false if all dependencies are completed', () => {
      const task = createTask('A', ['B', 'C'])
      const tasks: Task[] = [
        task,
        createTask('B', [], true),
        createTask('C', [], true),
      ]
      
      expect(isTaskBlocked(task, tasks)).toBe(false)
    })

    it('should handle missing dependency gracefully', () => {
      const task = createTask('A', ['B'])
      const tasks: Task[] = [task]
      
      expect(isTaskBlocked(task, tasks)).toBe(false)
    })
  })

  describe('getBlockingTasks', () => {
    it('should return incomplete dependency tasks', () => {
      const task = createTask('A', ['B', 'C', 'D'])
      const tasks: Task[] = [
        task,
        createTask('B', [], false),
        createTask('C', [], true),
        createTask('D', [], false),
      ]
      
      const blocking = getBlockingTasks(task, tasks)
      expect(blocking).toHaveLength(2)
      expect(blocking.map(t => t.id)).toEqual(expect.arrayContaining(['B', 'D']))
    })

    it('should return empty array if all dependencies completed', () => {
      const task = createTask('A', ['B'])
      const tasks: Task[] = [
        task,
        createTask('B', [], true),
      ]
      
      expect(getBlockingTasks(task, tasks)).toEqual([])
    })

    it('should return empty array if no dependencies', () => {
      const task = createTask('A', [])
      expect(getBlockingTasks(task, [])).toEqual([])
    })

    it('should handle missing dependencies', () => {
      const task = createTask('A', ['B', 'C'])
      const tasks: Task[] = [
        task,
        createTask('B', [], false),
        // C is missing
      ]
      
      const blocking = getBlockingTasks(task, tasks)
      expect(blocking).toHaveLength(1)
      expect(blocking[0].id).toBe('B')
    })
  })

  describe('getPriorityScore', () => {
    it('should return 4 for urgent priority', () => {
      expect(getPriorityScore('urgent')).toBe(4)
    })

    it('should return 3 for high priority', () => {
      expect(getPriorityScore('high')).toBe(3)
    })

    it('should return 2 for medium priority', () => {
      expect(getPriorityScore('medium')).toBe(2)
    })

    it('should return 1 for low priority', () => {
      expect(getPriorityScore('low')).toBe(1)
    })

    it('should return 2 (medium) for undefined priority', () => {
      expect(getPriorityScore(undefined)).toBe(2)
    })

    it('should maintain correct ordering', () => {
      expect(getPriorityScore('urgent')).toBeGreaterThan(getPriorityScore('high'))
      expect(getPriorityScore('high')).toBeGreaterThan(getPriorityScore('medium'))
      expect(getPriorityScore('medium')).toBeGreaterThan(getPriorityScore('low'))
    })
  })
})
