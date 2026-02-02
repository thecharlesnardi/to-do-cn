# Todo App - Project Context

## What This Is
A personal todo app built with React + TypeScript + Vite. Shared with family/friends via Netlify.

## Tech Stack
- **React 18** with TypeScript
- **Vite** for dev server and builds
- **Tailwind CSS** for styling
- **@phosphor-icons/react** for icons
- **@dnd-kit** for drag-and-drop reordering

## Features
- Add, complete, delete todos
- Dark/light mode toggle (persisted)
- Drag-and-drop reordering
- Local storage persistence (each device has its own todos)
- Custom "ember" (amber) and "void" (gray) color theme

## Deployment
- **GitHub**: https://github.com/thecharlesnardi/to-do-cn
- **Netlify**: Auto-deploys from GitHub on push
- **Workflow**: Make changes → commit → `git push` → live in ~30 seconds

## Key Files
- `src/App.tsx` - Main app component
- `src/components/TodoInput.tsx` - Input field for adding todos
- `src/components/TodoItem.tsx` - Individual todo item
- `src/hooks/useTodos.ts` - Todo state management + localStorage
- `src/hooks/useTheme.ts` - Dark/light mode logic

## Design Decisions
- Removed focus glow on input (was too harsh) - now just border color change
- Using localStorage so each user gets their own private todo list

## Future Feature Ideas
<!-- Add ideas here as they come up -->
- [ ] (Add your feature ideas!)

## Commands
```bash
npm run dev    # Start dev server at localhost:5173
npm run build  # Build for production
git push       # Deploy to Netlify (auto)
```
