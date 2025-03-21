/**
 * Chess Adapter
 * 
 * Implements the Adapter pattern to provide a consistent interface for chess operations.
 * Wraps the chess.js library with methods specific to our application needs.
 */

import { Chess, PieceSymbol, Square, Color } from 'chess.js';
import { PiecePosition } from '@/types/game';

/**
 * ChessAdapter provides a consistent interface for chess operations
 * specific to the Memory Chess application
 */
export class ChessAdapter {
  private chess: Chess;
  
  /**
   * Create a new ChessAdapter
   * 
   * @param position - Initial position (FEN string or Chess instance)
   */
  constructor(position?: string | Chess) {
    if (position instanceof Chess) {
      this.chess = position;
    } else if (typeof position === 'string') {
      this.chess = new Chess(position);
    } else {
      this.chess = new Chess();
    }
  }
  
  /**
   * Get the underlying Chess instance
   */
  getChessInstance(): Chess {
    return this.chess;
  }
  
  /**
   * Get the current position as a FEN string
   */
  getPosition(): string {
    return this.chess.fen();
  }
  
  /**
   * Set the position from a FEN string
   * 
   * @param fen - FEN string representing the position
   * @returns True if the position was set successfully
   */
  setPosition(fen: string): boolean {
    try {
      this.chess.load(fen);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Clear the board
   */
  clearBoard(): void {
    this.chess.clear();
  }
  
  /**
   * Reset the board to the starting position
   */
  resetBoard(): void {
    this.chess.reset();
  }
  
  /**
   * Get all pieces on the board
   * 
   * @returns Array of piece positions
   */
  getAllPieces(): PiecePosition[] {
    const pieces: PiecePosition[] = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    for (const file of files) {
      for (const rank of ranks) {
        const square = `${file}${rank}` as Square;
        const piece = this.chess.get(square);
        
        if (piece) {
          pieces.push({
            type: piece.type,
            color: piece.color,
            square
          });
        }
      }
    }
    
    return pieces;
  }
  
  /**
   * Get the piece at a specific square
   * 
   * @param square - Square to check
   * @returns Piece at the square or null if empty
   */
  getPiece(square: Square): PiecePosition | null {
    const piece = this.chess.get(square);
    
    if (!piece) return null;
    
    return {
      type: piece.type,
      color: piece.color,
      square
    };
  }
  
  /**
   * Place a piece on the board
   * 
   * @param piece - Piece to place
   * @param square - Square to place the piece on
   * @returns True if the piece was placed successfully
   */
  placePiece(piece: { type: PieceSymbol, color: Color }, square: Square): boolean {
    try {
      this.chess.put(piece, square);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Remove a piece from the board
   * 
   * @param square - Square to remove the piece from
   * @returns True if a piece was removed
   */
  removePiece(square: Square): boolean {
    const piece = this.chess.get(square);
    
    if (!piece) return false;
    
    this.chess.remove(square);
    return true;
  }
  
  /**
   * Move a piece on the board
   * 
   * @param from - Source square
   * @param to - Destination square
   * @param promotion - Promotion piece (optional)
   * @returns True if the move was made successfully
   */
  movePiece(from: Square, to: Square, promotion?: 'n' | 'b' | 'r' | 'q'): boolean {
    try {
      const move = this.chess.move({ from, to, promotion });
      return !!move;
    } catch {
      return false;
    }
  }
  
  /**
   * Undo the last move
   * 
   * @returns True if a move was undone
   */
  undoMove(): boolean {
    try {
      const move = this.chess.undo();
      return !!move;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if a square is empty
   * 
   * @param square - Square to check
   * @returns True if the square is empty
   */
  isSquareEmpty(square: Square): boolean {
    return !this.chess.get(square);
  }
  
  /**
   * Check if a move is valid
   * 
   * @param from - Source square
   * @param to - Destination square
   * @returns True if the move is valid
   */
  isValidMove(from: Square, to: Square): boolean {
    try {
      // Get the moves for the piece at the source square
      const moves = this.chess.moves({
        square: from,
        verbose: true
      });
      
      // Check if any of the moves match the destination square
      return moves.some(move => move.to === to);
    } catch {
      return false;
    }
  }
  
  /**
   * Count the number of pieces on the board
   * 
   * @returns Number of pieces
   */
  getPieceCount(): number {
    return this.getAllPieces().length;
  }
  
  /**
   * Compare two positions for equality
   * 
   * @param otherPosition - Position to compare with (FEN string or Chess instance)
   * @returns True if the positions are the same
   */
  isEqualTo(otherPosition: string | Chess): boolean {
    const otherFen = otherPosition instanceof Chess 
      ? otherPosition.fen() 
      : otherPosition;
    
    // Split FEN strings to compare only the piece placement part
    const thisFenParts = this.chess.fen().split(' ');
    const otherFenParts = otherFen.split(' ');
    
    // Compare only the piece placement part (first part of FEN)
    return thisFenParts[0] === otherFenParts[0];
  }
  
  /**
   * Calculate the accuracy of this position compared to another
   * 
   * @param targetPosition - Position to compare with (FEN string or Chess instance)
   * @returns Object with accuracy percentage and counts
   */
  calculateAccuracy(targetPosition: string | Chess): {
    accuracy: number;
    correctPlacements: number;
    totalPlacements: number;
  } {
    const targetChess = targetPosition instanceof Chess 
      ? targetPosition 
      : new Chess(targetPosition);
    
    const targetPieces = new ChessAdapter(targetChess).getAllPieces();
    const currentPieces = this.getAllPieces();
    
    let correctPlacements = 0;
    
    // Check each piece in the target position
    for (const targetPiece of targetPieces) {
      // Find matching piece in current position
      const matchingPiece = currentPieces.find(
        currentPiece => 
          currentPiece.square === targetPiece.square &&
          currentPiece.type === targetPiece.type &&
          currentPiece.color === targetPiece.color
      );
      
      if (matchingPiece) {
        correctPlacements++;
      }
    }
    
    const totalPlacements = targetPieces.length;
    const accuracy = totalPlacements > 0 ? (correctPlacements / totalPlacements) * 100 : 0;
    
    return {
      accuracy,
      correctPlacements,
      totalPlacements
    };
  }
}

/**
 * Create a new ChessAdapter instance
 * 
 * @param position - Initial position (FEN string or Chess instance)
 * @returns ChessAdapter instance
 */
export function createChessAdapter(position?: string | Chess): ChessAdapter {
  return new ChessAdapter(position);
} 