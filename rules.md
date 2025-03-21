# Memory Chess - Coding Standards and Best Practices

This document outlines the coding standards and best practices for the Memory Chess project. Following these guidelines will help maintain code quality, readability, and consistency across the codebase.

## Project Structure

```
memory-chess/
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   │   ├── common/          # Shared components used across features
│   │   ├── features/        # Feature-specific components
│   │   │   ├── game/        # Game-related components
│   │   │   ├── dashboard/   # Dashboard-related components
│   │   │   └── ...
│   │   └── layout/          # Layout components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and helpers
│   │   ├── store/           # State management
│   │   ├── services/        # External services and APIs
│   │   └── utils/           # Utility functions
│   └── types/               # TypeScript type definitions
└── tests/                   # Test files
```

## Design Patterns

### Core Patterns to Use

1. **Observer Pattern**
   - Use Zustand for state management, which implements this pattern
   - Subscribe to state changes only where needed to prevent unnecessary re-renders

2. **Factory Pattern**
   - Create factory functions for complex object creation
   - Example: Use factories for creating game configurations or chess positions

3. **Strategy Pattern**
   - Implement different algorithms that can be selected at runtime
   - Example: Different difficulty level strategies or scoring algorithms

4. **Composite Pattern**
   - Build complex UI components from simpler ones
   - Maintain consistent props and event handling across component hierarchies

5. **Command Pattern**
   - Encapsulate actions as objects
   - Useful for implementing undo/redo functionality in the game

6. **Adapter Pattern**
   - Create adapters for external libraries to maintain a consistent API
   - Example: Wrap chess.js with a consistent interface for our application

7. **Custom Hooks Pattern**
   - Extract reusable logic into custom hooks
   - Follow the "use" prefix naming convention

## Naming Conventions

### Files and Folders

- Use **PascalCase** for React components: `ChessBoard.tsx`, `GameConfig.tsx`
- Use **camelCase** for utility files, hooks, and services: `gameStore.ts`, `useChessBoard.ts`
- Use **kebab-case** for CSS modules: `chess-board.module.css`
- Group related files in descriptive folders

### Variables and Functions

- Use **camelCase** for variables and functions: `pieceCount`, `calculateAccuracy()`
- Use **PascalCase** for types, interfaces, and classes: `GameState`, `ChessPiece`
- Use **UPPER_SNAKE_CASE** for constants: `MAX_PIECE_COUNT`, `DEFAULT_MEMORIZE_TIME`

## Component Structure

### Component Organization

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

// 2. Type definitions
interface Props {
  // ...
}

// 3. Component definition
export default function ComponentName({ prop1, prop2 }: Props) {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Derived state
  const derivedValue = useMemo(() => {
    // ...
  }, [dependencies]);
  
  // 6. Effects
  useEffect(() => {
    // ...
  }, [dependencies]);
  
  // 7. Event handlers
  const handleEvent = () => {
    // ...
  };
  
  // 8. Helper functions
  const helperFunction = () => {
    // ...
  };
  
  // 9. Render
  return (
    // JSX
  );
}
```

## Code Style

### General

- Limit line length to 100 characters
- Use 2 spaces for indentation
- Add trailing commas in multi-line objects and arrays
- Use semicolons at the end of statements
- Use single quotes for strings, except when the string contains single quotes

### TypeScript

- Always define types for props, state, and function parameters/returns
- Use TypeScript's non-null assertion operator (`!`) sparingly
- Prefer interfaces for object types that will be extended
- Use type aliases for unions, intersections, and complex types

### React

- Use functional components with hooks instead of class components
- Extract complex logic into custom hooks
- Keep components focused on a single responsibility
- Use React.memo() for performance optimization when appropriate
- Prefer controlled components over uncontrolled components

### State Management

- Use Zustand for global state management
- Keep state minimal and normalized
- Derive computed values instead of storing them in state
- Use local component state for UI-specific state

## Code Reuse and DRY Principles

### Avoiding Duplication

- Extract repeated logic into reusable functions or hooks
- Create utility functions for common operations
- Use higher-order components or render props for shared component logic
- Implement shared constants for values used in multiple places

### Shared Components

- Create a component when the same UI pattern is used in 3+ places
- Design components with appropriate props for flexibility
- Use composition over inheritance for component relationships
- Document component APIs clearly with JSDoc comments

### Utility Functions

- Place utility functions in appropriate modules based on their purpose
- Export named functions rather than default exports for better discoverability
- Keep utility functions pure when possible (same input always produces same output)
- Test utility functions thoroughly

## Comments and Documentation

### Effective Commenting

- Comment at the function/method level, not line by line
- Focus on explaining "why" rather than "what" the code does
- Use block comments for complex logic sections
- Keep comments up-to-date when code changes

### When to Comment

- Add comments for non-obvious business logic
- Document complex algorithms or calculations
- Explain workarounds or unusual approaches
- Mark areas that need future improvement with TODO comments

### JSDoc Format

```typescript
/**
 * Description of what the function does and why it exists
 *
 * @param {Type} paramName - Description of the parameter
 * @returns {ReturnType} Description of the return value
 * @example
 * // Example usage of the function
 * const result = myFunction('example');
 */
```

## Testing

- Write tests for critical functionality
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies
- Test edge cases and error scenarios

## Performance Considerations

- Memoize expensive calculations with useMemo
- Prevent unnecessary re-renders with useCallback and React.memo
- Optimize images and assets
- Use code splitting for large components
- Implement virtualization for long lists

## Accessibility

- Use semantic HTML elements
- Include proper ARIA attributes
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Test with screen readers

## Git Workflow

- Use descriptive branch names: `feature/chess-board-animation`
- Write meaningful commit messages that explain the "why"
- Keep commits focused on a single change
- Squash commits before merging to main branch
- Use pull requests for code review

## Code Review Checklist

- Does the code follow the project's coding standards?
- Is the code well-tested?
- Is the code efficient and performant?
- Are there any security concerns?
- Is the code accessible?
- Is the code well-documented?
- Does the code handle edge cases and errors?
- Is there any duplicated code that could be refactored?
- Are appropriate design patterns used? 