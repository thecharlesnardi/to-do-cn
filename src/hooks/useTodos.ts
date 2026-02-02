import { useState, useEffect, useCallback } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { supabase } from '../lib/supabase'
import type { Todo as DbTodo } from '../lib/database.types'

/**
 * Priority levels for todos
 */
export type Priority = 'low' | 'medium' | 'high'

/**
 * Todo item type (matches the old interface for compatibility)
 */
export interface Todo {
  id: number
  text: string
  completed: boolean
  isToday?: boolean
  todayDate?: string
  category?: string
  dueDate?: string
  priority?: Priority
  parentId?: number
  subtaskIds?: number[]
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Convert database todo to app todo format
 */
function dbToAppTodo(dbTodo: DbTodo, subtaskIds: number[] = []): Todo {
  return {
    id: dbTodo.id,
    text: dbTodo.text,
    completed: dbTodo.completed,
    isToday: dbTodo.is_today,
    todayDate: dbTodo.today_date ?? undefined,
    category: dbTodo.category ?? undefined,
    dueDate: dbTodo.due_date ?? undefined,
    priority: dbTodo.priority ?? undefined,
    parentId: dbTodo.parent_id ?? undefined,
    subtaskIds: subtaskIds.length > 0 ? subtaskIds : undefined,
  }
}

/**
 * Custom hook for managing todos with Supabase persistence
 * Supports nested subtasks with parent-child relationships
 */
export function useTodos(userId: string | undefined) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch todos from Supabase
  const fetchTodos = useCallback(async () => {
    if (!userId) {
      setTodos([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true })

      if (fetchError) throw fetchError

      const today = getToday()

      // Build subtask relationships and convert to app format
      const todosMap = new Map<number, Todo>()
      const parentToChildren = new Map<number, number[]>()

      // First pass: collect parent-child relationships
      for (const dbTodo of data || []) {
        if (dbTodo.parent_id) {
          const children = parentToChildren.get(dbTodo.parent_id) || []
          children.push(dbTodo.id)
          parentToChildren.set(dbTodo.parent_id, children)
        }
      }

      // Second pass: convert todos with subtask IDs
      for (const dbTodo of data || []) {
        const subtaskIds = parentToChildren.get(dbTodo.id) || []
        let appTodo = dbToAppTodo(dbTodo, subtaskIds)

        // Reset "today" status if it's a new day
        if (appTodo.isToday && appTodo.todayDate !== today) {
          appTodo = { ...appTodo, isToday: false, todayDate: undefined }
          // Update in database (fire and forget with error logging)
          supabase
            .from('todos')
            .update({ is_today: false, today_date: null })
            .eq('id', dbTodo.id)
            .then(() => {})
            .catch(err => console.error('Failed to reset today status:', err))
        }

        todosMap.set(dbTodo.id, appTodo)
      }

      setTodos(Array.from(todosMap.values()))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch todos')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Load todos on mount and when userId changes
  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  interface AddTodoOptions {
    category?: string
    dueDate?: string
    priority?: Priority
  }

  const addTodo = async (text: string, options?: AddTodoOptions) => {
    if (!text.trim() || !userId) return

    const today = getToday()

    try {
      const { data, error: insertError } = await supabase
        .from('todos')
        .insert({
          user_id: userId,
          text: text.trim(),
          completed: false,
          is_today: true,
          today_date: today,
          category: options?.category || null,
          due_date: options?.dueDate || null,
          priority: options?.priority || null,
          position: todos.length,
        })
        .select()
        .single()

      if (insertError) throw insertError

      const newTodo = dbToAppTodo(data)
      setTodos(prev => [...prev, newTodo])
      return newTodo.id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add todo')
    }
  }

  // Add a subtask to a parent todo
  const addSubtask = useCallback(async (parentId: number, text: string) => {
    if (!text.trim() || !userId) return

    try {
      const { data, error: insertError } = await supabase
        .from('todos')
        .insert({
          user_id: userId,
          text: text.trim(),
          completed: false,
          parent_id: parentId,
          position: 0,
        })
        .select()
        .single()

      if (insertError) throw insertError

      const newSubtask = dbToAppTodo(data)

      setTodos(prev => {
        const updated = prev.map(todo => {
          if (todo.id === parentId) {
            return {
              ...todo,
              subtaskIds: [...(todo.subtaskIds || []), newSubtask.id],
            }
          }
          return todo
        })
        return [...updated, newSubtask]
      })

      return newSubtask.id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subtask')
    }
  }, [userId, todos])

  // Toggle a subtask with parent sync
  const toggleSubtask = useCallback(async (subtaskId: number) => {
    const subtask = todos.find(t => t.id === subtaskId)
    if (!subtask || !subtask.parentId) {
      // Not a subtask, use regular toggle
      await toggleTodo(subtaskId)
      return
    }

    const newCompleted = !subtask.completed

    // Optimistic update
    setTodos(prev => {
      let updated = prev.map(t => t.id === subtaskId ? { ...t, completed: newCompleted } : t)

      const parent = updated.find(t => t.id === subtask.parentId)
      if (parent && parent.subtaskIds) {
        const subtasks = updated.filter(t => parent.subtaskIds?.includes(t.id))

        if (newCompleted) {
          const allComplete = subtasks.every(s => s.completed)
          if (allComplete) {
            updated = updated.map(t => t.id === parent.id ? { ...t, completed: true } : t)
          }
        } else {
          updated = updated.map(t => t.id === parent.id ? { ...t, completed: false } : t)
        }
      }

      return updated
    })

    // Sync to database
    try {
      await supabase.from('todos').update({ completed: newCompleted }).eq('id', subtaskId)

      // Check if we need to update parent
      const parent = todos.find(t => t.id === subtask.parentId)
      if (parent && parent.subtaskIds) {
        const subtasks = todos.filter(t => parent.subtaskIds?.includes(t.id))
        const otherSubtasksComplete = subtasks.filter(s => s.id !== subtaskId).every(s => s.completed)

        if (newCompleted && otherSubtasksComplete) {
          await supabase.from('todos').update({ completed: true }).eq('id', parent.id)
        } else if (!newCompleted) {
          await supabase.from('todos').update({ completed: false }).eq('id', parent.id)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle subtask')
      fetchTodos() // Revert on error
    }
  }, [todos, fetchTodos])

  // Delete a subtask
  const deleteSubtask = useCallback(async (subtaskId: number) => {
    const subtask = todos.find(t => t.id === subtaskId)

    // Optimistic update
    setTodos(prev => {
      if (!subtask || !subtask.parentId) {
        return prev.filter(t => t.id !== subtaskId)
      }
      return prev
        .map(t => {
          if (t.id === subtask.parentId && t.subtaskIds) {
            return {
              ...t,
              subtaskIds: t.subtaskIds.filter(id => id !== subtaskId),
            }
          }
          return t
        })
        .filter(t => t.id !== subtaskId)
    })

    // Sync to database
    try {
      await supabase.from('todos').delete().eq('id', subtaskId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subtask')
      fetchTodos()
    }
  }, [todos, fetchTodos])

  // Get subtasks for a parent todo
  const getSubtasks = useCallback((parentId: number): Todo[] => {
    const parent = todos.find(t => t.id === parentId)
    if (!parent || !parent.subtaskIds) return []
    // Return subtasks in the order defined by subtaskIds
    return parent.subtaskIds
      .map(id => todos.find(t => t.id === id))
      .filter((t): t is Todo => t !== undefined)
  }, [todos])

  // Reorder subtasks within a parent
  const reorderSubtasks = useCallback(async (parentId: number, activeId: number, overId: number) => {
    const parent = todos.find(t => t.id === parentId)
    if (!parent || !parent.subtaskIds) return

    const oldIndex = parent.subtaskIds.indexOf(activeId)
    const newIndex = parent.subtaskIds.indexOf(overId)
    if (oldIndex === -1 || newIndex === -1) return

    const reorderedIds = arrayMove(parent.subtaskIds, oldIndex, newIndex)

    // Optimistic update
    setTodos(prev =>
      prev.map(t =>
        t.id === parentId ? { ...t, subtaskIds: reorderedIds } : t
      )
    )

    // Update positions in database
    try {
      await Promise.all(
        reorderedIds.map((id, index) =>
          supabase.from('todos').update({ position: index }).eq('id', id)
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder subtasks')
      fetchTodos()
    }
  }, [todos, fetchTodos])

  // Toggle regular todo with subtask sync
  const toggleTodo = useCallback(async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    // If it's a subtask, delegate to subtask toggle
    if (todo.parentId) {
      await toggleSubtask(id)
      return
    }

    const newCompleted = !todo.completed

    // Optimistic update
    setTodos(prev => {
      let updated = prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t)

      // If has subtasks, toggle them too
      if (todo.subtaskIds && todo.subtaskIds.length > 0) {
        updated = updated.map(t => {
          if (todo.subtaskIds?.includes(t.id)) {
            return { ...t, completed: newCompleted }
          }
          return t
        })
      }

      return updated
    })

    // Sync to database
    try {
      await supabase.from('todos').update({ completed: newCompleted }).eq('id', id)

      // Update subtasks too
      if (todo.subtaskIds && todo.subtaskIds.length > 0) {
        await supabase
          .from('todos')
          .update({ completed: newCompleted })
          .in('id', todo.subtaskIds)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle todo')
      fetchTodos()
    }
  }, [todos, fetchTodos, toggleSubtask])

  const updateTodo = async (id: number, newText: string) => {
    if (!newText.trim()) return

    // Optimistic update
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, text: newText.trim() } : todo
      )
    )

    try {
      await supabase.from('todos').update({ text: newText.trim() }).eq('id', id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo')
      fetchTodos()
    }
  }

  const updateTodoFields = async (id: number, fields: Partial<Pick<Todo, 'category' | 'dueDate' | 'priority'>>) => {
    // Optimistic update
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, ...fields } : todo
      )
    )

    try {
      await supabase.from('todos').update({
        category: fields.category ?? null,
        due_date: fields.dueDate ?? null,
        priority: fields.priority ?? null,
      }).eq('id', id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo')
      fetchTodos()
    }
  }

  // Delete a todo and its subtasks
  const deleteTodo = useCallback(async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    // If it's a subtask, use subtask delete
    if (todo.parentId) {
      await deleteSubtask(id)
      return
    }

    // Optimistic update: delete todo and all its subtasks
    const subtaskIds = todo.subtaskIds || []
    setTodos(prev => prev.filter(t => t.id !== id && !subtaskIds.includes(t.id)))

    try {
      // Delete subtasks first (they have FK constraint)
      if (subtaskIds.length > 0) {
        await supabase.from('todos').delete().in('id', subtaskIds)
      }
      await supabase.from('todos').delete().eq('id', id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo')
      fetchTodos()
    }
  }, [todos, fetchTodos, deleteSubtask])

  const reorderTodos = async (activeId: number, overId: number) => {
    const oldIndex = todos.findIndex(todo => todo.id === activeId)
    const newIndex = todos.findIndex(todo => todo.id === overId)
    const reordered = arrayMove(todos, oldIndex, newIndex)

    // Optimistic update
    setTodos(reordered)

    // Update positions in database
    try {
      const updates = reordered.map((todo, index) => ({
        id: todo.id,
        position: index,
      }))

      // Update positions in parallel for better performance
      await Promise.all(
        updates.map(update =>
          supabase.from('todos').update({ position: update.position }).eq('id', update.id)
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder todos')
      fetchTodos()
    }
  }

  const toggleToday = async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    const today = getToday()
    const newIsToday = !todo.isToday

    // Optimistic update
    setTodos(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, isToday: newIsToday, todayDate: newIsToday ? today : undefined }
          : t
      )
    )

    try {
      await supabase.from('todos').update({
        is_today: newIsToday,
        today_date: newIsToday ? today : null,
      }).eq('id', id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle today status')
      fetchTodos()
    }
  }

  const clearCompleted = async () => {
    const completedIds = todos.filter(t => t.completed).map(t => t.id)
    if (completedIds.length === 0) return

    // Optimistic update
    setTodos(prev => prev.filter(todo => !todo.completed))

    try {
      await supabase.from('todos').delete().in('id', completedIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear completed')
      fetchTodos()
    }
  }

  const clearAllTodos = async () => {
    if (!userId) return

    // Optimistic update
    setTodos([])

    try {
      await supabase.from('todos').delete().eq('user_id', userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear all todos')
      fetchTodos()
    }
  }

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    updateTodo,
    updateTodoFields,
    deleteTodo,
    reorderTodos,
    toggleToday,
    clearCompleted,
    clearAllTodos,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    getSubtasks,
    reorderSubtasks,
    refetch: fetchTodos,
  }
}
