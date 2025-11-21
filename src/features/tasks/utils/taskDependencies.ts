import { Task } from '@/lib/types'

/**
 * Detects if adding a dependency would create a circular reference
 * @param taskId - The ID of the task that would gain the new dependency
 * @param depId - The ID of the potential dependency
 * @param allTasks - All tasks in the system
 * @returns true if adding the dependency would create a cycle
 */
export function detectCircularDependency(
  taskId: string,
  depId: string,
  allTasks: Task[]
): boolean {
  const visited = new Set<string>()
  const queue = [depId]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === taskId) return true
    if (visited.has(current)) continue
    visited.add(current)

    const task = allTasks.find(t => t.id === current)
    if (task) {
      queue.push(...task.dependencies)
    }
  }

  return false
}

/**
 * Get all tasks that are blocked by a given task
 * @param taskId - The ID of the task
 * @param allTasks - All tasks in the system
 * @returns Array of tasks that depend on the given task
 */
export function getDependentTasks(taskId: string, allTasks: Task[]): Task[] {
  return allTasks.filter(task => task.dependencies.includes(taskId))
}

/**
 * Check if a task is blocked (has incomplete dependencies)
 * @param task - The task to check
 * @param allTasks - All tasks in the system
 * @returns true if the task has incomplete dependencies
 */
export function isTaskBlocked(task: Task, allTasks: Task[]): boolean {
  if (task.dependencies.length === 0) return false
  
  return task.dependencies.some(depId => {
    const depTask = allTasks.find(t => t.id === depId)
    return depTask && !depTask.completed
  })
}

/**
 * Get the blocking tasks for a given task
 * @param task - The task to check
 * @param allTasks - All tasks in the system
 * @returns Array of incomplete tasks that are blocking this task
 */
export function getBlockingTasks(task: Task, allTasks: Task[]): Task[] {
  return task.dependencies
    .map(depId => allTasks.find(t => t.id === depId))
    .filter((t): t is Task => t !== undefined && !t.completed)
}

/**
 * Calculate priority score for sorting (higher is more urgent)
 */
export function getPriorityScore(priority: Task['priority']): number {
  const scores = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  }
  return scores[priority || 'medium']
}
