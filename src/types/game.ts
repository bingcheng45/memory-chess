import { ChessPiece } from './chess';

export enum GamePhase {
  CONFIGURATION = 'configuration',
  MEMORIZATION = 'memorization',
  SOLUTION = 'solution',
  RESULT = 'result'
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'grandmaster' | 'custom';

export interface PiecePosition {
  square: string;
  type: string;
  color: 'w' | 'b';
}

export interface GameConfig {
  pieceCount: number;
  memorizeTime: number;
  difficulty: Difficulty;
}

export interface GameState {
  phase: GamePhase;
  config: GameConfig;
  originalPosition: ChessPiece[];
  playerSolution: ChessPiece[];
  startTime?: number;
  endTime?: number;
  accuracy?: number;
  correctPlacements?: number;
  isLoading: boolean;
  error: string | null;
}

export interface GameResult {
  accuracy: number;
  correctPlacements: number;
  totalPieces: number;
  completionTime: number;
  skillRatingChange: number;
}

export type GameHistory = {
  id: string;
  timestamp: number; // Unix timestamp
  pieceCount: number;
  memorizeTime: number;
  accuracy: number;
  correctPlacements: number;
  totalPlacements: number;
  level: number;
  duration: number; // in seconds
  completionTime?: number; // Time to complete the solution phase
  skillRatingChange?: number; // Change in skill rating from this game
  streak?: number; // Current streak at the time of this game
  perfectScore?: boolean; // Whether the user achieved 100% accuracy
};

export const DIFFICULTY_PRESETS: Record<Exclude<Difficulty, 'custom'>, GameConfig> = {
  easy: {
    pieceCount: 2,
    memorizeTime: 10,
    difficulty: 'easy'
  },
  medium: {
    pieceCount: 6,
    memorizeTime: 10,
    difficulty: 'medium'
  },
  hard: {
    pieceCount: 12,
    memorizeTime: 8,
    difficulty: 'hard'
  },
  grandmaster: {
    pieceCount: 20,
    memorizeTime: 5,
    difficulty: 'grandmaster'
  }
}; 