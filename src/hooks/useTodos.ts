import { useState, useEffect } from 'react';
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
  todayDate?: string; // Track when it was marked for today
  category?: string;  // Category tag (e.g., "work", "personal")
  dueDate?: string;   // ISO date string (YYYY-MM-DD)
  priority?: Priority;
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
 * Provides CRUD operations: add, toggle, update, delete, reorder
 */
export function useTodos() {
  // Initialize from localStorage, clearing old "today" flags
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Todo[] = JSON.parse(saved);
        const today = getToday();
        // Clear isToday flag for items marked on a previous day
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

  // Save to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  /**
   * Options for creating a new todo
   */
  interface AddTodoOptions {
    category?: string;
    dueDate?: string;
    priority?: Priority;
  }

  // Add a new todo with optional category, dueDate, and priority
  const addTodo = (text: string, options?: AddTodoOptions) => {
    if (!text.trim()) return;

    const newTodo: Todo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      ...(options?.category && { category: options.category }),
      ...(options?.dueDate && { dueDate: options.dueDate }),
      ...(options?.priority && { priority: options.priority }),
    };

    setTodos(prev => [...prev, newTodo]);
    return newTodo.id;
  };

  // Toggle completed status
  const toggleTodo = (id: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Update todo text
  const updateTodo = (id: number, newText: string) => {
    if (!newText.trim()) return;

    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, text: newText.trim() } : todo
      )
    );
  };

  // Update todo fields (category, dueDate, priority)
  const updateTodoFields = (id: number, fields: Partial<Pick<Todo, 'category' | 'dueDate' | 'priority'>>) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, ...fields } : todo
      )
    );
  };

  // Delete a todo
  const deleteTodo = (id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  // Reorder todos (for drag and drop)
  const reorderTodos = (activeId: number, overId: number) => {
    setTodos(prev => {
      const oldIndex = prev.findIndex(todo => todo.id === activeId);
      const newIndex = prev.findIndex(todo => todo.id === overId);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  // Toggle "today" flag for a todo
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

  // Clear all completed todos
  const clearCompleted = () => {
    setTodos(prev => prev.filter(todo => !todo.completed));
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
  };
}
