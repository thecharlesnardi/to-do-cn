import { useState, useEffect, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

/**
 * Priority levels for todos
 */
export type Priority = 'low' | 'medium' | 'high';

/**
 * Todo item type definition
 */
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  isToday?: boolean;
  todayDate?: string;
  category?: string;
  dueDate?: string;
  priority?: Priority;
  parentId?: number;      // Links to parent task (for subtasks)
  subtaskIds?: number[];  // Array of child task IDs
}

const STORAGE_KEY = 'todos-react';

/**
 * Get today's date as YYYY-MM-DD string
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Custom hook for managing todos with localStorage persistence
 * Supports nested subtasks with parent-child relationships
 */
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Todo[] = JSON.parse(saved);
        const today = getToday();
        return parsed.map(todo => {
          if (todo.isToday && todo.todayDate !== today) {
            return { ...todo, isToday: false, todayDate: undefined };
          }
          return todo;
        });
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  interface AddTodoOptions {
    category?: string;
    dueDate?: string;
    priority?: Priority;
  }

  const addTodo = (text: string, options?: AddTodoOptions) => {
    if (!text.trim()) return;

    const newTodo: Todo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      isToday: true,
      todayDate: getToday(),
      ...(options?.category && { category: options.category }),
      ...(options?.dueDate && { dueDate: options.dueDate }),
      ...(options?.priority && { priority: options.priority }),
    };

    setTodos(prev => [...prev, newTodo]);
    return newTodo.id;
  };

  // Add a subtask to a parent todo
  const addSubtask = useCallback((parentId: number, text: string) => {
    if (!text.trim()) return;

    const subtaskId = Date.now();
    const newSubtask: Todo = {
      id: subtaskId,
      text: text.trim(),
      completed: false,
      parentId,
    };

    setTodos(prev => {
      const updated = prev.map(todo => {
        if (todo.id === parentId) {
          return {
            ...todo,
            subtaskIds: [...(todo.subtaskIds || []), subtaskId],
          };
        }
        return todo;
      });
      return [...updated, newSubtask];
    });

    return subtaskId;
  }, []);

  // Toggle a subtask with parent sync
  const toggleSubtask = useCallback((subtaskId: number) => {
    setTodos(prev => {
      const subtask = prev.find(t => t.id === subtaskId);
      if (!subtask || !subtask.parentId) {
        // Not a subtask, use regular toggle
        return prev.map(t => t.id === subtaskId ? { ...t, completed: !t.completed } : t);
      }

      const newCompleted = !subtask.completed;
      let updated = prev.map(t => t.id === subtaskId ? { ...t, completed: newCompleted } : t);

      // Find parent and its subtasks
      const parent = updated.find(t => t.id === subtask.parentId);
      if (parent && parent.subtaskIds) {
        const subtasks = updated.filter(t => parent.subtaskIds?.includes(t.id));

        if (newCompleted) {
          // Subtask completed - check if all subtasks are now complete
          const allComplete = subtasks.every(s => s.completed);
          if (allComplete) {
            updated = updated.map(t => t.id === parent.id ? { ...t, completed: true } : t);
          }
        } else {
          // Subtask unchecked - uncheck parent too
          updated = updated.map(t => t.id === parent.id ? { ...t, completed: false } : t);
        }
      }

      return updated;
    });
  }, []);

  // Delete a subtask
  const deleteSubtask = useCallback((subtaskId: number) => {
    setTodos(prev => {
      const subtask = prev.find(t => t.id === subtaskId);
      if (!subtask || !subtask.parentId) {
        return prev.filter(t => t.id !== subtaskId);
      }

      // Remove from parent's subtaskIds and delete the subtask
      return prev
        .map(t => {
          if (t.id === subtask.parentId && t.subtaskIds) {
            return {
              ...t,
              subtaskIds: t.subtaskIds.filter(id => id !== subtaskId),
            };
          }
          return t;
        })
        .filter(t => t.id !== subtaskId);
    });
  }, []);

  // Get subtasks for a parent todo
  const getSubtasks = useCallback((parentId: number): Todo[] => {
    const parent = todos.find(t => t.id === parentId);
    if (!parent || !parent.subtaskIds) return [];
    return todos.filter(t => parent.subtaskIds?.includes(t.id));
  }, [todos]);

  // Toggle regular todo with subtask sync
  const toggleTodo = useCallback((id: number) => {
    setTodos(prev => {
      const todo = prev.find(t => t.id === id);
      if (!todo) return prev;

      // If it's a subtask, use subtask toggle logic
      if (todo.parentId) {
        const newCompleted = !todo.completed;
        let updated = prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t);

        const parent = updated.find(t => t.id === todo.parentId);
        if (parent && parent.subtaskIds) {
          const subtasks = updated.filter(t => parent.subtaskIds?.includes(t.id));

          if (newCompleted) {
            const allComplete = subtasks.every(s => s.completed);
            if (allComplete) {
              updated = updated.map(t => t.id === parent.id ? { ...t, completed: true } : t);
            }
          } else {
            updated = updated.map(t => t.id === parent.id ? { ...t, completed: false } : t);
          }
        }

        return updated;
      }

      // Regular todo toggle
      const newCompleted = !todo.completed;
      let updated = prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t);

      // If has subtasks, toggle them too
      if (todo.subtaskIds && todo.subtaskIds.length > 0) {
        updated = updated.map(t => {
          if (todo.subtaskIds?.includes(t.id)) {
            return { ...t, completed: newCompleted };
          }
          return t;
        });
      }

      return updated;
    });
  }, []);

  const updateTodo = (id: number, newText: string) => {
    if (!newText.trim()) return;

    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, text: newText.trim() } : todo
      )
    );
  };

  const updateTodoFields = (id: number, fields: Partial<Pick<Todo, 'category' | 'dueDate' | 'priority'>>) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, ...fields } : todo
      )
    );
  };

  // Delete a todo and its subtasks
  const deleteTodo = useCallback((id: number) => {
    setTodos(prev => {
      const todo = prev.find(t => t.id === id);
      if (!todo) return prev;

      // If it's a subtask, use subtask delete
      if (todo.parentId) {
        return prev
          .map(t => {
            if (t.id === todo.parentId && t.subtaskIds) {
              return {
                ...t,
                subtaskIds: t.subtaskIds.filter(sid => sid !== id),
              };
            }
            return t;
          })
          .filter(t => t.id !== id);
      }

      // Delete todo and all its subtasks
      const subtaskIds = todo.subtaskIds || [];
      return prev.filter(t => t.id !== id && !subtaskIds.includes(t.id));
    });
  }, []);

  const reorderTodos = (activeId: number, overId: number) => {
    setTodos(prev => {
      const oldIndex = prev.findIndex(todo => todo.id === activeId);
      const newIndex = prev.findIndex(todo => todo.id === overId);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const toggleToday = (id: number) => {
    const today = getToday();
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id
          ? {
              ...todo,
              isToday: !todo.isToday,
              todayDate: !todo.isToday ? today : undefined,
            }
          : todo
      )
    );
  };

  const clearCompleted = () => {
    setTodos(prev => prev.filter(todo => !todo.completed));
  };

  const clearAllTodos = () => {
    setTodos([]);
  };

  return {
    todos,
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
  };
}
