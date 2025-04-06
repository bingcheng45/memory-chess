'use client';

import React, { useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useResponsiveBoard } from '@/hooks/useResponsiveBoard';
import { ChessPiece, Position } from '@/types/chess';
import { getPieceImageUrl } from '@/utils/chessPieces';

interface ResponsiveChessBoardProps {
  pieces: ChessPiece[];
  selectedSquare?: Position | null;
  isInteractive?: boolean;
  onSquareClick?: (position: Position) => void;
  highlightedSquares?: Set<string>;
  isLoading?: boolean;
  showCoordinates?: boolean;
  minSize?: number;
  maxSize?: number;
  statusBarHeight?: number;
  controlsHeight?: number;
  renderOverlay?: (squareSize: number) => React.ReactNode;
}

export default function ResponsiveChessBoard({
  pieces = [],
  selectedSquare = null,
  isInteractive = true,
  onSquareClick,
  highlightedSquares = new Set(),
  isLoading = false,
  showCoordinates = true,
  minSize = 280,
  maxSize = 600,
  statusBarHeight = 0,
  controlsHeight = 0,
  renderOverlay
}: ResponsiveChessBoardProps) {
  // Touch handling state
  const [lastTapPosition, setLastTapPosition] = useState<string | null>(null);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get responsive dimensions
  const { size, squareSize, pieceSize, fontSize, padding } = useResponsiveBoard(
    minSize,
    maxSize,
    statusBarHeight,
    controlsHeight
  );
  
  // Files and ranks for coordinate labels
  const files = useMemo(() => ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], []);
  const ranks = useMemo(() => [8, 7, 6, 5, 4, 3, 2, 1], []);
  
  // Calculate board styles
  const boardStyle = useMemo(() => ({
    width: `${size}px`,
    height: `${size}px`,
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    margin: '0 auto', // Ensure centering
  }), [size]);
  
  // Calculate square styles
  const getSquareStyle = (file: number, rank: number) => {
    const isDark = (file + rank) % 2 === 1;
    const isSelected = selectedSquare && 
      selectedSquare.file === file && 
      selectedSquare.rank === rank;
    
    // Get square name (e.g., "a1")
    const squareName = `${files[file]}${ranks[rank]}`;
    const isHighlighted = highlightedSquares.has(squareName);
    
    return {
      width: `${squareSize}px`,
      height: `${squareSize}px`,
      backgroundColor: isDark ? 'var(--board-dark)' : 'var(--board-light)',
      border: '1px solid rgba(0, 0, 0, 0.15)',
      position: 'relative' as const,
      outline: isSelected 
        ? '2px solid rgba(0, 128, 255, 0.8)' 
        : isHighlighted
        ? '2px solid rgba(0, 200, 0, 0.5)'
        : 'none',
      transition: 'all 0.15s ease-in-out',
    };
  };
  
  // Calculate coordinate label styles
  const coordinateStyle = {
    fontSize: `${fontSize.coordinates}px`,
    opacity: 0.7,
    position: 'absolute' as const,
    color: 'black',
  };
  
  // Handle square click with debounce for touch events
  const handleSquareClick = useCallback((file: number, rank: number) => {
    if (!isInteractive || isLoading || !onSquareClick) return;
    
    const position: Position = {
      file,
      rank,
    };
    
    const squareKey = `${file}-${rank}`;
    const currentTime = Date.now();
    
    // Prevent rapid double-taps on mobile
    if (lastTapPosition === squareKey && currentTime - lastTapTime < 500) {
      console.log('Preventing rapid tap on same square', squareKey);
      return;
    }
    
    // Handle case where rapid taps occur on different squares
    if (lastTapPosition !== squareKey && currentTime - lastTapTime < 300) {
      console.log('Detected rapid tap on different square', squareKey);
      
      // Clear any pending timeouts
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
        touchTimeoutRef.current = null;
      }
      
      // Wait a bit to ensure the previous tap was processed
      touchTimeoutRef.current = setTimeout(() => {
        setLastTapPosition(squareKey);
        setLastTapTime(currentTime);
        console.log('Processing delayed tap on', squareKey);
        onSquareClick(position);
      }, 50);
      
      return;
    }
    
    // Normal tap handling
    setLastTapPosition(squareKey);
    setLastTapTime(currentTime);
    onSquareClick(position);
  }, [isInteractive, isLoading, onSquareClick, lastTapPosition, lastTapTime]);
  
  // Find piece at a specific position
  const getPieceAt = (file: number, rank: number): ChessPiece | undefined => {
    return pieces.find(p => 
      p.position.file === file && 
      p.position.rank === rank
    );
  };

  return (
    <div 
      className="relative rounded-lg overflow-hidden shadow-lg mx-auto game-container"
      style={boardStyle}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Board grid */}
      <div 
        className="grid grid-cols-8 grid-rows-8 h-full w-full"
        style={{ gap: '0px' }}
      >
        {/* Generate all 64 squares */}
        {Array.from({ length: 8 }, (_, rank) => 
          Array.from({ length: 8 }, (_, file) => {
            const piece = getPieceAt(file, rank);
            const squareStyle = getSquareStyle(file, rank);
            
            // Calculate square name for aria-label
            const squareName = `${files[file]}${ranks[rank]}`;
            
            // Handle keyboard interaction
            const handleKeyDown = (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSquareClick(file, rank);
              }
            };
            
            // Handle touch events explicitly
            const handleTouchStart = (e: React.TouchEvent) => {
              // Prevent default to avoid double-triggering with click
              e.preventDefault();
            };
            
            const handleTouchEnd = (e: React.TouchEvent) => {
              e.preventDefault();
              handleSquareClick(file, rank);
            };
            
            return (
              <div
                key={`${file}-${rank}`}
                style={squareStyle}
                onClick={() => handleSquareClick(file, rank)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onKeyDown={handleKeyDown}
                tabIndex={isInteractive ? 0 : -1}
                role={isInteractive ? "button" : "presentation"}
                aria-label={`${squareName}${piece ? ` with ${piece.color} ${piece.type}` : ''}`}
                data-coordinate={squareName}
                className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {/* File coordinates (a-h on bottom row) */}
                {showCoordinates && rank === 7 && (
                  <span 
                    style={{
                      ...coordinateStyle,
                      bottom: `${padding / 2}px`,
                      right: `${padding / 2}px`,
                    }}
                  >
                    {files[file]}
                  </span>
                )}
                
                {/* Rank coordinates (1-8 on leftmost column) */}
                {showCoordinates && file === 0 && (
                  <span 
                    style={{
                      ...coordinateStyle,
                      top: `${padding / 2}px`,
                      left: `${padding / 2}px`,
                    }}
                  >
                    {ranks[rank]}
                  </span>
                )}
                
                {/* Chess piece */}
                {piece && (
                  <div className="pointer-events-none">
                    <Image
                      src={getPieceImageUrl(piece.type, piece.color)}
                      alt={`${piece.color} ${piece.type}`}
                      width={pieceSize}
                      height={pieceSize}
                      className="transform-gpu drop-shadow-sm"
                      priority={true}
                      draggable={false}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Optional custom overlay */}
      {renderOverlay && (
        <div className="absolute inset-0 z-20">
          {renderOverlay(squareSize)}
        </div>
      )}
    </div>
  );
} 