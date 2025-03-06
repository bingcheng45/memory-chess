export interface GameState {
  isPlaying: boolean;
  timeElapsed: number;
  score: number;
  currentLevel: number;
  moves?: string[];
  elapsedTime?: number;
  level?: number;
}

export interface GameHistory {
  id: string;
  date: Date;
  score: number;
  level: number;
  duration: number;
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
  score: number;
  timeElapsed: number;
  accuracy: number;
} 