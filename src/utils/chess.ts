import { ChessPiece, PieceType, PieceColor, Position } from '../types/chess';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new chess piece.
 * 
 * @param type The type of the piece
 * @param color The color of the piece
 * @param position The position of the piece
 * @returns A new chess piece object
 */
export function createPiece(type: PieceType, color: PieceColor, position: Position): ChessPiece {
  return {
    id: uuidv4(),
    type,
    color,
    position
  };
}

/**
 * Gets the Unicode symbol for a chess piece.
 * 
 * @param type The type of the piece
 * @param color The color of the piece
 * @returns The Unicode symbol for the piece
 */
export function getPieceSymbol(type: PieceType, color: PieceColor): string {
  const symbols = {
    white: {
      king: '♔',
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘',
      pawn: '♙'
    },
    black: {
      king: '♚',
      queen: '♛',
      rook: '♜',
      bishop: '♝',
      knight: '♞',
      pawn: '♟'
    }
  };
  
  return symbols[color][type];
}

/**
 * Checks if a position is valid (within the board).
 * 
 * @param position The position to check
 * @returns True if the position is valid, false otherwise
 */
export function isValidPosition(position: Position): boolean {
  return position.file >= 0 && position.file < 8 && position.rank >= 0 && position.rank < 8;
}

/**
 * Gets the color of a square on the chess board.
 * 
 * @param file The file index (0-7)
 * @param rank The rank index (0-7)
 * @returns 'light' for light squares, 'dark' for dark squares
 */
export function getSquareColor(file: number, rank: number): 'light' | 'dark' {
  return (file + rank) % 2 === 0 ? 'light' : 'dark';
}

/**
 * Gets the CSS class for a square based on its color.
 * 
 * @param file The file index (0-7)
 * @param rank The rank index (0-7)
 * @returns The CSS class for the square
 */
export function getSquareClass(file: number, rank: number): string {
  return getSquareColor(file, rank) === 'light' ? 'bg-gray-100' : 'bg-gray-800';
} 