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
  
  // Game data
  moves: string[];
  originalPosition?: string; // FEN string of position to memorize
  userPosition?: string;     // FEN string of user's solution
  
  // Results
  accuracy?: number;         // Percentage of correct piece placements
  success?: boolean;         // Whether the user successfully recreated the position
}

export interface GameHistory {
  id: string;
  date: Date;
  completionTime: number;    // Time taken to complete the solution in seconds
  accuracy: number;          // Percentage of correct piece placements
  pieceCount: number;        // Number of pieces in the position
  memorizeTime: number;      // Time given for memorization in seconds
  level: number;             // Difficulty level
}

export interface GameConfig {
  pieceCount: number;
  memorizeTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
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
}

export enum GamePhase {
  CONFIGURATION = 'configuration',
  MEMORIZATION = 'memorization',
  SOLUTION = 'solution',
  RESULT = 'result'
} 