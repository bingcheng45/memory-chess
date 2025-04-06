'use client';

import { useState } from 'react';
import { ChessPiece, PieceType, PieceColor, Position } from '@/types/chess';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import ResponsiveChessBoard from './ResponsiveChessBoard';
import { getPieceImageUrl } from '@/utils/chessPieces';
import Image from 'next/image';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

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
  
  // Calculate height of controls for ResponsiveChessBoard
  const controlsHeight = 180; // Approximate height of the piece selector controls
  
  return (
    <div className="flex flex-col items-center w-full max-w-screen-sm mx-auto">
      <ResponsiveChessBoard
        pieces={playerSolution}
        selectedSquare={selectedPosition}
        isInteractive={true}
        onSquareClick={handleSquareClick}
        showCoordinates={true}
        controlsHeight={controlsHeight}
        minSize={280}
      />
      
      {/* Piece selection controls using shadcn/ui Card */}
      <Card className="w-full max-w-[600px] mt-4 mx-auto backdrop-blur-sm shadow-md border-muted">
        <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-medium">Place Pieces</CardTitle>
            <CardDescription className="text-xs mt-0.5">Select type & color</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Color selection buttons - completely redesigned */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    onClick={() => handleColorToggle('white')}
                    className={`h-10 w-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      selectedPieceColor === 'white' 
                        ? 'bg-gradient-to-br from-peach-400 to-peach-600 shadow-lg' 
                        : 'bg-neutral-400/40 hover:bg-neutral-200/50'
                    }`}
                    aria-label="Select white pieces"
                  >
                    <div className={`w-7 h-7 rounded-full ${
                      selectedPieceColor === 'white'
                        ? 'bg-white shadow-inner'
                        : 'bg-white/90 border border-white/20'
                    }`}></div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">White pieces</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    onClick={() => handleColorToggle('black')}
                    className={`h-10 w-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      selectedPieceColor === 'black' 
                        ? 'bg-gradient-to-br from-peach-400 to-peach-600 shadow-lg' 
                        : 'bg-neutral-400/40 hover:bg-neutral-200/50'
                    }`}
                    aria-label="Select black pieces"
                  >
                    <div className={`w-7 h-7 rounded-full ${
                      selectedPieceColor === 'black'
                        ? 'bg-black shadow-inner'
                        : 'bg-black/90 border border-white/20'
                    }`}></div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Black pieces</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-6 gap-2">
            {pieceTypes.map(type => {
              // Calculate remaining pieces for this type and color
              const currentCount = playerSolution.filter(
                p => p.type === type && p.color === selectedPieceColor
              ).length;
              const remainingCount = PIECE_LIMITS[type] - currentCount;
              const isDisabled = remainingCount <= 0;
              
              return (
                <TooltipProvider key={type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handlePieceTypeSelect(type)}
                        variant={selectedPieceType === type ? "secondary" : "outline"}
                        disabled={isDisabled}
                        className={`p-1 flex flex-col items-center justify-center h-14 w-full ${
                          selectedPieceType === type
                            ? 'bg-secondary/70 border border-primary/70 shadow-sm hover: bg-secondary/70'
                            : 'hover:bg-accent'
                        } ${isDisabled ? 'opacity-40' : ''}`}
                        aria-label={`Select ${type}`}
                      >
                        <div className="relative w-7 h-7 mb-1">
                          <Image
                            src={getPieceImageUrl(type, selectedPieceColor)}
                            alt={`${selectedPieceColor} ${type}`}
                            fill
                            sizes="28px"
                            className="object-contain"
                          />
                        </div>
                        <Badge 
                          variant={isDisabled ? "outline" : "secondary"} 
                          className={`text-[9px] h-4 px-1.5 ${isDisabled ? 'opacity-60' : ''}`}
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
        </CardContent>
      </Card>
      
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Tap a square to add a piece or remove an existing one
      </p>
    </div>
  );
} 