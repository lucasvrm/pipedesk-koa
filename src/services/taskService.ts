import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Task } from '@/lib/types';
import { TaskDB } from '@/lib/databaseTypes';

// ============================================================================
// Types
// ============================================================================

export interface TaskInput {
    playerTrackId: string;
    title: string;
    description?: string;
    assignees: string[];
    dueDate?: string;
    isMilestone?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'todo' | 'in_progress' | 'blocked' | 'completed';
    dependencies?: string[];
}

export interface TaskUpdate {
    title?: string;
    description?: string;
    assignees?: string[];
    dueDate?: string;
    completed?: boolean;
    dependencies?: string[];
    isMilestone?: boolean;
    position?: number;
    status?: 'todo' | 'in_progress' | 'blocked' | 'completed';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// ============================================================================
// Helpers
// ============================================================================

function mapTaskFromDB(item: TaskDB): Task {
    return {
        id: item.id,
        playerTrackId: item.player_track_id,
        title: item.title,
        description: item.description || '',
        assignees: item.assignees || [],
        dueDate: item.due_date || undefined,
        completed: item.completed,
        dependencies: item.dependencies || [],
        isMilestone: item.is_milestone,
        position: item.position,
        status: (item.status as any) || 'todo',
        priority: (item.priority as any) || 'medium',
        createdAt: item.created_at,
        updatedAt: item.updated_at,
    };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Fetch all tasks
 */
export async function getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });

    if (error) throw error;

    return (data || []).map(mapTaskFromDB);
}

/**
 * Fetch tasks for a specific track
 */
export async function getTasksByTrack(trackId: string): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('player_track_id', trackId)
        .order('position', { ascending: true });

    if (error) throw error;

    return (data || []).map(mapTaskFromDB);
}

/**
 * Get a single task
 */
export async function getTask(taskId: string): Promise<Task> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (error) throw error;

    return mapTaskFromDB(data);
}

/**
 * Create a new task
 */
export async function createTask(task: TaskInput): Promise<Task> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
        .from('tasks') as any)
        .insert({
            player_track_id: task.playerTrackId,
            title: task.title,
            description: task.description,
            assignees: task.assignees,
            due_date: task.dueDate,
            is_milestone: task.isMilestone || false,
            priority: task.priority || 'medium',
            status: task.status || 'todo',
            completed: false,
            position: 0, // Default position, should be calculated if needed
            dependencies: task.dependencies || [],
        })
        .select()
        .single();

    if (error) throw error;

    return mapTaskFromDB(data);
}

/**
 * Update a task
 */
export async function updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.assignees !== undefined) updateData.assignees = updates.assignees;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.dependencies !== undefined) updateData.dependencies = updates.dependencies;
    if (updates.isMilestone !== undefined) updateData.is_milestone = updates.isMilestone;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
        .from('tasks') as any)
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

    if (error) throw error;

    return mapTaskFromDB(data);
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) throw error;
}

// ============================================================================
// React Query Hooks
// ============================================================================

export function useTasks(trackId?: string) {
    return useQuery({
        queryKey: ['tasks', trackId],
        queryFn: () => (trackId ? getTasksByTrack(trackId) : getTasks()),
    });
}

export function useTask(taskId: string | null) {
    return useQuery({
        queryKey: ['tasks', 'detail', taskId],
        queryFn: () => getTask(taskId!),
        enabled: !!taskId,
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createTask,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasks', data.playerTrackId] });
        },
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, updates }: { taskId: string; updates: TaskUpdate }) =>
            updateTask(taskId, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasks', data.playerTrackId] });
            queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', data.id] });
        },
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}
