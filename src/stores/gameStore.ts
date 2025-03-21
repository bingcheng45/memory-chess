import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChessPiece } from '../types/chess';
import { Difficulty, GamePhase, GameState, DIFFICULTY_PRESETS } from '../types/game';
import { generateRandomPosition } from '../utils/positionGenerator';
import { comparePositions } from '../utils/positionComparator';

interface GameActions {
  // Configuration actions
  setDifficulty: (difficulty: Difficulty) => void;
  setPieceCount: (count: number) => void;
  setMemorizeTime: (seconds: number) => void;
  
  // Game flow actions
  startGame: () => void;
  endMemorization: () => void;
  submitSolution: () => void;
  resetGame: () => void;
  
  // Piece manipulation actions
  placePiece: (piece: ChessPiece) => void;
  removePiece: (position: { file: number; rank: number }) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

const initialState: GameState = {
  phase: GamePhase.CONFIGURATION,
  config: {
    pieceCount: 6,
    memorizeTime: 10,
    difficulty: 'medium'
  },
  originalPosition: [],
  playerSolution: [],
  isLoading: false,
  error: null
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Configuration actions
      setDifficulty: (difficulty) => {
        if (difficulty === 'custom') {
          set({ config: { ...get().config, difficulty } });
        } else {
          set({ config: DIFFICULTY_PRESETS[difficulty] });
        }
      },
      
      setPieceCount: (count) => {
        const validCount = Math.max(2, Math.min(32, count));
        set({ 
          config: { 
            ...get().config, 
            pieceCount: validCount,
            difficulty: 'custom'
          } 
        });
      },
      
      setMemorizeTime: (seconds) => {
        const validTime = Math.max(1, Math.min(30, seconds));
        set({ 
          config: { 
            ...get().config, 
            memorizeTime: validTime,
            difficulty: 'custom'
          } 
        });
      },
      
      // Game flow actions
      startGame: () => {
        try {
          set({ isLoading: true, error: null });
          
          const { pieceCount } = get().config;
          const originalPosition = generateRandomPosition(pieceCount);
          
          set({
            phase: GamePhase.MEMORIZATION,
            originalPosition,
            playerSolution: [],
            startTime: Date.now(),
            isLoading: false
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to start game',
            isLoading: false
          });
        }
      },
      
      endMemorization: () => {
        set({
          phase: GamePhase.SOLUTION,
          playerSolution: []
        });
      },
      
      submitSolution: () => {
        const { originalPosition, playerSolution } = get();
        const result = comparePositions(originalPosition, playerSolution);
        
        set({
          phase: GamePhase.RESULT,
          endTime: Date.now(),
          accuracy: result.accuracy,
          correctPlacements: result.correctPlacements.length
        });
      },
      
      resetGame: () => {
        set({
          ...initialState,
          config: get().config // Preserve the current configuration
        });
      },
      
      // Piece manipulation actions
      placePiece: (piece) => {
        const { playerSolution } = get();
        
        // Check if there's already a piece at this position
        const existingPieceIndex = playerSolution.findIndex(
          p => p.position.file === piece.position.file && p.position.rank === piece.position.rank
        );
        
        if (existingPieceIndex !== -1) {
          // Replace the existing piece
          const updatedSolution = [...playerSolution];
          updatedSolution[existingPieceIndex] = piece;
          set({ playerSolution: updatedSolution });
        } else {
          // Add a new piece
          set({ playerSolution: [...playerSolution, piece] });
        }
      },
      
      removePiece: (position) => {
        const { playerSolution } = get();
        
        const updatedSolution = playerSolution.filter(
          p => p.position.file !== position.file || p.position.rank !== position.rank
        );
        
        set({ playerSolution: updatedSolution });
      },
      
      // Error handling
      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading })
    }),
    {
      name: 'memory-chess-game-state'
    }
  )
); 