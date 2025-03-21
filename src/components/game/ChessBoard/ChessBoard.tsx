'use client';

import React from 'react';
import { ChessPiece, Position } from '@/types/chess';
import ChessPieceComponent from '@/components/game/ChessBoard/ChessPiece';
import { useSettingsStore } from '@/stores/settingsStore';
import { BoardCoordinates } from '@/components/game/BoardCoordinates';

interface ChessBoardProps {
  readonly pieces: ChessPiece[];
  readonly onSquareClick?: (position: Position) => void;
  readonly selectedPosition?: Position | null;
  readonly className?: string;
}

// Extract the renderSquare function outside of the component
function renderBoardSquare(
  file: number, 
  rank: number, 
  pieces: ChessPiece[], 
  selectedPosition: Position | null | undefined,
  onSquareClick: ((position: Position) => void) | undefined,
  showCoordinates: boolean
) {
  const position: Position = { file, rank };
  const piece = Array.isArray(pieces) ? pieces.find(p => p.position.file === file && p.position.rank === rank) : undefined;
  const isSelected = selectedPosition?.file === file && selectedPosition?.rank === rank;
  
  // Get the square color class - standardized to black and white
  const getSquareColorClass = (file: number, rank: number) => {
    const isLightSquare = (file + rank) % 2 === 0;
    return isLightSquare ? 'bg-gray-100' : 'bg-gray-800';
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSquareClick?.(position);
    }
  };
  
  // Get square name (e.g., "a1", "e4")
  const getSquareName = (file: number, rank: number) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    return `${files[file]}${rank + 1}`;
  };
  
  const squareName = getSquareName(file, rank);
  const pieceInfo = piece ? `${piece.color} ${piece.type}` : 'empty square';
  const ariaLabel = `${squareName}, ${pieceInfo}${isSelected ? ', selected' : ''}`;
  
  return (
    <button
      key={`${file}-${rank}`}
      className={`relative w-full h-full ${getSquareColorClass(file, rank)} ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } border-none focus:outline-none focus:ring-2 focus:ring-blue-500`}
      onClick={() => onSquareClick?.(position)}
      onKeyDown={handleKeyDown}
      data-testid={`square-${file}-${rank}`}
      aria-label={ariaLabel}
      tabIndex={0}
      type="button"
    >
      {/* Coordinate labels - using the BoardCoordinates component */}
      <BoardCoordinates 
        showCoordinates={showCoordinates} 
        file={file} 
        rank={rank} 
        position="file" 
      />
      <BoardCoordinates 
        showCoordinates={showCoordinates} 
        file={file} 
        rank={rank} 
        position="rank" 
      />
      
      {/* Chess piece */}
      {piece && (
        <ChessPieceComponent piece={piece} />
      )}
    </button>
  );
}

export default function ChessBoard({
  pieces = [],
  onSquareClick,
  selectedPosition,
  className = ''
}: ChessBoardProps) {
  const { showCoordinates } = useSettingsStore();
  
  // Get the border class for the board
  const getBorderClass = () => 'border-gray-800';
  
  return (
    <div className="flex justify-center items-center w-full px-2 sm:px-0">
      <div className={`w-full max-w-md aspect-square border-2 ${getBorderClass()} ${className} shadow-lg`}>
        <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
          {/* Render all 64 squares */}
          {Array.from({ length: 8 }, (_, rank) =>
            Array.from({ length: 8 }, (_, file) => renderBoardSquare(file, 7 - rank, pieces, selectedPosition, onSquareClick, showCoordinates))
          )}
        </div>
      </div>
    </div>
  );
} 