import { useState, useEffect } from 'react';

/**
 * Category definition with name and color
 */
export interface Category {
  id: string;
  name: string;
  color: string;
}

/**
 * Default categories with their colors
 * Colors are designed to work in both light and dark modes
 */
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', color: '#3b82f6' },      // Blue
  { id: 'personal', name: 'Personal', color: '#8b5cf6' }, // Purple
  { id: 'shopping', name: 'Shopping', color: '#10b981' }, // Green
  { id: 'health', name: 'Health', color: '#ef4444' },   // Red
];

const STORAGE_KEY = 'todo-categories';

/**
 * Custom hook for managing todo categories
 * - Default categories: Work, Personal, Shopping, Health
 * - Supports adding custom categories
 * - Persists to localStorage
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_CATEGORIES;
      }
    }
    return DEFAULT_CATEGORIES;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  // Add a new custom category
  const addCategory = (name: string, color: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    // Check if category already exists
    if (categories.some(c => c.id === id)) {
      return false;
    }
    setCategories(prev => [...prev, { id, name, color }]);
    return true;
  };

  // Remove a category (only custom ones)
  const removeCategory = (id: string) => {
    // Don't allow removing default categories
    if (DEFAULT_CATEGORIES.some(c => c.id === id)) {
      return false;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    return true;
  };

  // Get category by ID
  const getCategory = (id: string): Category | undefined => {
    return categories.find(c => c.id === id);
  };

  // Get color for a category ID
  const getCategoryColor = (id: string): string => {
    const category = categories.find(c => c.id === id);
    return category?.color ?? '#737373'; // Default gray if not found
  };

  // Reset to default categories
  const resetCategories = () => {
    setCategories(DEFAULT_CATEGORIES);
  };

  return {
    categories,
    addCategory,
    removeCategory,
    getCategory,
    getCategoryColor,
    resetCategories,
  };
}
