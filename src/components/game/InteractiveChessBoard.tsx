'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChessPiece, PieceType, PieceColor, Position } from '@/types/chess';
import { getPieceImageUrl, getPieceAltText } from '@/utils/chessPieces';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';

// Define maximum piece limits for standard chess
const PIECE_LIMITS: Record<PieceType, number> = {
  pawn: 8,
  knight: 2,
  bishop: 2,
  rook: 2,
  queen: 1,
  king: 1
};

interface InteractiveChessBoardProps {
  readonly playerSolution: ChessPiece[];
  readonly onPlacePiece: (piece: ChessPiece) => void;
  readonly onRemovePiece: (position: Position) => void;
}

export default function InteractiveChessBoard({
  playerSolution,
  onPlacePiece,
  onRemovePiece
}: InteractiveChessBoardProps) {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedPieceType, setSelectedPieceType] = useState<PieceType>('pawn');
  const [selectedPieceColor, setSelectedPieceColor] = useState<PieceColor>('white');

  // Handle square click
  const handleSquareClick = (position: Position) => {
    setSelectedPosition(position);
    
    // Check if there's already a piece at this position
    const existingPiece = playerSolution.find(
      p => p.position.file === position.file && p.position.rank === position.rank
    );
    
    if (existingPiece) {
      // Remove the piece if it exists
      onRemovePiece(position);
    } else {
      // Check if we've reached the limit for this piece type and color
      const currentCount = playerSolution.filter(
        p => p.type === selectedPieceType && p.color === selectedPieceColor
      ).length;
      
      if (currentCount >= PIECE_LIMITS[selectedPieceType]) {
        console.warn(`Cannot place more than ${PIECE_LIMITS[selectedPieceType]} ${selectedPieceColor} ${selectedPieceType}(s)`);
        return; // Don't place the piece if we've reached the limit
      }
      
      // Place a new piece
      const newPiece: ChessPiece = {
        id: uuidv4(),
        type: selectedPieceType,
        color: selectedPieceColor,
        position
      };
      onPlacePiece(newPiece);
    }
  };
  
  // Handle piece type selection
  const handlePieceTypeSelect = (type: PieceType) => {
    setSelectedPieceType(type);
  };
  
  // Handle piece color selection
  const handleColorToggle = (color: PieceColor) => {
    setSelectedPieceColor(color);
  };

  // Piece type buttons
  const pieceTypes: PieceType[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
  
  // Render a square on the board
  const renderSquare = (file: number, rank: number) => {
    const position: Position = { file, rank };
    const piece = playerSolution.find(p => p.position.file === file && p.position.rank === rank);
    const isSelected = selectedPosition?.file === file && selectedPosition?.rank === rank;
    
    // Get square color
    const squareColor = (file + rank) % 2 === 0 ? 'bg-board-light' : 'bg-board-dark';
    
    // Get square name (e.g., "a1", "e4")
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const squareName = `${files[file]}${rank + 1}`;
    
    // Handle keyboard events
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSquareClick(position);
      }
    };
    
    return (
      <button
        key={`${file}-${rank}`}
        className={`relative w-full h-full ${squareColor} ${
          isSelected ? 'ring-2 ring-black' : ''
        } focus:outline-none focus:ring-2 focus:ring-black border border-gray-800/80 transition-all hover:brightness-105`}
        onClick={() => handleSquareClick(position)}
        onKeyDown={handleKeyDown}
        data-testid={`square-${file}-${rank}`}
        aria-label={`${squareName}${piece ? ` with ${piece.color} ${piece.type}` : ''}`}
        tabIndex={0}
        type="button"
      >
        {/* Coordinate labels */}
        {rank === 0 && (
          <span className="absolute bottom-0 right-1 text-xs opacity-50">
            {files[file]}
          </span>
        )}
        {file === 0 && (
          <span className="absolute top-0 left-1 text-xs opacity-50">
            {rank + 1}
          </span>
        )}
        
        {/* Chess piece */}
        {piece && (
          <div className="flex items-center justify-center">
            <Image 
              src={getPieceImageUrl(piece.type, piece.color)}
              alt={getPieceAltText(piece.type, piece.color)}
              width={32}
              height={32}
              className="drop-shadow-md"
              priority
            />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative aspect-square w-full max-w-[600px] overflow-hidden rounded-xl border-2 border-gray-800 bg-bg-card shadow-xl mb-6">
        <div className="grid h-full w-full grid-cols-8 grid-rows-8 gap-0 border border-gray-800 shadow-inner">
          {/* Render all 64 squares */}
          {Array.from({ length: 8 }, (_, rank) =>
            Array.from({ length: 8 }, (_, file) => renderSquare(file, 7 - rank))
          )}
        </div>
      </div>
      
      {/* Piece selection controls */}
      <div className="mb-6 bg-bg-card p-4 rounded-lg w-full max-w-[600px]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">Piece Selection</h3>
            <span className="text-sm text-text-secondary">Select a piece type to place on the board</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Color:</span>
            <div className="flex items-center gap-1">
              {/* White color button */}
              <Button
                onClick={() => handleColorToggle('white')}
                variant="default"
                className={`flex items-center gap-2 px-3 py-1 bg-white text-black border ${
                  selectedPieceColor === 'white' 
                    ? 'border-gray-700 shadow-md' 
                    : 'border-gray-300 opacity-70'
                }`}
                aria-label="Select white pieces"
              >
                <div className={`w-4 h-4 rounded-full ${
                  selectedPieceColor === 'white' 
                    ? 'bg-peach-500' 
                    : 'bg-white border border-gray-300'
                }`}></div>
                <span>White</span>
              </Button>
              
              {/* Black color button */}
              <Button
                onClick={() => handleColorToggle('black')}
                variant="default"
                className={`flex items-center gap-2 px-3 py-1 bg-black text-white border ${
                  selectedPieceColor === 'black' 
                    ? 'border-gray-300 shadow-md' 
                    : 'border-gray-600 opacity-70'
                }`}
                aria-label="Select black pieces"
              >
                <div className={`w-4 h-4 rounded-full ${
                  selectedPieceColor === 'black' 
                    ? 'bg-peach-500' 
                    : 'bg-black border border-gray-600'
                }`}></div>
                <span>Black</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-6 gap-3">
          {pieceTypes.map(type => {
            // Calculate remaining pieces for this type and color
            const currentCount = playerSolution.filter(
              p => p.type === type && p.color === selectedPieceColor
            ).length;
            const remainingCount = PIECE_LIMITS[type] - currentCount;
            const isDisabled = remainingCount <= 0;
            
            return (
              <Button
                key={type}
                onClick={() => handlePieceTypeSelect(type)}
                variant={selectedPieceType === type ? "secondary" : "outline"}
                className={`p-3 flex flex-col items-center justify-center h-16 w-full ${
                  selectedPieceType === type
                    ? 'bg-gray-700 ring-2 ring-gray-500 text-white'
                    : 'bg-bg-light hover:bg-bg-light/80'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={`Select ${type}`}
                disabled={isDisabled}
              >
                <div className="h-8 w-8 flex items-center justify-center">
                  <Image 
                    src={getPieceImageUrl(type, selectedPieceColor)}
                    alt={`${selectedPieceColor} ${type}`}
                    width={32}
                    height={32}
                    className={selectedPieceType === type ? 'drop-shadow-md' : 'opacity-80'}
                  />
                </div>
                <div className="text-xs mt-1">{remainingCount}/{PIECE_LIMITS[type]}</div>
              </Button>
            );
          })}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="mb-4 w-full max-w-[600px] bg-bg-card p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2 text-center">Recreate the Position</h2>
        <p className="text-text-secondary text-center">
          Place pieces on the board to match the position you memorized.
        </p>
      </div>
    </div>
  );
} 