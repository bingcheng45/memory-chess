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
    // Log the clicked position with file and rank info
    console.log('---------- INTERACTIVE BOARD COORDINATE DEBUG ----------');
    console.log('Position received from ChessBoard:', position);
    console.log('Algebraic notation:', 
      `${String.fromCharCode(97 + position.file)}${position.rank + 1}`);
    console.log('Previous selected position:', selectedPosition);
    
    // Check if the coordinates match what the user intended
    console.log('Board orientation check:');
    console.log('- If you clicked a1 (bottom-left), position should be {file: 0, rank: 0}');
    console.log('- If you clicked a8 (top-left), position should be {file: 0, rank: 7}');
    console.log('- If you clicked h1 (bottom-right), position should be {file: 7, rank: 0}');
    console.log('- If you clicked h8 (top-right), position should be {file: 7, rank: 7}');
    console.log('------------------------------------------------------');
    
    setSelectedPosition(position);
    
    // Check if there's already a piece at this position
    const existingPiece = playerSolution.find(
      p => p.position.file === position.file && p.position.rank === position.rank
    );
    
    if (existingPiece) {
      // Remove the piece if it exists
      console.log('Removing piece at:', position, 
        `(${String.fromCharCode(97 + position.file)}${position.rank + 1})`);
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
            {/* Color selection buttons */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleColorToggle('white')}
                    variant={selectedPieceColor === 'white' ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 p-1 rounded-full ${
                      selectedPieceColor === 'white' 
                        ? 'bg-peach-500 hover:bg-peach-500' 
                        : 'bg-secondary/50 hover:bg-secondary/50'
                    }`}
                    aria-label="Select white pieces"
                  >
                    <div className="w-full h-full rounded-full bg-white"></div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">White pieces</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleColorToggle('black')}
                    variant={selectedPieceColor === 'black' ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 p-1 rounded-full ${
                      selectedPieceColor === 'black' 
                        ? 'bg-peach-500 border-1 hover:bg-peach-500' 
                        : 'bg-secondary/50 hover:bg-secondary/50'
                    }`}
                    aria-label="Select black pieces"
                  >
                    <div className="w-full h-full rounded-full bg-black"></div>
                  </Button>
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