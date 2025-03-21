/**
 * Position Factory
 * 
 * Factory for creating chess positions with different generation strategies.
 * Implements the Factory and Strategy patterns to encapsulate position creation logic.
 */

import { Chess, PieceSymbol, Square } from 'chess.js';
import { Difficulty } from '@/types/game';

/**
 * Interface for position generation strategies
 */
interface PositionGenerationStrategy {
  /**
   * Generate a chess position
   * @param pieceCount - Number of pieces to place on the board
   * @returns Chess instance with the generated position
   */
  generate(pieceCount: number): Chess;
}

/**
 * Strategy for generating completely random positions
 */
class RandomPositionStrategy implements PositionGenerationStrategy {
  /**
   * Generate a random chess position with the specified number of pieces
   */
  generate(pieceCount: number): Chess {
    // Initialize an empty chess board
    const chess = new Chess('8/8/8/8/8/8/8/8 w - - 0 1');
    
    // Always place kings first to ensure a valid position
    this.placeKings(chess);
    
    // Calculate how many additional pieces to place (minus the 2 kings)
    const remainingPieces = Math.max(0, pieceCount - 2);
    
    // Place the remaining pieces randomly
    if (remainingPieces > 0) {
      this.placeRandomPieces(chess, remainingPieces);
    }
    
    return chess;
  }

  /**
   * Place kings on the board in valid positions
   */
  private placeKings(chess: Chess): void {
    // Get all empty squares
    const emptySquares = this.getEmptySquares(chess);
    
    // Place white king
    const whiteKingSquare = this.getRandomSquare(emptySquares);
    chess.put({ type: 'k', color: 'w' }, whiteKingSquare as Square);
    
    // Remove adjacent squares to avoid kings being placed next to each other
    const availableSquares = emptySquares.filter(square => 
      !this.areSquaresAdjacent(square, whiteKingSquare)
    );
    
    // Place black king
    const blackKingSquare = this.getRandomSquare(availableSquares);
    chess.put({ type: 'k', color: 'b' }, blackKingSquare as Square);
  }

  /**
   * Place random pieces on the board
   */
  private placeRandomPieces(chess: Chess, count: number): void {
    // Piece types (excluding kings which are already placed)
    const pieceTypes: PieceSymbol[] = ['p', 'n', 'b', 'r', 'q'];
    const colors: ('w' | 'b')[] = ['w', 'b'];
    
    // Get all empty squares
    let emptySquares = this.getEmptySquares(chess);
    
    // Place random pieces
    for (let i = 0; i < count && emptySquares.length > 0; i++) {
      const pieceType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const square = this.getRandomSquare(emptySquares);
      
      // Don't place pawns on the first or last rank
      if (pieceType === 'p' && (square.charAt(1) === '1' || square.charAt(1) === '8')) {
        // Try again with a different piece
        i--;
        continue;
      }
      
      // Place the piece
      chess.put({ type: pieceType, color }, square as Square);
      
      // Update empty squares
      emptySquares = this.getEmptySquares(chess);
    }
  }

  /**
   * Get all empty squares on the board
   */
  private getEmptySquares(chess: Chess): string[] {
    const emptySquares: string[] = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    for (const file of files) {
      for (const rank of ranks) {
        const square = `${file}${rank}`;
        if (!chess.get(square as Square)) {
          emptySquares.push(square);
        }
      }
    }
    
    return emptySquares;
  }

  /**
   * Get a random square from the provided list
   */
  private getRandomSquare(squares: string[]): string {
    return squares[Math.floor(Math.random() * squares.length)];
  }

  /**
   * Check if two squares are adjacent to each other
   */
  private areSquaresAdjacent(square1: string, square2: string): boolean {
    const file1 = square1.charCodeAt(0);
    const rank1 = parseInt(square1.charAt(1));
    const file2 = square2.charCodeAt(0);
    const rank2 = parseInt(square2.charAt(1));
    
    const fileDiff = Math.abs(file1 - file2);
    const rankDiff = Math.abs(rank1 - rank2);
    
    // Squares are adjacent if they differ by at most 1 in file and rank
    return fileDiff <= 1 && rankDiff <= 1 && (fileDiff > 0 || rankDiff > 0);
  }
}

/**
 * Strategy for generating positions based on common tactical patterns
 */
class TacticalPositionStrategy implements PositionGenerationStrategy {
  /**
   * Generate a position with common tactical patterns
   */
  generate(pieceCount: number): Chess {
    // Start with a base position
    const chess = new Chess();
    chess.clear();
    
    // Place kings in standard positions
    chess.put({ type: 'k', color: 'w' }, 'e1' as Square);
    chess.put({ type: 'k', color: 'b' }, 'e8' as Square);
    
    // Adjust piece count to account for the kings
    const remainingPieces = Math.max(0, pieceCount - 2);
    
    // Select a tactical pattern based on piece count
    if (remainingPieces <= 4) {
      this.createForkPattern(chess, remainingPieces);
    } else if (remainingPieces <= 8) {
      this.createPinPattern(chess, remainingPieces);
    } else {
      this.createComplexPattern(chess, remainingPieces);
    }
    
    return chess;
  }

  /**
   * Create a position with a potential fork
   */
  private createForkPattern(chess: Chess, pieceCount: number): void {
    // Example: Knight fork setup
    if (pieceCount >= 1) chess.put({ type: 'n', color: 'w' }, 'd4' as Square);
    if (pieceCount >= 2) chess.put({ type: 'q', color: 'b' }, 'c6' as Square);
    if (pieceCount >= 3) chess.put({ type: 'r', color: 'b' }, 'e6' as Square);
    if (pieceCount >= 4) chess.put({ type: 'p', color: 'b' }, 'd7' as Square);
  }

  /**
   * Create a position with a potential pin
   */
  private createPinPattern(chess: Chess, pieceCount: number): void {
    // Example: Bishop pin setup
    if (pieceCount >= 1) chess.put({ type: 'b', color: 'w' }, 'c4' as Square);
    if (pieceCount >= 2) chess.put({ type: 'n', color: 'b' }, 'e6' as Square);
    if (pieceCount >= 3) chess.put({ type: 'q', color: 'b' }, 'h8' as Square);
    if (pieceCount >= 4) chess.put({ type: 'p', color: 'w' }, 'd4' as Square);
    if (pieceCount >= 5) chess.put({ type: 'p', color: 'b' }, 'e7' as Square);
    if (pieceCount >= 6) chess.put({ type: 'r', color: 'w' }, 'a1' as Square);
    if (pieceCount >= 7) chess.put({ type: 'n', color: 'w' }, 'f3' as Square);
    if (pieceCount >= 8) chess.put({ type: 'p', color: 'b' }, 'c6' as Square);
  }

  /**
   * Create a more complex position
   */
  private createComplexPattern(chess: Chess, pieceCount: number): void {
    // Start with the pin pattern
    this.createPinPattern(chess, 8);
    
    // Add additional pieces
    const additionalPieces: Array<[PieceSymbol, 'w' | 'b', string]> = [
      ['p', 'w', 'a2'], ['p', 'w', 'b2'], ['p', 'w', 'c2'], ['p', 'w', 'f2'],
      ['p', 'b', 'a7'], ['p', 'b', 'b7'], ['p', 'b', 'f7'], ['p', 'b', 'g7'],
      ['r', 'w', 'h1'], ['n', 'w', 'b1'], ['b', 'w', 'f1'], ['q', 'w', 'd1'],
      ['r', 'b', 'a8'], ['n', 'b', 'b8'], ['b', 'b', 'c8'], ['q', 'b', 'd8']
    ];
    
    // Add pieces until we reach the desired count
    for (let i = 0; i < Math.min(additionalPieces.length, pieceCount - 8); i++) {
      const [type, color, square] = additionalPieces[i];
      chess.put({ type, color }, square as Square);
    }
  }
}

/**
 * Position Factory class that creates chess positions using different strategies
 */
export class PositionFactory {
  private strategies: Record<string, PositionGenerationStrategy> = {
    random: new RandomPositionStrategy(),
    tactical: new TacticalPositionStrategy()
  };

  /**
   * Create a chess position with the specified strategy
   * 
   * @param pieceCount - Number of pieces to place on the board
   * @param strategy - Strategy to use for position generation
   * @returns Chess instance with the generated position
   */
  createPosition(pieceCount: number, strategy: 'random' | 'tactical' = 'random'): Chess {
    return this.strategies[strategy].generate(pieceCount);
  }

  /**
   * Create a position based on difficulty level
   * 
   * @param difficulty - Difficulty level
   * @returns Chess instance with the generated position
   */
  createPositionByDifficulty(difficulty: Difficulty): Chess {
    let pieceCount: number;
    let strategy: 'random' | 'tactical';
    
    switch (difficulty) {
      case 'Easy':
        pieceCount = Math.floor(Math.random() * 3) + 2; // 2-4 pieces
        strategy = 'random';
        break;
      case 'Medium':
        pieceCount = Math.floor(Math.random() * 5) + 6; // 6-10 pieces
        strategy = Math.random() > 0.5 ? 'random' : 'tactical';
        break;
      case 'Hard':
        pieceCount = Math.floor(Math.random() * 5) + 12; // 12-16 pieces
        strategy = Math.random() > 0.3 ? 'tactical' : 'random';
        break;
      case 'Grandmaster':
        pieceCount = Math.floor(Math.random() * 13) + 20; // 20-32 pieces
        strategy = 'tactical';
        break;
      default:
        pieceCount = 8;
        strategy = 'random';
    }
    
    return this.createPosition(pieceCount, strategy);
  }
}

// Export a singleton instance
export const positionFactory = new PositionFactory(); 