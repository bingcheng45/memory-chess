/**
 * ChessBoard Component
 * 
 * A reusable chess board component that can be used in different contexts.
 * Supports piece placement, movement, and highlighting.
 */

import { useState, useEffect, useCallback } from 'react';
import { Chess, PieceSymbol, Square } from 'chess.js';
import { PiecePosition } from '@/types/game';
import { cn } from '@/lib/utils/classNames';
import Image from 'next/image';

interface ChessBoardProps {
  /** Chess instance or FEN string representing the position */
  position: Chess | string;
  /** Whether the board is interactive (pieces can be moved) */
  interactive?: boolean;
  /** Whether to show coordinates around the board */
  showCoordinates?: boolean;
  /** Whether to flip the board (black pieces at bottom) */
  flipped?: boolean;
  /** Callback when a piece is moved */
  onMove?: (from: Square, to: Square, piece: PieceSymbol, color: 'w' | 'b') => void;
  /** Callback when a square is clicked */
  onSquareClick?: (square: Square) => void;
  /** Squares to highlight */
  highlightSquares?: Square[];
  /** CSS class for the board container */
  className?: string;
}

/**
 * Chess board component that renders a chess position
 */
export default function ChessBoard({
  position,
  interactive = false,
  showCoordinates = true,
  flipped = false,
  onMove,
  onSquareClick,
  highlightSquares = [],
  className
}: ChessBoardProps) {
  // Convert position to Chess instance if it's a string
  const [chess, setChess] = useState<Chess>(
    typeof position === 'string' ? new Chess(position) : position
  );
  
  // Track selected square for piece movement
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  
  // Update chess instance when position changes
  useEffect(() => {
    if (typeof position === 'string') {
      setChess(new Chess(position));
    } else {
      setChess(position);
    }
  }, [position]);
  
  /**
   * Get all pieces on the board
   */
  const getPieces = useCallback((): PiecePosition[] => {
    const pieces: PiecePosition[] = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    for (const file of files) {
      for (const rank of ranks) {
        const square = `${file}${rank}` as Square;
        const piece = chess.get(square);
        
        if (piece) {
          pieces.push({
            type: piece.type,
            color: piece.color,
            square
          });
        }
      }
    }
    
    return pieces;
  }, [chess]);
  
  /**
   * Handle square click
   */
  const handleSquareClick = useCallback((square: Square) => {
    // If not interactive, just call the callback
    if (!interactive) {
      onSquareClick?.(square);
      return;
    }
    
    // If a square is already selected
    if (selectedSquare) {
      // If the same square is clicked again, deselect it
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      
      // Try to move the piece
      const piece = chess.get(selectedSquare);
      if (piece) {
        try {
          // Attempt to make the move
          const move = chess.move({
            from: selectedSquare,
            to: square,
            promotion: 'q' // Always promote to queen for simplicity
          });
          
          // If move is successful, call the callback
          if (move) {
            onMove?.(selectedSquare, square, piece.type, piece.color);
          }
        } catch {
          // Invalid move, do nothing
        }
      }
      
      // Deselect the square
      setSelectedSquare(null);
    } else {
      // If the clicked square has a piece, select it
      const piece = chess.get(square);
      if (piece) {
        setSelectedSquare(square);
      } else {
        // If empty square is clicked, call the callback
        onSquareClick?.(square);
      }
    }
  }, [chess, interactive, onMove, onSquareClick, selectedSquare]);
  
  /**
   * Get the CSS class for a square
   */
  const getSquareClass = useCallback((file: string, rank: string): string => {
    const square = `${file}${rank}` as Square;
    const isLight = (file.charCodeAt(0) - 'a'.charCodeAt(0) + parseInt(rank)) % 2 === 0;
    const isSelected = square === selectedSquare;
    const isHighlighted = highlightSquares.includes(square);
    
    return cn(
      'w-full h-full flex items-center justify-center',
      isLight ? 'bg-board-light' : 'bg-board-dark',
      isSelected && 'ring-2 ring-yellow-400',
      isHighlighted && 'ring-2 ring-blue-400',
      interactive && 'cursor-pointer hover:opacity-90'
    );
  }, [highlightSquares, interactive, selectedSquare]);
  
  /**
   * Render a chess piece
   */
  const renderPiece = useCallback((piece: PiecePosition) => {
    const { type, color, square } = piece;
    const pieceSymbol = `${color}${type.toUpperCase()}`;
    
    return (
      <div
        key={square}
        className="absolute w-full h-full flex items-center justify-center"
        style={{
          gridColumn: flipped 
            ? 9 - (square.charCodeAt(0) - 'a'.charCodeAt(0)) 
            : square.charCodeAt(0) - 'a'.charCodeAt(0) + 1,
          gridRow: flipped 
            ? parseInt(square.charAt(1)) 
            : 9 - parseInt(square.charAt(1))
        }}
      >
        <div className="w-4/5 h-4/5 relative">
          <Image
            src={`/pieces/${pieceSymbol}.svg`}
            alt={`${color === 'w' ? 'White' : 'Black'} ${type}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
            draggable={false}
          />
        </div>
      </div>
    );
  }, [flipped]);
  
  // Generate files and ranks for the board
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  // If flipped, reverse the files and ranks
  const displayFiles = flipped ? [...files].reverse() : files;
  const displayRanks = flipped ? ranks : [...ranks].reverse();
  
  return (
    <div className={cn('relative', className)}>
      <div className="grid grid-cols-[auto_repeat(8,1fr)_auto] grid-rows-[auto_repeat(8,1fr)_auto]">
        {/* Empty top-left corner */}
        <div className="w-6 h-6" />
        
        {/* File labels (top) */}
        {showCoordinates && displayFiles.map(file => (
          <div key={`top-${file}`} className="h-6 flex items-center justify-center text-xs text-text-secondary">
            {file}
          </div>
        ))}
        
        {/* Empty top-right corner */}
        <div className="w-6 h-6" />
        
        {/* Rank labels (left) and board squares */}
        {displayRanks.map(rank => (
          <>
            {/* Rank label */}
            {showCoordinates && (
              <div key={`left-${rank}`} className="w-6 flex items-center justify-center text-xs text-text-secondary">
                {rank}
              </div>
            )}
            
            {/* Board squares for this rank */}
            {displayFiles.map(file => {
              const square = `${file}${rank}` as Square;
              return (
                <div
                  key={square}
                  className={getSquareClass(file, rank)}
                  onClick={() => handleSquareClick(square)}
                >
                  {/* Square content (empty) */}
                </div>
              );
            })}
            
            {/* Rank label (right) */}
            {showCoordinates && (
              <div key={`right-${rank}`} className="w-6 flex items-center justify-center text-xs text-text-secondary">
                {rank}
              </div>
            )}
          </>
        ))}
        
        {/* Empty bottom-left corner */}
        <div className="w-6 h-6" />
        
        {/* File labels (bottom) */}
        {showCoordinates && displayFiles.map(file => (
          <div key={`bottom-${file}`} className="h-6 flex items-center justify-center text-xs text-text-secondary">
            {file}
          </div>
        ))}
        
        {/* Empty bottom-right corner */}
        <div className="w-6 h-6" />
        
        {/* Pieces (positioned absolutely) */}
        {getPieces().map(renderPiece)}
      </div>
    </div>
  );
} 