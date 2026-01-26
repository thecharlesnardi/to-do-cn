import { useState, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

/**
 * Todo item type definition
 */
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const STORAGE_KEY = 'todos-react';

/**
 * Custom hook for managing todos with localStorage persistence
 * Provides CRUD operations: add, toggle, update, delete, reorder
 */
export function useTodos() {
  // Initialize from localStorage
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
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

  // Add a new todo
  const addTodo = (text: string) => {
    if (!text.trim()) return;

    const newTodo: Todo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
    };

    setTodos(prev => [...prev, newTodo]);
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

  return {
    todos,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    reorderTodos,
  };
}
