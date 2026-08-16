# Memory Chess

A web-based memory training application that challenges players to memorize and recreate chess positions. Built with Next.js, TypeScript, and Tailwind CSS.

## Latest Release - v1.2.1

Our latest release keeps the board steady between gameplay phases, improves random positions, and makes game results easier to review. Visit `/changelog` in the app to see the full release history.

### What's New in v1.2.1

- Kept the board in the same place between memorization and placement after helpful player feedback
- Improved random positions after a player reported invalid setups on Reddit
- Added a target-versus-submitted board comparison to the result screen
- Grouped accuracy, replay, and leaderboard actions at the top of the results
- Paused briefly after submission so players can see their locked-in time and final board

## Overview

Memory Chess combines chess knowledge with memory skills, offering a unique and engaging experience for chess enthusiasts and casual players alike. The game helps players improve their visualization abilities and pattern recognition through interactive exercises.

## Features

### Currently Implemented ✅

- Core chess game functionality
  - Interactive chess board with piece movement
  - Game state management using Zustand
  - Dynamic position generation
  - Accurate position comparison
- Game interface
  - Responsive design for mobile and desktop
  - Black and white chess theme
  - Real-time game statistics
  - Accessible keyboard controls
  - Modern UI with elegant color selection buttons
- Memory training features
  - Position memorization with visual timer
  - Interactive position recreation
  - Piece count configuration
  - Randomized piece placement
  - Accuracy calculation with visual feedback
- User experience
  - Smooth animations and transitions
  - Touch gesture support for mobile
  - Keyboard navigation support
  - Adaptive layout for various screen sizes
- Social features
  - Leaderboards
  - Ability to claim your rank

### In Progress 🚧

- Testing and optimization
  - Component unit tests
  - Integration testing
  - Performance optimizations
  - Code documentation

### Planned Features 📋

- Advanced features
  - Daily challenges
  - Achievement system
- Social features
  - Share results
  - Multiplayer mode

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/bingcheng45/memory-chess.git
cd memory-chess
```

2. Install dependencies:

```bash
bun install
```

3. Run the development server:

```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Game feedback worksheet

Game feedback uses the same spreadsheet configured by `GOOGLE_SHEET_ID`. Create a worksheet tab named `Game Feedback` and add these headers to columns A–J:

`Submitted At`, `Rating`, `Feedback`, `Accuracy`, `Correct Pieces`, `Piece Count`, `Difficulty`, `Memorization Time`, `Solution Time`, `App Version`.

### Advertising rollout

The AdSense ownership code is installed, but no ad units are active while the
site is under review. The approval-gated placement design is documented in
[`adsense-layout-plan.md`](./adsense-layout-plan.md).

## Project Roadmap Progress

### Phase 1: Project Setup ✅

- [x] Initialize Next.js project with TypeScript
- [x] Set up ESLint and Prettier
- [x] Configure Git hooks (husky)
- [x] Set up project structure

### Phase 2: Core Game Components ✅

- [x] Create chess board component
- [x] Implement piece movement
- [x] Add game controls
- [x] Create game statistics display
- [x] Add difficulty presets

### Phase 3: Game Logic Implementation ✅

- [x] Implement memory training mechanics
- [x] Add timer system
- [x] Create position validation
- [x] Add game flow control
- [x] Ensure truly random piece placement
- [x] Display pieces correct / total in results

### Phase 4: Game Experience Improvements ✅

- [x] Session tracking for player progress
- [x] Add basic performance metrics
- [x] Improve mobile experience
- [x] Add touch gesture support
- [x] Optimize component rendering
- [x] Add responsive layouts for all screen sizes
- [x] Implement modern, intuitive UI elements
- [x] Create elegant color selection interface

### Phase 5: Social Features ✅

- [x] Create leaderboard system
- [x] Implement "Claim Your Rank" feature
- [x] Add leaderboard entry submission

### Phase 6: Testing and Optimization 🚧

- [ ] Implement comprehensive testing
- [ ] Optimize rendering performance
- [ ] Add code documentation
- [ ] Prepare for deployment

### Phase 7: Additional Features (Optional) 📋

- [ ] Add daily challenges
- [ ] Implement simple achievements
- [ ] Create shareable results
- [ ] Add optional user accounts

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [React DnD](https://react-dnd.github.io/react-dnd/) - Drag and drop functionality

## Game Difficulty Settings

### Beginner

- 3-5 pieces on the board
- 30 seconds memorization time
- Simple piece patterns

### Intermediate

- 6-10 pieces on the board
- 15 seconds memorization time
- More complex patterns

### Advanced

- 11-16 pieces on the board
- 10 seconds memorization time
- Challenging positions

### Expert

- 17+ pieces on the board
- 5 seconds memorization time
- Complex, game-like positions

## Mobile Support

The application is fully responsive and works well on mobile devices:

- Dynamic board sizing based on screen dimensions
- Touch-optimized interactions for piece movement
- Compact UI for smaller screens
- Orientation support for both portrait and landscape
- Special optimizations for devices as small as iPhone SE (320x568px)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
