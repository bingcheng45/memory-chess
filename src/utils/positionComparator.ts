import { ChessPiece } from '../types/chess';

/**
 * Compares the original position with the player's solution.
 * 
 * @param originalPosition The original position to memorize
 * @param playerSolution The player's attempted solution
 * @returns An object containing the comparison results
 */
export function comparePositions(originalPosition: ChessPiece[], playerSolution: ChessPiece[]) {
  const correctPlacements: ChessPiece[] = [];
  const incorrectPlacements: ChessPiece[] = [];
  const missingPieces: ChessPiece[] = [];
  
  // Check each piece in the player's solution
  playerSolution.forEach(playerPiece => {
    // Find a matching piece in the original position
    const matchingPiece = originalPosition.find(originalPiece => 
      originalPiece.position.file === playerPiece.position.file &&
      originalPiece.position.rank === playerPiece.position.rank &&
      originalPiece.type === playerPiece.type &&
      originalPiece.color === playerPiece.color
    );
    
    if (matchingPiece) {
      correctPlacements.push(playerPiece);
    } else {
      incorrectPlacements.push(playerPiece);
    }
  });
  
  // Find pieces that were in the original position but not in the player's solution
  originalPosition.forEach(originalPiece => {
    const isPlaced = playerSolution.some(playerPiece => 
      originalPiece.position.file === playerPiece.position.file &&
      originalPiece.position.rank === playerPiece.position.rank &&
      originalPiece.type === playerPiece.type &&
      originalPiece.color === playerPiece.color
    );
    
    if (!isPlaced) {
      missingPieces.push(originalPiece);
    }
  });
  
  // Calculate accuracy
  const accuracy = originalPosition.length > 0
    ? (correctPlacements.length / originalPosition.length) * 100
    : 0;
  
  return {
    correctPlacements,
    incorrectPlacements,
    missingPieces,
    accuracy,
    totalPieces: originalPosition.length
  };
} 