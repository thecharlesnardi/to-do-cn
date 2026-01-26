import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from '@phosphor-icons/react';

interface TodoInputProps {
  onAdd: (text: string) => void;
  isDark: boolean;
}

/**
 * Input form for adding new todos
 * Features glow effect on focus in dark mode
 */
export function TodoInput({ onAdd, isDark }: TodoInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
        className={`
          flex-1 px-4 py-3 rounded-lg
          text-base
          transition-all duration-200
          outline-none
          ${isDark
            ? 'bg-void-800 border border-void-600 text-void-100 placeholder:text-void-500 focus:border-ember-500'
            : 'bg-white border border-void-200 text-void-900 placeholder:text-void-400 focus:border-ember-600'
          }
        `}
      />
      <button
        type="submit"
        className={`
          flex items-center justify-center gap-2
          px-5 py-3 rounded-lg
          font-medium text-base
          transition-all duration-200
          cursor-pointer
          ${isDark
            ? 'bg-ember-500 text-void-950 hover:bg-ember-400 hover:shadow-[0_0_16px_rgba(245,158,11,0.3)]'
            : 'bg-ember-600 text-white hover:bg-ember-500'
          }
        `}
      >
        <Plus size={20} weight="bold" />
        <span>Add</span>
      </button>
    </form>
  );
}
