'use client';

import { useState } from 'react';
import { ChessPiece, PieceType, PieceColor, Position } from '@/types/chess';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import ResponsiveChessBoard from './ResponsiveChessBoard';
import { getPieceImageUrl } from '@/utils/chessPieces';
import Image from 'next/image';

// Define maximum piece limits for standard chess
const PIECE_LIMITS: Record<PieceType, number> = {
  pawn: 8,
  knight: 2,
  bishop: 2,
  rook: 2,
  queen: 1,
  king: 1
};

interface ResponsiveInteractiveBoardProps {
  readonly playerSolution: ChessPiece[];
  readonly onPlacePiece: (piece: ChessPiece) => void;
  readonly onRemovePiece: (position: Position) => void;
}

export default function ResponsiveInteractiveBoard({
  playerSolution,
  onPlacePiece,
  onRemovePiece
}: ResponsiveInteractiveBoardProps) {
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
  const handleColorToggle = () => {
    setSelectedPieceColor(prev => prev === 'white' ? 'black' : 'white');
  };

  // Piece type buttons
  const pieceTypes: PieceType[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
  
  // Calculate height of controls for ResponsiveChessBoard
  const controlsHeight = 150; // Approximate height of the piece selector controls
  
  return (
    <div className="flex flex-col items-center w-full max-w-screen-sm mx-auto px-2 sm:px-4">
      <ResponsiveChessBoard
        pieces={playerSolution}
        selectedSquare={selectedPosition}
        isInteractive={true}
        onSquareClick={handleSquareClick}
        showCoordinates={true}
        controlsHeight={controlsHeight}
        minSize={280}
      />
      
      {/* Compact piece selection controls */}
      <div className="w-full max-w-[600px] bg-bg-card/80 backdrop-blur-sm border border-gray-700/30 p-2 mt-3 rounded-lg shadow-md mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1">
            <h3 className="text-sm font-medium">Place Pieces:</h3>
            <span className="text-xs text-text-secondary hidden sm:inline">Select type & color</span>
          </div>
          <Button
            onClick={handleColorToggle}
            variant="default"
            size="sm"
            className={`h-8 flex items-center gap-1 px-2 ${
              selectedPieceColor === 'white' 
                ? 'bg-black text-white border border-gray-600' 
                : 'bg-white text-black border border-gray-300'
            }`}
            aria-label={`Toggle piece color, currently ${selectedPieceColor}`}
          >
            <div className={`w-3 h-3 rounded-full ${selectedPieceColor === 'white' ? 'bg-white' : 'bg-black'}`}></div>
            <span className="text-xs">{selectedPieceColor === 'white' ? 'White' : 'Black'}</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-6 gap-1 mt-1">
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
                disabled={isDisabled}
                className={`p-1 flex flex-col items-center justify-center h-12 w-full ${
                  selectedPieceType === type
                    ? 'bg-gray-700 ring-1 ring-gray-500 text-white'
                    : 'bg-bg-light hover:bg-bg-light/80'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={`Select ${type}`}
              >
                <div className="relative w-6 h-6">
                  <Image
                    src={getPieceImageUrl(type, selectedPieceColor)}
                    alt={`${selectedPieceColor} ${type}`}
                    fill
                    sizes="24px"
                    className="object-contain"
                  />
                </div>
                <span className="text-[9px] mt-1 truncate">{remainingCount}</span>
              </Button>
            );
          })}
        </div>
      </div>
      
      <div className="mt-2 text-center text-xs text-text-secondary">
        Tap a square to add a piece or remove an existing one
      </div>
    </div>
  );
} 