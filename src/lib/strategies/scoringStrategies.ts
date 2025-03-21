/**
 * Scoring Strategies
 * 
 * Implements the Strategy pattern for different scoring algorithms.
 * This allows for flexible scoring based on difficulty, game mode, or other factors.
 */

import { GameHistory } from '@/types/game';

/**
 * Interface for scoring strategies
 */
export interface ScoringStrategy {
  /**
   * Calculate the score for a game
   * 
   * @param accuracy - Percentage of correct piece placements (0-100)
   * @param pieceCount - Number of pieces in the game
   * @param completionTime - Time taken to complete the solution in seconds
   * @param memorizeTime - Time allowed for memorization in seconds
   * @returns Score object with points and details
   */
  calculateScore(
    accuracy: number,
    pieceCount: number,
    completionTime: number,
    memorizeTime: number
  ): ScoreResult;
  
  /**
   * Calculate skill rating change based on performance
   * 
   * @param currentRating - Current skill rating
   * @param accuracy - Percentage of correct piece placements (0-100)
   * @param pieceCount - Number of pieces in the game
   * @param completionTime - Time taken to complete the solution in seconds
   * @returns Change in skill rating (positive or negative)
   */
  calculateRatingChange(
    currentRating: number,
    accuracy: number,
    pieceCount: number,
    completionTime: number
  ): number;
}

/**
 * Result of score calculation
 */
export interface ScoreResult {
  /** Total score points */
  points: number;
  
  /** Base score from accuracy */
  baseScore: number;
  
  /** Bonus points from time */
  timeBonus: number;
  
  /** Bonus points from difficulty */
  difficultyBonus: number;
  
  /** Whether this is a perfect score */
  isPerfect: boolean;
}

/**
 * Standard scoring strategy
 * 
 * Base score is calculated from accuracy, with bonuses for:
 * - Fast completion time
 * - Higher piece count
 */
export class StandardScoringStrategy implements ScoringStrategy {
  /**
   * Calculate the score for a game
   */
  calculateScore(
    accuracy: number,
    pieceCount: number,
    completionTime: number,
    memorizeTime: number
  ): ScoreResult {
    // Base score from accuracy (0-1000 points)
    const baseScore = Math.round(accuracy * 10);
    
    // Time bonus: faster completion relative to memorize time = more points
    // Maximum time bonus is 500 points (for completing in half the memorize time or less)
    const timeRatio = Math.min(1, completionTime / (memorizeTime * 2));
    const timeBonus = Math.round((1 - timeRatio) * 500);
    
    // Difficulty bonus based on piece count (0-500 points)
    // More pieces = more points
    const difficultyBonus = Math.min(500, pieceCount * 20);
    
    // Total score
    const points = baseScore + timeBonus + difficultyBonus;
    
    // Perfect score if 100% accuracy
    const isPerfect = accuracy === 100;
    
    return {
      points,
      baseScore,
      timeBonus,
      difficultyBonus,
      isPerfect
    };
  }
  
  /**
   * Calculate skill rating change based on performance
   */
  calculateRatingChange(
    currentRating: number,
    accuracy: number,
    pieceCount: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    completionTime: number
  ): number {
    // Base rating change depends on accuracy
    // 100% accuracy = +25 points
    // 0% accuracy = -25 points
    const baseChange = (accuracy / 100) * 50 - 25;
    
    // Difficulty modifier: higher piece count = more rating change
    const difficultyModifier = Math.sqrt(pieceCount) / 2;
    
    // Calculate the final rating change
    let ratingChange = baseChange * difficultyModifier;
    
    // Apply a scaling factor based on current rating
    // Higher rated players gain/lose points more slowly
    const scalingFactor = Math.max(0.5, Math.min(1.5, 1500 / currentRating));
    ratingChange *= scalingFactor;
    
    // Time bonus: faster completion = more points (not used in standard mode)
    // We could use completionTime here if needed
    
    return Math.round(ratingChange);
  }
}

/**
 * Competitive scoring strategy with stricter requirements
 * 
 * Emphasizes accuracy and speed more heavily than the standard strategy
 */
export class CompetitiveScoringStrategy implements ScoringStrategy {
  /**
   * Calculate the score for a game
   */
  calculateScore(
    accuracy: number,
    pieceCount: number,
    completionTime: number,
    memorizeTime: number
  ): ScoreResult {
    // Base score from accuracy (0-1500 points)
    // Competitive mode emphasizes accuracy more
    const baseScore = Math.round(accuracy * 15);
    
    // Time bonus: faster completion = more points
    // Maximum time bonus is 1000 points (for completing very quickly)
    const expectedTime = memorizeTime * 1.5;
    const timeRatio = Math.min(1, completionTime / expectedTime);
    const timeBonus = Math.round((1 - timeRatio) * 1000);
    
    // Difficulty bonus based on piece count (0-1000 points)
    const difficultyBonus = Math.min(1000, pieceCount * 40);
    
    // Total score
    const points = baseScore + timeBonus + difficultyBonus;
    
    // Perfect score if 100% accuracy
    const isPerfect = accuracy === 100;
    
    return {
      points,
      baseScore,
      timeBonus,
      difficultyBonus,
      isPerfect
    };
  }
  
  /**
   * Calculate skill rating change based on performance
   */
  calculateRatingChange(
    currentRating: number,
    accuracy: number,
    pieceCount: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    completionTime: number
  ): number {
    // Competitive mode has larger rating swings
    // 100% accuracy = +40 points
    // 0% accuracy = -40 points
    const baseChange = (accuracy / 100) * 80 - 40;
    
    // Difficulty modifier: higher piece count = more rating change
    const difficultyModifier = Math.sqrt(pieceCount) / 1.5;
    
    // Time bonus: faster completion = more points (not used in competitive mode)
    // We could use completionTime here if needed
    
    // Calculate the final rating change
    let ratingChange = baseChange * difficultyModifier;
    
    // Apply a scaling factor based on current rating
    // Higher rated players gain/lose points more slowly
    const scalingFactor = Math.max(0.5, Math.min(1.5, 2000 / currentRating));
    ratingChange *= scalingFactor;
    
    return Math.round(ratingChange);
  }
}

/**
 * Beginner-friendly scoring strategy
 * 
 * More forgiving with mistakes and emphasizes learning
 */
export class BeginnerScoringStrategy implements ScoringStrategy {
  /**
   * Calculate the score for a game
   */
  calculateScore(
    accuracy: number,
    pieceCount: number,
    completionTime: number,
    memorizeTime: number
  ): ScoreResult {
    // Base score from accuracy (0-800 points)
    // More forgiving curve for beginners
    const baseScore = Math.round(Math.pow(accuracy / 100, 0.8) * 800);
    
    // Time bonus: no pressure on time for beginners
    // Small bonus for quick completion
    const timeBonus = Math.round(Math.max(0, (memorizeTime - completionTime) * 5));
    
    // Difficulty bonus based on piece count
    const difficultyBonus = Math.min(300, pieceCount * 30);
    
    // Total score
    const points = baseScore + timeBonus + difficultyBonus;
    
    // Perfect score if 90%+ accuracy for beginners
    const isPerfect = accuracy >= 90;
    
    return {
      points,
      baseScore,
      timeBonus,
      difficultyBonus,
      isPerfect
    };
  }
  
  /**
   * Calculate skill rating change based on performance
   */
  calculateRatingChange(
    currentRating: number,
    accuracy: number,
    pieceCount: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    completionTime: number
  ): number {
    // Beginner mode has smaller penalties, larger rewards
    // 100% accuracy = +30 points
    // 0% accuracy = -10 points
    const baseChange = (accuracy / 100) * 40 - 10;
    
    // Difficulty modifier: higher piece count = more rating change
    const difficultyModifier = Math.sqrt(pieceCount) / 2.5;
    
    // Time bonus: faster completion = more points (not used in beginner mode)
    // We could use completionTime here if needed
    
    // Calculate the final rating change
    let ratingChange = baseChange * difficultyModifier;
    
    // Apply a scaling factor based on current rating
    // Higher rated players gain/lose points more slowly
    const scalingFactor = Math.max(0.7, Math.min(1.3, 1000 / currentRating));
    ratingChange *= scalingFactor;
    
    return Math.round(ratingChange);
  }
}

/**
 * Factory for creating scoring strategies
 */
export class ScoringStrategyFactory {
  /**
   * Get a scoring strategy based on the specified type
   * 
   * @param type - Type of scoring strategy
   * @returns Appropriate scoring strategy
   */
  getStrategy(type: 'standard' | 'competitive' | 'beginner'): ScoringStrategy {
    switch (type) {
      case 'competitive':
        return new CompetitiveScoringStrategy();
      case 'beginner':
        return new BeginnerScoringStrategy();
      case 'standard':
      default:
        return new StandardScoringStrategy();
    }
  }
  
  /**
   * Get a scoring strategy based on game history and skill rating
   * 
   * @param history - Recent game history
   * @param skillRating - Current skill rating
   * @returns Appropriate scoring strategy
   */
  getStrategyFromProfile(history: GameHistory[], skillRating: number): ScoringStrategy {
    // If skill rating is low or no history, use beginner strategy
    if (skillRating < 800 || history.length < 5) {
      return new BeginnerScoringStrategy();
    }
    
    // If skill rating is high, use competitive strategy
    if (skillRating > 1800) {
      return new CompetitiveScoringStrategy();
    }
    
    // Otherwise use standard strategy
    return new StandardScoringStrategy();
  }
}

// Export a singleton instance
export const scoringStrategyFactory = new ScoringStrategyFactory(); 