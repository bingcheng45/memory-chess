import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chess } from 'chess.js';
import { GameState, GameHistory } from '@/lib/types/game';

interface GameStore {
  // Game state
  gameState: GameState;
  history: GameHistory[];
  chess: Chess | null;
  
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

// Initial game state
const initialGameState: GameState = {
  isPlaying: false,
  timeElapsed: 0,
  elapsedTime: 0,
  score: 0,
  currentLevel: 1,
  level: 1,
  moves: [],
};

// Initialize a chess instance outside the store to ensure it's created correctly
let initialChess: Chess | null = null;
try {
  initialChess = new Chess();
} catch (error) {
  console.error('Failed to initialize Chess:', error);
}

// Define a type for chess.js move objects
interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: initialGameState,
      history: [],
      chess: initialChess,

      startGame: () => {
        let newChess: Chess | null = null;
        try {
          newChess = new Chess();
          console.log('Chess instance created successfully');
        } catch (error) {
          console.error('Failed to create Chess instance in startGame:', error);
        }
        
        set({
          chess: newChess,
          gameState: {
            ...initialGameState,
            isPlaying: true,
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
          level: currentState.level || currentState.currentLevel || 1,
          duration: currentState.elapsedTime || currentState.timeElapsed || 0,
        });
      },

      makeMove: (move: string) => {
        const chess = get().chess;
        if (!chess) {
          console.error('Chess object is null in makeMove');
          return false;
        }
        
        try {
          // Check if the move is in the standard algebraic notation (e.g., "e2e4")
          // If so, convert it to an object format that chess.js can understand
          let moveObj: string | ChessMove;
          if (move.length === 4) {
            moveObj = {
              from: move.substring(0, 2),
              to: move.substring(2, 4),
            };
          } else {
            moveObj = move;
          }
          
          // Try to make the move directly
          const result = chess.move(moveObj);
          
          if (result) {
            // Move was successful
            set((state) => ({
              gameState: {
                ...state.gameState,
                moves: [
                  ...(state.gameState.moves || []), 
                  typeof moveObj === 'string' ? moveObj : `${moveObj.from}${moveObj.to}`
                ],
                // Update score based on move
                score: state.gameState.score + 10,
              },
            }));
            return true;
          } else {
            console.log(`Move failed: ${JSON.stringify(moveObj)}`);
            return false;
          }
        } catch (error) {
          console.error('Invalid move:', error);
          return false;
        }
      },

      resetGame: () => {
        let newChess: Chess | null = null;
        try {
          newChess = new Chess();
        } catch (error) {
          console.error('Failed to create Chess instance in resetGame:', error);
        }
        
        set({
          chess: newChess,
          gameState: { ...initialGameState },
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
      partialize: (state) => ({
        // Don't persist the chess object as it can't be serialized properly
        gameState: state.gameState,
        history: state.history,
      }),
    }
  )
); 