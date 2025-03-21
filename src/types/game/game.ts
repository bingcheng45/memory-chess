import { PieceSymbol, Square } from 'chess.js';

export interface GameState {
  // Game status
  isPlaying: boolean;
  
  // Game phases
  isMemorizationPhase: boolean;
  isSolutionPhase: boolean;
  
  // Configuration
  pieceCount: number;
  memorizeTime: number;
  
  // Timing
  timeElapsed: number;
  memorizeStartTime?: number;
  solutionStartTime?: number;
  completionTime?: number;
  
  // Progress
  currentLevel: number;
  level?: number;
  skillRating?: number;      // Player's skill rating (ELO-like system)
  streak?: number;           // Current streak of successful games
  
  // Game data
  moves: string[];
  originalPosition?: string; // FEN string of position to memorize
  userPosition?: string;     // FEN string of user's solution
  
  // Results
  accuracy?: number;         // Percentage of correct piece placements
  success?: boolean;         // Whether the user successfully recreated the position
  perfectScore?: boolean;    // Whether the user achieved 100% accuracy
  timeBonusEarned?: number;  // Time bonus earned for quick completion
  
  // Learning
  lastPlayedDate?: string;   // Date of last played game (YYYY-MM-DD)
  dailyChallengeCompleted?: boolean; // Whether the daily challenge has been completed
  weakAreas?: WeakArea[];    // Areas that need improvement
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

export type GameSettings = {
  pieceCount: number;
  memorizeTime: number;
};

export type PiecePosition = {
  type: PieceSymbol;
  color: 'w' | 'b';
  square: Square;
};

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Grandmaster';

export type DailyChallenge = {
  id: string;
  description: string;
  pieceCount: number;
  memorizeTime: number;
  difficulty: Difficulty;
  completed?: boolean;
  accuracy?: number;
};

export enum RecommendationType {
  DAILY_CHALLENGE = 'daily_challenge',
  FOCUSED_PRACTICE = 'focused_practice',
  SKILL_IMPROVEMENT = 'skill_improvement',
  DIFFICULTY_ADJUSTMENT = 'difficulty_adjustment'
}

export type LearningRecommendation = {
  type: RecommendationType;
  description: string;
  pieceCount?: number;
  memorizeTime?: number;
  difficulty?: Difficulty;
};

export type WeakAreaType = 'pieceCount' | 'memorizeTime' | 'pieceType' | 'boardRegion';

export type WeakArea = {
  type: WeakAreaType;
  score: number; // 0-100
  details?: string;
};

export interface GameConfig {
  pieceCount: number;
  memorizeTime: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'grandmaster' | 'custom';
}

export interface GameMove {
  from: string;
  to: string;
  piece: string;
  color: 'w' | 'b';
  timestamp: number;
}

export interface GameResult {
  success: boolean;
  completionTime: number;
  accuracy: number;
  pieceCount: number;
  skillRatingChange?: number;
  streak?: number;
  perfectScore?: boolean;
  timeBonusEarned?: number;
}

export enum GamePhase {
  CONFIGURATION = 'configuration',
  MEMORIZATION = 'memorization',
  SOLUTION = 'solution',
  RESULT = 'result'
}

export interface DifficultyLevel {
  name: string;
  minPieces: number;
  maxPieces: number;
  minTime: number;
  maxTime: number;
  minSkillRating: number;
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    name: 'Easy',
    minPieces: 2,
    maxPieces: 4,
    minTime: 10,
    maxTime: 15,
    minSkillRating: 0
  },
  {
    name: 'Medium',
    minPieces: 6,
    maxPieces: 10,
    minTime: 8,
    maxTime: 12,
    minSkillRating: 1000
  },
  {
    name: 'Hard',
    minPieces: 12,
    maxPieces: 16,
    minTime: 5,
    maxTime: 8,
    minSkillRating: 1500
  },
  {
    name: 'Grandmaster',
    minPieces: 20,
    maxPieces: 32,
    minTime: 3,
    maxTime: 5,
    minSkillRating: 2000
  }
]; 