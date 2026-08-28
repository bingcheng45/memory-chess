'use client';

import { useEffect, useRef, useState } from 'react';
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

import { useTranslations } from "next-intl";
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
  const t = useTranslations("game");
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedPieceType, setSelectedPieceType] = useState<PieceType>('pawn');
  const [selectedPieceColor, setSelectedPieceColor] = useState<PieceColor>('white');

  /**
   * Mirror of the placed pieces that is updated as soon as a square is acted
   * on, rather than on the next render.
   *
   * `playerSolution` is a prop, so two activations that land before React
   * re-renders would both read the same pre-click list: the second would miss
   * the piece the first just placed and place a duplicate, leaving the board
   * and the scored position disagreeing. Deciding from the ref keeps every
   * activation working from the current board.
   */
  const placedPiecesRef = useRef<ChessPiece[]>(playerSolution);

  useEffect(() => {
    placedPiecesRef.current = playerSolution;
  }, [playerSolution]);

  // Handle square click
  const handleSquareClick = (position: Position) => {
    setSelectedPosition(position);

    const placedPieces = placedPiecesRef.current;

    // Check if there's already a piece at this position
    const existingPiece = placedPieces.find(
      p => p.position.file === position.file && p.position.rank === position.rank
    );

    if (existingPiece) {
      // Remove the piece if it exists
      placedPiecesRef.current = placedPieces.filter(
        p => p.position.file !== position.file || p.position.rank !== position.rank
      );
      onRemovePiece(position);
    } else {
      // Check if we've reached the limit for this piece type and color
      const currentCount = placedPieces.filter(
        p => p.type === selectedPieceType && p.color === selectedPieceColor
      ).length;

      if (currentCount >= PIECE_LIMITS[selectedPieceType]) {
        return; // Don't place the piece if we've reached the limit
      }

      // Place a new piece
      const newPiece: ChessPiece = {
        id: uuidv4(),
        type: selectedPieceType,
        color: selectedPieceColor,
        position
      };
      placedPiecesRef.current = [...placedPieces, newPiece];
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
              <h2 className="text-sm font-medium sm:text-base">{t("place.title")}</h2>
              <p className="text-[11px] text-muted-foreground sm:text-xs">{t("place.subtitle")}</p>
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
                      aria-label={t("place.selectWhite")}
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
                    <p className="text-xs">{t("place.whitePieces")}</p>
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
                      aria-label={t("place.selectBlack")}
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
                    <p className="text-xs">{t("place.blackPieces")}</p>
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
                        aria-label={t("board.selectPiece", {
                          piece: t(`board.pieces.${selectedPieceColor}.${type}`),
                        })}
                      >
                        <div className="relative mb-0.5 h-6 w-6 sm:mb-1 sm:h-7 sm:w-7">
                          <Image
                            src={getPieceImageUrl(type, selectedPieceColor)}
                            alt={t(`board.pieces.${selectedPieceColor}.${type}`)}
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

          <p className="mt-1.5 text-center text-[11px] text-muted-foreground sm:text-xs">{t("place.hint")}</p>
        </>
      }
    />
  );
}
