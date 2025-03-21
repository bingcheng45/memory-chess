'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useState, memo } from 'react';
import { ChessPiece as ChessPieceType, Position } from './ChessBoard.types';
import { ChessPiece } from './ChessPiece';

interface ChessBoardProps {
  pieces: ChessPieceType[];
  onPieceClick?: (piece: ChessPieceType) => void;
  onSquareClick?: (position: Position) => void;
  selectedPiece?: ChessPieceType | null;
  className?: string;
}

function ChessBoardComponent({
  pieces,
  onPieceClick,
  onSquareClick,
  selectedPiece,
  className
}: ChessBoardProps) {
  const [boardSize, setBoardSize] = useState(0);

  useEffect(() => {
    const updateSize = () => {
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      setBoardSize(Math.floor(minDimension * 0.8));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleSquareClick = useCallback((position: Position) => {
    onSquareClick?.(position);
  }, [onSquareClick]);

  const handlePieceClick = useCallback((piece: ChessPieceType) => {
    onPieceClick?.(piece);
  }, [onPieceClick]);

  const renderSquare = (row: number, col: number) => {
    const isLight = (row + col) % 2 === 0;
    const position: Position = { row, col };
    const piece = pieces.find(p => p.position.row === row && p.position.col === col);
    const isSelected = selectedPiece?.id === piece?.id;

    return (
      <div
        key={`${row}-${col}`}
        className={cn(
          'relative w-full h-full',
          isLight ? 'bg-board-light' : 'bg-board-dark',
          'transition-colors duration-200',
          isSelected && 'ring-2 ring-blue-500'
        )}
        onClick={() => handleSquareClick(position)}
      >
        {piece && (
          <ChessPiece
            piece={piece}
            onClick={handlePieceClick}
          />
        )}
      </div>
    );
  };

  return (
    <div
      className={cn('grid grid-cols-8 grid-rows-8 border border-gray-300', className)}
      style={{ width: boardSize, height: boardSize }}
    >
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => renderSquare(row, col))
      )}
    </div>
  );
}

export const ChessBoard = memo(ChessBoardComponent, (prevProps, nextProps) => {
  // Only re-render if these props have changed
  return (
    prevProps.pieces === nextProps.pieces &&
    prevProps.selectedPiece === nextProps.selectedPiece &&
    prevProps.onPieceClick === nextProps.onPieceClick &&
    prevProps.onSquareClick === nextProps.onSquareClick
  );
}); 