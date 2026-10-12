export type Difficulty = 'easy' | 'medium' | 'hard' | 'grandmaster' | 'custom';

export interface GameConfig {
  pieceCount: number;
  memorizeTime: number;
  difficulty: Difficulty;
}

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