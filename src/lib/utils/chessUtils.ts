/**
 * Chess Utility Functions
 * 
 * This file contains utility functions for chess operations,
 * including position generation, validation, and conversion.
 */

import { Chess, PieceSymbol, Square } from 'chess.js';
import { PiecePosition } from '@/types/game';

/**
 * Generates a random chess position with the specified number of pieces
 * 
 * @param pieceCount - Number of pieces to place on the board
 * @returns A Chess instance with the random position
 */
export function generateRandomPosition(pieceCount: number): Chess {
  // Initialize an empty chess board with just kings
  const chess = new Chess('8/8/8/8/8/8/8/8 w - - 0 1');
  
  // Always place kings first to ensure a valid position
  placeKings(chess);
  
  // Calculate how many additional pieces to place (minus the 2 kings)
  const remainingPieces = Math.max(0, pieceCount - 2);
  
  // Place the remaining pieces randomly
  if (remainingPieces > 0) {
    placeRandomPieces(chess, remainingPieces);
  }
  
  return chess;
}

/**
 * Places kings on the board in valid positions
 * 
 * @param chess - Chess instance to modify
 */
function placeKings(chess: Chess): void {
  // Get all empty squares
  const emptySquares = getEmptySquares(chess);
  
  // Place white king
  const whiteKingSquare = getRandomSquare(emptySquares);
  chess.put({ type: 'k', color: 'w' }, whiteKingSquare as Square);
  
  // Remove adjacent squares to avoid kings being placed next to each other
  const availableSquares = emptySquares.filter(square => 
    !areSquaresAdjacent(square, whiteKingSquare)
  );
  
  // Place black king
  const blackKingSquare = getRandomSquare(availableSquares);
  chess.put({ type: 'k', color: 'b' }, blackKingSquare as Square);
}

/**
 * Places random pieces on the board
 * 
 * @param chess - Chess instance to modify
 * @param count - Number of pieces to place
 */
function placeRandomPieces(chess: Chess, count: number): void {
  // Piece types (excluding kings which are already placed)
  const pieceTypes: PieceSymbol[] = ['p', 'n', 'b', 'r', 'q'];
  const colors: ('w' | 'b')[] = ['w', 'b'];
  
  // Get all empty squares
  let emptySquares = getEmptySquares(chess);
  
  // Place random pieces
  for (let i = 0; i < count && emptySquares.length > 0; i++) {
    const pieceType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const square = getRandomSquare(emptySquares);
    
    // Don't place pawns on the first or last rank
    if (pieceType === 'p' && (square.charAt(1) === '1' || square.charAt(1) === '8')) {
      // Try again with a different piece
      i--;
      continue;
    }
    
    // Place the piece
    chess.put({ type: pieceType, color }, square as Square);
    
    // Update empty squares
    emptySquares = getEmptySquares(chess);
  }
}

/**
 * Gets all empty squares on the board
 * 
 * @param chess - Chess instance to check
 * @returns Array of empty square coordinates
 */
function getEmptySquares(chess: Chess): string[] {
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
 * Gets a random square from the provided list
 * 
 * @param squares - Array of square coordinates
 * @returns A randomly selected square
 */
function getRandomSquare(squares: string[]): string {
  return squares[Math.floor(Math.random() * squares.length)];
}

/**
 * Checks if two squares are adjacent to each other
 * 
 * @param square1 - First square coordinate
 * @param square2 - Second square coordinate
 * @returns True if the squares are adjacent
 */
function areSquaresAdjacent(square1: string, square2: string): boolean {
  const file1 = square1.charCodeAt(0);
  const rank1 = parseInt(square1.charAt(1));
  const file2 = square2.charCodeAt(0);
  const rank2 = parseInt(square2.charAt(1));
  
  const fileDiff = Math.abs(file1 - file2);
  const rankDiff = Math.abs(rank1 - rank2);
  
  // Squares are adjacent if they differ by at most 1 in file and rank
  return fileDiff <= 1 && rankDiff <= 1 && (fileDiff > 0 || rankDiff > 0);
}

/**
 * Converts a chess.js piece to a PiecePosition object
 * 
 * @param piece - Chess.js piece object
 * @param square - Square coordinate
 * @returns PiecePosition object
 */
export function chessPieceToPiecePosition(
  piece: { type: PieceSymbol; color: 'w' | 'b' },
  square: string
): PiecePosition {
  return {
    type: piece.type,
    color: piece.color,
    square: square as Square
  };
}

/**
 * Gets all pieces from a chess position
 * 
 * @param chess - Chess instance to get pieces from
 * @returns Array of PiecePosition objects
 */
export function getAllPieces(chess: Chess): PiecePosition[] {
  const pieces: PiecePosition[] = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  for (const file of files) {
    for (const rank of ranks) {
      const square = `${file}${rank}` as Square;
      const piece = chess.get(square);
      
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
 * Calculates the accuracy of a solution compared to the original position
 * 
 * @param originalPosition - Original chess position
 * @param userPosition - User's solution position
 * @returns Object containing accuracy percentage and counts
 */
export function calculateAccuracy(originalPosition: string, userPosition: string): {
  accuracy: number;
  correctPlacements: number;
  totalPlacements: number;
} {
  const originalChess = new Chess(originalPosition);
  const userChess = new Chess(userPosition);
  
  const originalPieces = getAllPieces(originalChess);
  const userPieces = getAllPieces(userChess);
  
  let correctPlacements = 0;
  
  // Check each piece in the original position
  for (const originalPiece of originalPieces) {
    // Find matching piece in user position
    const matchingPiece = userPieces.find(
      userPiece => 
        userPiece.square === originalPiece.square &&
        userPiece.type === originalPiece.type &&
        userPiece.color === originalPiece.color
    );
    
    if (matchingPiece) {
      correctPlacements++;
    }
  }
  
  const totalPlacements = originalPieces.length;
  const accuracy = totalPlacements > 0 ? (correctPlacements / totalPlacements) * 100 : 0;
  
  return {
    accuracy,
    correctPlacements,
    totalPlacements
  };
} 