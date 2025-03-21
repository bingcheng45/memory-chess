import { ChessPiece, PieceType, PieceColor, Position } from '../types/chess';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a random chess position with the specified number of pieces.
 * Ensures that each piece is placed on a unique square (no overlap).
 * Always includes both white and black kings.
 * 
 * @param pieceCount The number of pieces to generate (minimum 2 for kings)
 * @returns An array of chess pieces
 */
export function generateRandomPosition(pieceCount: number): ChessPiece[] {
  // Ensure piece count is at least 2 (for kings)
  const count = Math.max(2, pieceCount);
  
  // Initialize the position array
  const pieces: ChessPiece[] = [];
  
  // Keep track of occupied squares to avoid overlap
  const occupiedSquares = new Set<string>();
  
  // Always add white and black kings first
  const whiteKingPosition = getRandomEmptyPosition(occupiedSquares);
  pieces.push({
    id: uuidv4(),
    type: 'king',
    color: 'white',
    position: whiteKingPosition
  });
  occupiedSquares.add(`${whiteKingPosition.file},${whiteKingPosition.rank}`);
  
  // Ensure black king is not adjacent to white king
  let blackKingPosition: Position;
  do {
    blackKingPosition = getRandomEmptyPosition(occupiedSquares);
  } while (areKingsAdjacent(whiteKingPosition, blackKingPosition));
  
  pieces.push({
    id: uuidv4(),
    type: 'king',
    color: 'black',
    position: blackKingPosition
  });
  occupiedSquares.add(`${blackKingPosition.file},${blackKingPosition.rank}`);
  
  // If we only need kings, return now
  if (count <= 2) {
    return pieces;
  }
  
  // Add remaining pieces
  const remainingCount = count - 2;
  const additionalPieces = generateAdditionalPieces(remainingCount, occupiedSquares);
  
  return [...pieces, ...additionalPieces];
}

/**
 * Generates a random empty position on the board.
 * 
 * @param occupiedSquares Set of occupied squares in "file,rank" format
 * @returns A random empty position
 */
function getRandomEmptyPosition(occupiedSquares: Set<string>): Position {
  let file: number, rank: number, posKey: string;
  
  do {
    file = Math.floor(Math.random() * 8);
    rank = Math.floor(Math.random() * 8);
    posKey = `${file},${rank}`;
  } while (occupiedSquares.has(posKey));
  
  return { file, rank };
}

/**
 * Checks if two kings are adjacent to each other.
 * 
 * @param pos1 Position of the first king
 * @param pos2 Position of the second king
 * @returns True if the kings are adjacent, false otherwise
 */
function areKingsAdjacent(pos1: Position, pos2: Position): boolean {
  const fileDiff = Math.abs(pos1.file - pos2.file);
  const rankDiff = Math.abs(pos1.rank - pos2.rank);
  
  // Kings are adjacent if they are at most 1 square apart in any direction
  return fileDiff <= 1 && rankDiff <= 1;
}

/**
 * Generates additional random pieces for the position.
 * 
 * @param count Number of additional pieces to generate
 * @param occupiedSquares Set of occupied squares in "file,rank" format
 * @returns Array of additional chess pieces
 */
function generateAdditionalPieces(count: number, occupiedSquares: Set<string>): ChessPiece[] {
  const pieces: ChessPiece[] = [];
  
  // Distribution weights for different piece types
  const typeWeights = {
    pawn: 8,
    knight: 2,
    bishop: 2,
    rook: 2,
    queen: 1
  };
  
  // Create a weighted array for random selection
  const weightedTypes: PieceType[] = [];
  for (const [type, weight] of Object.entries(typeWeights)) {
    for (let i = 0; i < weight; i++) {
      weightedTypes.push(type as PieceType);
    }
  }
  
  for (let i = 0; i < count; i++) {
    // Get a random empty position
    const position = getRandomEmptyPosition(occupiedSquares);
    occupiedSquares.add(`${position.file},${position.rank}`);
    
    // Randomly select piece type and color
    const type = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
    const color: PieceColor = Math.random() < 0.5 ? 'white' : 'black';
    
    pieces.push({
      id: uuidv4(),
      type,
      color,
      position
    });
  }
  
  return pieces;
} 