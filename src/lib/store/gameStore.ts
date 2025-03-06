import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chess } from 'chess.js';
import { GameState, GameHistory } from '@/lib/types/game';

interface GameStore {
  // Game state
  gameState: GameState;
  history: GameHistory[];
  chess: Chess;
  
  // Actions
  startGame: () => void;
  stopGame: () => void;
  makeMove: (move: string) => boolean;
  resetGame: () => void;
  updateScore: (points: number) => void;
  addToHistory: (game: Omit<GameHistory, 'id'>) => void;
  
  // Stats
  getTotalGames: () => number;
  getAverageScore: () => number;
  getHighestLevel: () => number;
  getTotalTimePlayed: () => number;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: {
        isPlaying: false,
        timeElapsed: 0,
        score: 0,
        currentLevel: 1,
      },
      history: [],
      chess: new Chess(),

      startGame: () => {
        const chess = new Chess();
        set({
          chess,
          gameState: {
            ...get().gameState,
            isPlaying: true,
            timeElapsed: 0,
            score: 0,
          },
        });
      },

      stopGame: () => {
        const currentState = get().gameState;
        set({ 
          gameState: { ...currentState, isPlaying: false }
        });
        
        // Add to history
        get().addToHistory({
          date: new Date(),
          score: currentState.score,
          level: currentState.currentLevel,
          duration: currentState.timeElapsed,
        });
      },

      makeMove: (move: string) => {
        try {
          const result = get().chess.move(move);
          return !!result;
        } catch {
          return false;
        }
      },

      resetGame: () => {
        set({
          chess: new Chess(),
          gameState: {
            isPlaying: false,
            timeElapsed: 0,
            score: 0,
            currentLevel: 1,
          },
        });
      },

      updateScore: (points: number) => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            score: state.gameState.score + points,
          },
        }));
      },

      addToHistory: (game) => {
        set((state) => ({
          history: [
            {
              ...game,
              id: crypto.randomUUID(),
            },
            ...state.history,
          ].slice(0, 100), // Keep last 100 games
        }));
      },

      getTotalGames: () => get().history.length,

      getAverageScore: () => {
        const history = get().history;
        if (history.length === 0) return 0;
        return Math.round(
          history.reduce((acc, game) => acc + game.score, 0) / history.length
        );
      },

      getHighestLevel: () => {
        const history = get().history;
        if (history.length === 0) return 1;
        return Math.max(...history.map((game) => game.level));
      },

      getTotalTimePlayed: () => {
        return get().history.reduce((acc, game) => acc + game.duration, 0);
      },
    }),
    {
      name: 'memory-chess-storage',
    }
  )
); 