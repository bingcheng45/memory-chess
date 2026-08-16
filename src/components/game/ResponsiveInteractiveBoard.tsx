'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChessPiece, PieceType, PieceColor, Position } from '@/types/chess';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import ResponsiveChessBoard from './ResponsiveChessBoard';
import { getPieceImageUrl } from '@/utils/chessPieces';
import Image from 'next/image';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { BoardDimensions } from '@/hooks/useResponsiveBoard';
import ActiveGameLayout from './ActiveGameLayout';

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
  readonly dimensions: BoardDimensions;
  readonly status: ReactNode;
}
export default function ResponsiveInteractiveBoard({
  playerSolution,
  onPlacePiece,
  onRemovePiece,
  dimensions,
  status,
}: ResponsiveInteractiveBoardProps) {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedPieceType, setSelectedPieceType] = useState<PieceType>('pawn');
  const [selectedPieceColor, setSelectedPieceColor] = useState<PieceColor>('white');

  // Handle square click
  const handleSquareClick = (position: Position) => {
    console.log(`Square clicked: ${position.file}${position.rank} at ${new Date().toISOString()}`);
    
    // Check if this is a different position than the last selected position
    if (selectedPosition && 
        selectedPosition.file === position.file && 
        selectedPosition.rank === position.rank) {
      console.log('Same square clicked again');
    } else {
      console.log('New square selection');
    }
    
    setSelectedPosition(position);
    
    // Check if there's already a piece at this position
    const existingPiece = playerSolution.find(
      p => p.position.file === position.file && p.position.rank === position.rank
    );
    
    if (existingPiece) {
      // Remove the piece if it exists
      console.log(`Removing piece at ${position.file}${position.rank}`);
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
      console.log(`Placing ${selectedPieceColor} ${selectedPieceType} at ${position.file}${position.rank}`);
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
  
  return (
    <ActiveGameLayout
      dimensions={dimensions}
      status={status}
      board={
        <ResponsiveChessBoard
          pieces={playerSolution}
          selectedSquare={selectedPosition}
          isInteractive={true}
          onSquareClick={handleSquareClick}
          showCoordinates={true}
          dimensions={dimensions}
        />
      }
      controls={
        <>
          <div className="flex h-10 items-center justify-between">
            <div>
              <h2 className="text-sm font-medium sm:text-base">Place Pieces</h2>
              <p className="text-[11px] text-muted-foreground sm:text-xs">Select type and color</p>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleColorToggle('white')}
                      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full !p-0 transition-all duration-200 ${
                        selectedPieceColor === 'white'
                          ? 'bg-gradient-to-br from-peach-400 to-peach-600 shadow-lg'
                          : 'bg-neutral-400/40 hover:bg-neutral-200/50'
                      }`}
                      aria-label="Select white pieces"
                    >
                      <span
                        className={`h-6 w-6 rounded-full ${
                          selectedPieceColor === 'white'
                            ? 'bg-white shadow-inner'
                            : 'border border-white/20 bg-white/90'
                        }`}
                      ></span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">White pieces</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleColorToggle('black')}
                      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full !p-0 transition-all duration-200 ${
                        selectedPieceColor === 'black'
                          ? 'bg-gradient-to-br from-peach-400 to-peach-600 shadow-lg'
                          : 'bg-neutral-400/40 hover:bg-neutral-200/50'
                      }`}
                      aria-label="Select black pieces"
                    >
                      <span
                        className={`h-6 w-6 rounded-full ${
                          selectedPieceColor === 'black'
                            ? 'bg-black shadow-inner'
                            : 'border border-white/20 bg-black/90'
                        }`}
                      ></span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Black pieces</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-6 gap-1.5 sm:gap-2">
            {pieceTypes.map((type) => {
              // Calculate remaining pieces for this type and color
              const currentCount = playerSolution.filter(
                (p) => p.type === type && p.color === selectedPieceColor
              ).length;
              const remainingCount = PIECE_LIMITS[type] - currentCount;
              const isDisabled = remainingCount <= 0;

              return (
                <TooltipProvider key={type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handlePieceTypeSelect(type)}
                        variant={selectedPieceType === type ? 'secondary' : 'outline'}
                        disabled={isDisabled}
                        className={`flex h-12 w-full flex-col items-center justify-center !px-1 py-0.5 sm:h-14 ${
                          selectedPieceType === type
                            ? 'border border-primary/70 bg-secondary/70 shadow-sm hover:bg-secondary/70'
                            : 'hover:bg-accent'
                        } ${isDisabled ? 'opacity-40' : ''}`}
                        aria-label={`Select ${type}`}
                      >
                        <div className="relative mb-0.5 h-6 w-6 sm:mb-1 sm:h-7 sm:w-7">
                          <Image
                            src={getPieceImageUrl(type, selectedPieceColor)}
                            alt={`${selectedPieceColor} ${type}`}
                            fill
                            sizes="(max-width: 640px) 24px, 28px"
                            className="object-contain"
                          />
                        </div>
                        <Badge
                          variant={isDisabled ? 'outline' : 'secondary'}
                          className={`h-3.5 px-1 text-[9px] sm:h-4 sm:px-1.5 ${isDisabled ? 'opacity-60' : ''}`}
                        >
                          {remainingCount}
                        </Badge>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs capitalize">
                        {isDisabled
                          ? `No more ${selectedPieceColor} ${type}s available`
                          : `${remainingCount} ${selectedPieceColor} ${type}${remainingCount > 1 ? 's' : ''} remaining`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          <p className="mt-1.5 text-center text-[11px] text-muted-foreground sm:text-xs">
            Tap a square to add a piece or remove one
          </p>
        </>
      }
    />
  );
}
